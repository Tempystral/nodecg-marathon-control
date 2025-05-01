import { createHead } from "@vueuse/head";
import { Component, createApp } from "vue";
import OBSSettingsPanel from "./panels/OBSSettingsPanel.vue";
import PrimeVue from "primevue/config";
import Theme from "@primeuix/themes/aura";
import Tooltip from "primevue/tooltip";
import "./style.css";

export function create(component: Component) {
  const app = createApp(component);
  app.use(createHead());
  app.use(PrimeVue, {
    theme: {
      preset: Theme,
    },
  });
  app.directive("tooltip", Tooltip);
  app.mount("#app");
  return app;
}
