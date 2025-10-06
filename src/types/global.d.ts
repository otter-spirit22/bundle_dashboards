// src/types/global.d.ts
export {};

declare global {
  interface Window {
    __BB_ROWS__?: Record<string, any>[];
    __BB_INSIGHTS__?: any[];    // keep wide to avoid circular type issues
    __BB_METRICS__?: any;
  }
}
