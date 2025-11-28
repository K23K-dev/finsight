import { defineConfig } from "eslint/config";

import { baseConfig } from "@finsight/eslint-config/base";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
);
