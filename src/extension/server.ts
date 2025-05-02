import path from "path";

import { RunDataTeam } from "speedcontrol-util/types/speedcontrol";
import { get } from "./util/nodecg";
import * as obs from "./obs";
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

import { ChecklistData, OBSStatus } from "@nmc/types";

const nodecg = get();
const config = nodecg.bundleConfig.websocket;

const { wsPath, upgradeServer } = useWebsocketServer();

let isUpgraded = false;
// const delayArray = {};

if (!config.ip || config.ip === "" || !config.port || config.port === "") {
  nodecg.log.error(
    `OBS Websocket address has not been defined!
      Please add the IP address and port in the config.`,
  );
  process.exit(1);

  /* gracefulExit(); */ // IDK what this is
}

// Set up delay page.
const app = nodecg.Router();
app.get("/delay", (req, res) =>
  res.sendFile(path.join(__dirname, "../graphics/delay.html")),
);

app.get(`${wsPath}/start`, (req, res) => {
  if (!isUpgraded) {
    upgradeServer(req.socket);
    isUpgraded = true;
  }
  res.sendStatus(200);
});

nodecg.mount(app);

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
  for (let j = 0; j < 4; j++) {
    activeRunners.value[j].streamKey = null;
  }
}

function updateStreamKeys(teams: RunDataTeam[]) {
  try {
    resetStreamKeys();
    teams.forEach((team) => {
      team.players.forEach((player, i) => {
        activeRunners.value[i].streamKey = player.social.twitch ?? "";
      });
    });
  } catch (e) {
    nodecg.log.error(e);
  }
}

