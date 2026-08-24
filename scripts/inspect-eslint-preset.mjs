import preset from "eslint-config-next/core-web-vitals.js";
console.log(JSON.stringify({ type: typeof preset, isArray: Array.isArray(preset), keys: preset && typeof preset === "object" ? Object.keys(preset) : [] }));
