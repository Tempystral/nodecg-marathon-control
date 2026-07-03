import { sceneList } from "@nmc/util/replicants";
import { send } from "./websocket";

export async function getScenes() {
  const scenes = await send("GetSceneList");
  const sceneArray = [];
  for (const scene of scenes.scenes) {
    if (scene.sceneName != null) {
      sceneArray.push(scene.sceneName.toString());
    }
  }
  sceneList.value = sceneArray;
}
