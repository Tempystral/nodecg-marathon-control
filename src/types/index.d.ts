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
  previewScene: string;
  programScene: string;
  inIntermission: boolean;
  inTransition: boolean;
  emergencyTransition: boolean;
  streaming: boolean;
  recording: boolean;
}

export interface SettingsReplicant {
  previewCode: string;
  programCode: string;
  intermissionScene: string;
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
