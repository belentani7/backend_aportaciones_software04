import { mkdir, writeFile } from "node:fs/promises";

const endpoint = "https://datasets-server.huggingface.co/rows?dataset=AmazonScience/massive&config=es-ES&split=train&offset=0&length=100";
const response = await fetch(endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
const payload = await response.json();
const rows = Array.isArray(payload.rows) ? payload.rows : [];
const patterns = [];
const rejected = [];

for (const wrapper of rows) {
  const row = wrapper?.row ?? {};
  const text = typeof row.utt === "string" ? row.utt.trim() : "";
  const reason = rejectReason(text);
  if (!text || reason) { rejected.push({ id: String(row.id ?? "unknown"), reason: reason ?? "empty" }); continue; }
  const normalized = normalize(text);
  patterns.push({
    schemaVersion: "3.0.0",
    sourceId: "massive-1.1",
    sourceUrl: "https://huggingface.co/datasets/AmazonScience/massive",
    sourceRecordId: String(row.id ?? "unknown"),
    language: String(row.locale ?? "es-ES"),
    region: String(row.locale ?? "es-ES").split("-")[1] ?? "unknown",
    variant: "standardized_localized_utterance",
    normalizedForm: normalized,
    intentCategory: String(row.intent ?? "unknown"),
    contextTags: [String(row.scenario ?? "general"), "public_dataset", "pii_filtered"],
    confidence: confidence(row.judgments),
    reviewStatus: "candidate",
    provenance: { method: "transient_fetch_normalize_discard_raw", fetchedAt: new Date().toISOString() }
  });
}

await mkdir("data", { recursive: true });
await writeFile("data/enriched-patterns-v3.json", JSON.stringify({ schemaVersion: "3.0.0", source: "massive-1.1", generatedAt: new Date().toISOString(), entries: patterns, rejected }, null, 2) + "\n");
console.log(JSON.stringify({ accepted: patterns.length, rejected: rejected.length, output: "data/enriched-patterns-v3.json" }));

function rejectReason(value) {
  if (value.length > 240) return "too_long";
  if (/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i.test(value)) return "url_or_email";
  if (/(?:\+?\d[\d .()/-]{6,}\d)/.test(value)) return "phone_or_numeric_identifier";
  if (/@[\w.-]{2,}/.test(value)) return "handle";
  return null;
}

function normalize(value) {
  return value.normalize("NFKC").toLocaleLowerCase("es-ES")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " __NUMBER__ ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function confidence(judgments) {
  const scores = Array.isArray(judgments) ? judgments.map(j => Number(j?.grammar_score ?? 0)).filter(Number.isFinite) : [];
  if (!scores.length) return 0.5;
  return Math.min(0.99, Math.max(0.1, scores.reduce((a, b) => a + b, 0) / scores.length / 4));
}
