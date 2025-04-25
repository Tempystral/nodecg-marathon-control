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

export interface AudioSource {
  name: string;
  type: string;
  volume: {
    mul: string;
    db: string;
  };
  muted: boolean;
  offset: number;
  updateLocation: string;
}

export interface ChecklistData {
  started: boolean;
  completed: boolean;
  default: {
    playRun: boolean;
    playAd: boolean;
    verifyStream: boolean;
    syncStreams: boolean;
    checkAudio: boolean;
    checkInfo: boolean;
    checkReady: boolean;
    finalCheck: boolean;
  };
  custom?: Record<string, any>;
  customOld?: Record<string, any>;
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
