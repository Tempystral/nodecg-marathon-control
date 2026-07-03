"use strict";
/// <reference types="@nodecg/types/augment-window" />
/* eslint-disable @typescript-eslint/no-require-imports */
Object.defineProperty(exports, "__esModule", { value: true });
// This must go first so we can use module aliases!
require("module-alias").addAlias("@nmc", require("path").join(__dirname, "."));
const nodecg_1 = require("./util/nodecg");
exports.default = (nodecg) => {
    /**
     * Because of how `import`s work, it helps to use `require`s to force
     * things to be loaded *after* the NodeCG context is set.
     */
    (0, nodecg_1.set)(nodecg);
    require("./obs-events");
    require("./server");
    //require("./util/replicants");
};
