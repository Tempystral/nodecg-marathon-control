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
const obs_websocket_js_1 = require("obs-websocket-js");
const set_interval_async_1 = require("set-interval-async");
const defaults = __importStar(require("./defaultValues"));
const audioSources_1 = require("./obs/audioSources");
const players_1 = require("./obs/players");
const scenes_1 = require("./obs/scenes");
const sources_1 = require("./obs/sources");
const websocket_1 = require("./obs/websocket");
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
const config = nodecg.bundleConfig.websocket;
const { viewer } = nodecg.bundleConfig.rtmp;
const wsUrl = `ws://${config.ip}:${config.port}`;
websocket_1.ws.once("Identified", () => start(true));
//ws.on('InputVolumeMeters', (data) => nodecg.log.info(data.inputs[0].inputLevelsMul))
// Listen to OBS events.
// General events.
websocket_1.ws.on("ExitStarted", websocketDisconnect);
websocket_1.ws.on("CurrentSceneCollectionChanged", () => {
    (0, scenes_1.updateSceneList)();
    updateAudioSources();
});
// Scene events.
websocket_1.ws.on("SceneCreated", scenes_1.updateSceneList);
websocket_1.ws.on("SceneRemoved", scenes_1.updateSceneList);
websocket_1.ws.on("SceneNameChanged", scenes_1.updateSceneList);
websocket_1.ws.on("CurrentPreviewSceneChanged", (data) => (0, scenes_1.setScene)("preview", data));
websocket_1.ws.on("CurrentProgramSceneChanged", (data) => (0, scenes_1.setScene)("program", data));
// Audio events.
websocket_1.ws.on("InputCreated", updateAudioSources);
websocket_1.ws.on("InputRemoved", updateAudioSources);
websocket_1.ws.on("InputNameChanged", updateAudioSources);
websocket_1.ws.on("InputVolumeChanged", audioSources_1.changeVolume);
websocket_1.ws.on("InputMuteStateChanged", audioSources_1.toggleMute);
websocket_1.ws.on("InputAudioSyncOffsetChanged", audioSources_1.adjustSyncOffset);
// Output events.
websocket_1.ws.on("StreamStateChanged", setStreaming);
function setStreaming(data) {
    replicants_1.obsStatus.value.streaming = data.outputActive;
}
websocket_1.ws.on("RecordStateChanged", setRecording);
function setRecording(data) {
    replicants_1.obsStatus.value.recording = data.outputActive;
}
// Transition events.
websocket_1.ws.on("SceneTransitionStarted", transition);
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
            !replicants_1.obsStatus.value.emergencyTransition)
            // and if we're currently recording and not performing an emergency transition
            await (0, websocket_1.send)("StopRecord"); // Then stop
    }
    else {
        // Scene switching to is not an intermission scene
        shouldRecord = true; // We should record
        replicants_1.obsStatus.value.emergencyTransition = false; // Reset emergency status
    }
    websocket_1.ws.once("SceneTransitionEnded", async () => {
        replicants_1.obsStatus.value.inTransition = false;
        if (shouldRecord) {
            replicants_1.obsStatus.value.inIntermission = false;
            if (!replicants_1.obsStatus.value.recording && replicants_1.settings.value.autoRecord)
                await (0, websocket_1.send)("StartRecord");
        }
    });
}
function previewIsIntermission() {
    return replicants_1.settings.value.intermissionScenes.includes(replicants_1.obsStatus.value.previewScene);
}
// After setting up event hooks, connect
nodecg.log.info(`Connecting to OBS at ${wsUrl}...`);
websocket_1.ws
    .connect(wsUrl, config.password, {
    eventSubscriptions: obs_websocket_js_1.EventSubscription.All,
})
    .catch((e) => {
    nodecg.log.error(`Could not connect to OBS at ${wsUrl}.`);
    nodecg.log.error(e);
    process.exit(1);
});
async function websocketDisconnect() {
    nodecg.log.error("Disconnected from OBS! Attempting to reconnect...");
    replicants_1.audioSources.value = [];
    const reconnectInterval = setInterval(() => {
        websocket_1.ws
            .connect(wsUrl, config.password, {
            eventSubscriptions: obs_websocket_js_1.EventSubscription.All,
        })
            .then(() => {
            websocket_1.ws.once("Identified", () => {
                nodecg.log.info("Reconnected to OBS!");
                clearInterval(reconnectInterval);
                start(false);
            });
        })
            .catch(() => { });
    }, 2500);
}
async function start(msg) {
    if (msg) {
        nodecg.log.info(`Successfully connected to OBS at ${wsUrl}`);
    }
    replicants_1.streamSync.value.status = {
        delays: false,
        syncing: false,
        autoSync: false,
    };
    replicants_1.adPlayer.value.adPlaying = false;
    await (0, websocket_1.send)("SetStudioModeEnabled", { studioModeEnabled: true });
    const streamStatus = await (0, websocket_1.send)("GetStreamStatus");
    const recordingStatus = await (0, websocket_1.send)("GetRecordStatus");
    const previewScene = await (0, websocket_1.send)("GetCurrentPreviewScene");
    const programScene = await (0, websocket_1.send)("GetCurrentProgramScene");
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
    (0, set_interval_async_1.setIntervalAsync)(updateStats, 2000);
    (0, scenes_1.updateSceneList)();
    updateAudioSources();
}
async function updateStats() {
    const { renderSkippedFrames, renderTotalFrames, outputSkippedFrames, outputTotalFrames, ...data } = await (0, websocket_1.send)("GetStats");
    const streamData = await getOutputStatus();
    replicants_1.stats.value = {
        cpuUsage: `${data.cpuUsage.toFixed(1)}%`,
        fps: `${data.activeFps.toFixed(1)} FPS`,
        kbitsPerSec: `? kb/s`,
        averageFrameTime: `${data.averageFrameRenderTime.toFixed(1)} ms`,
        skippedFrames: totalAndPercent(renderSkippedFrames, renderTotalFrames),
        missedFrames: totalAndPercent(outputSkippedFrames, outputTotalFrames),
        totalFrames: `${outputTotalFrames}`,
        droppedFrames: streamData.outputSkippedFrames && streamData.outputTotalFrames
            ? totalAndPercent(streamData.outputSkippedFrames, streamData.outputTotalFrames)
            : "0 / 0 (NaN%)",
        uptime: streamData.outputTimecode
            ? streamData.outputTimecode.slice(0, -4)
            : "00:00:00",
        diskSpace: `${(data.availableDiskSpace / 1024).toFixed(1)} GB`,
        autoRecord: replicants_1.settings.value.autoRecord ? "Active" : "Inactive",
    };
}
async function getOutputStatus() {
    if (replicants_1.obsStatus.value.streaming) {
        return await (0, websocket_1.send)("GetOutputStatus", { outputName: "adv_stream" });
    }
    else {
        return defaults.streamData;
    }
}
function totalAndPercent(num, denom) {
    return `${num} / ${denom} (${percent(num, denom)}%)`;
}
function percent(num, denom) {
    return ((num / denom) * 100).toFixed(1);
}
async function updateAudioSources() {
    const audioSourceList = [];
    const browserSources = await (0, sources_1.getBrowserSources)();
    for await (const { inputName, inputKind } of browserSources) {
        if (!inputName || !inputKind) {
            continue;
        }
        const source = await (0, sources_1.getInputSettings)(inputName);
        if (!(0, sources_1.hasRerouteAudio)(source)) {
            continue;
        }
        else if ((0, sources_1.inputURLContains)(source, viewer.url)) {
            nodecg.log.info("Setting player audio source " + inputName);
            (0, players_1.setPlayerAudioSource)(inputName);
        }
        const volume = await (0, websocket_1.send)("GetInputVolume", { inputName });
        const mute = await (0, websocket_1.send)("GetInputMute", { inputName });
        const offset = await (0, websocket_1.send)("GetInputAudioSyncOffset", { inputName });
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
