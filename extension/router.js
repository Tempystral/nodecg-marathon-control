"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNodeCGRouter = useNodeCGRouter;
const path_1 = __importDefault(require("path"));
function useNodeCGRouter(nodecg) {
    const app = nodecg.Router();
    let isUpgraded = false;
    app.get("/delay", (req, res) => res.sendFile(path_1.default.join(__dirname, "../graphics/delay.html")));
    function upgrade(wsPath, upgradeServer) {
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
