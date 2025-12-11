import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { simplefinRouter } from "./router/simplefin";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  simplefin: simplefinRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
