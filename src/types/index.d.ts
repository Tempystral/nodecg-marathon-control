export interface OBSStats {
  cpuUsage: string;
  fps: string;
  kbitsPerSec: string;
  averageFrameTime: string;
  skippedFrames: string;
  missedFrames: string;
  droppedFrames: string;
  totalFrames: string;
  uptime: string;
  diskSpace: string;
  autoRecord: string;
}

export interface OBSStatus {
  /** Name of the current preview scene */
  previewScene: string;
  /** Name of the current program scene */
  programScene: string;
  /** Is the current preview scene listed as an intermission scene? */
  inIntermission: boolean;
  /** Is OBS transitioning scenes? */
  inTransition: boolean;
  /** Is the emergency transition active? */
  emergencyTransition: boolean;
  /** Is OBS streaming? */
  streaming: boolean;
  /** Is OBS recording? */
  recording: boolean;
  /** Is the dashboard connected to OBS Studio? */
  connected: boolean;
}

export interface SettingsReplicant {
  previewCode: string;
  programCode: string;
  /** List of scenes considered intermissions */
  intermissionScenes: string[];
  /** The default scene to return to during an emergency */
  defaultScene: string;
  autoRecord: boolean;
  autoSetLayout: boolean;
  autoSetRunners: boolean;
  forceChecklist: boolean;
  firstLaunch: boolean;
}

export interface AutoRecordSettings {
  active: boolean;
  filenameFormatting: string;
}

export interface AudioSource {
  name: string;
  type: string;
  volume: {
    mul: number;
    db: number;
  };
  muted: boolean;
  offset: number;
  updateLocation: string;
}

export interface ReturnDelay {
  playerNum: number;
  currentDelay: number;
}

export interface StreamSyncData {
  active: boolean;
  status: {
    delays: boolean;
    syncing: boolean;
    autoSync: boolean;
  };
  autoSync: boolean;
  maxOffset: number;
  delay: null[];
}

export interface AdPlayerData {
  adPlaying: boolean;
  videoAds: boolean;
  twitchAds: boolean;
  twitchAdLength: number;
  secondsLeft: number;
  videoScene: string | null;
}

export interface ActiveRunners {
  source: string | null;
  streamKey: string | null;
  server: string | null;
  cam: boolean;
}
