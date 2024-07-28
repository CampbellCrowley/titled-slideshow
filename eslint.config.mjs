import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Common
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  // Exclude generated files
  {
    ignores: ["**/dist/**/*", ".pnp.*js"],
  },
  // Server
  {
    files: ["server/**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  // // Web
  {
    files: ["web/**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.browser },
  },
];
