"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebsocketServer = useWebsocketServer;
exports.loadWebsocketParams = loadWebsocketParams;
const ws_1 = require("ws");
function useWebsocketServer() {
    const wsPath = "/bundles/nodecg-marathon-control/ws";
    const clients = { delay: [], bot: [] };
    const wsServer = new ws_1.WebSocketServer({ noServer: true });
    function upgradeServer(server) {
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
function loadWebsocketParams(nodecg) {
    const { ip: wsIp, port: wsPort } = nodecg.bundleConfig.websocket;
    if (!wsIp || wsIp === "" || !wsPort || wsPort === "") {
        nodecg.log.error(`OBS Websocket address has not been defined!
      Please add the IP address and port in the config.`);
        process.exit(1);
    }
    return { wsIp, wsPort };
}
