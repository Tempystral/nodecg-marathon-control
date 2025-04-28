/// <reference types="@nodecg/types/augment-window" />
/* eslint-disable @typescript-eslint/no-require-imports */

// This must go first so we can use module aliases!
require("module-alias").addAlias("@nmc", require("path").join(__dirname, "."));

import NodeCG from "@nodecg/types";
import { set } from "./util/nodecg";
import { ServerConfig } from "@nmc/types";

export default (nodecg: NodeCG.ServerAPI<ServerConfig>): void => {
  /**
   * Because of how `import`s work, it helps to use `require`s to force
   * things to be loaded *after* the NodeCG context is set.
   */
  set(nodecg);
  require("./server");
  require("./obs");
};
