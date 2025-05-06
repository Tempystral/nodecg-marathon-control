import Theme from "@primeuix/themes/aura";
import { createHead } from "@vueuse/head";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import { Component, createApp } from "vue";
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
