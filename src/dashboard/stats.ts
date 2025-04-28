import { createHead } from "@vueuse/head";
import { createApp } from "vue";
import StatsPanel from "./stats/StatsPanel.vue";

const app = createApp(StatsPanel);
const head = createHead();
app.use(head);
app.mount("#app");
