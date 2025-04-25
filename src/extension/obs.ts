import { OBSEventTypes, OBSResponseTypes } from "obs-websocket-js";
import { get, config } from "./util/nodecg";
import OBSWebSocket, {
  EventSubscription,
  OBSRequestTypes,
} from "obs-websocket-js/json";
import {
  activeRunners,
  adPlayer,
  audioSources,
  obsStatus,
  sceneList,
  settings,
  stats,
  streamSync,
} from "./util/replicants";
import { AudioSource } from "@nmc/types";
import * as defaultValue from "./defaultValues";
import { setIntervalAsync } from "set-interval-async";

const playerPage = "/bundles/nodecg-marathon-control/graphics/streamPlayer";
const nodecg = get();

nodecg.log.info(
  `Connecting to OBS instance at ws://${config.ip}:${config.port}...`,
);

const obs = new OBSWebSocket();

obs.once("Identified", () => start(true));

//obs.on('InputVolumeMeters', (data) => console.log(data.inputs[4].inputLevelsMul))

// Listen to OBS events.
// General events.
obs.on("ExitStarted", () => websocketDisconnect());
obs.on("CurrentSceneCollectionChanged", () => {
  getScenes();
  getAudioSources();
});

// Scene events.
obs.on("SceneCreated", () => getScenes());
obs.on("SceneRemoved", () => getScenes());
obs.on("SceneNameChanged", () => getScenes());
obs.on("CurrentPreviewSceneChanged", (data) => setScene("preview", data));
obs.on("CurrentProgramSceneChanged", (data) => setScene("program", data));

function setScene(
  scene: "preview" | "program",
  data: OBSEventTypes["CurrentPreviewSceneChanged"],
) {
  obsStatus.value[`${scene}Scene`] = data.sceneName;
}

// Audio events.
obs.on("InputCreated", getAudioSources);
obs.on("InputRemoved", getAudioSources);
obs.on("InputNameChanged", getAudioSources);
obs.on("InputVolumeChanged", (data) => {
  const source = findAudioSource(data.inputName);
  if (source) {
    source.volume = {
      mul: data.inputVolumeMul.toFixed(1),
      db: data.inputVolumeDb.toFixed(1),
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
  return audioSources.value.find((input) => input.name === name);
}

// Output events.
obs.on("StreamStateChanged", setStreaming);
obs.on("RecordStateChanged", setRecording);

function setStreaming(data: OBSEventTypes["StreamStateChanged"]) {
  obsStatus.value.streaming = data.outputActive;
}

function setRecording(data: OBSEventTypes["RecordStateChanged"]) {
  obsStatus.value.streaming = data.outputActive;
}

// Transition events.
obs.on("SceneTransitionStarted", transition);

async function send<Type extends keyof OBSRequestTypes>(
  request: Type,
  data?: OBSRequestTypes[Type],
) {
  // Return promise with callback
  return new Promise<OBSResponseTypes[Type]>(async (resolve) => {
    obs
      .call<Type>(request, data)
      .then((result) => resolve(result))
      .catch((error) => {
        if (error.code === 600 || !error.code) return;
        nodecg.log.error("A OBS Websocket error has occurred.\n", {
          code: error.code,
          request: request,
          requestData: data,
        });
        return;
      });
  });
}

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

export async function start(msg: boolean) {
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
  /*   setInterval(() => {
    if (
      streamSync.value.autoSync &&
      (timer.value.state === "running" || timer.value.state === "paused")
    )
      sendSyncSignal();
  }, 120000); */

  setIntervalAsync(getStats, 2000);

  getScenes();
  getAudioSources();
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

  if (obsStatus.streaming) {
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

// TODO export these methods from the server module

export async function getScenes() {
  const scenes = await send("GetSceneList");
  const sceneArray = [];
  for (const scene of scenes.scenes) {
    if (scene.sceneName != null) {
      sceneArray.push(scene.sceneName.toString());
    }
  }
  sceneList.value = sceneArray;
}

export async function getAudioSources() {
  const inputs = await send("GetInputList");
  const inputList = inputs.inputs.filter((input) => {
    return (
      input.inputKind &&
      defaultValue.audioSourceTypes.includes(input.inputKind.toString())
    );
  });
  const audioSourceList: AudioSource[] = [];
  for (const input of inputList) {
    if (
      input.inputName === null ||
      input.inputKind === null ||
      input.inputName.toString().includes("--")
    ) {
      continue;
    }
    const inputName = input.inputName.toString();
    const inputKind = input.inputKind.toString();

    if (inputKind === "browser_source") {
      const sourceSettings = await send("GetInputSettings", {
        inputName: inputName,
      });
      if (!sourceSettings.inputSettings.reroute_audio) {
        continue;
      } else if (
        typeof sourceSettings.inputSettings.url === "string" &&
        sourceSettings.inputSettings.url.includes(playerPage)
      ) {
        setPlayerSource(inputName, sourceSettings);
      }
    }
    const volume = await send("GetInputVolume", { inputName });
    const mute = await send("GetInputMute", { inputName });
    const offset = await send("GetInputAudioSyncOffset", { inputName });
    audioSourceList.push({
      name: inputName,
      type: inputKind,
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
}

async function setPlayerSource(
  input: string,
  sourceSettings: OBSResponseTypes["GetInputSettings"],
) {
  if (
    sourceSettings.inputSettings.url &&
    typeof sourceSettings.inputSettings.url === "string"
  ) {
    switch (true) {
      case sourceSettings.inputSettings.url.includes(`${playerPage}/1.html`):
        activeRunners.value[0].source = input;
        break;
      case sourceSettings.inputSettings.url.includes(`${playerPage}/2.html`):
        activeRunners.value[1].source = input;
        break;
      case sourceSettings.inputSettings.url.includes(`${playerPage}/3.html`):
        activeRunners.value[2].source = input;
        break;
      case sourceSettings.inputSettings.url.includes(`${playerPage}/4.html`):
        activeRunners.value[3].source = input;
        break;
    }
  }
}

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
      await send("StopRecord");
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
        await send("StartRecord");
    }
  });
}

export { obs as ws, send };
