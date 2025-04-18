import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"
import rootConfig from "./eslint.config.mjs";
import importPlugin from "eslint-plugin-import-x";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export default tseslint.config(
  tseslint.configs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node
      },
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module"
      }
    },
    plugins: {
      "@stylistic": stylistic
    },
    extends: [rootConfig, importPlugin.flatConfigs.typescript],
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          tsconfig: "tsconfig.extension.json"

          // extensions: ['.js', '.jsx', '.ts', '.tsx']
        })
      ],
      "import-x/extensions": ['.js', '.jsx', '.ts', '.tsx']

    },
    rules: {
      // max-len set to ignore "import" lines (as they usually get long and messy).
      'max-len': ['error', { code: 100, ignorePattern: '^import\\s.+\\sfrom\\s.+;' }],
      // I mainly have this off as it ruins auto import sorting in VSCode.
      '@stylistic/object-curly-newline': 'off',
      'import-x/extensions': ['error', 'ignorePackages', {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      }],
    },
    // Overrides for types.
    // overrides: [{
    //   files: ['**/*.d.ts'],
    //   rules: {
    //     // @typescript-eslint/no-unused-vars does not work with type definitions
    //     '@typescript-eslint/no-unused-vars': 'off',
    //     // Sometimes eslint complains about this for types (usually when using namespaces).
    //     'import/prefer-default-export': 'off',
    //     // Types are only used for development (usually!) so dev dependencies are fine.
    //     'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    //   }
    // }],
  });
