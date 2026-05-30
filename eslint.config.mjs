import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Project-level ignores.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Local backup / holding folders:
    ".virtus-backups/**",
    ".local-untracked-hold/**",

    // Local backup files:
    "**/*.backup.js",
    "**/*.before-*.js",
    "**/*.bak*.js",
  ]),
]);

export default eslintConfig;
