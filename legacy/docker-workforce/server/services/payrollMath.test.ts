import { describe, expect, it } from "vitest";
import { calculateProgressiveOvertimeHours, getPayrollWindow, hoursBetween, nightHoursBetween } from "./payrollMath";

describe("payroll math", () => {
  it("covers the complete month with an exclusive first-day-of-next-month boundary", () => {
    const window = getPayrollWindow("2026-02");
    expect(window.start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(window.endExclusive.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("calculates non-negative shift duration", () => {
    expect(hoursBetween(new Date("2026-02-01T08:00:00Z"), new Date("2026-02-01T16:30:00Z"))).toBe(8.5);
    expect(hoursBetween(new Date("2026-02-01T16:00:00Z"), new Date("2026-02-01T08:00:00Z"))).toBe(0);
  });

  it("counts only the overlap with the Brazilian urban night window", () => {
    expect(nightHoursBetween(new Date("2026-02-01T21:00:00Z"), new Date("2026-02-02T06:00:00Z"), 22, 5)).toBe(7);
    expect(nightHoursBetween(new Date("2026-02-01T10:00:00Z"), new Date("2026-02-01T18:00:00Z"), 22, 5)).toBe(0);
  });

  it("does not mutate the regular-hour allowance", () => {
    expect(calculateProgressiveOvertimeHours(160)).toBe(0);
    expect(calculateProgressiveOvertimeHours(171.5)).toBe(11.5);
  });
});
