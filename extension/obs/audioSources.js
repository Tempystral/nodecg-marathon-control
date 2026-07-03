"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAudioSource = findAudioSource;
exports.changeVolume = changeVolume;
exports.toggleMute = toggleMute;
exports.adjustSyncOffset = adjustSyncOffset;
const replicants_1 = require("@nmc/util/replicants");
function findAudioSource(name) {
    return replicants_1.audioSources.value?.find((input) => input.name === name);
}
function changeVolume(data) {
    const source = findAudioSource(data.inputName);
    if (source) {
        source.volume = {
            mul: data.inputVolumeMul, //.toFixed(1),
            db: data.inputVolumeDb, //.toFixed(1),
        };
    }
}
function toggleMute(data) {
    const source = findAudioSource(data.inputName);
    if (source) {
        source.muted = data.inputMuted;
    }
}
function adjustSyncOffset(data) {
    const source = findAudioSource(data.inputName);
    if (source) {
        source.offset = data.inputAudioSyncOffset;
    }
}
