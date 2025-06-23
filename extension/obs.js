"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
exports.setPlayerURL = setPlayerURL;
const nodecg_1 = require("./util/nodecg");
const json_1 = __importStar(require("obs-websocket-js/json"));
const replicants_1 = require("./util/replicants");
const defaultValue = __importStar(require("./defaultValues"));
const set_interval_async_1 = require("set-interval-async");
const streamHost = "https://lt2025.restream.space";
const nodecg = (0, nodecg_1.get)();
const config = nodecg.bundleConfig.websocket;
const { viewer } = nodecg.bundleConfig.rtmp;
nodecg.log.info(`Connecting to OBS instance at ws://${config.ip}:${config.port}...`);
const obs = new json_1.default();
obs.once("Identified", () => start(true));
//obs.on('InputVolumeMeters', (data) => console.log(data.inputs[4].inputLevelsMul))
// Listen to OBS events.
// General events.
obs.on("ExitStarted", websocketDisconnect);
obs.on("CurrentSceneCollectionChanged", () => {
    getScenes();
    getAudioSources();
});
// Scene events.
obs.on("SceneCreated", getScenes);
obs.on("SceneRemoved", getScenes);
obs.on("SceneNameChanged", getScenes);
obs.on("CurrentPreviewSceneChanged", (data) => setScene("preview", data));
obs.on("CurrentProgramSceneChanged", (data) => setScene("program", data));
function setScene(scene, data) {
    replicants_1.obsStatus.value[`${scene}Scene`] = data.sceneName;
}
// Audio events.
obs.on("InputCreated", getAudioSources);
obs.on("InputRemoved", getAudioSources);
obs.on("InputNameChanged", getAudioSources);
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
function findAudioSource(name) {
    return replicants_1.audioSources.value?.find((input) => input.name === name);
}
// Output events.
obs.on("StreamStateChanged", setStreaming);
function setStreaming(data) {
    replicants_1.obsStatus.value.streaming = data.outputActive;
}
obs.on("RecordStateChanged", setRecording);
function setRecording(data) {
    replicants_1.obsStatus.value.recording = data.outputActive;
}
// Transition events.
obs.on("SceneTransitionStarted", transition);
async function transition() {
    replicants_1.obsStatus.value.inTransition = true;
    let shouldRecord = false;
    // I think this is a race condition but
    // it does consistently catch the pre-transition scenes
    // So this effectively says whether we're going INTO an intermission
    if (previewIsIntermission()) {
        // If the next scene is an intermission
        replicants_1.obsStatus.value.inIntermission = true;
        if (replicants_1.settings.value.autoRecord &&
            replicants_1.obsStatus.value.recording &&
            !replicants_1.obsStatus.value.emergencyTransition) // and if we're currently recording and not performing an emergency transition
            await send("StopRecord"); // Then stop
    }
    else {
        // Scene switching to is not an intermission scene
        shouldRecord = true; // We should record
        replicants_1.obsStatus.value.emergencyTransition = false; // Reset emergency status
    }
    obs.once("SceneTransitionEnded", async () => {
        replicants_1.obsStatus.value.inTransition = false;
        if (shouldRecord) {
            replicants_1.obsStatus.value.inIntermission = false;
            if (!replicants_1.obsStatus.value.recording && replicants_1.settings.value.autoRecord)
                await send("StartRecord");
        }
    });
}
function previewIsIntermission() {
    return replicants_1.settings.value.intermissionScenes.includes(replicants_1.obsStatus.value.previewScene);
}
/* function programIsIntermission() {
  return settings.value.intermissionScenes.includes(obsStatus.value.programScene);
} */
// After setting up event hooks, connect
obs
    .connect(`ws://${config.ip}:${config.port}`, config.password, {
    eventSubscriptions: json_1.EventSubscription.All,
})
    .catch((e) => {
    nodecg.log.error(`Could not connect to OBS instance at ws://${config.ip}:${config.port}.`);
    nodecg.log.error(e);
    process.exit(1);
});
async function send(request, data) {
    // Return promise with callback
    return new Promise(async (resolve) => {
        obs
            .call(request, data)
            .then((result) => resolve(result))
            .catch((error) => {
            if (error.code === 600 || !error.code)
                return;
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
    nodecg.log.error("Disconnected from OBS instance! Attempting to reconnect...");
    replicants_1.audioSources.value = [];
    const reconnectInterval = setInterval(() => {
        obs
            .connect(`ws://${config.ip}:${config.port}`, config.password, {
            eventSubscriptions: json_1.EventSubscription.All,
        })
            .then(() => {
            obs.once("Identified", () => {
                nodecg.log.info("Reconnected to OBS instance!");
                clearInterval(reconnectInterval);
                start(false);
            });
        })
            .catch(() => { });
    }, 2500);
}
async function start(msg) {
    if (msg) {
        nodecg.log.info(`Successfully connected to OBS instance at ws://${config.ip}:${config.port}`);
    }
    replicants_1.streamSync.value.status = {
        delays: false,
        syncing: false,
        autoSync: false,
    };
    replicants_1.adPlayer.value.adPlaying = false;
    await send("SetStudioModeEnabled", { studioModeEnabled: true });
    const streamStatus = await send("GetStreamStatus");
    const recordingStatus = await send("GetRecordStatus");
    const previewScene = await send("GetCurrentPreviewScene");
    const programScene = await send("GetCurrentProgramScene");
    replicants_1.obsStatus.value = {
        previewScene: previewScene.currentPreviewSceneName,
        programScene: programScene.currentProgramSceneName,
        inIntermission: replicants_1.settings.value.intermissionScenes.includes(programScene.currentProgramSceneName)
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
    (0, set_interval_async_1.setIntervalAsync)(getStats, 2000);
    getScenes();
    getAudioSources();
}
async function getStats() {
    const data = await send("GetStats");
    let streamData = {
        outputActive: false,
        outputBytes: 0,
        outputCongestion: 0,
        outputDuration: 0,
        outputReconnecting: false,
        outputSkippedFrames: 0,
        outputTimecode: "",
        outputTotalFrames: 0,
    };
    if (replicants_1.obsStatus.value.streaming) {
        streamData = await send("GetOutputStatus", {
            outputName: "adv_stream",
        });
    }
    replicants_1.stats.value = {
        cpuUsage: `${data.cpuUsage.toFixed(1)}%`,
        fps: `${data.activeFps.toFixed(1)} FPS`,
        kbitsPerSec: `? kb/s`,
        averageFrameTime: `${data.averageFrameRenderTime.toFixed(1)} ms`,
        skippedFrames: `${data.renderSkippedFrames} / ${data.renderTotalFrames}\
     (${((data.renderSkippedFrames / data.renderTotalFrames) * 100).toFixed(1)}%)`,
        missedFrames: `${data.outputSkippedFrames} / ${data.outputTotalFrames}\
     (${((data.outputSkippedFrames / data.outputTotalFrames) * 100).toFixed(1)}%)`,
        totalFrames: `${data.outputTotalFrames}`,
        droppedFrames: streamData.outputSkippedFrames !== undefined
            ? `${streamData.outputSkippedFrames} / ${streamData.outputTotalFrames}\
         (${((streamData.outputSkippedFrames / streamData.outputTotalFrames) * 100).toFixed(1)}%)`
            : "0 / 0 (NaN%)",
        uptime: streamData.outputTimecode
            ? streamData.outputTimecode.slice(0, -4)
            : "00:00:00",
        diskSpace: `${(data.availableDiskSpace / 1024).toFixed(1)} GB`,
        autoRecord: replicants_1.settings.value.autoRecord ? "Active" : "Inactive",
    };
}
async function getScenes() {
    const scenes = await send("GetSceneList");
    const sceneArray = [];
    for (const scene of scenes.scenes) {
        if (scene.sceneName != null) {
            sceneArray.push(scene.sceneName.toString());
        }
    }
    replicants_1.sceneList.value = sceneArray;
}
async function getBrowserSources() {
    const { inputs } = await send("GetInputList");
    return inputs.filter((input) => input.inputKind &&
        defaultValue.audioSourceTypes.includes(input.inputKind.toString()) &&
        input.inputKind.toString() === "browser_source");
}
async function getAudioSources() {
    const audioSourceList = [];
    const browserSources = await getBrowserSources();
    for (const input of browserSources) {
        if (input.inputName === null ||
            input.inputKind === null ||
            input.inputName.toString().includes("--")) {
            continue;
        }
        const inputName = input.inputName.toString();
        const inputKind = input.inputKind.toString();
        const sourceSettings = await send("GetInputSettings", {
            inputName: inputName,
        });
        if (!sourceSettings.inputSettings.reroute_audio) {
            continue;
        }
        else if (typeof sourceSettings.inputSettings.url === "string" &&
            sourceSettings.inputSettings.url.includes(streamHost)) {
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
    replicants_1.audioSources.value = audioSourceList;
}
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
async function setPlayerURL(index, player) {
    const browserSources = await getBrowserSources();
    const playerSource = browserSources.find((s) => s.inputName === `Player ${index + 1}`);
    if (playerSource?.inputName) {
        await send("SetInputSettings", {
            inputName: `Player ${index + 1}`,
            inputSettings: {
                url: `${streamHost}/live/key/${player.streamKey}?token=${viewer.token}&region=use`,
            },
        });
    }
}
