// Ambient global typings for Window. Must be defined exactly once.
import type { HeatmapInsight, UploadedRow } from "./insights";

declare global {
  interface Window {
    __BB_METRICS__?: any;
    __BB_ROWS__?: UploadedRow[];
    __BB_INSIGHTS__?: HeatmapInsight[];
  }
}
export {};
