<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiOpenInNew, mdiRefresh } from "@mdi/js";
import {
  ActiveRunners,
  OBSStatus
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

const previewScene = ref("");

onMounted(() => {
  previewScene.value = sceneList.data?.[0] ?? "";
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
      <template #title> Runner Info </template>
      <template #content>
        <div class="flex flex-col gap-2 items-center">
          <div
            class="playerDiv"
            :player="i"
            v-for="(player, i) of activeRunners.data"
            :key="`${player}-${i}`">
            <div class="flex gap-1">
              <div class="flex flex-col gap-1">
                <FloatLabel variant="on">
                  <InputText
                    v-model="player.streamKey"
                    @update:model-value="activeRunners.save"
                    :label-id="`player-${i}-stream-key`"
                    class="w-full" />
                  <label :for="`player-${i}-stream-key`">
                    Player {{ i + 1 }} Stream Key
                  </label>
                </FloatLabel>
                <FloatLabel variant="on">
                  <Select
                    v-model="player.server"
                    :options="servers"
                    option-label="name"
                    option-value="value"
                    default-value="use"
                    @update:model-value="activeRunners.save"
                    class="server w-full"
                    :label-id="`player-${i}-server`"></Select>
                  <label :for="`player-${i}-server`">
                    View Player {{ i + 1 }} from Server:
                  </label>
                </FloatLabel>
              </div>
              <div class="flex flex-col gap-1">
                <Button
                  :player="i"
                  :id="`player-${i}-refresh`"
                  severity="success"
                  rounded
                  variant="text"
                  @click="refreshStream(i)">
                  <template #icon>
                    <svg-icon type="mdi" :path="mdiRefresh" />
                  </template>
                </Button>
                <Button
                  :player="i"
                  :id="`player-${i}-open`"
                  severity="info"
                  rounded
                  variant="text"
                  @click="() => openStream(player)"
                  >
                  <template #icon>
                    <svg-icon type="mdi" :path="mdiOpenInNew" />
                  </template>
                </Button>
                <!-- <Button
                  :player="i"
                  id="cam"
                  rounded
                  variant="text"
                  :severity="activeRunners.data[i].cam ? 'info' : 'danger'"
                  @click="toggleCam(i)">
                  <template #icon>
                    <svg-icon
                      type="mdi"
                      :path="
                        activeRunners.data[i].cam ? mdiVideo : mdiVideoOff
                      " />
                  </template>
                </Button> -->
              </div>
            </div>
            <hr v-if="i < activeRunners.data.length - 1" class="mt-2 mr-2 ml-2" />
          </div>
        </div>

        <!-- <div class="playerDiv" player="1">
          <InputText
            player="1"
            label="Player 2"
            @change="setStreamKey(1, this.value)"></InputText>
          <Select
            class="server"
            player="1"
            label="Server"
            @change="setServer(1, this.value)"></Select>
          <Button
            player="1"
            id="refresh"
            @click="
              nodecg.sendMessage('restartMedia', activeRunners.value[1].source)
            ">
            <span class="material-icons">refresh</span>
          </Button>
          <Button
            player="1"
            id="cam"
            @click="activeRunners.value[1].cam = !activeRunners.value[1].cam">
            <span class="material-icons">videocam_off</span>
          </Button>
        </div>
        <div class="playerDiv" player="2">
          <InputText
            player="2"
            label="Player 3"
            @change="setStreamKey(2, this.value)"></InputText>
          <Select
            class="server"
            player="2"
            label="Server"
            @change="setServer(2, this.value)"></Select>
          <Button
            player="2"
            id="refresh"
            @click="
              nodecg.sendMessage('restartMedia', activeRunners.value[2].source)
            ">
            <span class="material-icons">refresh</span>
          </Button>
          <Button
            player="2"
            id="cam"
            @click="activeRunners.value[2].cam = !activeRunners.value[2].cam">
            <span class="material-icons">videocam_off</span>
          </Button>
        </div>
        <div class="playerDiv" player="3">
          <InputText
            player="3"
            label="Player 4"
            @change="setStreamKey(3, this.value)"></InputText>
          <Select
            class="server"
            player="3"
            label="Server"
            @change="setServer(3, this.value)"></Select>
          <Button
            player="3"
            id="refresh"
            @click="
              nodecg.sendMessage('restartMedia', activeRunners.value[3].source)
            ">
            <span class="material-icons">refresh</span>
          </Button>
          <Button
            player="3"
            id="cam"
            @click="activeRunners.value[3].cam = !activeRunners.value[3].cam">
            <span class="material-icons">videocam_off</span>
          </Button>
        </div> -->
      </template>
    </Card>
    <!-- <Button id="adPlayer" label="Start Ad" @click="startAd"></Button> -->
  </div>
</template>

<style></style>
