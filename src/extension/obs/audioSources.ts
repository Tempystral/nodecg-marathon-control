import { audioSources } from "@nmc/util/replicants";
import { OBSEventTypes } from "obs-websocket-js";

export function findAudioSource(name: string) {
  return audioSources.value?.find((input) => input.name === name);
}

export function changeVolume(data: OBSEventTypes["InputVolumeChanged"]) {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.volume = {
      mul: data.inputVolumeMul, //.toFixed(1),
      db: data.inputVolumeDb, //.toFixed(1),
    };
  }
}

export function toggleMute(data: OBSEventTypes["InputMuteStateChanged"]) {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.muted = data.inputMuted;
  }
}

export function adjustSyncOffset(
  data: OBSEventTypes["InputAudioSyncOffsetChanged"],
) {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.offset = data.inputAudioSyncOffset;
  }
}
