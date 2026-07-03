import { AudioSource } from "@nmc/types";
import { EventSubscription, OBSEventTypes } from "obs-websocket-js";
import { setIntervalAsync } from "set-interval-async";
import * as defaults from "./defaultValues";
import { adjustSyncOffset, changeVolume, toggleMute } from "./obs/audioSources";
import { setPlayerAudioSource } from "./obs/players";
import { setScene, updateSceneList } from "./obs/scenes";
import {
  getBrowserSources,
  getInputSettings,
  hasRerouteAudio,
  inputURLContains,
} from "./obs/sources";
import { ws as obs, send } from "./obs/websocket";
import { get } from "./util/nodecg";
import {
  adPlayer,
  audioSources,
  obsStatus,
  settings,
  stats,
  streamSync,
} from "./util/replicants";

const nodecg = get();
const config = nodecg.bundleConfig.websocket;
const { viewer } = nodecg.bundleConfig.rtmp;

const wsUrl = `ws://${config.ip}:${config.port}`;

obs.once("Identified", () => start(true));

//ws.on('InputVolumeMeters', (data) => nodecg.log.info(data.inputs[0].inputLevelsMul))

// Listen to OBS events.
// General events.
obs.on("ExitStarted", websocketDisconnect);
obs.on("CurrentSceneCollectionChanged", () => {
  updateSceneList();
  updateAudioSources();
});

// Scene events.
obs.on("SceneCreated", updateSceneList);
obs.on("SceneRemoved", updateSceneList);
obs.on("SceneNameChanged", updateSceneList);
obs.on("CurrentPreviewSceneChanged", (data) => setScene("preview", data));
obs.on("CurrentProgramSceneChanged", (data) => setScene("program", data));

// Audio events.
obs.on("InputCreated", updateAudioSources);
obs.on("InputRemoved", updateAudioSources);
obs.on("InputNameChanged", updateAudioSources);
obs.on("InputVolumeChanged", changeVolume);
obs.on("InputMuteStateChanged", toggleMute);
obs.on("InputAudioSyncOffsetChanged", adjustSyncOffset);

// Output events.
obs.on("StreamStateChanged", setStreaming);

function setStreaming(data: OBSEventTypes["StreamStateChanged"]) {
  obsStatus.value.streaming = data.outputActive;
}

obs.on("RecordStateChanged", setRecording);

function setRecording(data: OBSEventTypes["RecordStateChanged"]) {
  obsStatus.value.recording = data.outputActive;
}

// Transition events.
obs.on("SceneTransitionStarted", transition);

async function transition() {
  obsStatus.value.inTransition = true;
  let shouldRecord = false;
  // I think this is a race condition but
  // it does consistently catch the pre-transition scenes
  // So this effectively says whether we're going INTO an intermission
  if (previewIsIntermission()) {
    // If the next scene is an intermission
    obsStatus.value.inIntermission = true;
    if (
      settings.value.autoRecord &&
      obsStatus.value.recording &&
      !obsStatus.value.emergencyTransition
    )
      // and if we're currently recording and not performing an emergency transition
      await send("StopRecord"); // Then stop
  } else {
    // Scene switching to is not an intermission scene
    shouldRecord = true; // We should record
    obsStatus.value.emergencyTransition = false; // Reset emergency status
  }

  obs.once("SceneTransitionEnded", async () => {
    obsStatus.value.inTransition = false;
    if (shouldRecord) {
      obsStatus.value.inIntermission = false;
      if (!obsStatus.value.recording && settings.value.autoRecord)
        await send("StartRecord");
    }
  });
}

function previewIsIntermission() {
  return settings.value.intermissionScenes.includes(
    obsStatus.value.previewScene,
  );
}

// After setting up event hooks, connect
nodecg.log.info(`Connecting to OBS at ${wsUrl}...`);
obs
  .connect(wsUrl, config.password, {
    eventSubscriptions: EventSubscription.All,
  })
  .catch((e) => {
    nodecg.log.error(`Could not connect to OBS at ${wsUrl}.`);
    nodecg.log.error(e);
    process.exit(1);
  });

