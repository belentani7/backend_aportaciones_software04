import { describe, expect, it } from "vitest";
import { getApprovedSourceCandidates, getSourceRegistry } from "./sourceRegistry";

describe("linguistic source registry", () => {
  it("exposes only traceable candidate sources", () => {
    const registry = getSourceRegistry();
    expect(registry.version).toBe("3.0.0");
    expect(registry.policy.rawTextStorage).toBe(false);
    expect(getApprovedSourceCandidates().map(source => source.id)).toContain("massive-1.1");
  });

  it("covers the twelve target language families without contact fields", () => {
    const sources = getSourceRegistry().sources;
    const allLanguages = new Set(sources.flatMap(source => source.languages));
    for (const language of ["de", "el", "en", "es", "fr", "it", "nl", "pl", "pt", "ro", "bg", "cs"]) expect(allLanguages.has(language) || [...allLanguages].some(value => value.startsWith(`${language}-`))).toBe(true);
    const serialized = JSON.stringify(registrySafeShape(sources));
    expect(serialized).not.toMatch(/\+?[0-9][0-9 .-]{6,}/);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i);
  });
});

function registrySafeShape(sources: unknown) {
  return sources;
}
