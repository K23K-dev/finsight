import { defineConfig } from "eslint/config";

import { baseConfig } from "@finsight/eslint-config/base";
import { reactConfig } from "@finsight/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
