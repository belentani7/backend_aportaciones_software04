export const OUTCOMES = ["accept", "waitlist", "route", "reject", "human_review", "stop"] as const;
export const CAPACITY_STATES = ["VERDE", "AMARILLO", "NARANJA", "ROJO", "NEGRO"] as const;

export type Outcome = (typeof OUTCOMES)[number];
export type CapacityState = (typeof CAPACITY_STATES)[number];
export type Risk = "low" | "medium" | "high" | "critical";

export type GateConfig = {
  theoreticalCapacity: number;
  qualityFactor: number;
  humanFactor: number;
  safetyBuffer: number;
  minimumMargin: number;
  maxResponseMinutes: number;
  maxRisk: "low" | "medium" | "high";
  authorizedChannels: string[];
  queueOrangeThreshold: number;
  queueRedThreshold: number;
  errorThreshold: number;
  confidenceThreshold: number;
  ruleVersion: string;
};

export type GateRequest = {
  requestKey: string;
  title: string;
  description: string;
  channel: string;
  priority: number;
  complexity: number;
  urgency: number;
  estimatedLoad: number;
  estimatedMargin: number;
  risk: Risk;
};

export type GateSnapshot = {
  currentLoad: number;
  queueLoad: number;
  errorRate: number;
  responseMinutes: number;
  humanInterventionRate: number;
  duplicateRate: number;
  incidentCount: number;
};

export type GateDecision = {
  outcome: Outcome;
  capacityState: CapacityState;
  confidence: number;
  reason: string;
  modelUsed: string;
  rulesVersion: string;
  safeCapacity: number;
  remainingCapacity: number;
  loadUnits: number;
};

const riskRank: Record<Risk, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function safeCapacity(config: GateConfig) {
  return Math.max(0, Math.floor(config.theoreticalCapacity * config.qualityFactor * config.humanFactor * config.safetyBuffer));
}

export function capacityState(config: GateConfig, snapshot: GateSnapshot): CapacityState {
  const safe = safeCapacity(config);
  const loadPercent = safe === 0 ? 100 : ((snapshot.currentLoad + snapshot.queueLoad) / safe) * 100;
  if (snapshot.errorRate >= config.errorThreshold || snapshot.duplicateRate >= 0.1 || snapshot.incidentCount >= 5) return "NEGRO";
  if (snapshot.responseMinutes > config.maxResponseMinutes || loadPercent >= config.queueRedThreshold || snapshot.humanInterventionRate >= 0.9) return "ROJO";
  if (loadPercent >= config.queueOrangeThreshold) return "NARANJA";
  if (loadPercent >= 70) return "AMARILLO";
  return "VERDE";
}

export function isExpired(expiresAt: Date | null | undefined, now = new Date()) {
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}

export function canRetry(retryCount: number, maxRetries: number) {
  return retryCount < maxRetries;
}

export function isDuplicate(requestKey: string, seenKeys: ReadonlySet<string>) {
  return seenKeys.has(requestKey);
}

export function evaluateCapacityGate(config: GateConfig, request: GateRequest, snapshot: GateSnapshot): GateDecision {
  const safe = safeCapacity(config);
  const loadUnits = Math.max(1, Math.ceil(request.estimatedLoad * Math.max(1, request.complexity) * Math.max(1, request.urgency)));
  const remaining = Math.max(0, safe - snapshot.currentLoad - snapshot.queueLoad);
  const state = capacityState(config, snapshot);
  const base = { capacityState: state, modelUsed: "capacity-gate-rules", rulesVersion: config.ruleVersion, safeCapacity: safe, remainingCapacity: remaining, loadUnits };

  if (state === "NEGRO") return { ...base, outcome: "stop", confidence: 0.99, reason: "Cierre de seguridad: error, duplicados o incidencias por encima del umbral." };
  if (state === "ROJO") return { ...base, outcome: "stop", confidence: 0.98, reason: "Capacidad o tiempo de respuesta agotados; no se aceptan nuevas obligaciones." };
  if (!config.authorizedChannels.includes(request.channel)) return { ...base, outcome: "route", confidence: 0.99, reason: "Canal no autorizado; derivación sin comprometer capacidad." };
  if (request.risk === "critical" || riskRank[request.risk] > riskRank[config.maxRisk]) return { ...base, outcome: "human_review", confidence: 0.96, reason: "Nivel de riesgo superior al máximo automático." };
  if (request.estimatedMargin < config.minimumMargin) return { ...base, outcome: "reject", confidence: 0.97, reason: "Margen estimado inferior al mínimo operativo." };
  if (snapshot.responseMinutes > config.maxResponseMinutes) return { ...base, outcome: "waitlist", confidence: 0.94, reason: "El tiempo de respuesta previsto supera el límite configurado." };
  if (loadUnits > remaining) return { ...base, outcome: "waitlist", confidence: 0.95, reason: "La solicitud supera la capacidad restante segura." };
  if (state === "NARANJA" && request.priority < 80) return { ...base, outcome: "waitlist", confidence: 0.92, reason: "Modo de protección: solo se aceptan prioridades altas cerca del límite." };
  if (state === "AMARILLO" && request.priority < 50) return { ...base, outcome: "waitlist", confidence: 0.9, reason: "Modo preventivo: se reserva capacidad para prioridades superiores." };
  return { ...base, outcome: "accept", confidence: 0.98, reason: "Capacidad, margen, riesgo, canal y plazo dentro de los límites." };
}
