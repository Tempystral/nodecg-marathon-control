import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import OBSSettingsPanel from "./panels/OBSSettingsPanel.vue";
import PrimeVue from "primevue/config";
import Theme from "@primeuix/themes/aura";
import Tooltip from "primevue/tooltip";

const app = createApp(OBSSettingsPanel);
const head = createHead();
app.use(head);
app.use(PrimeVue, {
  theme: {
    preset: Theme,
  },
});
app.directive("tooltip", Tooltip);
app.mount("#app");