async function websocketDisconnect() {
  nodecg.log.error("Disconnected from OBS! Attempting to reconnect...");
  audioSources.value = [];
  const reconnectInterval = setInterval(() => {
    obs
      .connect(wsUrl, config.password, {
        eventSubscriptions: EventSubscription.All,
      })
      .then(() => {
        obs.once("Identified", () => {
          nodecg.log.info("Reconnected to OBS!");
          clearInterval(reconnectInterval);
          start(false);
        });
      })
      .catch(() => {});
  }, 2500);
}

async function start(msg: boolean) {
  if (msg) {
    nodecg.log.info(`Successfully connected to OBS at ${wsUrl}`);
  }

  streamSync.value.status = {
    delays: false,
    syncing: false,
    autoSync: false,
  };
  adPlayer.value.adPlaying = false;

  await send("SetStudioModeEnabled", { studioModeEnabled: true });

  const streamStatus = await send("GetStreamStatus");
  const recordingStatus = await send("GetRecordStatus");
  const previewScene = await send("GetCurrentPreviewScene");
  const programScene = await send("GetCurrentProgramScene");

  obsStatus.value = {
    previewScene: previewScene.currentPreviewSceneName,
    programScene: programScene.currentProgramSceneName,
    inIntermission: settings.value.intermissionScenes.includes(
      programScene.currentProgramSceneName,
    )
      ? true
      : false,
    inTransition: false,
    emergencyTransition: false,
    streaming: streamStatus.outputActive,
    recording: recordingStatus.outputActive,
  };

  setIntervalAsync(updateStats, 2000);

  updateSceneList();
  updateAudioSources();
}

async function updateStats() {
  const {
    renderSkippedFrames,
    renderTotalFrames,
    outputSkippedFrames,
    outputTotalFrames,
    ...data
  } = await send("GetStats");
  const streamData = await getOutputStatus();

  stats.value = {
    cpuUsage: `${data.cpuUsage.toFixed(1)}%`,
    fps: `${data.activeFps.toFixed(1)} FPS`,
    kbitsPerSec: `? kb/s`,
    averageFrameTime: `${data.averageFrameRenderTime.toFixed(1)} ms`,
    skippedFrames: totalAndPercent(renderSkippedFrames, renderTotalFrames),
    missedFrames: totalAndPercent(outputSkippedFrames, outputTotalFrames),
    totalFrames: `${outputTotalFrames}`,
    droppedFrames:
      streamData.outputSkippedFrames && streamData.outputTotalFrames
        ? totalAndPercent(
            streamData.outputSkippedFrames,
            streamData.outputTotalFrames,
          )
        : "0 / 0 (NaN%)",
    uptime: streamData.outputTimecode
      ? streamData.outputTimecode.slice(0, -4)
      : "00:00:00",
    diskSpace: `${(data.availableDiskSpace / 1024).toFixed(1)} GB`,
    autoRecord: settings.value.autoRecord ? "Active" : "Inactive",
  };
}

async function getOutputStatus() {
  if (obsStatus.value.streaming) {
    return await send("GetOutputStatus", { outputName: "adv_stream" });
  } else {
    return defaults.streamData;
  }
}

function totalAndPercent(num: number, denom: number) {
  return `${num} / ${denom} (${percent(num, denom)}%)`;
}

function percent(num: number, denom: number) {
  return ((num / denom) * 100).toFixed(1);
}

async function updateAudioSources() {
  const audioSourceList: AudioSource[] = [];
  const browserSources = await getBrowserSources();
  for await (const { inputName, inputKind } of browserSources) {
    if (!inputName || !inputKind) {
      continue;
    }
    const source = await getInputSettings(inputName);
    if (!hasRerouteAudio(source)) {
      continue;
    } else if (inputURLContains(source, viewer.url)) {
      nodecg.log.info("Setting player audio source " + inputName);
      setPlayerAudioSource(inputName);
    }
    const volume = await send("GetInputVolume", { inputName });
    const mute = await send("GetInputMute", { inputName });
    const offset = await send("GetInputAudioSyncOffset", { inputName });
    audioSourceList.push({
      name: inputName,
      type: inputKind,
      volume: {
        mul: volume.inputVolumeMul, //.toFixed(1),
        db: volume.inputVolumeDb, //.toFixed(1),
      },
      muted: mute.inputMuted,
      offset: offset.inputAudioSyncOffset,
      updateLocation: "server",
    });
  }
  audioSources.value = audioSourceList;
}
