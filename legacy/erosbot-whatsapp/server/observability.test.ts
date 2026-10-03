import { describe, expect, it } from "vitest";
import { getObservabilitySnapshot, incrementMetric, recordSanitizedError } from "./observability";

describe("sanitized observability", () => {
  it("records metrics and only sanitized error codes", () => {
    incrementMetric("api_rate_limited");
    recordSanitizedError("transport failure: token=not-recorded");
    const snapshot = getObservabilitySnapshot();
    expect(snapshot.counters.api_rate_limited).toBeGreaterThanOrEqual(1);
    expect(snapshot.recentErrors[0]?.code).toBe("transport_failure__token_not-recorded");
    expect(snapshot.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
