export const audioSourceTypes = [
    'wasapi_input_capture',
    'wasapi_output_capture',
    'pulse_input_capture',
    'pulse_output_capture',
    'browser_source',
    'ffmpeg_source',
    'vlc_source'
];

export const activeRunners = [
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false
    },
    {
        source: null,
        streamKey: null,
        server: null,
        cam: false
    }
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
}

export const autoRecord = {
    active: false,
    filenameFormatting: '%CCYY-%MM-%DD %hh-%mm-%ss',
}

export const botData = {
    connected: false,
    users: {},
}

export const botSettings = {
    active: false,
    websocketURL: null,
    channel: null,
    audioOffset: 675,
    channels: {}
}

export const settings = {
    previewCode: '',
    programCode: '',
    intermissionScene: '',
    autoRecord: false,
    autoSetLayout: false,
    autoSetRunners: false,
    forceChecklist: false,
    firstLaunch: true
};

export const status = {
    previewScene: '',
    programScene: '',
    inIntermission: false,
    inTransition: false,
    emergencyTransition: false,
    streaming: false,
    recording: false,
}

export const stats = {
    cpuUsage: 0.00,
    fps: 0.00,
    kbitsPerSec: 0,
    averageFrameTime: 0.0,
    renderMissedFrames: 0,
    renderTotalFrames: 0,
    outputSkippedFrames: 0,
    outputTotalFrames: 0,
    numDroppedFrames: 0,
    numTotalFrames: 0,
    totalStreamTime: 0,
    freeDiskSpace: 0
};

export const checklist = {
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
        finalCheck: false
    },
    custom: {},
    customOld: {}
}

export const adPlayer = {
    adPlaying: false,
    videoAds: false,
    twitchAds: false,
    twitchAdLength: 0,
    secondsLeft: 0,
    videoScene: null,
}