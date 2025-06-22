import { ActiveRunners,  OBSStats, SettingsReplicant } from "@nmc/types";
import { ChecklistData } from "@nmc/types/schemas/ChecklistData";

export const audioSourceTypes = [
  "wasapi_input_capture",
  "wasapi_output_capture",
  "pulse_input_capture",
  "pulse_output_capture",
  "browser_source",
  "ffmpeg_source",
  "vlc_source",
];

export const activeRunners : ActiveRunners[] = [
  {
    source: null,
    streamKey: null,
    server: "use",
    cam: true,
  },
  /* {
    source: null,
    streamKey: null,
    server: "use",
    cam: true,
  },
  {
    source: null,
    streamKey: null,
    server: "use",
    cam: true,
  },
  {
    source: null,
    streamKey: null,
    server: "use",
    cam: true,
  }, */
];

export const streamSync = {
  active: false,
  status: {
    delays: false,
    syncing: false,
    autoSync: false,
  },
  autoSync: false,
  maxOffset: 500,
  delay: [null, null, null, null],
};

export const autoRecord = {
  active: false,
  filenameFormatting: "%CCYY-%MM-%DD %hh-%mm-%ss",
};

export const botData = {
  connected: false,
  users: {},
};

export const botSettings = {
  active: false,
  websocketURL: null,
  channel: null,
  audioOffset: 675,
  channels: {},
};

export const settings: SettingsReplicant = {
  previewCode: "",
  programCode: "",
  intermissionScenes: [],
  defaultScene: "",
  autoRecord: false,
  autoSetLayout: false,
  autoSetRunners: false,
  forceChecklist: false,
  firstLaunch: true,
};

export const status = {
  previewScene: "",
  programScene: "",
  inIntermission: false,
  inTransition: false,
  emergencyTransition: false,
  streaming: false,
  recording: false,
};

export const stats: OBSStats = {
  cpuUsage: "0.0",
  fps: "0.0",
  kbitsPerSec: "0",
  averageFrameTime: "0.0",
  missedFrames: "0",
  totalFrames: "0",
  skippedFrames: "0",
  droppedFrames: "0",
  autoRecord: "off",
  diskSpace: "0GB",
  uptime: "00:00:00",
};

export const checklist : ChecklistData = {
  started: false,
  completed: false,
  items: {
    verifyStream: false,
    checkAudio: false,
    checkInfo: false,
    checkReady: false,
    finalCheck: false
  }
};

export const adPlayer = {
  adPlaying: false,
  videoAds: false,
  twitchAds: false,
  twitchAdLength: 0,
  secondsLeft: 0,
  videoScene: null,
};
