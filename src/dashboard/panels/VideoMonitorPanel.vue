<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiRecord, mdiSurroundSound } from "@mdi/js";
import { ChecklistData, OBSStatus, SettingsReplicant } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import { computed } from "vue";
import { NAMESPACE } from "../utils";

const settings = useReplicant<SettingsReplicant>("settings", NAMESPACE);
const obsStatus = useReplicant<OBSStatus>("obsStatus", NAMESPACE);
const checklist = useReplicant<ChecklistData>("checklist", NAMESPACE);

/* function load() {
  // Open welcome dialog on first launch.
  if (settings.value.firstLaunch) {
    setTimeout(() => {
      nodecg.getDialog("welcome").open();
      settings.value.firstLaunch = false;
    }, 2000);
  } */

// Update buttons, icons, and VBO.Ninja room codes.
/* settings.on("change", (newVal) => {
    switch (newVal.previewCode) {
      case "":
        document.getElementById("preview").src = ``;
        break;
      default:
        document.getElementById("preview").src =
          `https://vdo.ninja/?view=${newVal.previewCode}&autostart&cleanish&transparent&mute`;
        break;
    }
    switch (newVal.programCode) {
      case "":
        document.getElementById("program").src = ``;
        break;
      default:
        document.getElementById("program").src =
          `https://vdo.ninja/?view=${newVal.programCode}&autostart&cleanish&transparent&mute`;
        break;
    }
  }); */

/* obsStatus.on("change", (newVal) => {
    console.log(newVal);
    const transition = document.getElementById("transition");
    const emergency = document.getElementById("emergency");
    switch (newVal.streaming) {
      case true:
        document.getElementById("streaming").style.color = "limegreen";
        break;
      case false:
        document.getElementById("streaming").style.color = "white";
        break;
    }
    switch (newVal.recording) {
      case true:
        document.getElementById("recording").style.color = "red";
        break;
      case false:
        document.getElementById("recording").style.color = "white";
        break;
    }
    switch (newVal.emergencyTransition) {
      case true:
        emergency.disabled = true;
        break;
      case false:
        emergency.disabled = false;
        break;
    }
    if (
      !settings.value.forceChecklist ||
      checklist.value.completed ||
      !checklist.value.started
    ) {
      switch (newVal.inTransition) {
        case true:
          transition.disabled = true;
          emergency.disabled = true;
          break;
        case false:
          transition.disabled = false;
          break;
      }
    }
  }); */

/* checklist.on("change", (newVal) => {
    if (settings.value.forceChecklist && newVal.started) {
      const transition = document.getElementById("transition");
      switch (newVal.completed) {
        case false:
          transition.disabled = true;
          transition.title =
            "Please complete the checklist to unlock this button.";
          break;
        case true:
          transition.disabled = false;
          transition.title = "";
          break;
      }
    }
  });
} */

function transition() {
  nodecg.sendMessage("startTransition");
}

function emergencyTransition() {
  if (!obsStatus.data) {
    nodecg.log.error("OBS Status not found!");
    return;
  }

  obsStatus.data.emergencyTransition = true;
  obsStatus.save();
}

const streamIconStyle = computed(() =>
  obsStatus.data?.streaming ? "text-green-400" : "text-white",
);

const recordIconStyle = computed(() =>
  obsStatus.data?.recording ? "text-red-600" : "text-white",
);
</script>
<template>
  <div class="flex items-center justify-around w-full gap-2">
    <iframe
      id="preview"
      frameBorder="0"
      allow="autoplay"
      class="h-60 aspect-video"></iframe>
    <div id="transitionDiv" class="flex flex-col items-center gap-2">
      <div id="streamStatus" class="flex gap-2">
        <SvgIcon
          id="stream-icon"
          type="mdi"
          :size="32"
          :path="mdiSurroundSound"
          :class="streamIconStyle"
          class="text-red" />
        <SvgIcon
          id="record-icon"
          type="mdi"
          :size="32"
          :path="mdiRecord"
          :class="recordIconStyle" />
      </div>
      <div
        id="transitionButtons"
        class="flex flex-col gap-1"
        v-if="obsStatus.data">
        <Button
          id="transition"
          severity="info"
          :disabled="
            settings.data?.forceChecklist && !checklist.data?.completed
          "
          v-tooltip.top="
            !checklist.data?.completed &&
            'Please complete the checklist to unlock this button.'
          "
          @click="transition">
          Transition
        </Button>
        <Button
          id="emergency"
          severity="danger"
          :disabled="
            obsStatus.data.emergencyTransition || obsStatus.data.inTransition
          "
          @click="emergencyTransition">
          Emergency Transition
        </Button>
      </div>
    </div>
    <iframe
      id="program"
      frameBorder="0"
      allow="autoplay"
      class="h-60 aspect-video"></iframe>
  </div>
</template>
<style></style>
