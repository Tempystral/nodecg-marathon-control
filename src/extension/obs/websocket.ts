import OBSWebSocket, {
  OBSRequestTypes,
  OBSResponseTypes,
} from "obs-websocket-js";

const ws = new OBSWebSocket();

async function send<Type extends keyof OBSRequestTypes>(
  request: Type,
  data?: OBSRequestTypes[Type],
) {
  // Return promise with callback
  return new Promise<OBSResponseTypes[Type]>(async (resolve) => {
    ws.call<Type>(request, data)
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

export { ws, send };
