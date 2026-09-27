import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

import { authEnv } from "@finsight/auth/env";

export const env = createEnv({
  extends: [authEnv(), vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    AWS_REGION: z.string().min(1).default("us-east-1"),
    AWS_ROLE_ARN: z.string().startsWith("arn:aws:iam::").optional(),
    BEDROCK_MODEL_ID: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(16).optional(),
    POSTGRES_URL: z.url(),
  },

  // Only NEXT_PUBLIC_ variables are exposed to the browser.
  client: {
    NEXT_PUBLIC_LOGOKIT_TOKEN: z.string().min(1),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    NEXT_PUBLIC_LOGOKIT_TOKEN: process.env.NEXT_PUBLIC_LOGOKIT_TOKEN,
  },
  skipValidation: process.env.npm_lifecycle_event === "lint",
});
