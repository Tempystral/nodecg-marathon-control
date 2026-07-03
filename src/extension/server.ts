import { OBSStatus } from "@nmc/types";
import { RunData, RunDataTeam } from "speedcontrol-util/types/speedcontrol";
import * as defaultValues from "./defaultValues";
import * as obs from "./obs/websocket";
import { useNodeCGRouter } from "./router";
import { get } from "./util/nodecg";
import {
  activeRunners,
  adPlayer,
  autoRecord,
  botSettings,
  checklist,
  obsStatus,
  runDataActiveRun,
  settings,
  streamSync,
  timer,
} from "./util/replicants";
import { useWebsocketServer } from "./websocketServer";
import { setPlayerURL } from "./obs";

const nodecg = get();

const { wsPath, upgradeServer } = useWebsocketServer();
const { upgrade } = useNodeCGRouter(nodecg);
upgrade(wsPath, upgradeServer);

// Start DACBot.
if (botSettings.value.active) {
  switch (nodecg.bundleConfig.botToken) {
    case "":
      nodecg.log.warn("No bot token has been provided!");
      break;
    default:
      /* DACBot.start(nodecg, wsServer.bot); */
      // No clue what this is either
      break;
  }
}

// Listen for requests from clients.
nodecg.listenFor("setPreviewScene", (value) =>
  obs.send("SetCurrentPreviewScene", { sceneName: value }),
);
nodecg.listenFor("startTransition", () =>
  obs.send("TriggerStudioModeTransition"),
);
nodecg.listenFor("setVolume", (value) =>
  obs.send("SetInputVolume", {
    inputName: value.source,
    inputVolumeDb: value.volume === null ? -100.0 : value.volume,
  }),
);
nodecg.listenFor("toggleMute", (value) =>
  obs.send("ToggleInputMute", { inputName: value }),
);
nodecg.listenFor("setOffset", (value) =>
  obs.send("SetInputAudioSyncOffset", {
    inputName: value.source,
    inputAudioSyncOffset: value.offset,
  }),
);
nodecg.listenFor("toggleStream", () => obs.send("ToggleStream"));
nodecg.listenFor("toggleRecording", () => obs.send("ToggleRecord"));
nodecg.listenFor("restartMedia", (value) =>
  obs.send("PressInputPropertiesButton", {
    inputName: value,
    propertyName: "refreshnocache",
  }),
);
nodecg.listenFor("refreshVideoSource", refreshVideoSource);

/* TODO: Low priority */
//nodecg.listenFor("startAd", () => playAds());

/* nodecg.listenFor("returnDelay", (value) =>
  syncStreams(value, streamSync.value),
); */

function resetStreamKeys() {
  for (let j = 0; j < activeRunners.value.length; j++) {
    activeRunners.value[j].streamKey = null;
  }
}

function updateStreamKeys(teams: RunDataTeam[]) {
  try {
    resetStreamKeys();
    teams.forEach((team) => {
      team.players.forEach(async (player, i) => {
        activeRunners.value[i].streamKey = player.social.twitch ?? player.name;
      });
    });
  } catch (e) {
    nodecg.log.error(e);
  }
}

runDataActiveRun.on("change", (newVal, oldVal) => {
  nodecg.log.debug("onChange - runDataActiveRun");
  if (!newVal) {
    resetStreamKeys();
    return;
  }
  if (newVal.id !== oldVal?.id) {
    if (settings.value.autoSetRunners) {
      updateStreamKeys(newVal.teams);
    }
    if (
      settings.value.autoSetLayout &&
      newVal.customData !== undefined &&
      newVal.customData.layout !== undefined
    )
      try {
        obs.send("SetCurrentPreviewScene", {
          sceneName: newVal.customData.layout,
        });
      } catch {}
    setFilenameFormatting(autoRecord.value.filenameFormatting, newVal);
    streamSync.value.delay = [null, null, null, null];
  }
});

activeRunners.on("change", (newVal, oldVal) => {
  if (newVal && newVal != oldVal) {
    newVal.forEach(async (player, i) => {
      if (player.streamKey && player.server) {
        await setPlayerURL(i, player);
      }
    });
  }
});

obsStatus.on("change", onStatusChange);

async function onStatusChange(newVal?: OBSStatus, oldVal?: OBSStatus) {
  if (!oldVal || !newVal) {
    return;
  }
  if (newVal.emergencyTransition !== oldVal.emergencyTransition) {
    await emergencyTransition(newVal);
  }
  if (newVal.inIntermission !== oldVal.inIntermission) {
    updateChecklist(newVal);
  }
}

// Emergency transition logic.
async function emergencyTransition(data: OBSStatus) {
  nodecg.log.debug(`Emergency transition! Status: ${data.emergencyTransition}`);
  if (!data.emergencyTransition) {
    await obs.send("TriggerStudioModeTransition");
    return;
  }
  await obs.send("SetCurrentPreviewScene", {
    sceneName: settings.value.defaultScene,
  });
  await obs.send("TriggerStudioModeTransition");
  return;
}

function updateChecklist(newVal: OBSStatus) {
  if (newVal.inIntermission && timer.value?.state === "finished") {
    checklist.value = defaultValues.checklist;
    checklist.value.started = true;
  }
}

checklist.on("change", (newVal) => {
  if (!newVal.completed) {
    let item: keyof typeof newVal.items;
    for (item in newVal.items) {
      if (newVal.items[item] === false) {
        checklist.value.completed = false;
        return;
      }
    }
    setTimeout(() => {
      checklist.value.completed = true;
    }, 100);
  }
});

// Set filename formatting.
function setFilenameFormatting(filename: string, data: RunData) {
  filename = filename.replace(/%GAME/g, data.game ?? "");
  filename = filename.replace(/%CAT/g, data.category ?? "");
  filename = filename.replace(/%RGN/g, data.region ?? "");
  filename = filename.replace(/%REL/g, data.release ?? "");
  filename = filename.replace(/%TWIT/g, data.gameTwitch ?? "");
  filename = filename.replace(/%SYS/g, data.system ?? "");
  filename = filename.replace(/%SYS/g, data.estimate ?? "");
  filename = filename.replace(/%SET/g, data.setupTime ?? "");

  if (filename.includes("%RNR")) {
    let playerString = "";
    data.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (playerString === "") {
          playerString = player.name;
        } else {
          playerString = playerString.concat(", ", player.name);
        }
      });
    });
    filename = filename.replace(/%RNR/g, playerString);
  }
  filename = filename.replaceAll(/%/g, "%%");
  filename = filename.replaceAll(/[<>:\"\/\\|?*]/g, "");
  nodecg.log.debug(`Filename format: ${filename}`);
  obs.send("SetProfileParameter", {
    parameterCategory: "Output",
    parameterName: "FilenameFormatting",
    parameterValue: filename,
  });
}

async function refreshVideoSource() {
  const adData = adPlayer.value;
  const itemList = await obs.send("GetSceneItemList", {
    sceneName: adData.videoScene ?? "",
  });
  for (const item of itemList.sceneItems) {
    if (item.inputKind !== "browser_source") continue;
    await obs.send("PressInputPropertiesButton", {
      inputName: item.sourceName?.toString(),
      propertyName: "refreshnocache",
    });
  }
  adPlayer.value.adPlaying = false;
  adPlayer.value.secondsLeft = 0;
}
