import { Socket } from "net";
import WebSocket, { WebSocketServer } from "ws";

export interface Clients {
  delay: WebSocket[];
  bot: WebSocket[];
}

export function useWebsocketServer() {
  const wsPath = "/bundles/nodecg-marathon-control/ws";
  const clients: Clients = { delay: [], bot: [] };

  const wsServer = new WebSocketServer({ noServer: true });

  function upgradeServer(server: Socket) {
    server.on("upgrade", (req, socket, head) => {
      if (req.url.includes(`${wsPath}/data`)) {
        wsServer.handleUpgrade(req, socket, head, (wsConnection) => {
          wsServer.emit("connection", wsConnection, req);
          //wsServer.ws = wsConnection;
        });
      }
    });
  }

  wsServer.on("connection", (ws, req) => {
    if (req?.url && req.url.includes(`${wsPath}/data/`)) {
      const split = req.url.split(`${wsPath}/data/`)[1];
      switch (split) {
        case "delay":
          clients.delay.push(ws);
          break;
        case "bot":
          clients.bot.push(ws);
          break;
      }
    }
  });

  return { wsServer, upgradeServer, wsPath, clients };
}
