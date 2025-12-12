// packages/api/src/router/simplefin.ts
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, eq, notInArray, sql } from "@finsight/db";
import { Connection, FinancialAccount, Transaction } from "@finsight/db/schema";

import { protectedProcedure } from "../trpc";

async function fetchWithAuth(accessUrl: string) {
  const parsedUrl = new URL(accessUrl);
  const username = parsedUrl.username;
  const password = parsedUrl.password;

  // Remove credentials from URL (fetch doesn't support user:pass@host)
  parsedUrl.username = "";
  parsedUrl.password = "";

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  return fetch(parsedUrl.toString(), {
    headers: { Authorization: authHeader },
  });
}

const SimpleFinTransactionSchema = z.object({
  id: z.string(),
  posted: z.number(), // Unix seconds
  amount: z.union([z.string(), z.number()]).transform((v) => v.toString()),
  description: z.string(),
  payee: z.string().optional(),
  memo: z.string().optional(),
  category: z.string().optional(),
});

const SimpleFinAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.union([z.string(), z.number()]).transform((v) => v.toString()),
  currency: z.string(),
  type: z.string().optional().nullable(),
  transactions: z.array(SimpleFinTransactionSchema).optional(),
});

const SimpleFinResponseSchema = z.object({
  accounts: z.array(SimpleFinAccountSchema),
});

export const simplefinRouter = {
  linkAccount: protectedProcedure
    .input(z.object({ setupToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let claimUrl: string;
      try {
        claimUrl = Buffer.from(input.setupToken, "base64").toString("utf-8");
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid setup token format (must be base64).",
        });
      }

      // Call the Claim URL via POST to get the Access URL
      const response = await fetch(claimUrl, {
        method: "POST",
        headers: { "Content-Length": "0" }, // Required by SimpleFin docs/example
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("SimpleFin Claim Error:", errorText);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to exchange token: ${errorText}`,
        });
      }

      const accessUrl = await response.text();

      await ctx.db
        .insert(Connection)
        .values({
          userId: ctx.session.user.id,
          accessUrl: accessUrl,
        })
        .onConflictDoUpdate({
          target: Connection.userId,
          set: {
            accessUrl: accessUrl,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const connection = await ctx.db.query.Connection.findFirst({
      where: eq(Connection.userId, ctx.session.user.id),
    });

    if (!connection) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          "No SimpleFin connection found. Please link your account first.",
      });
    }

    const accountsRes = await fetchWithAuth(`${connection.accessUrl}/accounts`);

    if (!accountsRes.ok) {
      if (accountsRes.status === 403) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied. Please reconnect your account.",
        });
      }
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Fetch accounts failed: ${accountsRes.statusText}`,
      });
    }

    const json = await accountsRes.json();
    const parsed = SimpleFinResponseSchema.safeParse(json);

    if (parsed.success) {
      await ctx.db.transaction(async (tx) => {
        await tx.delete(FinancialAccount).where(
          and(
            eq(FinancialAccount.userId, ctx.session.user.id),
            notInArray(
              FinancialAccount.id,
              parsed.data.accounts.map((a) => a.id),
            ),
          ),
        );

        for (const account of parsed.data.accounts) {
          await tx
            .insert(FinancialAccount)
            .values({
              id: account.id,
              userId: ctx.session.user.id,
              name: account.name,
              balance: account.balance,
              currency: account.currency,
              type: account.type ?? undefined,
              lastSyncedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: FinancialAccount.id,
              set: {
                balance: sql`excluded.balance`,
                name: sql`excluded.name`,
                type: sql`excluded.type`,
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
              },
            });

          if (account.transactions && account.transactions.length > 0) {
            for (const t of account.transactions) {
              await tx
                .insert(Transaction)
                .values({
                  id: t.id,
                  accountId: account.id,
                  userId: ctx.session.user.id,
                  amount: t.amount,
                  description: t.description,
                  postedDate: new Date(t.posted * 1000),
                  category: t.category ?? null,
                })
                .onConflictDoUpdate({
                  target: Transaction.id,
                  set: {
                    amount: sql`excluded.amount`,
                    description: sql`excluded.description`,
                    postedDate: sql`excluded.posted_date`,
                    category: sql`excluded.category`,
                  },
                });
            }
          }
        }
      });
    } else {
      console.error(
        "Failed to parse SimpleFin accounts for syncing:",
        parsed.error,
      );
    }

    return json as Record<string, unknown>;
  }),

  getAccountsFromDb: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.db.query.FinancialAccount.findMany({
      where: eq(FinancialAccount.userId, ctx.session.user.id),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    });

    return accounts;
  }),

  getTransactionsFromDb: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await ctx.db.query.Transaction.findMany({
      where: eq(Transaction.userId, ctx.session.user.id),
      orderBy: (fields, { desc }) => [desc(fields.postedDate)],
    });

    return transactions;
  }),
} satisfies TRPCRouterRecord;
