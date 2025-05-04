<script setup lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiVolumeHigh, mdiVolumeOff } from "@mdi/js";
import { ActiveRunners, AudioSource } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputNumber from "primevue/inputnumber";
import Slider from "primevue/slider";
import { ref, watch } from "vue";
import { NAMESPACE } from "../utils";

const activeRunners = useReplicant<ActiveRunners[]>("activeRunners", NAMESPACE);
const audioSources = useReplicant<AudioSource[]>("audioSources", NAMESPACE);

const playerAudioSources = ref<AudioSource[]>(); // Audio sources for the players specifically
interface VolumeSlider {
  value: number;
  active: boolean;
}
const sliders = ref<VolumeSlider[]>([
  { value: 0, active: false },
  { value: 0, active: false },
  { value: 0, active: false },
  { value: 0, active: false },
]); // Volume (in %) for each player source

watch(
  () => audioSources.data,
  (sources) => {
    // Set player audio sources from the list of OBS audio sources
    playerAudioSources.value = activeRunners.data
      ?.map((r) => sources?.find((x) => x.name === r.source))
      .filter((r) => r != undefined);
    // For each player audio source, set its volume only if its slider is not being used
    // This prevents double-assignment when we change the volume here
    // and OBS reports the change a second later
    playerAudioSources.value?.forEach((source, i) => {
      const newVol = dbToPercent(source.volume.db);
      const currVol = sliders.value[i].value;
      if (!sliders.value[i].active && currVol != newVol) {
        // Only update this if the handle isn't being grabbed
        console.log(`Slider ${source.name} updated from OBS`);
        sliders.value[i].value = newVol;
      }
    });
  },
);

// I hate how these are more accurate than the math functions but fine, they work
function dbToPercent(value: number) {
  return parseFloat((Math.pow(10, value / 40) * 100).toFixed(0));
}

function percentToDb(value: number) {
  return parseFloat((40 * Math.log10(value) - 80).toFixed(1));
}

async function mute(source: AudioSource) {
  await nodecg.sendMessage("toggleMute", source.name);
}

async function setVolume(source: AudioSource, slider: VolumeSlider) {
  slider.active = true;
  console.log(`Slider ${source.name} updated from NodeCG`);
  await nodecg.sendMessage("setVolume", {
    source: source.name,
    volume: percentToDb(slider.value),
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
              {{ percentToDb(sliders[i].value) }} dB
            </span>
            <Slider
              :aria-labelledby="`player-${i}-volume-slider`"
              class="w-full"
              :min="0"
              :max="100"
              v-model="sliders[i].value"
              @change="setVolume(source, sliders[i])"
              @slideend="sliders[i].active = false">
            </Slider>
          </div>
          <FloatLabel variant="over" class="w-12">
            <InputNumber
              type="number"
              :input-id="`player-${i}-offset`"
              v-model="source.offset"
              @change="setOffset(source)" />
            <label :for="`player-${i}-offset`" class="-ms-1">Offset</label>
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
