<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiOpenInNew, mdiRefresh } from "@mdi/js";
import {
  ActiveRunners,
  OBSStatus,
  SettingsReplicant
} from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import Card from "primevue/card";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { onMounted, ref, watch } from "vue";
import { NAMESPACE } from "../utils";
import { NodeCGAPIClient } from "node_modules/nodecg/out/client/api/api.client";
import { ServerConfig } from "@nmc/types/schemas/ServerConfig";

const { rtmp } = (nodecg as NodeCGAPIClient<ServerConfig>).bundleConfig;

const activeRunners = useReplicant<ActiveRunners[]>("activeRunners", NAMESPACE);
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

const servers = [
  { name: "US West", value: "usw" },
  { name: "US East", value: "use" },
  { name: "Europe", value: "eu" },
  { name: "South America", value: "sa" },
  { name: "Asia/Pacific", value: "ap" },
];

function refreshStream(i: number) {
  if (activeRunners.data) {
    nodecg.sendMessage("restartMedia", activeRunners.data[i].source);
  }
}

function openStream(player: ActiveRunners) {
  window.open(`${rtmp.viewer.url}/live/key/${player.streamKey}?token=${rtmp.viewer.token}&region=${player.server}`, '_blank')
}

function isRunnerLive() {
  return !obsStatus.data?.inIntermission;
}

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
    <Card id="runnerInfo" v-if="activeRunners.data">
      <template #title> Active Runner Info </template>
      <template #content>
          <div
            class="playerDiv"
            :player="i"
            v-for="(player, i) of activeRunners.data"
            :key="`${player}-${i}`">
              <div class="flex gap-1">
                <Button
                  :player="i"
                  :id="`player-${i}-refresh`"
                  severity="success"
                  
                  variant="text"
                  @click="refreshStream(i)">
                  <template #icon>
                    <svg-icon type="mdi" :path="mdiRefresh" />
                  </template>
                </Button>
                <FloatLabel variant="on">
                  <InputText
                    v-model="player.streamKey"
                    @update:model-value="activeRunners.save"
                    :disabled="isRunnerLive()"
                    v-tooltip="
                      isRunnerLive() &&
                      'Cannot change stream key while the runner is live'
                    "
                    :label-id="`player-${i}-stream-key`"
                    fluid />
                  <label :for="`player-${i}-stream-key`">
                    Player {{ i + 1 }} Stream Key
                  </label>
                </FloatLabel>
                <FloatLabel variant="on" >
                  <Select
                    v-model="player.server"
                    :options="servers"
                    option-label="name"
                    option-value="value"
                    default-value="use"
                    @update:model-value="activeRunners.save"
                    fluid
                    :label-id="`player-${i}-server`"></Select>
                  <label :for="`player-${i}-server`">
                    View from server:
                  </label>
                </FloatLabel>
                
                <Button
                  :player="i"
                  :id="`player-${i}-open`"
                  severity="info"
                  
                  variant="text"
                  @click="() => openStream(player)"
                  >
                  <template #icon>
                    <svg-icon type="mdi" :path="mdiOpenInNew" />
                  </template>
                </Button>
              </div>
            <hr v-if="i < activeRunners.data.length - 1" class="mt-2 mr-2 ml-2" />
          </div>

      </template>
    </Card>
    <!-- <Button id="adPlayer" label="Start Ad" @click="startAd"></Button> -->
  </div>
</template>

<style></style>
