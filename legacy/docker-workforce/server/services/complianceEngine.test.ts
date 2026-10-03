import { describe, expect, it } from "vitest";
import { getJurisdictionRules } from "./complianceEngine";

describe("Brazilian compliance jurisdiction", () => {
  it("uses BR as the default jurisdiction with CLT-oriented parameters", () => {
    const rules = getJurisdictionRules();
    expect(rules.CURRENCY).toBe("BRL");
    expect(rules.DAILY_REST_HOURS).toBe(11);
    expect(rules.MAX_WEEKLY_HOURS).toBe(44);
    expect(rules.DAILY_REST_ARTICLE).toBe("CLT art. 66");
    expect(rules.SOURCE).toContain("planalto.gov.br");
  });

  it("keeps explicit legacy jurisdictions available without making them the default", () => {
    const rules = getJurisdictionRules("ES");
    expect(rules.CURRENCY).toBe("EUR");
    expect(rules.MAX_WEEKLY_HOURS).toBe(40);
    expect(getJurisdictionRules("unknown").CURRENCY).toBe("BRL");
  });
});
