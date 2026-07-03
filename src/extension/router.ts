import { ServerConfig } from "@nmc/types/schemas/ServerConfig";
import NodeCG from "@nodecg/types";
import { Socket } from "net";
import path from "path";

export function useNodeCGRouter(nodecg: NodeCG.ServerAPI<ServerConfig>) {
  const app = nodecg.Router();
  let isUpgraded = false;

  app.get("/delay", (req, res) =>
    res.sendFile(path.join(__dirname, "../graphics/delay.html")),
  );

  function upgrade(wsPath: string, upgradeServer: (server: Socket) => void) {
    app.get(`${wsPath}/start`, (req, res) => {
      if (!isUpgraded) {
        upgradeServer(req.socket);
        isUpgraded = true;
      }
      res.sendStatus(200);
    });
  }

  nodecg.mount(app);

  return { app, upgrade };
}
