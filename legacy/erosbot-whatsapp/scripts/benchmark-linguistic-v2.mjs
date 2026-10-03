import { detectV2Rules, linguisticV2Stats } from "../server/linguistic-v2/index.ts";
const stats = linguisticV2Stats();
const input = "Necesito ayuda humana, el mensaje incluye una señal de seguridad y privacidad";
const started = performance.now();
let matches = 0;
for (let index = 0; index < 100; index++) matches += detectV2Rules(input).length;
const elapsed = performance.now() - started;
console.log(JSON.stringify({ ...stats, iterations: 100, matches, elapsedMs: Number(elapsed.toFixed(2)), averageMs: Number((elapsed / 100).toFixed(3)) }));
