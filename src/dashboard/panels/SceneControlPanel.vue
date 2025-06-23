<script setup lang="ts">
import {
  OBSStatus,
  SettingsReplicant
} from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Select from "primevue/select";
import { onMounted, ref, watch } from "vue";
import { NAMESPACE } from "../utils";
import StreamInfoPanel from "./StreamInfoPanel.vue";

const sceneList = useReplicant<string[]>("sceneList", NAMESPACE);
const obsStatus = useReplicant<OBSStatus>("obsStatus", NAMESPACE);
const settings = useReplicant<SettingsReplicant>("settings", undefined);

const previewScene = ref("");

onMounted(() => {
  previewScene.value = settings.data?.defaultScene ?? "";
})

watch(previewScene, (newVal, oldVal) => {
  if (newVal != oldVal) {
    nodecg.sendMessage("setPreviewScene", newVal);
  }
});

watch(() => obsStatus.data, (newVal, oldVal) => {
  if (newVal?.previewScene && newVal.previewScene != oldVal?.previewScene) {
    previewScene.value = newVal?.previewScene;
  }
})

</script>
<template>
  <div id="sceneControlPanelParent" class="w-full flex flex-col gap-2">
    <div id="sceneDiv" class="flex items-center gap-2">
      Preview Scene
      <Select
        id="sceneList"
        label-id="sceneList"
        v-model="previewScene"
        :options="sceneList.data"
        class="w-8/12 me-2">
      </Select>
    </div>
    <StreamInfoPanel />
  </div>
</template>

<style></style>
