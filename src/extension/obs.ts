import { ActiveRunners, AudioSource } from "@nmc/types";
import { OBSEventTypes, OBSResponseTypes } from "obs-websocket-js";
import { EventSubscription } from "obs-websocket-js/json";
import { setIntervalAsync } from "set-interval-async";
import { ws as obs, send } from "./obs/websocket";
import { get } from "./util/nodecg";
import {
  activeRunners,
  adPlayer,
  audioSources,
  obsStatus,
  settings,
  stats,
  streamSync,
} from "./util/replicants";
import { getScenes } from "./obs/scenes";
import {
  getBrowserSources,
  getInputSettings,
  hasRerouteAudio,
  inputURLContains,
} from "./obs/sources";

const streamHost = "https://lt2026.restream.space";
const nodecg = get();
const config = nodecg.bundleConfig.websocket;
const { viewer } = nodecg.bundleConfig.rtmp;

nodecg.log.info(
  `Connecting to OBS instance at ws://${config.ip}:${config.port}...`,
);

obs.once("Identified", () => start(true));

//ws.on('InputVolumeMeters', (data) => nodecg.log.info(data.inputs[0].inputLevelsMul))

// Listen to OBS events.
// General events.
obs.on("ExitStarted", websocketDisconnect);
obs.on("CurrentSceneCollectionChanged", () => {
  getScenes();
  updateAudioSources();
});

// Scene events.
obs.on("SceneCreated", getScenes);
obs.on("SceneRemoved", getScenes);
obs.on("SceneNameChanged", getScenes);
obs.on("CurrentPreviewSceneChanged", (data) => setScene("preview", data));
obs.on("CurrentProgramSceneChanged", (data) => setScene("program", data));

function setScene(
  scene: "preview" | "program",
  data: OBSEventTypes["CurrentPreviewSceneChanged"],
) {
  obsStatus.value[`${scene}Scene`] = data.sceneName;
}

// Audio events.
obs.on("InputCreated", updateAudioSources);
obs.on("InputRemoved", updateAudioSources);
obs.on("InputNameChanged", updateAudioSources);
obs.on("InputVolumeChanged", (data) => {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.volume = {
      mul: data.inputVolumeMul, //.toFixed(1),
      db: data.inputVolumeDb, //.toFixed(1),
    };
  }
});
obs.on("InputMuteStateChanged", (data) => {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.muted = data.inputMuted;
  }
});
obs.on("InputAudioSyncOffsetChanged", (data) => {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.offset = data.inputAudioSyncOffset;
  }
});

function findAudioSource(name: string) {
  return audioSources.value?.find((input) => input.name === name);
}

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

/* function programIsIntermission() {
  return settings.value.intermissionScenes.includes(obsStatus.value.programScene);
} */

// After setting up event hooks, connect
obs
  .connect(`ws://${config.ip}:${config.port}`, config.password, {
    eventSubscriptions: EventSubscription.All,
  })
  .catch((e) => {
    nodecg.log.error(
      `Could not connect to OBS instance at ws://${config.ip}:${config.port}.`,
    );
    nodecg.log.error(e);
    process.exit(1);
  });

async function websocketDisconnect() {
  nodecg.log.error(
    "Disconnected from OBS instance! Attempting to reconnect...",
  );
  audioSources.value = [];
  const reconnectInterval = setInterval(() => {
    obs
      .connect(`ws://${config.ip}:${config.port}`, config.password, {
        eventSubscriptions: EventSubscription.All,
      })
      .then(() => {
        obs.once("Identified", () => {
          nodecg.log.info("Reconnected to OBS instance!");
          clearInterval(reconnectInterval);
          start(false);
        });
      })
      .catch(() => {});
  }, 2500);
}

async function start(msg: boolean) {
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

  // Auto Stream Sync™
  /*   setInterval(() => {
    if (
      streamSync.value.autoSync &&
      (timer.value.state === "running" || timer.value.state === "paused")
    )
      sendSyncSignal();
  }, 120000); */

  setIntervalAsync(getStats, 2000);

  getScenes();
  updateAudioSources();
}

async function getStats() {
  const data = await send("GetStats");
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

  if (obsStatus.value.streaming) {
    streamData = await send("GetOutputStatus", {
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

async function updateAudioSources() {
  const audioSourceList: AudioSource[] = [];
  const browserSources = await getBrowserSources();
  for (const { inputName, inputKind } of browserSources) {
    if (!inputName || !inputKind) {
      continue;
    }
    const source = await getInputSettings(inputName);
    if (!hasRerouteAudio(source)) {
      continue;
    } else if (inputURLContains(source, streamHost)) {
      nodecg.log.info(
        `Browser source found with url: ${source.inputSettings.url}`,
      );
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

async function setPlayerAudioSource(sourceName: string) {
  nodecg.log.info("Setting player audio source " + sourceName);
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

export async function setPlayerURL(index: number, player: ActiveRunners) {
  const browserSources = await getBrowserSources();
  const playerSource = browserSources.find(
    (s) => s.inputName === `Player ${index + 1}`,
  );
  if (playerSource?.inputName) {
    await send("SetInputSettings", {
      inputName: `Player ${index + 1}`,
      inputSettings: {
        url: `${streamHost}/live/key/${player.streamKey}?token=${viewer.token}&region=use`,
      },
    });
  }
}
