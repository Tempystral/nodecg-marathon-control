"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSceneList = updateSceneList;
exports.setScene = setScene;
const replicants_1 = require("@nmc/util/replicants");
const websocket_1 = require("./websocket");
async function updateSceneList() {
    const scenes = await (0, websocket_1.send)("GetSceneList");
    const sceneArray = [];
    for (const scene of scenes.scenes) {
        if (scene.sceneName != null) {
            sceneArray.push(scene.sceneName.toString());
        }
    }
    replicants_1.sceneList.value = sceneArray;
}
function setScene(scene, data) {
    replicants_1.obsStatus.value[`${scene}Scene`] = data.sceneName;
}
