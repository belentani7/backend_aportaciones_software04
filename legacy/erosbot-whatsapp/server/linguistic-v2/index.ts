import { readFileSync } from "node:fs";
import { join } from "node:path";

export type V2Category = "minor" | "coercion" | "trafficking" | "violence" | "harassment" | "fraud" | "privacy" | "support" | "consent" | "spam";
export type V2Severity = "low" | "medium" | "high" | "critical";

type V2Rule = { id: string; language: string; region: string; category: V2Category; severity: V2Severity; confidence: number; pattern: string; action: string };
let cachedRules: V2Rule[] | null = null;
let compiledRules: Array<{ rule: V2Rule; regex: RegExp }> | null = null;
let cachedCorrections: Array<{ language: string; canonical: string; variant: string; confidence: number }> | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "server", "linguistic-v2", file), "utf8")) as T;
}

function getRules() {
  if (!cachedRules) cachedRules = readJson<{ rules: V2Rule[] }>("pattern_rules.json").rules;
  return cachedRules;
}

function getCorrections() {
  if (!cachedCorrections) cachedCorrections = readJson<{ corrections: Array<{ language: string; canonical: string; variant: string; confidence: number }> }>("corrections.json").corrections;
  return cachedCorrections;
}

export function linguisticV2Stats() {
  return { rules: getRules().length, corrections: getCorrections().length, languages: new Set(getRules().map(rule => rule.language)).size, version: "2.0.0" };
}

export function detectV2Rules(text: string) {
  const normalized = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!compiledRules) compiledRules = getRules().flatMap(rule => { try { return [{ rule, regex: new RegExp(rule.pattern, "i") }]; } catch { return []; } });
  return compiledRules.filter(item => item.regex.test(normalized)).slice(0, 32).map(item => item.rule);
}

export function normalizeV2(text: string, language?: string) {
  const lower = text.toLocaleLowerCase(language);
  const candidates = getCorrections().filter(item => (!language || item.language === language) && lower.includes(item.variant.toLocaleLowerCase(language))).sort((a, b) => b.variant.length - a.variant.length).slice(0, 16);
  let result = text;
  for (const item of candidates) result = result.replaceAll(item.variant, item.canonical);
  return { text: result, corrections: candidates };
}
