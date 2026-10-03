import { describe, expect, it } from "vitest";
import { canRetry, capacityState, evaluateCapacityGate, isDuplicate, isExpired, safeCapacity, type GateConfig, type GateRequest, type GateSnapshot } from "./capacityEngine";

const config: GateConfig = { theoreticalCapacity: 100, qualityFactor: 0.8, humanFactor: 0.8, safetyBuffer: 0.8, minimumMargin: 50, maxResponseMinutes: 60, maxRisk: "medium", authorizedChannels: ["web", "email", "referral"], queueOrangeThreshold: 85, queueRedThreshold: 100, errorThreshold: 0.08, confidenceThreshold: 0.65, ruleVersion: "1.0.0" };
const request: GateRequest = { requestKey: "req-1", title: "Test", description: "Test", channel: "web", priority: 90, complexity: 1, urgency: 1, estimatedLoad: 2, estimatedMargin: 100, risk: "low" };
const healthy: GateSnapshot = { currentLoad: 10, queueLoad: 10, errorRate: 0.01, responseMinutes: 10, humanInterventionRate: 0.1, duplicateRate: 0, incidentCount: 0 };

describe("capacity gate", () => {
  it("calculates safe capacity with all protection factors", () => expect(safeCapacity(config)).toBe(51));
  it("accepts a profitable low-risk request within capacity", () => expect(evaluateCapacityGate(config, request, healthy).outcome).toBe("accept"));
  it("waitlists work when the safe capacity is exhausted", () => expect(evaluateCapacityGate(config, request, { ...healthy, currentLoad: 50, queueLoad: 0 }).outcome).toBe("waitlist"));
  it("routes unauthorized channels", () => expect(evaluateCapacityGate(config, { ...request, channel: "social" }, healthy).outcome).toBe("route"));
  it("rejects work below minimum margin", () => expect(evaluateCapacityGate(config, { ...request, estimatedMargin: 10 }, healthy).outcome).toBe("reject"));
  it("requires human review for high risk", () => expect(evaluateCapacityGate(config, { ...request, risk: "high" }, healthy).outcome).toBe("human_review"));
  it("stops on critical operational drift", () => expect(evaluateCapacityGate(config, request, { ...healthy, errorRate: 0.2 }).outcome).toBe("stop"));
  it("protects queue expiry, retry limits and idempotency", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(isExpired(new Date("2025-12-31T23:59:00Z"), now)).toBe(true);
    expect(isExpired(new Date("2026-01-01T01:00:00Z"), now)).toBe(false);
    expect(canRetry(2, 3)).toBe(true);
    expect(canRetry(3, 3)).toBe(false);
    expect(isDuplicate("req-1", new Set(["req-1"]))).toBe(true);
    expect(isDuplicate("req-2", new Set(["req-1"]))).toBe(false);
  });
  it("uses the five exact dashboard states", () => {
    expect(capacityState(config, healthy)).toBe("VERDE");
    expect(capacityState(config, { ...healthy, currentLoad: 20, queueLoad: 20 })).toBe("AMARILLO");
    expect(capacityState(config, { ...healthy, currentLoad: 34, queueLoad: 10 })).toBe("NARANJA");
    expect(capacityState(config, { ...healthy, currentLoad: 51, queueLoad: 0 })).toBe("ROJO");
    expect(capacityState(config, { ...healthy, errorRate: 0.2 })).toBe("NEGRO");
  });
});
