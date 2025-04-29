import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import StatsPanel from "./panels/StatsPanel.vue";

const app = createApp(StatsPanel);
app.use(createHead());

app.mount("#app");
