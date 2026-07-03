import { get } from "@nmc/util/nodecg";
import OBSWebSocket, {
  EventSubscription,
  OBSRequestTypes,
  OBSResponseTypes,
} from "obs-websocket-js";

const nodecg = get();
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

function connect(ip: string, port: string, password: string) {
  return ws.connect(`ws://${ip}:${port}`, password, {
    eventSubscriptions: EventSubscription.All,
  });
}

export { ws, send, connect };
