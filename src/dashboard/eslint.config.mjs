import { defineConfig } from "eslint/config";
import dashboardConfig from "../../.eslintrc.browser.mjs"


export default defineConfig({
	extends: [dashboardConfig],
});
