"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlayerAudioSource = setPlayerAudioSource;
exports.resetStreamKeys = resetStreamKeys;
exports.updateStreamKeys = updateStreamKeys;
const defaultValues_1 = require("@nmc/defaultValues");
const replicants_1 = require("@nmc/util/replicants");
/**
 * Set the audio source name into the activeRunners replicant
 * @param sourceName - Name of the audio source
 */
async function setPlayerAudioSource(sourceName) {
    switch (true) {
        case sourceName.includes(`Player 1`):
            setActiveRunner(0, sourceName);
            break;
        case sourceName.includes(`Player 2`):
            setActiveRunner(1, sourceName);
            break;
        case sourceName.includes(`Player 3`):
            setActiveRunner(2, sourceName);
            break;
        case sourceName.includes(`Player 4`):
            setActiveRunner(3, sourceName);
            break;
    }
}
function setActiveRunner(index, sourceName) {
    if (!replicants_1.activeRunners.value[index]) {
        replicants_1.activeRunners.value[index] = defaultValues_1.activeRunner;
    }
    replicants_1.activeRunners.value[index].source = sourceName;
}
/**
 * Clear the stream keys from the activeRunners replicant
 */
function resetStreamKeys() {
    for (let j = 0; j < replicants_1.activeRunners.value.length; j++) {
        replicants_1.activeRunners.value[j].streamKey = null;
    }
}
/**
 * Update the activeRunners replicant with stream keys from speedcontrol RunData
 * @param teams - The teams to pull stream keys from
 */
function updateStreamKeys(teams) {
    resetStreamKeys();
    teams.forEach((team, i) => {
        team.players.forEach(async (player) => {
            replicants_1.activeRunners.value[i].streamKey = player.social.twitch ?? player.name;
        });
    });
}
