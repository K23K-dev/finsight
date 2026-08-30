import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@finsight/eslint-config/base";
import { nextjsConfig } from "@finsight/eslint-config/nextjs";
import { reactConfig } from "@finsight/eslint-config/react";

export default defineConfig(
  {
    ignores: [".next/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
);
