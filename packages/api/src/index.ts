import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export { type AppRouter, appRouter } from "./root";
export { syncSimpleFinUser } from "./router/simplefin";
export { createTRPCContext } from "./trpc";
export type { RouterOutputs };
