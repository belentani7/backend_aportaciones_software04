import { performance } from "node:perf_hooks";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getEnrichmentStats, findEnrichmentHints } from "../server/enrichmentRegistry.ts";

const endpoint = "https://datasets-server.huggingface.co/rows?dataset=AmazonScience/massive&config=es-ES&split=train&offset=0&length=100";
const started = performance.now();
const fetchStarted = performance.now();
const response = await fetch(endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
const payload = await response.json();
const fetchMs = performance.now() - fetchStarted;
const rows = Array.isArray(payload.rows) ? payload.rows : [];

const sanitizeStarted = performance.now();
const rejected = [];
const unique = new Map();
for (const wrapper of rows) {
  const row = wrapper?.row ?? {};
  const text = typeof row.utt === "string" ? row.utt.trim() : "";
  const reason = rejectReason(text);
  if (!text || reason) { rejected.push(reason ?? "empty"); continue; }
  const normalized = normalize(text);
  unique.set(normalized, { language: row.locale, normalizedForm: normalized, intentCategory: row.intent, confidence: 0.5 });
}
const sanitizeMs = performance.now() - sanitizeStarted;

const output = join("/tmp", "aurea-enrichment-pipeline-v3.json");
const writeStarted = performance.now();
await writeFile(output, JSON.stringify({ schemaVersion: "3.0.0", entries: Array.from(unique.values()) }));
const writeMs = performance.now() - writeStarted;

const lookupStarted = performance.now();
let matches = 0;
for (let i = 0; i < 1000; i += 1) matches += findEnrichmentHints("despiértame a las nueve de la mañana el viernes", "es-ES").length;
const lookupMs = performance.now() - lookupStarted;
await rm(output, { force: true });
console.log(JSON.stringify({ rows: rows.length, rejected: rejected.length, deduplicatedEntries: unique.size, fetchMs: fixed(fetchMs), sanitizeMs: fixed(sanitizeMs), writeMs: fixed(writeMs), lookupMs: fixed(lookupMs), lookupAverageMs: fixed(lookupMs / 1000), totalMs: fixed(performance.now() - started), matches, loadedStats: getEnrichmentStats() }));

function rejectReason(value) {
  if (value.length > 240) return "too_long";
  if (/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i.test(value)) return "url_or_email";
  if (/(?:\+?\d[\d .()/-]{6,}\d)/.test(value)) return "phone_or_numeric_identifier";
  if (/@[\w.-]{2,}/.test(value)) return "handle";
  return null;
}
function normalize(value) { return value.normalize("NFKC").toLocaleLowerCase("es-ES").replace(/\b\d+(?:[.,]\d+)?\b/g, " __NUMBER__ ").replace(/\s+/g, " ").trim().slice(0, 240); }
function fixed(value) { return Number(value.toFixed(3)); }
