<script setup lang="ts">
import {
  ActiveRunners,
  AdPlayerData,
  ChecklistData,
  OBSStatus,
} from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import Card from "primevue/card";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ToggleButton from "primevue/togglebutton";
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiVideoOff, mdiVideo, mdiRefresh } from "@mdi/js";
import { ref, watch } from "vue";
import { NAMESPACE } from "../utils";

const obsStatus = useReplicant<OBSStatus>("obsStatus", NAMESPACE);
const activeRunners = useReplicant<ActiveRunners[]>("activeRunners", NAMESPACE);
const sceneList = useReplicant<string[]>("sceneList", NAMESPACE);
const adPlayer = useReplicant<AdPlayerData>("adPlayer", NAMESPACE);
const checklist = useReplicant<ChecklistData>("checklist", NAMESPACE);

/* window.onload = () => {

            // Load replicants.
            NodeCG.waitForReplicants(obsStatus, activeRunners, sceneList, adPlayer, checklist).then(() => {

                // Populate streamkey dropdown.
                let serverOptions = '';
                for (const server of Object.keys(nodecg.bundleConfig.RTMPServers)) {
                    serverOptions += `<option>${server}</option>`
                }
                const serverDropdowns = document.querySelectorAll(`#runnerInfo Select`);
                for (const select of serverDropdowns) {
                    select.options = serverOptions;
                }

                // Populates dropdown with uploaded layouts.
                sceneList.on('change', (newVal) => {
                    let options = '';
                    for (const scene of newVal) {
                        options += `<option ${(obsStatus.value.previewScene === scene) ? 'selected' : ''}>${scene}</option>`
                    }
                    document.querySelector('Select').options = options;
                });

                // Update active runners and quality.
                activeRunners.on('change', (newVal) => {
                    for (let i = 0; i < 4; i++) {
                        document.querySelector(`InputText[player="${i}"]`).value = newVal[i].streamKey;
                        document.querySelector(`Select[player="${i}"]`).value = newVal[i].server;
                        const cam = document.querySelector(`#cam[player="${i}"]`)
                        switch (newVal[i].cam) {
                            case true: cam.buttonText = `<span class="material-icons">videocam</span>`; cam.foregroundColor = 'white'; break;
                            case false: cam.buttonText = `<span class="material-icons">videocam_off</span>`; cam.foregroundColor = 'red'; break;
                        }
                    }
                });

                adPlayer.on('change', (newVal) => {
                    const adPlayer = document.getElementById('adPlayer')
                    if (!newVal.videoAds && !newVal.twitchAds) adPlayer.style.display = 'none';
                    else adPlayer.style.display = 'inherit'
                    switch (newVal.adPlaying) {
                        case true: adPlayer.disabled = true; adPlayer.buttonText = `Ads Playing (${newVal.secondsLeft}s Remaining)`; break;
                        case false: adPlayer.disabled = false; adPlayer.buttonText = 'Play Ads'; break;
                    }
                })

                obsStatus.on('change', (newVal, oldVal) => { if (!oldVal || newVal.previewScene !== oldVal.previewScene) document.getElementById("sceneList").value = newVal.previewScene; });
            })
        } */

function setStreamKey(player: number, value: string) {
  if (activeRunners.data) {
    if (value === "") {
      activeRunners.data[player].streamKey = null;
    } else {
      activeRunners.data[player].streamKey = value;
    }
  }
}
function setServer(player: number, value: string) {
  if (activeRunners.data) {
    if (value === "") {
      activeRunners.data[player].server = null;
    } else {
      activeRunners.data[player].server = value;
    }
  }
}

function refreshStream(i: number) {
  if (activeRunners.data) {
    nodecg.sendMessage("restartMedia", activeRunners.data[i].source);
  }
}

function toggleCam(i: number) {
  if (activeRunners.data)
    activeRunners.data[i].cam = !activeRunners.data[i].cam;
}

function startAd() {
  nodecg.sendMessage("startAd");
}

const previewScene = ref(sceneList.data?.[0] ?? "");

watch(previewScene, (newVal, oldVal) => {
  if (newVal != oldVal) {
    nodecg.sendMessage("setPreviewScene", newVal);
  }
});
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
                    :player="i"
                    :label-id="`player-${i}-stream-key`"
                    class="w-full" />
                  <label :for="`player-${i}-stream-key`">
                    Player {{ i + 1 }} Stream Key
                  </label>
                </FloatLabel>
                <FloatLabel variant="on">
                  <Select
                    class="server w-full"
                    :player="i"
                    :label-id="`player-${i}-server`"></Select>
                  <label :for="`player-${i}-server`">
                    Player {{ i + 1 }} Server
                  </label>
                </FloatLabel>
              </div>
              <div class="flex flex-col gap-1">
                <Button
                  :player="i"
                  id="refresh"
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
                </Button>
              </div>
            </div>
            <hr v-if="i < 3" class="mt-2 mr-2 ml-2" />
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
