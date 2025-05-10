"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adPlayer = exports.checklist = exports.stats = exports.status = exports.settings = exports.botSettings = exports.botData = exports.autoRecord = exports.streamSync = exports.activeRunners = exports.audioSourceTypes = void 0;
exports.audioSourceTypes = [
    "wasapi_input_capture",
    "wasapi_output_capture",
    "pulse_input_capture",
    "pulse_output_capture",
    "browser_source",
    "ffmpeg_source",
    "vlc_source",
];
exports.activeRunners = [
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false,
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false,
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false,
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false,
    },
];
exports.streamSync = {
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
exports.autoRecord = {
    active: false,
    filenameFormatting: "%CCYY-%MM-%DD %hh-%mm-%ss",
};
exports.botData = {
    connected: false,
    users: {},
};
exports.botSettings = {
    active: false,
    websocketURL: null,
    channel: null,
    audioOffset: 675,
    channels: {},
};
exports.settings = {
    previewCode: "",
    programCode: "",
    intermissionScene: "",
    autoRecord: false,
    autoSetLayout: false,
    autoSetRunners: false,
    forceChecklist: false,
    firstLaunch: true,
};
exports.status = {
    previewScene: "",
    programScene: "",
    inIntermission: false,
    inTransition: false,
    emergencyTransition: false,
    streaming: false,
    recording: false,
};
exports.stats = {
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
exports.checklist = {
    started: false,
    completed: false,
    default: {
        playRun: false,
        playAd: false,
        verifyStream: false,
        syncStreams: false,
        checkAudio: false,
        checkInfo: false,
        checkReady: false,
        finalCheck: false,
    },
    custom: {},
    customOld: {},
};
exports.adPlayer = {
    adPlaying: false,
    videoAds: false,
    twitchAds: false,
    twitchAdLength: 0,
    secondsLeft: 0,
    videoScene: null,
};
