import { activeRunners } from "@nmc/util/replicants";
import { RunDataTeam } from "speedcontrol-util/types/speedcontrol";

/**
 * Set the audio source name into the activeRunners replicant
 * @param sourceName - Name of the audio source
 */
export async function setPlayerAudioSource(sourceName: string) {
  switch (true) {
    case sourceName.includes(`Player 1`):
      activeRunners.value[0].source = sourceName;
      break;
    case sourceName.includes(`Player 2`):
      activeRunners.value[1].source = sourceName;
      break;
    case sourceName.includes(`Player 3`):
      activeRunners.value[2].source = sourceName;
      break;
    case sourceName.includes(`Player 4`):
      activeRunners.value[3].source = sourceName;
      break;
  }
}

/**
 * Clear the stream keys from the activeRunners replicant
 */
export function resetStreamKeys() {
  for (let j = 0; j < activeRunners.value.length; j++) {
    activeRunners.value[j].streamKey = null;
  }
}

/**
 * Update the activeRunners replicant with stream keys from speedcontrol RunData
 * @param teams - The teams to pull stream keys from
 */
export function updateStreamKeys(teams: RunDataTeam[]) {
  resetStreamKeys();
  teams.forEach((team, i) => {
    team.players.forEach(async (player) => {
      activeRunners.value[i].streamKey = player.social.twitch ?? player.name;
    });
  });
}
