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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const defaultValues = __importStar(require("./defaultValues"));
const obs = __importStar(require("./obs"));
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const websocketServer_1 = require("./websocketServer");
const nodecg = (0, nodecg_1.get)();
const { ip: wsIp, port: wsPort } = nodecg.bundleConfig.websocket;
const { wsPath, upgradeServer } = (0, websocketServer_1.useWebsocketServer)();
let isUpgraded = false;
// const delayArray = {};
if (!wsIp || wsIp === "" || !wsPort || wsPort === "") {
    nodecg.log.error(`OBS Websocket address has not been defined!
      Please add the IP address and port in the config.`);
    process.exit(1);
    /* gracefulExit(); */ // IDK what this is
}
// Set up delay page.
const app = nodecg.Router();
app.get("/delay", (req, res) => res.sendFile(path_1.default.join(__dirname, "../graphics/delay.html")));
app.get(`${wsPath}/start`, (req, res) => {
    if (!isUpgraded) {
        upgradeServer(req.socket);
        isUpgraded = true;
    }
    res.sendStatus(200);
});
nodecg.mount(app);
// Start DACBot.
if (replicants_1.botSettings.value.active) {
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
/* TODO: Low priority */
//nodecg.listenFor("startAd", () => playAds());
/* nodecg.listenFor("returnDelay", (value) =>
  syncStreams(value, streamSync.value),
); */
function resetStreamKeys() {
    for (let j = 0; j < replicants_1.activeRunners.value.length; j++) {
        replicants_1.activeRunners.value[j].streamKey = null;
    }
}
function updateStreamKeys(teams) {
    try {
        resetStreamKeys();
        teams.forEach((team) => {
            team.players.forEach(async (player, i) => {
                replicants_1.activeRunners.value[i].streamKey = player.social.twitch ?? player.name;
            });
        });
    }
    catch (e) {
        nodecg.log.error(e);
    }
}
replicants_1.runDataActiveRun.on("change", (newVal, oldVal) => {
    nodecg.log.debug("onChange - runDataActiveRun");
    if (!newVal) {
        resetStreamKeys();
        return;
    }
    if (newVal.id !== oldVal?.id) {
        if (replicants_1.settings.value.autoSetRunners) {
            updateStreamKeys(newVal.teams);
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
                await obs.setPlayerURL(i, player);
            }
        });
    }
});
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
