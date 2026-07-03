import { audioSourceTypes } from "@nmc/defaultValues";
import { OBSResponseTypes } from "obs-websocket-js";
import { send } from "./websocket";

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

async function setPlayerURL(index: number, url: string) {
  const sourceName = `Player ${index + 1}`;
  const browserSources = await getBrowserSources();
  const playerSource = browserSources.find((s) => s.inputName === sourceName);
  if (playerSource?.inputName) {
    await setBrowserUrl(sourceName, url);
  }
}

async function getInputSettings(inputName: string) {
  return await send("GetInputSettings", { inputName });
}

async function setBrowserUrl(inputName: string, url: string) {
  await send("SetInputSettings", { inputName, inputSettings: { url } });
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
  setPlayerURL,
};
