import { describe, expect, it } from "vitest";
import {
  AUDIT_CRITERIA,
  auditComponents,
  buildAuditExport,
  getAuditSummary,
  isPerfectScore,
} from "@shared/audit";

describe("Forge10 audit rules", () => {
  it("uses exactly the six required criteria", () => {
    expect(AUDIT_CRITERIA).toEqual([
      "backend",
      "frontend",
      "utilidad",
      "relevancia",
      "potencial",
      "identidad",
    ]);
  });

  it("approves only a component with six exact 10s", () => {
    expect(isPerfectScore(auditComponents[0].scores)).toBe(true);
    expect(isPerfectScore(auditComponents[2].scores)).toBe(false);
  });

  it("computes the summary from the catalog", () => {
    const summary = getAuditSummary(auditComponents);
    expect(summary.total).toBe(4);
    expect(summary.approved).toBe(2);
    expect(summary.approvalRate).toBe(50);
    expect(summary.perfectCriteria).toBe(12);
  });

  it("exports structured JSON-ready audit data with verdicts", () => {
    const report = buildAuditExport(auditComponents);
    expect(report.product).toBe("Forge10");
    expect(report.scale).toEqual({ min: 0, max: 10, passing: 10 });
    expect(report.components).toHaveLength(4);
    expect(
      report.components.find(component => component.id === "trpc")?.verdict
    ).toBe("approved");
    expect(
      report.components.find(component => component.id === "playwright")
        ?.verdict
    ).toBe("rejected");
  });
});
