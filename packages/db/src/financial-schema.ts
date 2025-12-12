import { sql } from "drizzle-orm";
import { pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const Connection = pgTable(
  "connection",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessUrl: t.text().notNull(),
    createdAt: t.timestamp().defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => ({
    userUnique: uniqueIndex("simplefin_connection_user_id_idx").on(t.userId),
  }),
);

export const FinancialAccount = pgTable("financial_account", (t) => ({
  id: t.text().primaryKey(), // SimpleFin ID
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: t.text().notNull(),
  balance: t.numeric({ precision: 19, scale: 2 }).notNull(),
  currency: t.text().notNull(),
  type: t.text(), // 'checking', 'credit card', 'investment', etc.
  lastSyncedAt: t.timestamp().defaultNow(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const Transaction = pgTable("transaction", (t) => ({
  id: t.text().primaryKey(), // SimpleFin Transaction ID
  accountId: t
    .text()
    .notNull()
    .references(() => FinancialAccount.id, { onDelete: "cascade" }),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: t.numeric({ precision: 19, scale: 2 }).notNull(),
  description: t.text().notNull(),
  postedDate: t.timestamp().notNull(),
  category: t.text(),
  createdAt: t.timestamp().defaultNow().notNull(),
}));

export const BalanceSnapshot = pgTable(
  "balance_snapshot",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    accountId: t
      .text()
      .notNull()
      .references(() => FinancialAccount.id, { onDelete: "cascade" }),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    balance: t.numeric({ precision: 19, scale: 2 }).notNull(),
    date: t.date().notNull(),
    createdAt: t.timestamp().defaultNow().notNull(),
  }),
  (t) => ({
    uniqueDailySnapshot: uniqueIndex("balance_snapshot_account_date_idx").on(
      t.accountId,
      t.date,
    ),
  }),
);
