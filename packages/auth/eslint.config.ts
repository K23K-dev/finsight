import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "@finsight/eslint-config/base";

export default defineConfig(baseConfig, restrictEnvAccess);
