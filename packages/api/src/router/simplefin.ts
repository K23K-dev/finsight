import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { db as DB } from "@finsight/db/client";
import { and, eq, isNull, notInArray, or, sql } from "@finsight/db";
import {
  BalanceSnapshot,
  Connection,
  FinancialAccount,
  Transaction,
  user,
} from "@finsight/db/schema";

import type { SimpleFinAccount } from "../simplefin-provider";
import {
  claimAccessUrl,
  createSimpleFinAccountId,
  createSimpleFinTransactionId,
  fetchAccountSet,
} from "../simplefin-provider";
import { protectedProcedure, requireFound } from "../trpc";

type DatabaseTransaction = Parameters<
  Parameters<(typeof DB)["transaction"]>[0]
>[0];

const TRANSACTION_BATCH_SIZE = 250;

function inconsistentIdentity(entity: "account" | "transaction"): never {
  throw new TRPCError({
    code: "CONFLICT",
    message: `Stored SimpleFin ${entity} identity is inconsistent. Reconnect before syncing.`,
  });
}

function requireId(rows: { id: string }[], entity: "account" | "transaction") {
  const id = rows[0]?.id;
  if (!id) inconsistentIdentity(entity);
  return id;
}

function requireTransactionIds(rows: { id: string }[], expectedIds: string[]) {
  const returnedIds = new Set(rows.map(({ id }) => id));
  if (
    rows.length !== expectedIds.length ||
    returnedIds.size !== expectedIds.length ||
    expectedIds.some((id) => !returnedIds.has(id))
  ) {
    inconsistentIdentity("transaction");
  }
}

function* chunks<T>(values: T[], size: number) {
  for (let index = 0; index < values.length; index += size) {
    yield values.slice(index, index + size);
  }
}

function lockUser(tx: DatabaseTransaction, userId: string) {
  return tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .for("update");
}

async function runTransaction<T>(
  db: typeof DB,
  failureMessage: string,
  operation: (tx: DatabaseTransaction) => Promise<T>,
) {
  try {
    return await db.transaction(operation);
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("SimpleFin database transaction failed.");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: failureMessage,
    });
  }
}

async function writeAccountSet(
  tx: DatabaseTransaction,
  userId: string,
  accounts: SimpleFinAccount[],
  completeAccountSet = true,
) {
  let transactionsSynced = 0;
  const accountIds: string[] = [];
  const balancesByAccountId = new Map<string, string>();

  const syncedAt = new Date();

  for (const account of accounts) {
    const scopedAccountId = createSimpleFinAccountId(
      userId,
      account.conn_id,
      account.id,
    );
    const accountId = requireId(
      await tx
        .insert(FinancialAccount)
        .values({
          id: scopedAccountId,
          userId,
          providerConnectionId: account.conn_id,
          providerAccountId: account.id,
          name: account.name,
          accountType: account.accountType,
          institution: account.institution,
          balance: account.balance,
          currency: account.currency,
          lastSyncedAt: syncedAt,
        })
        .onConflictDoUpdate({
          target: [
            FinancialAccount.userId,
            FinancialAccount.providerConnectionId,
            FinancialAccount.providerAccountId,
          ],
          set: {
            name: account.name,
            accountType: sql`COALESCE(${FinancialAccount.accountType}, excluded.account_type)`,
            institution: sql`COALESCE(${FinancialAccount.institution}, excluded.institution)`,
            balance: account.balance,
            currency: account.currency,
            lastSyncedAt: syncedAt,
            updatedAt: syncedAt,
          },
          setWhere: eq(FinancialAccount.id, scopedAccountId),
        })
        .returning({ id: FinancialAccount.id }),
      "account",
    );
    accountIds.push(accountId);
    balancesByAccountId.set(accountId, account.balance);

    const transactions = account.transactions ?? [];
    const feedPendingIds = new Set<string>();
    const transactionRows = new Map<string, typeof Transaction.$inferInsert>();

    for (const transaction of transactions) {
      const isPending = transaction.pending ?? false;
      const postedDate = isPending
        ? new Date("2099-12-31")
        : new Date(transaction.posted * 1000);
      const scopedTransactionId = createSimpleFinTransactionId(
        accountId,
        transaction.id,
      );

      transactionRows.set(transaction.id, {
        id: scopedTransactionId,
        accountId,
        userId,
        providerTransactionId: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        payee: transaction.payee ?? null,
        memo: transaction.memo ?? null,
        providerCategory: transaction.category ?? null,
        postedDate,
        pending: isPending,
      });

      if (isPending) feedPendingIds.add(scopedTransactionId);
    }

    for (const batch of chunks(
      [...transactionRows.values()],
      TRANSACTION_BATCH_SIZE,
    )) {
      const storedTransactions = await tx
        .insert(Transaction)
        .values(batch)
        .onConflictDoUpdate({
          target: [Transaction.accountId, Transaction.providerTransactionId],
          set: {
            amount: sql`excluded.amount`,
            description: sql`excluded.description`,
            payee: sql`COALESCE(excluded.payee, ${Transaction.payee})`,
            memo: sql`COALESCE(excluded.memo, ${Transaction.memo})`,
            providerCategory: sql`COALESCE(excluded.provider_category, ${Transaction.providerCategory})`,
            postedDate: sql`excluded.posted_date`,
            pending: sql`excluded.pending`,
          },
          setWhere: eq(Transaction.id, sql`excluded.id`),
        })
        .returning({ id: Transaction.id });

      requireTransactionIds(
        storedTransactions,
        batch.map(({ id }) => id),
      );
    }
    transactionsSynced += transactions.length;

    if (completeAccountSet && account.transactions !== undefined) {
      const stalePendingFilter = and(
        eq(Transaction.userId, userId),
        eq(Transaction.accountId, accountId),
        eq(Transaction.pending, true),
      );

      await tx
        .delete(Transaction)
        .where(
          feedPendingIds.size > 0
            ? and(
                stalePendingFilter,
                notInArray(Transaction.id, [...feedPendingIds]),
              )
            : stalePendingFilter,
        );
    }
  }

  if (completeAccountSet) {
    await tx
      .delete(FinancialAccount)
      .where(
        and(
          eq(FinancialAccount.userId, userId),
          notInArray(FinancialAccount.id, accountIds),
        ),
      );

    await tx
      .insert(BalanceSnapshot)
      .values(
        [...balancesByAccountId].map(([accountId, balance]) => ({
          accountId,
          userId,
          balance,
          date: syncedAt.toISOString().slice(0, 10),
        })),
      )
      .onConflictDoUpdate({
        target: [BalanceSnapshot.accountId, BalanceSnapshot.date],
        set: { balance: sql`excluded.balance` },
      });
  }

  return { accountIds, transactionsSynced };
}