runDataActiveRun.on("change", (newVal, oldVal) => {
  if (!newVal) {
    resetStreamKeys();
    return;
  }
  if ((!oldVal && newVal) || newVal.id !== oldVal?.id) {
    if (checklist.value.started) checklist.value.default.playRun = true;
    if (settings.value.autoSetRunners) {
      try {
        for (let j = 0; j < 4; j++) {
          activeRunners.value[j].streamKey = null;
        }
        let i = 0;
        newVal.teams.forEach((team) => {
          team.players.forEach((player) => {
            // Prefer twitch name, but if it's unset fall back to username (which cannot be null)
            activeRunners.value[i].streamKey =
              player.social.twitch || player.name;
            i++;
          });
        });
        for (let j = i; j < 4; j++) {
          activeRunners.value[i].streamKey = null;
        }
      } catch {}
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
    setFilenameFormatting(autoRecord.value.filenameFormatting);
    streamSync.value.delay = [null, null, null, null];
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
    sceneName: settings.value.intermissionScene,
  });
  await obs.send("TriggerStudioModeTransition");
  return;
}

function updateChecklist(newVal: OBSStatus) {
  if (newVal.inIntermission && timer.value?.state === "finished") {
    const def = {} as ChecklistData["default"];
    const custom = {};
    for (const item of Object.keys(checklist.value.default)) {
      Object.defineProperty(def, item, { value: false });
    }
    for (const item of Object.keys(checklist.value.custom ?? {})) {
      Object.defineProperty(custom, item, { value: false });
    }
    checklist.value = {
      started: true,
      completed: false,
      default: def,
      custom: custom,
    };
  }
}

checklist.on("change", (newVal, oldVal) => {
  if (
    !oldVal &&
    JSON.stringify(newVal.customOld) !==
      JSON.stringify(nodecg.bundleConfig.checklist)
  )
    createCustomChecklist();
  if (newVal.started && !newVal.completed) {
    let item: keyof typeof newVal.default;
    for (item in newVal.default) {
      if (!newVal.default[item]) {
        checklist.value.completed = false;
        return;
      }
    }
    for (const item of Object.keys(newVal.custom ?? {})) {
      if (!newVal.custom?.[item]) {
        return (checklist.value.completed = false);
      }
    }
    // setTimeout(() => {
    //   checklist.value.completed = true;
    // }, 100);
  }
});

function createCustomChecklist() {
  checklist.value.customOld = nodecg.bundleConfig.checklist;
  const custom = {};
  for (const item of Object.keys(nodecg.bundleConfig.checklist)) {
    Object.defineProperty(custom, item, { value: false });
  }
  checklist.value.custom = custom;
}

// Set filename formatting.
async function setFilenameFormatting(filename: string) {
  if (runDataActiveRun.value) {
    const data = runDataActiveRun.value;
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
  }
  filename = filename.replaceAll(/%/, "%%");
  filename = filename.replaceAll(/[<>:\"\/\\|?*]/, "");
  await obs.send("SetProfileParameter", {
    parameterCategory: "Output",
    parameterName: "FilenameFormatting",
    parameterValue: filename,
  });
}

// Get stream delay.
/* nodecg.listenFor("startStreamSync", () => getStreamDelay(streamSync.value)); */

/* streamSync.on("change", (newVal, oldVal) => {
  if (!oldVal) return;
  if (
    newVal.active &&
    newVal.status.delays &&
    JSON.stringify(newVal.delay) !== JSON.stringify(oldVal.delay)
  )
    checkDelayArray(newVal);
}); */

// sendSyncSignal();

/* function sendSyncSignal() {
  let num = 0;
  setInterval(() => {
    clients.delay.forEach(async (client) => {
      client.send(
        JSON.stringify({
          type: "delay",
          data: {
            num: num,
            binary: num
              .toString(2)
              .split("")
              .map((x) => !!+x)
              .reverse(),
            frame: num % 2 === 0,
          },
        }),
      );
    });
    num++;
    if (num > 128) num = 0;
  }, 500);
} */

/* function getStreamDelay() {
  if (streamSync.value.status.delays) return;
  streamSync.value.status.delays = true;
  delayArray = [null, null, null, null];
  nodecg.sendMessage("getDelay");
} */

// function sendSyncSignal(autoSync) {
//   if (!autoSync) nodecg.log.info("Stream sync requested on " + Date() + ".");
//   //streamSync.value.delay = [null, null, null, null];
//   streamSync.value.status = {
//     delays: true,
//     syncing: false,
//     error: false,
//     autoSync: autoSync,
//     checked: 0,
//   };
//   clients.delay.forEach(async (client) => {
//     client.obs.send(
//       JSON.stringify({ type: "delay", data: "Trigger ty square!" }),
//     );
//   });
//   nodecg.sendMessage("getDelay");
//   setTimeout(() => {
//     if (streamSync.value.status.delays) {
//       checklist.value.default.syncStreams = true;
//       streamSync.value.status = {
//         delays: false,
//         syncing: false,
//         error: true,
//         autoSync: null,
//         checked: null,
//       };
//     }
//   }, 60000);
// }

// function checkDelayArray(newVal) {
//   streamSync.value.status.checked = streamSync.value.status.checked + 1;
//   const numRunners = activeRunners.value.filter((x) => x.streamKey !== null);
//   if (
//     streamSync.value.status.checked >= numRunners.length &&
//     streamSync.value.status.checked !== null
//   )
//     syncStreams(newVal);
// }

// Stream Sync™
/* TODO: Maybe fix this but we shouldn't need it anymore */
/* function syncStreams(
  res: ReturnDelay,
  newVal: StreamSyncData,
  autoSync: boolean = false,
) {
  delayArray[res.playerNum] = res.delay;
  if (
    delayArray.filter(Boolean).length <
    streamSync.value.delay.filter(Boolean).length
  )
    return;
  streamSync.value.status = {
    delays: false,
    syncing: true,
    autoSync: autoSync ? true : false,
  };
  const filteredArray = delayArray.filter((e) => e);
  const biggestDelay = Math.max(...filteredArray);
  const smallestDelay = Math.min(...filteredArray);
  if (
    (autoSync && biggestDelay - smallestDelay < newVal.maxOffset) ||
    filteredArray <= 1
  )
    return finishSync();
  if (!autoSync) nodecg.log.info("Stream sync requested on " + Date() + ".");
  const syncArray = [];
  for (const delay of delayArray) {
    switch (delay) {
      case null:
        syncArray.push(null);
        break;
      default:
        syncArray.push(biggestDelay - delay);
        break;
    }
  }
  nodecg.sendMessage("syncStreams", syncArray);
  setTimeout(() => finishSync(), Math.max(...syncArray) + 500);

  function finishSync() {
    streamSync.value.status = {
      delays: false,
      syncing: false,
      autoSync: false,
    };
    // for (let i = 0; i < 4; i++) {
    //     if (syncArray && syncArray[i] > 0) {
    //      streamSync.value.delay[i] = streamSync.value.delay[i] + syncArray[i];
           }
    // }
    checklist.value.default.syncStreams = true;
  }
} */

// Ad player.
/* async function playAds() {
  const newVal = adPlayer.value;
  nodecg.log.info("Ad requested on " + Date() + ".");
  const video = {};
  if (newVal.videoAds) {
    const sceneItems = await obs.send("GetSceneItemList", {
      sceneName: newVal.videoScene,
    });
    const inputs = [];
    for (const item of sceneItems.sceneItems) {
      if (item.inputKind === "ffmpeg_source") inputs.push(item.sourceName);
    }
    video.name = inputs[Math.floor(Math.random() * inputs.length)];
    await obs.send("TriggerMediaInputAction", {
      inputName: video.name,
      mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
    });
    const status = await obs.send("GetMediaInputStatus", {
      inputName: video.name,
    });
    video.duration = status.mediaDuration;
    await obs.send("TriggerMediaInputAction", {
      inputName: video.name,
      mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP",
    });
  }
  let secondsLeft = 0;

  switch (true) {
    case newVal.videoAds && newVal.twitchAds:
      secondsLeft =
        Math.ceil(video.duration / 1000) +
        parseFloat(newVal.twitchAdLength) +
        1 +
        10;
      break;
    case newVal.videoAds:
      secondsLeft = Math.ceil(video.duration / 1000) + 1;
      break;
    case newVal.twitchAds:
      secondsLeft = parseFloat(newVal.twitchAdLength) + 10;
      break;
  }

  adPlayer.value.adPlaying = true;
  adPlayer.value.secondsLeft = secondsLeft;
  secondsLeft--;
  const timerInterval = setInterval(() => {
    adPlayer.value.secondsLeft = secondsLeft;
    secondsLeft--;
    if (secondsLeft < 0) {
      adPlayer.value.secondsLeft = 0;
      adPlayer.value.adPlaying = false;
      checklist.value.default.playAd = true;
      clearInterval(timerInterval);
    }
  }, 1000);

  if (newVal.videoAds) await playVideo();
  if (newVal.twitchAds) await playTwitch();

  try {
    clearInterval(timerInterval);
  } catch {}

  adPlayer.value.secondsLeft = 0;
  adPlayer.value.adPlaying = false;
  checklist.value.default.playAd = true;

  async function playVideo() {
    return new Promise(async (resolve) => {
      const previewScene = obsStatus.value.previewScene;
      await obs.send("SetCurrentPreviewScene", {
        sceneName: newVal.videoScene,
      });
      await obs.send("TriggerStudioModeTransition");
      obs.once("SceneTransitionEnded", async () => {
        setTimeout(() => {
          obs.send("TriggerMediaInputAction", {
            inputName: video.name,
            mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART",
          });
          obs.send("SetCurrentPreviewScene", { sceneName: previewScene });
        }, 500);
        setTimeout(async () => {
          await obs.send("SetCurrentPreviewScene", {
            sceneName: settings.value.intermissionScene,
          });
          setTimeout(
            async () =>
              await obs.send("TriggerMediaInputAction", {
                inputName: video.name,
                mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP",
              }),
            5000,
          );
          setTimeout(async () => {
            await obs.send("TriggerStudioModeTransition");
            obs.once("SceneTransitionEnded", () => {
              setTimeout(
                () =>
                  obs.send("SetCurrentPreviewScene", {
                    sceneName: previewScene,
                  }),
                500,
              );
              resolve();
            });
          }, 6000);
        }, video.duration - 4000);
      });
    });
  }

  async function playTwitch() {
    return new Promise(async (resolve) => {
      const duration = parseInt(adPlayer.value.twitchAdLength);
      nodecg.log.debug({ duration: duration, fromDashboard: false });
      nodecg.sendMessageToBundle(
        "twitchStartCommercial",
        "nodecg-speedcontrol",
        { duration: duration, fromDashboard: false },
      );
      nodecg.sendMessageToBundle(
        "twitchStartCommercialTimer",
        "nodecg-speedcontrol",
        { duration: duration },
      );
      setTimeout(() => resolve(), (duration + 5) * 1000);
    });
  }
} */

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

//     function updateCurrentScene(scene) {
//         currentScene.value.program = scene;
//         settings.value.inTransition = false;
//         if (scene !== settings.value.intermissionScene && !adPlayer.value.adPlaying) {
//             settings.value.inIntermission = false;
//             settings.value.emergencyTransition = false;
//         }
//         else {
//             settings.value.inIntermission = true;
//             if (timer.value.state === 'finished') {
//                 checklist.value = {
//                     started: true,
//                     completed: false,
//                     playRun: false,
//                     playAd: false,
//                     verifyStream: false,
//                     syncStreams: false,
//                     checkAudio: false,
//                     checkInfo: false,
//                     checkReady: false,
//                     finalCheck: false
//                 }
//                 if (!adPlayer.value.videoAds && !adPlayer.value.twitchAds) {
//                   checklist.value.playAd = true;
//                 }
//             }
//         }
//     }
