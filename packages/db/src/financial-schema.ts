import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  CLASSIFICATION_SOURCES,
  SPENDING_CATEGORY_NAMES,
} from "@finsight/validators";

import { user } from "./auth-schema";

export const spendingCategoryEnum = pgEnum(
  "spending_category",
  SPENDING_CATEGORY_NAMES,
);

export const classificationSourceEnum = pgEnum(
  "classification_source",
  CLASSIFICATION_SOURCES,
);

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

export const FinancialAccount = pgTable(
  "financial_account",
  (t) => ({
    id: t.text().primaryKey(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerConnectionId: t.text(),
    providerAccountId: t.text(),
    name: t.text().notNull(),
    customName: t.text(),
    accountType: t.text(),
    institution: t.text(),
    balance: t.numeric({ precision: 19, scale: 2 }).notNull(),
    currency: t.text().notNull(),
    hidden: t.boolean().default(false).notNull(),
    lastSyncedAt: t.timestamp().defaultNow(),
    createdAt: t.timestamp().defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => ({
    userIdx: index("financial_account_user_id_idx").on(t.userId),
    userHiddenIdx: index("financial_account_user_hidden_idx").on(
      t.userId,
      t.hidden,
    ),
    idUserUnique: unique("financial_account_id_user_id_unique").on(
      t.id,
      t.userId,
    ),
    providerIdentityUnique: uniqueIndex(
      "financial_account_provider_identity_idx",
    ).on(t.userId, t.providerConnectionId, t.providerAccountId),
  }),
);

export const Transaction = pgTable(
  "transaction",
  (t) => ({
    id: t.text().primaryKey(),
    accountId: t.text().notNull(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerTransactionId: t.text(),
    amount: t.numeric({ precision: 19, scale: 2 }).notNull(),
    description: t.text().notNull(),
    payee: t.text(),
    memo: t.text(),
    providerCategory: t.text(),
    customDescription: t.text(),
    postedDate: t.timestamp().notNull(),
    pending: t.boolean().default(false).notNull(),
    hidden: t.boolean().default(false).notNull(),
    spendingCategory: spendingCategoryEnum(),
    spendingCategorySource: classificationSourceEnum(),
    createdAt: t.timestamp().defaultNow().notNull(),
  }),
  (t) => ({
    userPostedIdx: index("transaction_user_posted_idx").on(
      t.userId,
      t.postedDate,
    ),
    userHiddenIdx: index("transaction_user_hidden_idx").on(t.userId, t.hidden),
    accountIdx: index("transaction_account_id_idx").on(t.accountId),
    providerIdentityUnique: uniqueIndex("transaction_provider_identity_idx").on(
      t.accountId,
      t.providerTransactionId,
    ),
    accountOwnerFk: foreignKey({
      columns: [t.accountId, t.userId],
      foreignColumns: [FinancialAccount.id, FinancialAccount.userId],
      name: "transaction_account_owner_fk",
    }).onDelete("cascade"),
  }),
);

export const BalanceSnapshot = pgTable(
  "balance_snapshot",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    accountId: t.text().notNull(),
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
    accountOwnerFk: foreignKey({
      columns: [t.accountId, t.userId],
      foreignColumns: [FinancialAccount.id, FinancialAccount.userId],
      name: "balance_snapshot_account_owner_fk",
    }).onDelete("cascade"),
  }),
);

export const Budget = pgTable(
  "budget",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: t.text().notNull(),
    description: t.text(),
    budgetAmount: t.numeric({ precision: 19, scale: 2 }),
    createdAt: t.timestamp().defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (t) => ({
    userIdx: index("budget_user_id_idx").on(t.userId),
  }),
);

export const BudgetTransaction = pgTable(
  "budget_transaction",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    budgetId: t
      .uuid()
      .notNull()
      .references(() => Budget.id, { onDelete: "cascade" }),
    transactionId: t
      .text()
      .notNull()
      .references(() => Transaction.id, { onDelete: "cascade" }),
    createdAt: t.timestamp().defaultNow().notNull(),
  }),
  (t) => ({
    uniqueBudgetTransaction: uniqueIndex("budget_transaction_unique_idx").on(
      t.budgetId,
      t.transactionId,
    ),
  }),
);
