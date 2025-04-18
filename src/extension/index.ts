/* eslint-disable @typescript-eslint/no-require-imports */

// This must go first so we can use module aliases!
require("module-alias").addAlias(
  "@licenseathon-vue",
  require("path").join(__dirname, "."),
);

import type { NodeCG } from "nodecg-types/types/server";
import { set } from "./util/nodecg";

export default (nodecg: NodeCG): void => {
  /**
   * Because of how `import`s work, it helps to use `require`s to force
   * things to be loaded *after* the NodeCG context is set.
   */
  set(nodecg);
  require("./server");
};
