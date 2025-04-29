<script setup lang="ts">
import { OBSStatus, SettingsReplicant } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import { ref } from "vue";
import { NodecgButton, NodecgSelect } from "../components";
import { NAMESPACE } from "../utils";

const settings = useReplicant<SettingsReplicant>("settings", undefined)!;
const sceneList = useReplicant<string[]>("sceneList", undefined)!;
const obsStatus = useReplicant<OBSStatus>("obsStatus", undefined)!;

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
  //nodecg.sendMessage("toggleStream");
  streamBtnDisabled.value = true;
  //element.backgroundColor = "#485264";
}

function toggleRecording() {
  //nodecg.sendMessage("toggleRecording");
  //element.disabled = true;
  //element.setAttribute("disabled", true);
  //element.backgroundColor = "#485264";
}

function setPreviewWindow() {
  const roomCode = Math.random().toString(36).substring(2);
  if (settings.data) {
    settings.data.previewCode = roomCode;
  }
  window.open(`https://vdo.ninja/?push=${roomCode}&screenshare&mute`);
}

function setProgramWindow() {
  const roomCode = Math.random().toString(36).substring(2);
  if (settings.data) {
    settings.data.programCode = roomCode;
  }
  window.open(`https://vdo.ninja/?push=${roomCode}&screenshare&mute`);
}

function setIntermissionScene(el: NodecgSelect) {
  if (settings.data) {
    settings.data.intermissionScene = el.value;
  }
}

function openDialog() {
  nodecg.getDialog("welcome")?.open();
}
</script>
<template>
  <nodecg-button
    id="toggleStream"
    :disabled="streamBtnDisabled.valueOf()"
    :backgroundColor="streamBtnDisabled.valueOf() ? '#485264' : '#990000'"
    @click="toggleStream" />
  <nodecg-button id="toggleRecording" @click="toggleRecording()" />
  <!-- <nodecg-button
      id="autoRunner"
      @click="settings.data.autoSetRunners = !settings.data.autoSetRunners" />
    <nodecg-button
      id="autoLayout"
      @click="settings.data.autoSetLayout = !settings.data.autoSetLayout" />
    <nodecg-button
      id="forceChecklist"
      @click="settings.data.forceChecklist = !settings.data.forceChecklist"
      title="If enabled, the checklist must be complete to unlock the transition button." />
    <nodecg-button id="selectPreviewWindow" @click="setPreviewWindow()">
      Select Preview Window
    </nodecg-button>
    <nodecg-button id="selectProgramWindow" @click="setProgramWindow()">
      Select Program Window
    </nodecg-button>
    <nodecg-button id="showWelcome" @click="openDialog()">
      Show Welcome Screen
    </nodecg-button>
    <nodecg-select
      id="intermissionScene"
      label="Intermission Scene"
      @change="setIntermissionScene">
    </nodecg-select> -->
</template>
<style>
nodecg-button {
  margin-top: 17px;
}

#toggleStream {
  margin: 0;
}

nodecg-select {
  margin-top: 15px;
}
</style>
