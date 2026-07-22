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
const defaultValues = __importStar(require("./defaultValues"));
const players_1 = require("./obs/players");
const sources_1 = require("./obs/sources");
const obs = __importStar(require("./obs/websocket"));
const router_1 = require("./router");
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const websocketServer_1 = require("./websocketServer");
const nodecg = (0, nodecg_1.get)();
const viewer = nodecg.bundleConfig.rtmp.viewer;
const config = nodecg.bundleConfig.websocket;
const { wsPath, upgradeServer } = (0, websocketServer_1.useWebsocketServer)();
const { upgrade } = (0, router_1.useNodeCGRouter)(nodecg);
upgrade(wsPath, upgradeServer);
// DACBot is currently disabled as it has not proven useful for my purposes
/* // Start DACBot
if (botSettings.value.active) {
  switch (nodecg.bundleConfig.botToken) {
    case "":
      nodecg.log.warn("No bot token has been provided!");
      break;
    default:
      // DACBot.start(nodecg, wsServer.bot);
      // No clue what this is either
      break;
  }
} */
nodecg.listenFor("connectOBS", websocketConnect);
nodecg.listenFor("disconnectOBS", websocketDisconnect);
function websocketConnect() {
    // After setting up event hooks, connect
    nodecg.log.info(`Connecting to OBS...`);
    return obs
        .connect(config.ip, config.port, config.password)
        .then((res) => {
        nodecg.log.info(`Successfully connected to OBS at ${config.ip} \
        | websocket version ${res.obsWebSocketVersion}`);
    })
        .catch((e) => {
        nodecg.log.error(`Could not connect to OBS at ${config.ip}.`);
        nodecg.log.error(e);
        //process.exit(1);
    });
}
// This is really stupid but it's the only way I can think of to
// ensure you're connected before disconnecting again.
function websocketDisconnect() {
    obs
        .connect(config.ip, config.port, config.password)
        .then(obs.disconnect)
        .then(() => (replicants_1.obsStatus.value.connected = false));
}
// Listen for requests from clients.
nodecg.listenFor("setPreviewScene", (value) => obs.send("SetCurrentPreviewScene", { sceneName: value }));
nodecg.listenFor("startTransition", () => obs.send("TriggerStudioModeTransition"));
nodecg.listenFor("setVolume", (value) => obs.send("SetInputVolume", {
    inputName: value.source,
    inputVolumeDb: value.volume === null ? -100.0 : value.volume,
}));
nodecg.listenFor("toggleMute", (value) => obs.send("ToggleInputMute", { inputName: value }));
nodecg.listenFor("setOffset", (value) => obs.send("SetInputAudioSyncOffset", {
    inputName: value.source,
    inputAudioSyncOffset: value.offset,
}));
nodecg.listenFor("toggleStream", () => obs.send("ToggleStream"));
nodecg.listenFor("toggleRecording", () => obs.send("ToggleRecord"));
nodecg.listenFor("restartMedia", (value) => obs.send("PressInputPropertiesButton", {
    inputName: value,
    propertyName: "refreshnocache",
}));
nodecg.listenFor("refreshVideoSource", refreshVideoSource);
/* TODO: This can be enabled and fixed if you want to use the ad player.
I however do not care and have disabled it. */
//nodecg.listenFor("startAd", () => playAds());
/* nodecg.listenFor("returnDelay", (value) =>
  syncStreams(value, streamSync.value),
); */
replicants_1.runDataActiveRun.on("change", (newVal, oldVal) => {
    nodecg.log.debug("onChange - runDataActiveRun");
    if (!newVal) {
        (0, players_1.resetStreamKeys)();
        return;
    }
    if (newVal.id !== oldVal?.id) {
        if (replicants_1.settings.value.autoSetRunners) {
            try {
                (0, players_1.updateStreamKeys)(newVal.teams);
            }
            catch (e) {
                nodecg.log.error(e);
            }
        }
        if (replicants_1.settings.value.autoSetLayout &&
            newVal.customData !== undefined &&
            newVal.customData.layout !== undefined)
            try {
                obs.send("SetCurrentPreviewScene", {
                    sceneName: newVal.customData.layout,
                });
            }
            catch { }
        setFilenameFormatting(replicants_1.autoRecord.value.filenameFormatting, newVal);
        replicants_1.streamSync.value.delay = [null, null, null, null];
    }
});
replicants_1.activeRunners.on("change", (newVal, oldVal) => {
    if (newVal && newVal != oldVal) {
        newVal.forEach(async (player, i) => {
            if (player.streamKey && player.server) {
                await (0, sources_1.setPlayerURL)(i, buildViewerUrl(player.streamKey, viewer.url, viewer.token));
            }
        });
    }
});
function buildViewerUrl(streamKey, url, token) {
    return `${url}/live/key/${streamKey}?token=${token}&region=use`;
}
replicants_1.obsStatus.on("change", onStatusChange);
async function onStatusChange(newVal, oldVal) {
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
async function emergencyTransition(data) {
    nodecg.log.debug(`Emergency transition! Status: ${data.emergencyTransition}`);
    if (!data.emergencyTransition) {
        await obs.send("TriggerStudioModeTransition");
        return;
    }
    await obs.send("SetCurrentPreviewScene", {
        sceneName: replicants_1.settings.value.defaultScene,
    });
    await obs.send("TriggerStudioModeTransition");
    return;
}
function updateChecklist(newVal) {
    if (newVal.inIntermission && replicants_1.timer.value?.state === "finished") {
        replicants_1.checklist.value = defaultValues.checklist;
        replicants_1.checklist.value.started = true;
    }
}
replicants_1.checklist.on("change", (newVal) => {
    if (!newVal.completed) {
        let item;
        for (item in newVal.items) {
            if (newVal.items[item] === false) {
                replicants_1.checklist.value.completed = false;
                return;
            }
        }
        setTimeout(() => {
            replicants_1.checklist.value.completed = true;
        }, 100);
    }
});
// Set filename formatting.
function setFilenameFormatting(filename, data) {
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
                }
                else {
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
    const adData = replicants_1.adPlayer.value;
    const itemList = await obs.send("GetSceneItemList", {
        sceneName: adData.videoScene ?? "",
    });
    for (const item of itemList.sceneItems) {
        if (item.inputKind !== "browser_source")
            continue;
        await obs.send("PressInputPropertiesButton", {
            inputName: item.sourceName?.toString(),
            propertyName: "refreshnocache",
        });
    }
    replicants_1.adPlayer.value.adPlaying = false;
    replicants_1.adPlayer.value.secondsLeft = 0;
}
