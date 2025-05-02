<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiRecord, mdiSurroundSound } from "@mdi/js";
import { ChecklistData, OBSStatus, SettingsReplicant } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import { computed, watch } from "vue";
import { NAMESPACE } from "../utils";

const settings = useReplicant<SettingsReplicant>("settings", NAMESPACE);
const obsStatus = useReplicant<OBSStatus>("obsStatus", NAMESPACE);
const checklist = useReplicant<ChecklistData>("checklist", NAMESPACE);

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
      v-if="settings.data"
      id="preview"
      frameBorder="0"
      allow="autoplay"
      class="h-60 aspect-video t-2"
      :src="`https://vdo.ninja/?view=${settings.data.previewCode}&autostart&cleanish&transparent&mute`"></iframe>
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
      v-if="settings.data"
      id="program"
      frameBorder="0"
      allow="autoplay"
      class="h-60 aspect-video"
      :src="`https://vdo.ninja/?view=${settings.data.programCode}&autostart&cleanish&transparent&mute`"></iframe>
  </div>
</template>
<style></style>
