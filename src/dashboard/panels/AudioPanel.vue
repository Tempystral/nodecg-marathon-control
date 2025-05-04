<script setup lang="ts">
import { ActiveRunners, AudioSource } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import { NAMESPACE } from "../utils";
import { computed, onMounted, ref, unref, watch } from "vue";
import Slider from "primevue/slider";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import SvgIcon from "@jamescoyle/vue-icon";
import InputNumber from "primevue/inputnumber";
import { mdiVolumeHigh, mdiVolumeOff, mdiVolumePlus } from "@mdi/js";
import FloatLabel from "primevue/floatlabel";

// kludgy solution, I think a better way would be to just fix the type issue and control the value directly from v-model
const activeRunners = nodecg.Replicant<ActiveRunners[]>(
  "activeRunners",
  NAMESPACE,
);
const audioSources = nodecg.Replicant<AudioSource[]>("audioSources", NAMESPACE);

const playerAudioSources = ref<AudioSource[]>();

NodeCG.waitForReplicants(activeRunners, audioSources).then(() => {
  playerAudioSources.value = activeRunners.value
    ?.map((r) => audioSources.value?.find((x) => x.name === r.source))
    .filter((r) => r != undefined);
});

// const playerAudioSources = computed(() =>
//   activeRunners.data
//     ?.map((r) => audioSources.data?.find((x) => x.name === r.source))
//     .filter((r) => r != undefined),
// );

const volume = ref([0, 0, 0, 0]);

watch(
  playerAudioSources,
  (val) => {
    val?.forEach((source, i) => {
      volume.value[i] = parseFloat(dbToPercent(parseFloat(source.volume.db)));
    });
  },
  { once: true },
);

// function percentToMul(value) {
// 	value = value / 100;
// 	value = 20 * Math.log10(value);
// 	value = Math.pow(10, -Math.abs(value / 10));
// 	value = value.toFixed(2);
// 	return parseFloat(value);
// }

function dbToPercent(value: number) {
  return (Math.pow(10, value / 40) * 100).toFixed(0);
}

function dbToString(value: number) {
  if (value < -99) return "-inf dB";
  return value + " dB";
}

function percentToDb(value: number) {
  return (40 * Math.log10(value) - 80).toFixed(1);
}

async function mute(source: AudioSource) {
  await nodecg.sendMessage("toggleMute", source.name);
}

async function setVolume(source: AudioSource, volume: number) {
  await nodecg.sendMessage("setVolume", {
    source: source.name,
    volume: parseFloat(percentToDb(volume)),
  });
}

async function setOffset(source: AudioSource) {
  await nodecg.sendMessage("setOffset", {
    source: source.name,
    offset: source.offset,
  });
}
</script>
<template>
  <div id="sourceSliders">
    <div
      class="sliderContainer"
      v-for="(source, i) of playerAudioSources"
      :key="`player-${i}-slider`">
      <div class="mb-2">
        <span class="mb-2">
          {{ source.name }}
        </span>

        <div class="sliderDiv flex gap-4">
          <Button
            class="muteButton"
            severity="secondary"
            size="small"
            @click="mute(source)">
            <SvgIcon
              type="mdi"
              :path="source.muted ? mdiVolumeOff : mdiVolumeHigh"
              :class="source.muted ? 'text-red-500' : 'text-white'" />
          </Button>
          <div class="flex-grow-1 flex flex-col gap-2">
            <span class="-mt-1" :id="`player-${i}-volume-slider`">
              {{ percentToDb(volume[i]) }} dB
            </span>
            <Slider
              :aria-labelledby="`player-${i}-volume-slider`"
              class="w-full"
              :min="0"
              :max="100"
              v-model="volume[i]"
              @change="setVolume(source, volume[i])">
            </Slider>
          </div>
          <FloatLabel variant="over" class="w-12">
            <InputNumber
              type="number"
              input-id="playerOffset"
              v-model="source.offset"
              @change="setOffset(source)" />
            <label for="playerOffset" class="-ms-1">Offset</label>
          </FloatLabel>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Fix your library please */
.p-inputnumber input {
  width: 100%;
}
</style>
