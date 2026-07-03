import { obsStatus, sceneList } from "@nmc/util/replicants";
import { send } from "./websocket";
import { OBSEventTypes } from "obs-websocket-js";

export async function updateSceneList() {
  const scenes = await send("GetSceneList");
  const sceneArray = [];
  for (const scene of scenes.scenes) {
    if (scene.sceneName != null) {
      sceneArray.push(scene.sceneName.toString());
    }
  }
  sceneList.value = sceneArray;
}

export function setScene(
  scene: "preview" | "program",
  data: OBSEventTypes["CurrentPreviewSceneChanged"],
) {
  obsStatus.value[`${scene}Scene`] = data.sceneName;
}
