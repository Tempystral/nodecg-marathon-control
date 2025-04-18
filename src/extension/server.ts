import { OBSResponseTypes } from "obs-websocket-js";
import path from "path";
import * as DACBot from "./bot";

import { RunDataTeam } from "speedcontrol-util/types/speedcontrol";
import * as obs from "./obs";
import { config, get } from "./util/nodecg";
import {
  activeRunners,
  adPlayer,
  audioSources,
  autoRecord,
  botSettings,
  checklist,
  obsStatus,
  runDataActiveRun,
  sceneList,
  settings,
  stats,
  streamSync,
  timer,
} from "./util/replicants";
import { useWebsocketServer } from "./websocketServer";
import { setIntervalAsync } from "set-interval-async";

import * as defaultValue from "./defaultValues";

const nodecg = get();

const { wsServer, wsPath, upgradeServer, clients } = useWebsocketServer();

const lastRun = +new Date();
let isUpgraded = false;
let delayArray = {};

if (!config.ip || config.ip === "" || !config.port || config.port === "") {
  nodecg.log.error(
    `OBS Websocket address has not been defined!
      Please add the IP address and port in the config.`,
  );
  process.exit(1);
  gracefulExit();
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
      DACBot.start(nodecg, wsServer.bot);
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
nodecg.listenFor("startAd", () => playAds());
nodecg.listenFor("refreshVideoSource", () => refreshVideoSource());
nodecg.listenFor("returnDelay", (value) =>
  syncStreams(value, streamSync.value),
);

async function setup(msg: boolean) {
  if (msg) {
    nodecg.log.info(
      `Successfully connected to OBS instance at ws://${config.ip}:${config.port}`,
    );
  }

  streamSync.value.status = {
    delays: false,
    syncing: false,
    autoSync: false,
  };
  adPlayer.value.adPlaying = false;

  await obs.send("SetStudioModeEnabled", { studioModeEnabled: true });

  const streamStatus = await obs.send("GetStreamStatus");
  const recordingStatus = await obs.send("GetRecordStatus");
  const previewScene = await obs.send("GetCurrentPreviewScene");
  const programScene = await obs.send("GetCurrentProgramScene");

  obsStatus.value = {
    previewScene: previewScene.currentPreviewSceneName,
    programScene: programScene.currentProgramSceneName,
    inIntermission:
      programScene.currentProgramSceneName === settings.value.intermissionScene
        ? true
        : false,
    inTransition: false,
    emergencyTransition: false,
    streaming: streamStatus.outputActive,
    recording: recordingStatus.outputActive,
  };

  // Auto Stream Sync™
  setInterval(() => {
    if (
      streamSync.value.autoSync &&
      (timer.value.state === "running" || timer.value.state === "paused")
    )
      sendSyncSignal();
  }, 120000);

  setIntervalAsync(getStats, 2000);

  getScenes();
  getAudioSources();
}

async function getStats() {
  const data = await obs.send("GetStats");
  let streamData: OBSResponseTypes["GetOutputStatus"] = {
    outputActive: false,
    outputBytes: 0,
    outputCongestion: 0,
    outputDuration: 0,
    outputReconnecting: false,
    outputSkippedFrames: 0,
    outputTimecode: "",
    outputTotalFrames: 0,
  };

  if (obsStatus.streaming) {
    streamData = await obs.send("GetOutputStatus", {
      outputName: "adv_stream",
    });
  }

  stats.value = {
    cpuUsage: `${data.cpuUsage.toFixed(1)}%`,
    fps: `${data.activeFps.toFixed(1)} FPS`,
    kbitsPerSec: `? kb/s`,
    averageFrameTime: `${data.averageFrameRenderTime.toFixed(1)} ms`,
    skippedFrames: `${data.renderSkippedFrames} / ${data.renderTotalFrames}\
     (${((data.renderSkippedFrames / data.renderTotalFrames) * 100).toFixed(1)}%)`,
    missedFrames: `${data.outputSkippedFrames} / ${data.outputTotalFrames}\
     (${((data.outputSkippedFrames / data.outputTotalFrames) * 100).toFixed(1)}%)`,
    totalFrames: `${data.outputTotalFrames}`,
    droppedFrames:
      streamData.outputSkippedFrames !== undefined
        ? `${streamData.outputSkippedFrames} / ${streamData.outputTotalFrames}\
         (${((streamData.outputSkippedFrames / streamData.outputTotalFrames) * 100).toFixed(1)}%)`
        : "0 / 0 (NaN%)",
    uptime: streamData.outputTimecode
      ? streamData.outputTimecode.slice(0, -4)
      : "00:00:00",
    diskSpace: `${(data.availableDiskSpace / 1024).toFixed(1)} GB`,
    autoRecord: settings.value.autoRecord ? "Active" : "Inactive",
  };
}

function resetStreamKeys() {
  for (let j = 0; j < 4; j++) {
    activeRunners.value[j].streamKey = null;
  }
}

function updateStreamKeys(teams: RunDataTeam[]) {
  try {
    resetStreamKeys();
    let i = 0;
    teams.forEach((team) => {
      team.players.forEach((player) => {
        activeRunners.value[i].streamKey = player.social.twitch;
        i++;
      });
    });
    for (let j = i; j < 4; j++) {
      activeRunners.value[i].streamKey = null;
    }
  } catch {}
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

async function getScenes() {
  const scenes = await obs.send("GetSceneList");
  const sceneArray = [];
  for (const scene of scenes.scenes) {
    sceneArray.push(scene.sceneName);
  }
  sceneList.value = sceneArray;
}

async function getAudioSources() {
  const inputs = await obs.send("GetInputList");
  const inputList = inputs.inputs.filter((input) => {
    return (
      input.inputKind != null &&
      defaultValue.audioSourceTypes.includes(input.inputKind.toString())
    );
  });
  const audioSourceList = [];
  for (const input of inputList) {
    if (input.inputName?.toString().includes("--")) continue;
    if (input.inputKind === "browser_source") {
      const sourceSettings = await obs.send("GetInputSettings", {
        inputName: input.inputName?.toString(),
      });
      if (!sourceSettings.inputSettings.reroute_audio) continue;
      else if (
        typeof sourceSettings.inputSettings.url === "string" &&
        sourceSettings.inputSettings.url.includes(
          "/bundles/nodecg-marathon-control/graphics/streamPlayer",
        )
      )
        setPlayerSource(input, sourceSettings);
    }
    const volume = await obs.send("GetInputVolume", {
      inputName: input.inputName,
    });
    const mute = await obs.send("GetInputMute", { inputName: input.inputName });
    const offset = await obs.send("GetInputAudioSyncOffset", {
      inputName: input.inputName,
    });
    audioSourceList.push({
      name: input.inputName,
      type: input.inputKind,
      volume: {
        mul: volume.inputVolumeMul.toFixed(1),
        db: volume.inputVolumeDb.toFixed(1),
      },
      muted: mute.inputMuted,
      offset: offset.inputAudioSyncOffset,
      updateLocation: "server",
    });
  }
  audioSources.value = audioSourceList;

  // TODO clean this up, I don't like this response type from another module being here
  async function setPlayerSource(
    input: { inputName: string },
    sourceSettings: OBSResponseTypes["GetInputSettings"],
  ) {
    if (
      sourceSettings.inputSettings.url &&
      typeof sourceSettings.inputSettings.url === "string"
    ) {
      switch (true) {
        case sourceSettings.inputSettings.url.includes(
          "/bundles/nodecg-marathon-control/graphics/streamPlayer/1.html",
        ):
          activeRunners.value[0].source = input.inputName;
          break;
        case sourceSettings.inputSettings.url.includes(
          "/bundles/nodecg-marathon-control/graphics/streamPlayer/2.html",
        ):
          activeRunners.value[1].source = input.inputName;
          break;
        case sourceSettings.inputSettings.url.includes(
          "/bundles/nodecg-marathon-control/graphics/streamPlayer/3.html",
        ):
          activeRunners.value[2].source = input.inputName;
          break;
        case sourceSettings.inputSettings.url.includes(
          "/bundles/nodecg-marathon-control/graphics/streamPlayer/4.html",
        ):
          activeRunners.value[3].source = input.inputName;
          break;
      }
    }
  }
}

obsStatus.on("change", (newVal, oldVal) => {
  if (!oldVal) return;
  if (newVal.emergencyTransition !== oldVal.emergencyTransition)
    emergencyTransition(newVal);
  if (newVal.inIntermission !== oldVal.inIntermission) updateChecklist(newVal);
});

// Auto record logic.
async function transition() {
  obsStatus.value.inTransition = true;
  let startRecord = false;
  if (obsStatus.value.previewScene === settings.value.intermissionScene) {
    obsStatus.value.inIntermission = true;
    if (
      settings.value.autoRecord &&
      obsStatus.value.recording &&
      !obsStatus.value.emergencyTransition
    )
      await obs.send("StopRecord");
  }
  if (
    obsStatus.value.previewScene !== settings.value.intermissionScene &&
    obsStatus.value.previewScene !== adPlayer.value.videoScene
  ) {
    startRecord = true;
    obsStatus.value.emergencyTransition = false;
  }

  obs.once("SceneTransitionEnded", async () => {
    obsStatus.value.inTransition = false;
    if (startRecord) {
      obsStatus.value.inIntermission = false;
      if (!obsStatus.value.recording && settings.value.autoRecord)
        await obs.send("StartRecord");
    }
  });
}

// Emergency transition logic.
async function emergencyTransition(data) {
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

function updateChecklist(newVal) {
  if (newVal.inIntermission && timer.value.state === "finished") {
    const def = {};
    const custom = {};
    for (const item of Object.keys(checklist.value.default)) {
      def[item] = false;
    }
    for (const item of Object.keys(checklist.value.custom)) {
      custom[item] = false;
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
    createCustomChecklist(newVal);
  if (newVal.started && !newVal.completed) {
    for (const item of Object.keys(newVal.default)) {
      if (!newVal.default[item]) return (checklist.value.completed = false);
    }
    for (const item of Object.keys(newVal.custom)) {
      if (!newVal.custom[item]) return (checklist.value.completed = false);
    }
    setTimeout(() => {
      checklist.value.completed = true;
    }, 100);
  }
});

function createCustomChecklist(newVal) {
  checklist.value.customOld = nodecg.bundleConfig.checklist;
  const custom = {};
  for (const item of Object.keys(nodecg.bundleConfig.checklist)) {
    custom[item] = false;
  }
  checklist.value.custom = custom;
}

// Set filename formatting.
async function setFilenameFormatting(filename) {
  filename = filename.replace(
    new RegExp("%GAME", "g"),
    runDataActiveRun.value.game,
  );
  filename = filename.replace(
    new RegExp("%CAT", "g"),
    runDataActiveRun.value.category,
  );
  filename = filename.replace(
    new RegExp("%RGN", "g"),
    runDataActiveRun.value.region,
  );
  filename = filename.replace(
    new RegExp("%REL", "g"),
    runDataActiveRun.value.release,
  );
  filename = filename.replace(
    new RegExp("%TWIT", "g"),
    runDataActiveRun.value.gameTwitch,
  );
  filename = filename.replace(
    new RegExp("%SYS", "g"),
    runDataActiveRun.value.system,
  );
  filename = filename.replace(
    new RegExp("%EST", "g"),
    runDataActiveRun.value.estimate,
  );
  filename = filename.replace(
    new RegExp("%SET", "g"),
    runDataActiveRun.value.setupTime,
  );
  if (filename.includes("%RNR")) {
    let playerString = "";
    runDataActiveRun.value.teams.forEach((team) => {
      team.players.forEach((player) => {
        if (playerString === "") playerString = player.name;
        else playerString = playerString.concat(", ", player.name);
      });
    });
    filename = filename.replace(new RegExp("%RNR", "g"), playerString);
  }
  filename = filename.replaceAll("%", "%%");
  filename = filename.replaceAll("<", "");
  filename = filename.replaceAll(">", "");
  filename = filename.replaceAll(":", "");
  filename = filename.replaceAll('"', "");
  filename = filename.replaceAll("/", "");
  filename = filename.replaceAll("\\", "");
  filename = filename.replaceAll("|", "");
  filename = filename.replaceAll("?", "");
  filename = filename.replaceAll("*", "");
  await obs.send("SetProfileParameter", {
    parameterCategory: "Output",
    parameterName: "FilenameFormatting",
    parameterValue: filename,
  });
}

// Get stream delay.
nodecg.listenFor("startStreamSync", () => getStreamDelay(streamSync.value));

streamSync.on("change", (newVal, oldVal) => {
  if (!oldVal) return;
  if (
    newVal.active &&
    newVal.status.delays &&
    JSON.stringify(newVal.delay) !== JSON.stringify(oldVal.delay)
  )
    checkDelayArray(newVal);
});

sendSyncSignal();

function sendSyncSignal() {
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
}

function getStreamDelay() {
  if (streamSync.value.status.delays) return;
  streamSync.value.status.delays = true;
  delayArray = [null, null, null, null];
  nodecg.sendMessage("getDelay");
}

// function sendSyncSignal(autoSync) {
//     if (!autoSync) nodecg.log.info('Stream sync requested on ' + Date() + '.');
//     //streamSync.value.delay = [null, null, null, null];
//     streamSync.value.status = { delays: true, syncing: false, error: false, autoSync: autoSync, checked: 0 };
//     clients.delay.forEach(async client => {
//         client.obs.send(JSON.stringify({ type: 'delay', data: 'Trigger ty square!' }));
//     });
//     nodecg.sendMessage('getDelay');
//     setTimeout(() => {
//         if (streamSync.value.status.delays) {
//             checklist.value.default.syncStreams = true;
//             streamSync.value.status = { delays: false, syncing: false, error: true, autoSync: null, checked: null };
//         }
//     }, 60000)
// }

// function checkDelayArray(newVal) {
//     streamSync.value.status.checked = streamSync.value.status.checked + 1;
//     let numRunners = activeRunners.value.filter((x) => x.streamKey !== null);
//     if (streamSync.value.status.checked >= numRunners.length && streamSync.value.status.checked !== null) syncStreams(newVal);
// }

// Stream Sync™
function syncStreams(res, newVal, autoSync) {
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
    //     if (syncArray && syncArray[i] > 0) streamSync.value.delay[i] = streamSync.value.delay[i] + syncArray[i];
    // }
    checklist.value.default.syncStreams = true;
  }
}

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
  const itemList = await obs.send("GetSceneItemList", {
    sceneName: adPlayer.value.videoScene,
  });
  for (const item of itemList.sceneItems) {
    if (item.inputKind !== "browser_source") continue;
    await obs.send("PressInputPropertiesButton", {
      inputName: item.sourceName,
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
//                 if (!adPlayer.value.videoAds && !adPlayer.value.twitchAds) checklist.value.playAd = true;
//             }
//         }
//     }
