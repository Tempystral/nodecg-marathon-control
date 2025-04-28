import { RunDataActiveRun, Timer } from "speedcontrol-util/types/speedcontrol";
import * as defaultValue from "../defaultValues";
import { get as nodecg } from "./nodecg";
import {
  AdPlayerData,
  AudioSource,
  ChecklistData,
  OBSStats,
  OBSStatus,
  StreamSyncData,
} from "@nmc/types";

/**
 * This is where you can declare all your replicant to import easily into other files,
 * and to make sure they have any correct settings on startup.
 */

// TODO put a type on all of these

// Active runner data.
interface ActiveRunners {
  source: string | null;
  streamKey: string | null;
  server: string | null;
  cam: boolean;
}
const activeRunners = nodecg().Replicant<ActiveRunners[]>("activeRunners", {
  defaultValue: defaultValue.activeRunners,
});
// List of all available scenes.
const sceneList = nodecg().Replicant<string[]>("sceneList", {
  persistent: false,
});
// List of all OBS audio sources.
const audioSources = nodecg().Replicant<AudioSource[]>("audioSources");

// All OBS stats.
const stats = nodecg().Replicant<OBSStats>("stats", {
  persistent: false,
  defaultValue: defaultValue.stats,
});
// All dashboard settings.
const settings = nodecg().Replicant("settings", {
  defaultValue: defaultValue.settings,
});

// OBS data such as scenes.

const obsStatus = nodecg().Replicant<OBSStatus>("obsStatus", {
  defaultValue: defaultValue.status,
});

// Stream Sync data.
const streamSync = nodecg().Replicant<StreamSyncData>("streamSync", {
  defaultValue: defaultValue.streamSync,
});
// Auto Record settings
const autoRecord = nodecg().Replicant("autoRecord", {
  defaultValue: defaultValue.autoRecord,
});
// Bot data.
const botData = nodecg().Replicant("botData", {
  defaultValue: defaultValue.botData,
});
// Bot speaking map.
const botSpeaking = nodecg().Replicant("botSpeaking", {
  persistent: false,
  defaultValue: [],
});
// Bot settings.
const botSettings = nodecg().Replicant("botSettings", {
  defaultValue: defaultValue.botSettings,
});
// Ad player.
const adPlayer = nodecg().Replicant<AdPlayerData>("adPlayer", {
  defaultValue: defaultValue.adPlayer,
});
// Checklist tasks.
const checklist = nodecg().Replicant<ChecklistData>("checklist", {
  defaultValue: defaultValue.checklist,
});
// Active run data from nodecg()-speedcontrol.
const runDataActiveRun = nodecg().Replicant<RunDataActiveRun>(
  "runDataActiveRun",
  "nodecg()-speedcontrol",
);
// Timer from nodecg()-speedcontrol.
const timer = nodecg().Replicant<Timer>("timer", "nodecg()-speedcontrol");

export {
  timer,
  runDataActiveRun,
  checklist,
  adPlayer,
  botSettings,
  botSpeaking,
  botData,
  autoRecord,
  streamSync,
  obsStatus,
  settings,
  activeRunners,
  sceneList,
  audioSources,
  stats,
};