export async function syncSimpleFinUser(db: typeof DB, userId: string) {
  const connection = requireFound(
    await db.query.Connection.findFirst({
      where: eq(Connection.userId, userId),
    }),
    "No SimpleFin connection found. Please link your account first.",
  );

  const [legacyAccount, legacyTransaction] = await Promise.all([
    db.query.FinancialAccount.findFirst({
      columns: { id: true },
      where: and(
        eq(FinancialAccount.userId, userId),
        or(
          isNull(FinancialAccount.providerConnectionId),
          isNull(FinancialAccount.providerAccountId),
        ),
      ),
    }),
    db.query.Transaction.findFirst({
      columns: { id: true },
      where: and(
        eq(Transaction.userId, userId),
        isNull(Transaction.providerTransactionId),
      ),
    }),
  ]);

  if (legacyAccount || legacyTransaction) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Reconnect SimpleFin once before syncing so older accounts can be upgraded safely.",
    });
  }

  const accountSet = await fetchAccountSet(connection.accessUrl);
  const { providerErrors } = accountSet;

  if (accountSet.accounts.length === 0 && providerErrors.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "SimpleFin returned no accounts. Your existing data was not changed.",
    });
  }

  // Partial responses only update returned accounts. A complete response is
  // authoritative, so accounts missing upstream are removed below.
  const writeResult = await runTransaction(
    db,
    "Your accounts could not be synced, so no data was changed.",
    async (tx) => {
      await lockUser(tx, userId);
      const lockedConnections = await tx
        .select({
          accessUrl: Connection.accessUrl,
          updatedAt: Connection.updatedAt,
        })
        .from(Connection)
        .where(eq(Connection.userId, userId))
        .for("update");

      const lockedConnection = lockedConnections[0];
      if (
        lockedConnection?.accessUrl !== connection.accessUrl ||
        lockedConnection.updatedAt?.getTime() !==
          connection.updatedAt?.getTime()
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "The SimpleFin connection changed during sync. Please retry.",
        });
      }

      return writeAccountSet(
        tx,
        userId,
        accountSet.accounts,
        providerErrors.length === 0,
      );
    },
  );

  return {
    accountsSynced: writeResult.accountIds.length,
    transactionsSynced: writeResult.transactionsSynced,
    providerErrors,
  };
}

export const simplefinRouter = {
  status: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const connection = await ctx.db.query.Connection.findFirst({
      columns: { id: true },
      where: eq(Connection.userId, userId),
    });

    return {
      isConnected: connection !== undefined,
    };
  }),

  linkAccount: protectedProcedure
    .input(z.object({ setupToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const accessUrl = await claimAccessUrl(input.setupToken);
      let accountSet: Awaited<ReturnType<typeof fetchAccountSet>>;
      try {
        accountSet = await fetchAccountSet(accessUrl);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw new TRPCError({
            code: error.code,
            message: `${error.message} Generate a new setup token before retrying.`,
          });
        }
        throw error;
      }
      const { providerErrors } = accountSet;

      if (providerErrors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The new SimpleFin connection returned an incomplete account set, so your existing data was not changed. Generate a new setup token before retrying.",
        });
      }

      if (accountSet.accounts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The new SimpleFin connection returned no usable accounts. Existing data was not changed. Generate a new setup token before retrying.",
        });
      }

      const writeResult = await runTransaction(
        ctx.db,
        "The new accounts could not be imported, so your existing data was restored. Generate a new setup token before retrying.",
        async (tx) => {
          await lockUser(tx, userId);
          await tx
            .insert(Connection)
            .values({ userId, accessUrl })
            .onConflictDoUpdate({
              target: Connection.userId,
              set: { accessUrl, updatedAt: new Date() },
            });

          await tx
            .delete(FinancialAccount)
            .where(eq(FinancialAccount.userId, userId));

          const result = await writeAccountSet(tx, userId, accountSet.accounts);
          return result;
        },
      );

      return {
        accountsSynced: accountSet.accounts.length,
        transactionsSynced: writeResult.transactionsSynced,
      };
    }),

  sync: protectedProcedure.mutation(({ ctx }) =>
    syncSimpleFinUser(ctx.db, ctx.session.user.id),
  ),
} satisfies TRPCRouterRecord;
