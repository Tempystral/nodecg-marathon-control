<script setup lang="ts">
import { ActiveRunners, AudioSource } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";
import { NAMESPACE } from "../utils";
import { computed, onMounted, ref, watch } from "vue";
import Slider from "primevue/slider";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import SvgIcon from "@jamescoyle/vue-icon";

const activeRunners = useReplicant<ActiveRunners[]>("activeRunners", NAMESPACE);
const audioSources = useReplicant<AudioSource[]>("audioSources", NAMESPACE);

/* window.onload = () => {
  NodeCG.waitForReplicants(audioSources, activeRunners).then(() => {
    audioSources.on("change", (newVal, oldVal) => {
      if (!oldVal || newVal.length !== oldVal.length)
        return createAudioSources(newVal);
      const changedSources = [];
      newVal.forEach((source, index) => {
        if (JSON.stringify(source) !== JSON.stringify(oldVal[index]))
          changedSources.push(source);
      });
      for (const source of changedSources) {
        document.querySelector(
          `.volumeLabel[source="${source.name}"]`,
        ).innerHTML = dbToString(source.volume.db);
        document.querySelector(
          `.muteButton[source="${source.name}"]`,
        ).buttonText =
          `<span class="material-icons mute" source="${source.name}" style="color: ${source.muted ? "red" : "white"};">${source.muted ? "volume_off" : "volume_up"}</span>`;
        document.querySelector(`.slider[source="${source.name}"]`).value =
          dbToPercent(source.volume.db);
        document.querySelector(`.offset[source="${source.name}"]`).value =
          source.offset;
      }
    });
  });
}; */

/* function createAudioSources(newVal) {
  const newArray = [];
  newVal.forEach((element) => newArray.push(element));
  const audioSources = newArray.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
  document.getElementById("sourceSliders").innerHTML = "";
  for (const playerSource of activeRunners.value) {
    const source = audioSources.find((x) => x.name === playerSource.source);
    if (source) createSlider(source);
  }
  for (const source of audioSources) {
    if (
      document.querySelector(`.volumeLabel[source="${source.name}"]`) === null
    )
      createSlider(source);
  }
} */

const playerAudioSources = computed(() =>
  activeRunners.data
    ?.map((r) => audioSources.data?.find((x) => x.name === r.source))
    .filter((r) => r != undefined),
); //ref<AudioSource[]>([]);
//watch(() => activeRunners.data, updateAudioSources);

/* const sources = 

function updateAudioSources(runners?: ActiveRunners[]) {
  playerAudioSources.value = [];
  if (runners && audioSources.data) {
    for (const player of runners) {
      const source = audioSources.data.find((x) => x.name === player.source);
      if (source) {
        playerAudioSources.value.push(source);
      }
    }
  }
}

onMounted(() => {
  updateAudioSources(activeRunners.data);
}); */

/* function createSlider(source: AudioSource) {
  const slider = `
	<div class="sliderContainer">
		<span class="label">${source.name}</span>
		<span class="volumeLabel" source="${source.name}">${dbToString(source.volume.db)}</span>
		<div class="sliderDiv">
			<Button class="muteButton" source="${source.name}" onclick="nodecg.sendMessage('toggleMute', '${source.name}')">
				<span class="material-icons mute" source="${source.name}" style="color: ${source.muted ? "red" : "white"};">${source.muted ? "volume_off" : "volume_up"}</span>
			</Button>
			<Slider class="slider" source="${source.name}" min="0" max="100" value="${dbToPercent(source.volume.db)}" onInput="setLabel('${source.name}', this.value)" onChange="nodecg.sendMessage('setVolume', { source: '${source.name}', volume: parseFloat(percentToDb(this.value)) })"></Slider>
			<InputText type="number" class="offset" label="Offset" source="${source.name}" value="${source.offset}" onChange="nodecg.sendMessage('setOffset', { source: '${source.name}', offset: parseInt(this.value) })"></InputText>
		</div>
	</div>`;
  document.getElementById("sourceSliders").innerHTML += slider;
}

function setLabel(source, value) {
  document.querySelector(`.volumeLabel[source="${source}"]`).innerHTML =
    dbToString(percentToDb(value));
} */

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

const volume = ref(0);
</script>
<template>
  <div id="sourceSliders">
    <div
      class="sliderContainer"
      v-for="(source, i) of playerAudioSources"
      :key="`player-${i}-slider`">
      <span class="label">{{ source.name }}</span>
      <span class="volumeLabel">
        {{ dbToString(volume) }}
      </span>
      <div class="sliderDiv">
        <Button class="muteButton" @click="mute(source)">
          <SvgIcon
            type="mdi"
            :path="source.muted ? 'volume_off' : 'volume_up'"
            :class="source.muted ? 'text-red-500' : 'text-white'" />
        </Button>
        <Slider
          class="slider"
          :min="0"
          :max="100"
          v-model="volume"
          value="${dbToPercent(source.volume.db)}"
          onInput="setLabel('${source.name}', this.value)"
          @change="setVolume(source, volume)"></Slider>
        <InputText
          type="number"
          class="offset"
          label="Offset"
          source="${source.name}"
          value="${source.offset}"
          onChange="nodecg.sendMessage('setOffset', { source: '${source.name}', offset: parseInt(this.value) })"></InputText>
      </div>
    </div>
  </div>
</template>

<style></style>
