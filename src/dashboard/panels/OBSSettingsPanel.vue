<script setup lang="ts">
import { OBSStatus, SettingsReplicant } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import Select from "primevue/select";
import { ref, watch } from "vue";

const settings = useReplicant<SettingsReplicant>("settings", undefined);
const sceneList = useReplicant<string[]>("sceneList", undefined);
const obsStatus = useReplicant<OBSStatus>("obsStatus", undefined);

/* settings.window.onload = () => {
  NodeCG.waitForReplicants(settings, sceneList, obsStatus).then(() => {
    // Update preview/program URL.
    settings.on("change", (newVal) => {
      const autoRunner = document.getElementById("autoRunner");
      const autoLayout = document.getElementById("autoLayout");
      const forceChecklist = document.getElementById("forceChecklist");
      switch (newVal.autoSetRunners) {
        case true:
          autoRunner.buttonText = "Disable Auto Runner";
          autoRunner.backgroundColor = "#990000";
          break;
        case false:
          autoRunner.buttonText = "Enable Auto Runner";
          autoRunner.backgroundColor = "#272727";
          break;
      }
      switch (newVal.autoSetLayout) {
        case true:
          autoLayout.buttonText = "Disable Auto Layout";
          autoLayout.backgroundColor = "#990000";
          break;
        case false:
          autoLayout.buttonText = "Enable Auto Layout";
          autoLayout.backgroundColor = "#272727";
          break;
      }
      switch (newVal.forceChecklist) {
        case true:
          forceChecklist.buttonText = `Don't Enforce Checklist`;
          forceChecklist.backgroundColor = "#990000";
          break;
        case false:
          forceChecklist.buttonText = "Enforce Checklist";
          forceChecklist.backgroundColor = "#272727";
          break;
      }
      document.getElementById("intermissionScene").value =
        newVal.intermissionScene;
    });

    obsStatus.on("change", (newVal) => {
      const toggleStream = document.getElementById("toggleStream");
      const toggleRecording = document.getElementById("toggleRecording");
      switch (newVal.streaming) {
        case true:
          toggleStream.buttonText = "Stop Streaming";
          toggleStream.backgroundColor = "#990000";
          toggleStream.disabled = false;
          break;
        case false:
          toggleStream.buttonText = "Start Streaming";
          toggleStream.backgroundColor = "#272727";
          toggleStream.disabled = false;
          break;
      }
      switch (newVal.recording) {
        case true:
          toggleRecording.buttonText = "Stop Recording";
          toggleRecording.backgroundColor = "#990000";
          toggleRecording.disabled = false;
          break;
        case false:
          toggleRecording.buttonText = "Start Recording";
          toggleRecording.backgroundColor = "#272727";
          toggleRecording.disabled = false;
          break;
      }
    });

    sceneList.on("change", (newVal) => {
      let options = "";
      for (const scene of newVal) {
        const option = `<option ${scene === settings.value.intermissionScene ? "selected" : ""}>${scene}</option>`;
        options += option;
      }
      document.getElementById("intermissionScene").options = options;
    });
  });
}; */

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

    <hr style="margin-inline: 1rem" />

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

    <hr style="margin-inline: 1rem" />

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
    <FloatLabel variant="on" class="w-full">
      <Select
        id="intermissionScene"
        labelid="intermission_scene"
        v-model="settings.data.intermissionScene"
        :options="sceneList.data"
        @update:model-value="settings.save()"
        class="w-full"></Select>
      <label for="intermission_scene">Intermission Scene</label>
    </FloatLabel>
  </div>
</template>
