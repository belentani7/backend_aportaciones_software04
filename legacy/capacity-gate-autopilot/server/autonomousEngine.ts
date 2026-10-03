import { evaluateCapacityGate, type GateConfig, type GateSnapshot, type GateRequest } from "./capacityEngine";

export type AutonomousRunStatus = "active" | "completed" | "saturated" | "stopped" | "error";

export type AutonomousPromptInput = {
  title?: string;
  objective: string;
  context?: string;
};

export type AutonomousStepInput = {
  iterationNumber: number;
  maxIterations: number;
  title: string;
  objective: string;
};

export function buildResolutionPrompt(input: AutonomousPromptInput): string {
  const title = input.title?.trim() || "Caso operativo autogenerado";
  const context = input.context?.trim() || "No se ha proporcionado contexto externo; genera el caso a partir del objetivo y de los límites operativos actuales.";
  return [
    "ROL: Capacity Gate Autopilot, motor de resolución operativa autónoma.",
    "MISIÓN: convertir un objetivo en un caso ejecutable, elevarlo de forma progresiva y detenerlo antes de saturar recursos.",
    `CASO: ${title}`,
    `OBJETIVO: ${input.objective.trim()}`,
    `CONTEXTO: ${context}`,
    "PROTOCOLO: autogenera los datos mínimos que falten; no inventes capacidad disponible; usa únicamente los límites persistidos; registra cada iteración; eleva intensidad una sola vez por iteración; conserva idempotencia; no repitas una iteración ya registrada.",
    "SALIDAS PERMITIDAS: accept, waitlist, route, reject, human_review, stop.",
    "PARADA OBLIGATORIA: detén cuando la capacidad segura, el margen, el riesgo, el plazo, la confianza, los reintentos o cualquier umbral de estado impidan continuar. Nunca sobrepases la capacidad segura para completar el objetivo.",
    "FORMATO: devuelve únicamente JSON estructurado con runKey, iterationNumber, outcome, capacityState, confidence, action, reason, nextStep y stopReason.",
  ].join("\n");
}

export function buildAutonomousRequest(input: AutonomousStepInput, config: GateConfig, snapshot: GateSnapshot): GateRequest {
  const safeCapacity = Math.max(1, Math.floor(config.theoreticalCapacity * config.qualityFactor * config.humanFactor * config.safetyBuffer));
  const pressure = Math.max(1, Math.ceil((input.iterationNumber + 1) * safeCapacity / Math.max(1, input.maxIterations)));
  return {
    requestKey: `auto:${input.title}:${input.iterationNumber}`.slice(0, 128),
    title: input.title,
    description: input.objective,
    channel: "autonomous",
    priority: 100,
    complexity: Math.min(10, 1 + Math.floor(input.iterationNumber / 3)),
    urgency: Math.min(10, 1 + Math.floor(input.iterationNumber / 4)),
    estimatedLoad: pressure,
    estimatedMargin: config.minimumMargin,
    risk: "low",
  };
}

export function resolveAutonomousStep(input: AutonomousStepInput, config: GateConfig, snapshot: GateSnapshot) {
  if (input.iterationNumber >= input.maxIterations) {
    return {
      status: "completed" as const,
      outcome: "stop" as const,
      capacityState: "AMARILLO" as const,
      confidence: 1,
      action: "stop",
      reason: "Límite de iteraciones alcanzado sin forzar capacidad adicional.",
      stopReason: "max_iterations",
      request: buildAutonomousRequest(input, config, snapshot),
    };
  }

  const request = buildAutonomousRequest(input, config, snapshot);
  const decision = evaluateCapacityGate(config, request, snapshot);
  const terminal = decision.outcome === "stop" || decision.capacityState === "ROJO" || decision.capacityState === "NEGRO";
  return {
    status: terminal ? (decision.capacityState === "NEGRO" ? "stopped" : "saturated") : "active",
    outcome: decision.outcome,
    capacityState: decision.capacityState,
    confidence: decision.confidence,
    action: terminal ? "stop" : "raise_intensity",
    reason: terminal ? `Escalado detenido antes de saturar: ${decision.reason}` : `Iteración ${input.iterationNumber + 1} validada; se puede elevar una vez más dentro del perímetro.`,
    stopReason: terminal ? "capacity_gate" : null,
    request,
    decision,
  };
}
