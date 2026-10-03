import { readFileSync } from "node:fs";
import { join } from "node:path";

type SourceRecord = {
  id: string;
  name: string;
  url: string | null;
  type: string;
  license: string;
  status: string;
  languages: string[];
  use: string[];
  exclude: string[];
  notes: string;
};

type Registry = {
  version: string;
  policy: Record<string, unknown>;
  sources: SourceRecord[];
};

let cached: Registry | null = null;

export function getSourceRegistry(): Registry {
  if (!cached) {
    const path = join(process.cwd(), "data", "linguistic-sources-v3.json");
    cached = JSON.parse(readFileSync(path, "utf8")) as Registry;
  }
  return cached;
}

export function getApprovedSourceCandidates() {
  return getSourceRegistry().sources.filter(source => source.status === "candidate").map(source => ({
    id: source.id,
    name: source.name,
    license: source.license,
    languages: source.languages,
    use: source.use,
  }));
}
