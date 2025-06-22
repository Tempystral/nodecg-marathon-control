<script setup lang="ts">
import { OBSStatus, SettingsReplicant } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import { ref, watch } from "vue";

const settings = useReplicant<SettingsReplicant>("settings", undefined);
const sceneList = useReplicant<string[]>("sceneList", undefined);
const obsStatus = useReplicant<OBSStatus>("obsStatus", undefined);

const streamBtnDisabled = ref(false);
const recordBtnDisabled = ref(false);

function toggleStream() {
  streamBtnDisabled.value = true;
  nodecg.sendMessage("toggleStream");
}

function toggleRecording() {
  recordBtnDisabled.value = true;
  nodecg.sendMessage("toggleRecording");
}

watch(
  () => obsStatus.data,
  (newData, oldData) => {
    if (newData?.streaming != oldData?.streaming) {
      streamBtnDisabled.value = false;
    }
    if (newData?.recording != oldData?.recording) {
      recordBtnDisabled.value = false;
    }
  },
);

function setPreviewWindow() {
  const roomCode = Math.random().toString(36).substring(2);
  if (settings.data) {
    settings.data.previewCode = roomCode;
  }
  settings.save();
  window.open(`https://vdo.ninja/?push=${roomCode}&screenshare&mute`);
}

function setProgramWindow() {
  const roomCode = Math.random().toString(36).substring(2);
  if (settings.data) {
    settings.data.programCode = roomCode;
  }
  settings.save();
  window.open(`https://vdo.ninja/?push=${roomCode}&screenshare&mute`);
}

function openDialog() {
  nodecg.getDialog("welcome")?.open();
}

function enableDisable(val: boolean, text: string) {
  return `${val ? "Disable" : "Enable"} ${text}`;
}

function toggleEnforceChecklist() {
  if (settings.data) {
    settings.data.forceChecklist = !settings.data.forceChecklist;
    settings.save();
  }
}

function toggleAutoLayout() {
  if (settings.data) {
    settings.data.autoSetLayout = !settings.data.autoSetLayout;
    settings.save();
  }
}

function toggleAutoRunner() {
  if (settings.data) {
    settings.data.autoSetRunners = !settings.data.autoSetRunners;
    settings.save();
  }
}
</script>
<template>
  <div
    v-if="settings.data"
    style="
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      margin-inline: 0.25em;
    ">
    <Button
      id="toggleStream"
      :disabled="streamBtnDisabled"
      :severity="obsStatus.data?.streaming ? 'danger' : 'success'"
      @click="toggleStream">
      {{ obsStatus.data?.streaming ? "Stop Streaming" : "Start Streaming" }}
    </Button>
    <Button
      id="toggleRecording"
      :disabled="recordBtnDisabled"
      :severity="obsStatus.data?.recording ? 'danger' : 'info'"
      @click="toggleRecording">
      {{ obsStatus.data?.recording ? "Stop Recording" : "Start Recording" }}
    </Button>

    <hr class="mx-4 my-2" />

    <Button id="autoRunner" severity="secondary" @click="toggleAutoRunner">
      {{ enableDisable(settings.data.autoSetRunners, "Auto-Runner") }}
    </Button>
    <Button id="autoLayout" severity="secondary" @click="toggleAutoLayout">
      {{ enableDisable(settings.data.autoSetLayout, "Auto-Layout") }}
    </Button>
    <Button
      id="forceChecklist"
      severity="secondary"
      @click="toggleEnforceChecklist"
      v-tooltip.right="
        'If enabled, the checklist must be complete to unlock the transition button.'
      ">
      {{ settings.data.forceChecklist ? "Don't" : "" }} Enforce Checklist
    </Button>

    <hr class="mx-4 my-2" />

    <Button
      id="selectPreviewWindow"
      severity="secondary"
      @click="setPreviewWindow">
      Select Preview Window
    </Button>
    <Button
      id="selectProgramWindow"
      severity="secondary"
      @click="setProgramWindow">
      Select Program Window
    </Button>
    <Button id="showWelcome" severity="secondary" @click="openDialog">
      Show Welcome Screen
    </Button>

    <FloatLabel variant="on" class="w-full mt-2">
      <MultiSelect
        id="intermissionScene"
        labelid="intermission_scene"
        v-model="settings.data.intermissionScenes"
        :options="sceneList.data"
        @update:model-value="settings.save()"
        class="w-full"></MultiSelect>
      <label for="intermission_scene">Intermission Scenes</label>
    </FloatLabel>

    <FloatLabel variant="on" class="w-full mt-2">
      <Select
        id="defaultScene"
        labelid="default_scene"
        v-model="settings.data.defaultScene"
        :options="sceneList.data"
        @update:model-value="settings.save()"
        class="w-full"></Select>
      <label for="default_scene">Default Selected Scene</label>
    </FloatLabel>
  </div>
</template>
