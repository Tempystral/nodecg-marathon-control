<script setup lang="ts">
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { NAMESPACE } from "../utils";
import { AutoRecordSettings, SettingsReplicant } from "@nmc/types";
import { ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import FloatLabel from "primevue/floatlabel";
import IconField from "primevue/iconfield";
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiCheckCircleOutline } from "@mdi/js";
import InputIcon from "primevue/inputicon";
//import {autoRecord} from "defaultValues"

const settings = useReplicant<SettingsReplicant>("settings", NAMESPACE);
const autoRecord = useReplicant<AutoRecordSettings>("autoRecord", NAMESPACE, {
  defaultValue: {
    active: false,
    filenameFormatting: "%CCYY-%MM-%DD %hh-%mm-%ss",
  },
});

/* window.onload = () => {
  NodeCG.waitForReplicants(settings, autoRecord).then(() => {
    settings.on("change", (newVal) => {
      const autoRecord = document.getElementById("autoRecord");
      switch (newVal.autoRecord) {
        case true:
          autoRecord.value = "Turn Off Auto Record";
          autoRecord.backgroundColor = "#990000";
          document.getElementById("filenameFormatting").disabled = false;
          break;
        case false:
          autoRecord.value = "Turn On Auto Record";
          autoRecord.backgroundColor = "#272727";
          document.getElementById("filenameFormatting").disabled = true;
          break;
      }
    });

    autoRecord.on(
      "change",
      (newVal) =>
        (document.getElementById("filenameFormatting").value =
          newVal.filenameFormatting),
    );
  });
};
*/
/* function toggleTable() {
  switch (
    window
      .getComputedStyle(document.getElementById("variableTable"))
      .getPropertyValue("display")
  ) {
    case "none":
      document.getElementById("variableTable").style.display = "table";
      document.getElementById("toggleTable").value = "Hide Variables";
      break;
    case "table":
      document.getElementById("variableTable").style.display = "none";
      document.getElementById("toggleTable").value = "Show Variables";
      break;
  }
} */

const variables = [
  { variable: "%GAME", desc: "Game name" },
  { variable: "%CAT", desc: "Category" },
  { variable: "%RGN", desc: "Region" },
  { variable: "%REL", desc: "Release" },
  { variable: "%TWIT", desc: "Game, Twitch" },
  { variable: "%SYS", desc: "System" },
  { variable: "%EST", desc: "Estimate" },
  { variable: "%SET", desc: "Setup Time" },
  { variable: "%RNR", desc: "Runner" },
  { variable: "%CCYY", desc: "Year, four digits" },
  { variable: "%YY", desc: "Year, last two digits (00-99)" },
  { variable: "%MM", desc: "Month as a decimal number (01-12)" },
  { variable: "%DD", desc: "Day of the month, zero-padded (01-31)" },
  { variable: "%hh", desc: "Hour in 24h format (00-23)" },
  { variable: "%mm", desc: "Minute (00-59)" },
  { variable: "%ss", desc: "Second (00-61)" },
  { variable: "%%", desc: "A % sign" },
  { variable: "%a", desc: "Abbreviated weekday name" },
  { variable: "%A", desc: "Full weekday name" },
  { variable: "%b", desc: "Abbreviated month name" },
  { variable: "%B", desc: "Full month name" },
  { variable: "%d", desc: "Day of the month, zero-padded (01-31)" },
  { variable: "%H", desc: "Hour in 24h format (00-23)" },
  { variable: "%l", desc: "Hour in 12h format (01-12)" },
  { variable: "%m", desc: "Month as a decimal number (01-12)" },
  { variable: "%M", desc: "Minute (00-59)" },
  { variable: "%p", desc: "AM or PM designation" },
  { variable: "%S", desc: "Second (00-61)" },
  { variable: "%y", desc: "Year, last two digits (00-99)" },
  { variable: "%Y", desc: "Year" },
  { variable: "%z", desc: "ISO 8601 offset from UTC in timezone" },
  { variable: "%Z", desc: "Timezone name or abbreviation" },
  { variable: "%FPS", desc: "Frames per second" },
  { variable: "%CRES", desc: "Base (canvas) resolution" },
  { variable: "%ORES", desc: "Output (scaled) resolution" },
  { variable: "%VF", desc: "Video format" },
];

const showTable = ref(false);

function toggleAutoRecord() {
  if (settings.data) {
    settings.data.autoRecord = !settings.data.autoRecord;
  }
  settings.save();
}

function reset() {
  if (autoRecord.data && settings.data) {
    autoRecord.loadDefault();
    settings.data.autoRecord = autoRecord.data?.active;
    settings.save();
  }
}
</script>
<template>
  <div class="grid grid-cols-2 gap-2" v-if="autoRecord.data">
    <Button
      id="autoRecord"
      :severity="settings.data?.autoRecord ? 'warn' : 'primary'"
      @click="toggleAutoRecord">
      {{ settings.data?.autoRecord ? "Disable" : "Enable" }} Auto-Record
    </Button>
    <FloatLabel variant="in" class="row-start-2 col-span-2">
      <!-- <IconField> -->
      <InputText
        type="text"
        id="filenameFormatting"
        itemid="filenameFormatting"
        class="w-full"
        v-model="autoRecord.data.filenameFormatting"
        @update:model-value="autoRecord.save" />
      <!-- <InputIcon>
          <SvgIcon type="mdi" :path="mdiCheckCircleOutline" :class="" />
        </InputIcon>
      </IconField> -->
      <label for="filenameFormatting">Filename Formatting</label>
    </FloatLabel>
    <Button severity="danger" class="row-start-3" @click="reset">
      Reset Format
    </Button>
    <Button
      id="toggleTable"
      :severity="showTable ? 'secondary' : 'help'"
      class="row-start-3"
      @click="showTable = !showTable">
      {{ showTable ? "Hide" : "Show" }} Variables
    </Button>

    <DataTable
      :value="variables"
      v-show="showTable"
      scrollable
      scroll-height="flex"
      size="small"
      class="row-start-4 col-span-2 max-h-100 rounded-lg">
      <Column field="variable" header="Variable" />
      <Column field="desc" header="Description" />
    </DataTable>
  </div>
</template>
