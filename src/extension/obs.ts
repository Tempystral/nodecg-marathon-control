import { OBSResponseTypes } from "obs-websocket-js";
import { get, config } from "./util/nodecg";
import OBSWebSocket, {
  EventSubscription,
  OBSRequestTypes,
} from "obs-websocket-js/json";
import { audioSources, obsStatus } from "./util/replicants";

const nodecg = get();

nodecg.log.info(
  `Connecting to OBS instance at ws://${config.ip}:${config.port}...`,
);

const obs = new OBSWebSocket();

export async function send<Type extends keyof OBSRequestTypes>(
  request: Type,
  data?: OBSRequestTypes[Type],
) {
  // Return promise with callback
  return new Promise<OBSResponseTypes[Type]>(async (resolve) => {
    obs
      .call<Type>(request, data)
      .then((result) => resolve(result))
      .catch((error) => {
        if (error.code === 600 || !error.code) return;
        nodecg.log.error("A OBS Websocket error has occurred.\n", {
          code: error.code,
          request: request,
          requestData: data,
        });
        return;
      });
  });
}

obs
  .connect(`ws://${config.ip}:${config.port}`, config.password, {
    eventSubscriptions: EventSubscription.All,
  })
  .catch((e) => {
    nodecg.log.error(
      `Could not connect to OBS instance at ws://${config.ip}:${config.port}.`,
    );
    nodecg.log.error(e);
    process.exit(1);
  });

// TODO export these methods from the server module

obs.once("Identified", () => setup(true));

//obs.on('InputVolumeMeters', (data) => console.log(data.inputs[4].inputLevelsMul))

// Listen to OBS events.
// General events.
obs.on("ExitStarted", () => websocketDisconnect());
obs.on("CurrentSceneCollectionChanged", () => {
  getScenes();
  getAudioSources();
});

// Scene events.
obs.on("SceneCreated", () => getScenes());
obs.on("SceneRemoved", () => getScenes());
obs.on("SceneNameChanged", () => getScenes());
obs.on(
  "CurrentPreviewSceneChanged",
  (data) => (obsStatus.value.previewScene = data.sceneName),
);
obs.on(
  "CurrentProgramSceneChanged",
  (data) => (obsStatus.value.programScene = data.sceneName),
);

// Audio events.
obs.on("InputCreated", () => getAudioSources());
obs.on("InputRemoved", () => getAudioSources());
obs.on("InputNameChanged", () => getAudioSources());
obs.on(
  "InputVolumeChanged",
  (data) =>
    (audioSources.value.find((input) => input.name === data.inputName).volume =
      {
        mul: data.inputVolumeMul.toFixed(1),
        db: data.inputVolumeDb.toFixed(1),
      }),
);
obs.on(
  "InputMuteStateChanged",
  (data) =>
    (audioSources.value.find((input) => input.name === data.inputName).muted =
      data.inputMuted),
);
obs.on(
  "InputAudioSyncOffsetChanged",
  (data) =>
    (audioSources.value.find((input) => input.name === data.inputName).offset =
      data.inputAudioSyncOffset),
);

// Output events.
obs.on(
  "StreamStateChanged",
  (data) => (obsStatus.value.streaming = data.outputActive),
);
obs.on(
  "RecordStateChanged",
  (data) => (obsStatus.value.recording = data.outputActive),
);

// Transition events.
obs.on("SceneTransitionStarted", (data) => transition(data));
