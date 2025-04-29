import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import OBSSettingsPanel from "./panels/OBSSettingsPanel.vue";

const app = createApp(OBSSettingsPanel);
const head = createHead();
app.use(head);
app.mount("#app");
