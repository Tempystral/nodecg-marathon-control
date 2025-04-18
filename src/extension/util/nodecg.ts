import type { NodeCG } from "nodecg-types/types/server";

let nodecg: NodeCG;

export function set(ctx: NodeCG): void {
  nodecg = ctx;
}

export function get(): NodeCG {
  return nodecg;
}

export const config = {
  ip: get().bundleConfig.websocket.ip,
  port: get().bundleConfig.websocket.port,
  password: get().bundleConfig.websocket.password,
};
