import { accountRouter } from "./router/account";
import { budgetRouter } from "./router/budget";
import { cashflowRouter } from "./router/cashflow";
import { simplefinRouter } from "./router/simplefin";
import { transactionRouter } from "./router/transaction";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  budget: budgetRouter,
  cashflow: cashflowRouter,
  simplefin: simplefinRouter,
  transaction: transactionRouter,
});

export type AppRouter = typeof appRouter;
