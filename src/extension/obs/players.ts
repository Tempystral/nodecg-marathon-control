import { activeRunner } from "@nmc/defaultValues";
import { activeRunners } from "@nmc/util/replicants";
import { RunDataTeam } from "speedcontrol-util/types/speedcontrol";

/**
 * Set the audio source name into the activeRunners replicant
 * @param sourceName - Name of the audio source
 */
export async function setPlayerAudioSource(sourceName: string) {
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

function setActiveRunner(index: number, sourceName: string) {
  if (!activeRunners.value[index]) {
    activeRunners.value[index] = activeRunner;
  }
  activeRunners.value[index].source = sourceName;
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
