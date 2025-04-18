import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
    [
        globalIgnores([
            "**/eslint*js",
            "**/vite.config.mjs",
            "dashboard/**/*",
            "extension/**/*",
            "graphics/**/*",
            "shared/dist/**/*",
            "node_modules/**/*",
            "schemas/**/*",
            "src/types/schemas/**/*",
        ])
    ]
);