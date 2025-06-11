<script setup lang="ts">
import {
  AdPlayerData,
  ChecklistData,
  StreamSyncData,
} from "@nmc/types";
import { NodeCGAPIClient } from "node_modules/nodecg/out/client/api/api.client";
import { useReplicant } from "nodecg-vue-composable";
import { NAMESPACE } from "../utils";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import Card from "primevue/card";
import { ServerConfig } from "@nmc/types/schemas/ServerConfig";

const checklist = useReplicant<ChecklistData>("checklist", NAMESPACE);
const adPlayer = useReplicant<AdPlayerData>("adPlayer", NAMESPACE);
const streamSync = useReplicant<StreamSyncData>("streamSync", NAMESPACE);

const bundleConfig = (nodecg as NodeCGAPIClient<ServerConfig>).bundleConfig;

/* 
streamSync.on("change", (newVal) => {
  if (!newVal.active)
    document.querySelector("#syncStreams").parentElement.style.display = "none";
  else
    document.querySelector("#syncStreams").parentElement.style.display = "flex";
});

adPlayer.on("change", (newVal) => {
  if (!newVal.twitchAds && !newVal.videoAds)
    document.querySelector("#playAd").parentElement.style.display = "none";
  else document.querySelector("#playAd").parentElement.style.display = "flex";
});

*/
function reset() {
  const def = {};
  const custom = {};
  if (checklist.data) {
    for (const key in checklist.data.default) {
      checklist.data.default[key as keyof ChecklistData["default"]] = false;
    }
    for (const key in checklist.data.custom) {
      checklist.data.custom[key] = false;
    }
    checklist.data.completed = false;
    checklist.save();
  }
}

function override() {
  if (checklist.data) {
    checklist.data.completed = true;
    checklist.save();
  }
}
</script>
<template>
  <div id="buttonDiv" v-if="checklist.data" class="flex w-full mb-2 gap-4">
    <Button
      id="override"
      severity="info"
      @click="override"
      class="w-full"
      label="Override">
    </Button>
    <Button
      id="reset"
      severity="danger"
      @click="reset()"
      class="w-full"
      label="Reset">
    </Button>
  </div>

  <div class="flex flex-col gap-2 mb-2">
    <!-- <div class="flex items-center gap-2">
      <Checkbox
        input-id="syncStreams"
        title="This checkbox is managed by the system."
        disabled></Checkbox>
      <span>Sync the streams</span>
    </div> -->

    <div class="flex items-center gap-2">
      <Checkbox
        input-id="playRun"
        title="This checkbox is managed by the system."
        disabled></Checkbox>
      <span>Play the next run</span>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        input-id="playAd"
        title="This checkbox is managed by the system."
        disabled></Checkbox>
      <span>Play an ad</span>
    </div>
  </div>

  <div v-if="checklist.data?.default" class="flex flex-col gap-2 mb-2">
    <div class="flex items-center gap-2">
      <Checkbox
        input-id="verifyStream"
        binary
        v-model="checklist.data.default.verifyStream" />
      <span>Verify the stream key and layout</span>
    </div>

    <div class="flex items-center gap-2">
      <Checkbox
        input-id="checkAudio"
        binary
        v-model="checklist.data.default.checkAudio" />
      <span>Adjust audio levels</span>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        input-id="checkInfo"
        binary
        v-model="checklist.data.default.checkInfo" />
      <span>Verify run information</span>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        input-id="finalCheck"
        binary
        v-model="checklist.data.default.finalCheck" />
      <span>Make sure everything looks good</span>
    </div>
    <div class="flex items-center gap-2">
      <Checkbox
        input-id="checkReady"
        binary
        v-model="checklist.data.default.checkReady" />
      <span>Ask everyone if they're ready</span>
    </div>
  </div>

  <div id="custom" v-if="checklist.data?.custom" class="flex flex-col gap-2">
    <div v-for="item of bundleConfig.checklist.custom" :key="item">
      <div class="flex items-center gap-2">
        <Checkbox
          :input-id="item"
          :id="item"
          binary
          v-model="checklist.data.custom[item]" />
        <label :for="item">{{ item }}</label>
      </div>
    </div>
  </div>
  <Card class="mt-2">
    <template #content>
      <div id="statusText" class="-mt-2 -mb-2">
        {{
          checklist.data?.completed
            ? "All tasks complete! You may now use the transition button."
            : "Complete each item on the checklist to unlock the transition button."
        }}
      </div>
    </template>
  </Card>
</template>
<style></style>
