<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiOpenInNew, mdiRefresh } from "@mdi/js";
import {
  ActiveRunners,
  OBSStatus
} from "@nmc/types";
import { ServerConfig } from "@nmc/types/schemas/ServerConfig";
import  NodeCG  from "nodecg/types";
import { useReplicant, ReactiveReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import Card from "primevue/card";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { NAMESPACE } from "../utils";
import { RunDataArray } from "speedcontrol-util/types";
import { computed } from "vue";

const { rtmp } = (nodecg as NodeCG.ClientAPI<ServerConfig>).bundleConfig;

const activeRunners = useReplicant<ActiveRunners[]>("activeRunners", NAMESPACE);
const obsStatus = useReplicant<OBSStatus>("obsStatus", NAMESPACE);

const allRuns = useReplicant<RunDataArray>("runDataArray", "nodecg-speedcontrol");
const surrounding = useReplicant<{
	previous?: string;
	current?: string;
	next?: string;
}>("runDataActiveRunSurrounding", "nodecg-speedcontrol");

const nextRun = computed(() => allRuns.data?.find(r => r.id === surrounding.data?.next))

const servers = [
  { name: "US West", value: "usw" },
  { name: "US East", value: "use" },
  { name: "Europe", value: "eu" },
  { name: "South America", value: "sa" },
  { name: "Asia/Pacific", value: "ap" },
];

function refreshStream(source: string | null) {
  if (source) {
    nodecg.sendMessage("restartMedia", source);
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
                  @click="refreshStream(player.source)">
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

    <Card id="runnerInfo" v-if="activeRunners.data">
      <template #title> Next Runner's Info </template>
      <template #content>
        <div v-if="nextRun" class="flex gap-1 mt-2">
        <FloatLabel variant="on">
          <InputText
            v-model="nextRun.teams[0].players[0].social.twitch"
            disabled
            :label-id="`player-next-stream-key`"
            fluid />
          <label :for="`player-next-stream-key`">
            Next Player Stream Key
          </label>
        </FloatLabel>
        <FloatLabel variant="on" >
          <Select
            v-model="nextRun.teams[0].players[0].customData.server"
            :options="servers"
            option-label="name"
            option-value="value"
            default-value="use"
            fluid
            :label-id="`player-next-server`"></Select>
          <label :for="`player-next-server`">
            View from server:
          </label>
        </FloatLabel>
        
        <Button
          :id="`player-next-open`"
          severity="info"
          
          variant="text"
          @click="() => openStream({
            server: nextRun?.teams[0].players[0].customData.server ?? 'use',
            streamKey: nextRun?.teams[0].players[0].social.twitch ?? '',
            cam: false,
            source: '' })"
          >
          <template #icon>
            <svg-icon type="mdi" :path="mdiOpenInNew" />
          </template>
        </Button>
      </div>
    </template>
  </Card>
</template>


<style></style>
