"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserSources = getBrowserSources;
exports.getInputSettings = getInputSettings;
exports.hasRerouteAudio = hasRerouteAudio;
exports.inputURLContains = inputURLContains;
exports.setPlayerURL = setPlayerURL;
const defaultValues_1 = require("@nmc/defaultValues");
const websocket_1 = require("./websocket");
async function getBrowserSources() {
    const { inputs } = await (0, websocket_1.send)("GetInputList");
    return inputs
        .filter(filterInputName)
        .filter(filterInputKind)
        .map((input) => ({
        inputName: input.inputName?.toString(),
        inputKind: input.inputKind?.toString(),
    }));
}
function filterInputName(input) {
    return input.inputName && !input.inputName.toString().includes("--");
}
function filterInputKind(input) {
    return (input.inputKind &&
        input.inputKind.toString() === "browser_source" &&
        defaultValues_1.audioSourceTypes.includes(input.inputKind.toString()));
}
async function setPlayerURL(index, url) {
    const sourceName = `Player ${index + 1}`;
    const browserSources = await getBrowserSources();
    const playerSource = browserSources.find((s) => s.inputName === sourceName);
    if (playerSource?.inputName) {
        await setBrowserUrl(sourceName, url);
    }
}
async function getInputSettings(inputName) {
    return await (0, websocket_1.send)("GetInputSettings", { inputName });
}
async function setBrowserUrl(inputName, url) {
    await (0, websocket_1.send)("SetInputSettings", { inputName, inputSettings: { url } });
}
function hasRerouteAudio(source) {
    return source.inputSettings.reroute_audio;
}
function inputURLContains(source, pathPart) {
    return (typeof source.inputSettings.url === "string" &&
        source.inputSettings.url.includes(pathPart));
}
