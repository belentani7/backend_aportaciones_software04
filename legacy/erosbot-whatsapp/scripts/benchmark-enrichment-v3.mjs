import { performance } from "node:perf_hooks";
import { getEnrichmentStats, findEnrichmentHints } from "../server/enrichmentRegistry.ts";

const warmStart = performance.now();
const stats = getEnrichmentStats();
const loadMs = performance.now() - warmStart;
const iterations = 1_000;
const start = performance.now();
let matches = 0;
for (let i = 0; i < iterations; i += 1) matches += findEnrichmentHints("despiértame a las nueve de la mañana el viernes", "es-ES").length;
const elapsedMs = performance.now() - start;
console.log(JSON.stringify({ stats, loadMs: Number(loadMs.toFixed(3)), iterations, matches, elapsedMs: Number(elapsedMs.toFixed(3)), averageMs: Number((elapsedMs / iterations).toFixed(4)) }));
