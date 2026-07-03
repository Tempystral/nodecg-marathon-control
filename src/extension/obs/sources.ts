import { OBSResponseTypes } from "obs-websocket-js";
import { send } from "./websocket";
import { audioSourceTypes } from "@nmc/defaultValues";

type SourceSettings = OBSResponseTypes["GetInputSettings"];
type InputType = OBSResponseTypes["GetInputList"]["inputs"][0];

async function getBrowserSources() {
  const { inputs } = await send("GetInputList");
  return inputs
    .filter(filterInputName)
    .filter(filterInputKind)
    .map((input) => ({
      inputName: input.inputName?.toString(),
      inputKind: input.inputKind?.toString(),
    }));
}

function filterInputName(input: InputType) {
  return input.inputName && !input.inputName.toString().includes("--");
}

function filterInputKind(input: InputType) {
  return (
    input.inputKind &&
    input.inputKind.toString() === "browser_source" &&
    audioSourceTypes.includes(input.inputKind.toString())
  );
}

async function getInputSettings(inputName: string) {
  return await send("GetInputSettings", { inputName: inputName });
}

function hasRerouteAudio(source: SourceSettings) {
  return source.inputSettings.reroute_audio;
}

function inputURLContains(source: SourceSettings, pathPart: string) {
  return (
    typeof source.inputSettings.url === "string" &&
    source.inputSettings.url.includes(pathPart)
  );
}

export {
  getBrowserSources,
  getInputSettings,
  hasRerouteAudio,
  inputURLContains,
};
