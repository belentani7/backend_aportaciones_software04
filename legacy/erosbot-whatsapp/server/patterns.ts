import { normalizeText } from "./linguistics";
import { detectV2Rules } from "./linguistic-v2";

export type PatternCategory = "minor" | "coercion" | "trafficking" | "violence" | "harassment" | "fraud" | "privacy" | "consent" | "none";
export type PatternSeverity = "low" | "medium" | "high" | "critical";

export interface PatternSignal {
  category: PatternCategory;
  severity: PatternSeverity;
  confidence: number;
  code: string;
  explanation: string;
  requiresHumanReview: boolean;
}

const rules: Array<{ category: PatternCategory; severity: PatternSeverity; code: string; patterns: RegExp[]; explanation: string }> = [
  { category: "minor", severity: "critical", code: "AGE_MINOR_SIGNAL", patterns: [/\b(15|16|17)\s*(años|years|ans|jahre|anos)\b/i, /\bsoy\s*menor\b/i, /\bi[' ]?m\s*under\s*18\b/i], explanation: "Señal de posible minoría de edad." },
  { category: "coercion", severity: "critical", code: "COERCION_CONTROL", patterns: [/te\s*(quito|confisco)\s*el\s*(móvil|telefono|teléfono)/i, /you\s*must\s*work\s*for\s*me/i, /du\s*musst\s*für\s*mich\s*arbeiten/i, /no\s*puedes\s*irte/i], explanation: "Señal de control, amenaza o trabajo impuesto." },
  { category: "trafficking", severity: "critical", code: "TRAFFICKING_SIGNAL", patterns: [/te\s*recojo\s*y\s*te\s*llevo/i, /debt\s* bondage/i, /trabajarás\s*para\s*mí/i, /papiere\s*behalten/i], explanation: "Señal compatible con explotación o trata; requiere revisión humana." },
  { category: "violence", severity: "high", code: "VIOLENCE_THREAT", patterns: [/te\s*haré\s*daño/i, /i[' ]?ll\s*hurt\s*you/i, /ich\s*werde\s*dir\s*wehtun/i, /amenaza/i, /weapon|arma|pistola/i], explanation: "Amenaza, violencia o presencia de armas." },
  { category: "harassment", severity: "high", code: "HARASSMENT", patterns: [/doxx|publicar\s*tu\s*numero|subiré\s*tus\s*fotos/i, /send\s*nudes/i, /te\s*voy\s*a\s*exponer/i, /extorsion|extort|blackmail|chantaje/i], explanation: "Posible acoso, extorsión o exposición de datos." },
  { category: "consent", severity: "critical", code: "CONSENT_ABSENT", patterns: [/sin\s+(tu|su)\s*consentimiento/i, /no\s*(tengo|tienes)\s*permiso/i, /without\s+(your|their)\s*consent/i, /ohne\s*(deine|ihre)\s*zustimmung/i], explanation: "La acción propuesta carece de consentimiento informado explícito." },
  { category: "fraud", severity: "medium", code: "FRAUD_SIGNAL", patterns: [/paga\s*con\s*gift\s*card/i, /crypto|bitcoin|usdt/i, /env[ií]ame\s*el\s*c[oó]digo/i, /verification\s*code/i], explanation: "Señal de posible fraude o solicitud de credenciales." },
  { category: "privacy", severity: "medium", code: "SENSITIVE_DATA_REQUEST", patterns: [/dame\s*tu\s*dni/i, /send\s*your\s*id/i, /full\s*card\s*number/i, /numero\s*de\s*tarjeta/i], explanation: "Solicitud de identificadores o datos financieros sensibles." },
];

export function detectPatterns(text: string): PatternSignal[] {
  const normalized = normalizeText(text);
  const baseSignals = rules.filter(rule => rule.patterns.some(pattern => pattern.test(normalized))).map(rule => ({
    category: rule.category,
    severity: rule.severity,
    confidence: rule.severity === "critical" ? 0.93 : rule.severity === "high" ? 0.87 : 0.78,
    code: rule.code,
    explanation: rule.explanation,
    requiresHumanReview: rule.severity !== "low",
  }));
  const v2Signals = detectV2Rules(text).filter(rule => !["support", "spam"].includes(rule.category)).map(rule => ({
    category: rule.category as PatternCategory,
    severity: rule.severity,
    confidence: rule.confidence,
    code: `V2_${rule.id}`,
    explanation: `Regla lingüística v2 (${rule.language}, ${rule.region})`,
    requiresHumanReview: rule.severity !== "low",
  }));
  const signals = [...baseSignals, ...v2Signals].filter((signal, index, all) => all.findIndex(item => item.code === signal.code) === index);
  return signals.length ? signals : [{ category: "none", severity: "low", confidence: 0.99, code: "NO_SIGNAL", explanation: "No se ha detectado un patrón de riesgo conocido.", requiresHumanReview: false }];
}

const ambiguityCues = /\b(?:quiz[aá]|tal\s*vez|no\s*s[eé]|maybe|not\s*sure|perhaps|je\s*ne\s*sais\s*pas|peut[- ]être|ich\s*wei[ßs]\s*nicht|vielleicht|non\s*lo\s*so|forse|talvez|não\s*sei|misschien|może|možná|може\s*би)\b/i;
const sensitiveCues = /\b(?:consentimiento|consent|permiso|permission|edad|age|adult|menor|minor|trabajar|work|irse|leave|móvil|telefono|phone|documento|dni|id)\b/i;

export function isAmbiguousSafetyInput(text: string) {
  const normalized = normalizeText(text);
  return ambiguityCues.test(normalized) && sensitiveCues.test(normalized);
}

export function safetyDecision(signals: PatternSignal[]) {
  const critical = signals.some(signal => signal.severity === "critical");
  const high = signals.some(signal => signal.severity === "high");
  return {
    action: critical ? "stop_and_escalate" : high ? "pause_and_review" : "continue",
    shouldCallModel: !critical && !high,
    requiresHumanReview: signals.some(signal => signal.requiresHumanReview),
  } as const;
}
