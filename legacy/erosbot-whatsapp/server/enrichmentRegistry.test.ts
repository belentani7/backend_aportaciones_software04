import { describe, expect, it } from "vitest";
import { getEnrichmentRegistry, getEnrichmentStats } from "./enrichmentRegistry";

describe("enrichment registry v3", () => {
  it("loads sanitized versioned entries with provenance", () => {
    const registry = getEnrichmentRegistry();
    expect(registry.schemaVersion).toBe("3.0.0");
    expect(registry.entries.length).toBeGreaterThan(0);
    expect(registry.entries.length).toBeLessThanOrEqual(5000);
    expect(registry.entries.every(entry => entry.reviewStatus === "candidate" && entry.provenance.method.includes("discard_raw"))).toBe(true);
  });

  it("reports stable source and language statistics", () => {
    const stats = getEnrichmentStats();
    expect(stats.version).toBe("3.0.0");
    expect(stats.sources).toBe(1);
    expect(stats.languages).toBe(1);
  });
});
