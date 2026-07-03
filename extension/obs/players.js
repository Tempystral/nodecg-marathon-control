"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlayerAudioSource = setPlayerAudioSource;
exports.resetStreamKeys = resetStreamKeys;
exports.updateStreamKeys = updateStreamKeys;
const replicants_1 = require("@nmc/util/replicants");
/**
 * Set the audio source name into the activeRunners replicant
 * @param sourceName - Name of the audio source
 */
async function setPlayerAudioSource(sourceName) {
    switch (true) {
        case sourceName.includes(`Player 1`):
            replicants_1.activeRunners.value[0].source = sourceName;
            break;
        case sourceName.includes(`Player 2`):
            replicants_1.activeRunners.value[1].source = sourceName;
            break;
        case sourceName.includes(`Player 3`):
            replicants_1.activeRunners.value[2].source = sourceName;
            break;
        case sourceName.includes(`Player 4`):
            replicants_1.activeRunners.value[3].source = sourceName;
            break;
    }
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
