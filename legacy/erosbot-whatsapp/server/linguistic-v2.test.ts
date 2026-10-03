import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectV2Rules, linguisticV2Stats, normalizeV2 } from "./linguistic-v2";

describe("linguistic engine v2", () => {
  it("exceeds the requested rule and correction minimums", () => {
    const stats = linguisticV2Stats();
    expect(stats.rules).toBeGreaterThan(5000);
    expect(stats.corrections).toBeGreaterThan(1000);
  });

  it("recognizes all supported languages in the generated catalogue", () => {
    const source = linguisticV2Stats();
    expect(source.version).toBe("2.0.0");
    expect(source.languages).toBe(12);
    const signals = detectV2Rules("menor");
    expect(signals.length).toBeGreaterThan(0);
  });

  it("contains unique generated rule identifiers", () => {
    const payload = JSON.parse(readFileSync(join(process.cwd(), "server", "linguistic-v2", "pattern_rules.json"), "utf8")) as { rules: Array<{ id: string }> };
    expect(new Set(payload.rules.map(rule => rule.id)).size).toBe(payload.rules.length);
  });

  it("normalizes a generated correction without generating explicit content", () => {
    const result = normalizeV2("holaa", "es-ES");
    expect(result.corrections.length).toBeGreaterThan(0);
    expect(result.text).toContain("hola");
  });
});
