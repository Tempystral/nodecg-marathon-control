<script setup lang="ts">
import { OBSStats } from "@nmc/types";
import { useReplicant } from "nodecg-vue-composable";

const stats = useReplicant<OBSStats>("stats", undefined)!;
</script>
<template>
  <table class="table">
    <tbody>
      <tr>
        <td><b>CPU Usage</b></td>
        <td id="cpuUsage" class="data">{{ stats.data?.cpuUsage }}</td>
      </tr>
      <tr>
        <td><b>Frames Per Second</b></td>
        <td id="fps" class="data">{{ stats.data?.fps }}</td>
      </tr>
      <tr>
        <td><b>Bitrate</b></td>
        <td id="bitrate" class="data">{{ stats.data?.kbitsPerSec }}</td>
      </tr>
      <tr>
        <td><b>Frame Time</b></td>
        <td id="frameTime" class="data">{{ stats.data?.averageFrameTime }}</td>
      </tr>
      <tr>
        <td><b>Missed Frames</b></td>
        <td id="rendering" class="data">{{ stats.data?.missedFrames }}</td>
      </tr>
      <tr>
        <td><b>Skipped Frames</b></td>
        <td id="encoding" class="data">{{ stats.data?.skippedFrames }}</td>
      </tr>
      <tr>
        <td><b>Dropped Frames</b></td>
        <td id="network" class="data">{{ stats.data?.droppedFrames }}</td>
      </tr>
      <tr>
        <td><b>Uptime</b></td>
        <td id="uptime" class="data">{{ stats.data?.uptime }}</td>
      </tr>
      <tr>
        <td><b>Disk Space</b></td>
        <td id="diskSpace" class="data">{{ stats.data?.diskSpace }}</td>
      </tr>
      <tr>
        <td><b>Auto Record</b></td>
        <td id="autoRecord" class="data">{{ stats.data?.autoRecord }}</td>
      </tr>
    </tbody>
  </table>
</template>
<style>
body {
  font-size: 14px;
  letter-spacing: 0.08em;
}

.table {
  width: 100%;
  height: 100%;
}

.data {
  text-align: right;
  font-weight: 300;
  width: 50%;
}
</style>
