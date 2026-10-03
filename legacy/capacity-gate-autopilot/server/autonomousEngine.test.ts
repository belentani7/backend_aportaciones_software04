import { describe, expect, it } from "vitest";
import { buildAutonomousRequest, buildResolutionPrompt, resolveAutonomousStep } from "./autonomousEngine";
import type { GateConfig, GateSnapshot } from "./capacityEngine";

const config: GateConfig = {
  theoreticalCapacity: 100,
  qualityFactor: 0.8,
  humanFactor: 0.8,
  safetyBuffer: 0.8,
  minimumMargin: 50,
  maxResponseMinutes: 60,
  maxRisk: "medium",
  authorizedChannels: ["autonomous"],
  queueOrangeThreshold: 85,
  queueRedThreshold: 100,
  errorThreshold: 0.08,
  confidenceThreshold: 0.65,
  ruleVersion: "1.0.0",
};
const snapshot: GateSnapshot = { currentLoad: 0, queueLoad: 0, responseMinutes: 5, errorRate: 0, humanInterventionRate: 0, marginPerOperation: 60, duplicateRate: 0, incidentCount: 0 };

describe("autonomous resolution protocol", () => {
  it("generates a strict resolver prompt with an internally generated case", () => {
    const prompt = buildResolutionPrompt({ objective: "Resolver el cuello de botella operativo" });
    expect(prompt).toContain("CASO: Caso operativo autogenerado");
    expect(prompt).toContain("FORMATO: devuelve únicamente JSON estructurado");
    expect(prompt).toContain("Nunca sobrepases la capacidad segura");
  });

  it("raises pressure deterministically one iteration at a time", () => {
    const first = buildAutonomousRequest({ iterationNumber: 0, maxIterations: 20, title: "Caso", objective: "Objetivo" }, config, snapshot);
    const second = buildAutonomousRequest({ iterationNumber: 1, maxIterations: 20, title: "Caso", objective: "Objetivo" }, config, snapshot);
    expect(second.estimatedLoad).toBeGreaterThan(first.estimatedLoad);
    expect(first.requestKey).not.toBe(second.requestKey);
  });

  it("stops when the persisted iteration budget is exhausted", () => {
    const result = resolveAutonomousStep({ iterationNumber: 20, maxIterations: 20, title: "Caso", objective: "Objetivo" }, config, snapshot);
    expect(result.status).toBe("completed");
    expect(result.outcome).toBe("stop");
    expect(result.stopReason).toBe("max_iterations");
  });

  it("stops instead of crossing a saturated perimeter", () => {
    const result = resolveAutonomousStep({ iterationNumber: 19, maxIterations: 20, title: "Caso", objective: "Objetivo" }, config, { ...snapshot, currentLoad: 50, queueLoad: 20, responseMinutes: 100, errorRate: 0.2, marginPerOperation: 0, incidentCount: 2 });
    expect(["saturated", "stopped"]).toContain(result.status);
    expect(result.action).toBe("stop");
    expect(result.stopReason).toBe("capacity_gate");
  });
});
