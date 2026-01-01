// Shim for Cesium/Vite builds.
// Cesium deep-imports "@zip.js/zip.js/lib/zip-no-worker.js" but recent zip.js
// versions restrict exports, which makes Vite fail during build.
// We alias that deep import to this file in vite.config.ts.

import * as zip from "@zip.js/zip.js";

// Disable web workers (matches intent of zip-no-worker build).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(zip as any).configure?.({ useWebWorkers: false });

export * from "@zip.js/zip.js";
export default zip;
