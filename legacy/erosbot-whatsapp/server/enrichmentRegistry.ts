import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type EnrichedPattern = {
  schemaVersion: string;
  sourceId: string;
  sourceUrl: string;
  sourceRecordId: string;
  language: string;
  region: string;
  variant: string;
  normalizedForm: string;
  intentCategory: string;
  contextTags: string[];
  confidence: number;
  reviewStatus: string;
  provenance: { method: string; fetchedAt: string };
};

type EnrichmentFile = { schemaVersion: string; source: string; generatedAt: string; entries: EnrichedPattern[]; rejected: Array<{ id: string; reason: string }> };
let cached: EnrichmentFile | null = null;

export function getEnrichmentRegistry(): EnrichmentFile {
  if (!cached) {
    const dataDir = join(process.cwd(), "data");
    const activePath = join(dataDir, "enriched-patterns-v3.active.json");
    const basePath = join(dataDir, "enriched-patterns-v3.json");
    const path = existsSync(activePath) ? activePath : basePath;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as EnrichmentFile;
    const unique = new Map<string, EnrichedPattern>();
    for (const entry of parsed.entries ?? []) {
      if (entry.schemaVersion !== "3.0.0" || entry.reviewStatus !== "candidate" || !entry.normalizedForm || unique.has(`${entry.language}:${entry.normalizedForm}`)) continue;
      unique.set(`${entry.language}:${entry.normalizedForm}`, entry);
      if (unique.size >= 5_000) break;
    }
    cached = { ...parsed, entries: Array.from(unique.values()) };
  }
  return cached;
}

export function getEnrichmentStats() {
  const entries = getEnrichmentRegistry().entries;
  return { version: "3.0.0", entries: entries.length, languages: new Set(entries.map(entry => entry.language)).size, sources: new Set(entries.map(entry => entry.sourceId)).size };
}

export function findEnrichmentHints(text: string, language = "es-ES") {
  const normalized = text.normalize("NFKC").toLocaleLowerCase(language).replace(/\s+/g, " ").trim();
  return getEnrichmentRegistry().entries
    .filter(entry => entry.language === language && entry.normalizedForm === normalized)
    .slice(0, 3)
    .map(entry => ({ intentCategory: entry.intentCategory, contextTags: entry.contextTags, confidence: Math.min(entry.confidence, 0.75), sourceId: entry.sourceId }));
}
