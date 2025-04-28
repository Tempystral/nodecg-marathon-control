import stylistic from "@stylistic/eslint-plugin";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";
import tseslint from "typescript-eslint";
import rootConfig from "./eslint.config.mjs";

export default tseslint.config(
  tseslint.configs.recommended,
  vuePlugin.configs["flat/essential"],
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        nodecg: "readonly",
        NodeCG: "readonly",
      },
      parser: vueParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        extraFileExtensions: [".vue"],
        parser: tseslint.parser,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    extends: [rootConfig, importPlugin.flatConfigs.typescript],
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          tsconfig: "tsconfig.browser.json",
        }),
      ],
      "import-x/extensions": [".js", ".jsx", ".ts", ".tsx"],
    },
    rules: {
      // Everything is compiled for the browser so dev dependencies are fine.
      "import-x/no-extraneous-dependencies": [
        "error",
        { devDependencies: true },
      ],
      // max-len set to ignore "import" lines (as they usually get long and messy).
      "@stylistic/max-len": "off", //['error', { code: 100, ignorePattern: '^import\\s.+\\sfrom\\s.+;' }],
      // I mainly have this off as it ruins auto import sorting in VSCode.
      "@stylistic/object-curly-newline": "off",
      "@stylistic/no-mixed-spaces-and-tabs": "off",
      "@stylistic/no-multiple-empty-lines": "off",
      // Allows "main.vue" files to be named as such.
      //'vue/multi-word-component-names': ['error', { 'ignores': ['main'] }],
      "@typescript-eslint/no-unused-vars": "off",

      "no-fallthrough": "off",
      "prefer-const": "error",
      "no-unused-vars": "off",
    },
  },
  // ...
);
