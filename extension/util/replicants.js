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
exports.timer = exports.streamSync = exports.stats = exports.settings = exports.sceneList = exports.runDataActiveRun = exports.obsStatus = exports.checklist = exports.botSpeaking = exports.botSettings = exports.botData = exports.autoRecord = exports.audioSources = exports.adPlayer = exports.activeRunners = void 0;
const defaultValue = __importStar(require("../defaultValues"));
const nodecg_1 = require("./nodecg");
/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */
// TODO put a type on all of these
// Active runner data.
const activeRunners = (0, nodecg_1.get)().Replicant("activeRunners", {
    defaultValue: defaultValue.activeRunners,
});
exports.activeRunners = activeRunners;
// List of all available scenes.
const sceneList = (0, nodecg_1.get)().Replicant("sceneList", {
    persistent: false,
});
exports.sceneList = sceneList;
// List of all OBS audio sources.
const audioSources = (0, nodecg_1.get)().Replicant("audioSources");
exports.audioSources = audioSources;
// All OBS stats.
const stats = (0, nodecg_1.get)().Replicant("stats", {
    persistent: false,
    defaultValue: defaultValue.stats,
});
exports.stats = stats;
// All dashboard settings.
const settings = (0, nodecg_1.get)().Replicant("settings", {
    defaultValue: defaultValue.settings,
});
exports.settings = settings;
// OBS data such as scenes.
const obsStatus = (0, nodecg_1.get)().Replicant("obsStatus", {
    defaultValue: defaultValue.status,
});
exports.obsStatus = obsStatus;
// Stream Sync data.
const streamSync = (0, nodecg_1.get)().Replicant("streamSync", {
    defaultValue: defaultValue.streamSync,
});
exports.streamSync = streamSync;
// Auto Record settings
const autoRecord = (0, nodecg_1.get)().Replicant("autoRecord", {
    defaultValue: defaultValue.autoRecord,
});
exports.autoRecord = autoRecord;
// Bot data.
const botData = (0, nodecg_1.get)().Replicant("botData", {
    defaultValue: defaultValue.botData,
});
exports.botData = botData;
// Bot speaking map.
const botSpeaking = (0, nodecg_1.get)().Replicant("botSpeaking", {
    persistent: false,
    defaultValue: [],
});
exports.botSpeaking = botSpeaking;
// Bot settings.
const botSettings = (0, nodecg_1.get)().Replicant("botSettings", {
    defaultValue: defaultValue.botSettings,
});
exports.botSettings = botSettings;
// Ad player.
const adPlayer = (0, nodecg_1.get)().Replicant("adPlayer", {
    defaultValue: defaultValue.adPlayer,
});
exports.adPlayer = adPlayer;
// Checklist tasks.
const checklist = (0, nodecg_1.get)().Replicant("checklist", {
    defaultValue: defaultValue.checklist,
});
exports.checklist = checklist;
// Active run data from nodecg()-speedcontrol.
const runDataActiveRun = (0, nodecg_1.get)().Replicant("runDataActiveRun", "nodecg-speedcontrol");
exports.runDataActiveRun = runDataActiveRun;
// Timer from nodecg()-speedcontrol.
const timer = (0, nodecg_1.get)().Replicant("timer", "nodecg-speedcontrol");
exports.timer = timer;
