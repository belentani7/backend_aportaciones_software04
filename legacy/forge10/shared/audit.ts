export const AUDIT_CRITERIA = [
  "backend",
  "frontend",
  "utilidad",
  "relevancia",
  "potencial",
  "identidad",
] as const;

export type AuditCriterion = (typeof AUDIT_CRITERIA)[number];
export type AuditScores = Record<AuditCriterion, number>;
export type Layer = "backend" | "frontend";
export type AuditVerdict = "approved" | "rejected";

export type AuditComponent = {
  id: string;
  name: string;
  description: string;
  repository: string;
  stars: number;
  layer: Layer;
  scores: AuditScores;
  justifications: Record<AuditCriterion, string>;
  verdict: AuditVerdict;
  perfect: boolean;
};

export const auditComponents: AuditComponent[] = [
  {
    id: "trpc",
    name: "tRPC",
    description:
      "Contratos tipados de extremo a extremo para APIs TypeScript con fricción mínima.",
    repository: "https://github.com/trpc/trpc",
    stars: 39300,
    layer: "backend",
    scores: {
      backend: 10,
      frontend: 10,
      utilidad: 10,
      relevancia: 10,
      potencial: 10,
      identidad: 10,
    },
    verdict: "approved",
    perfect: true,
    justifications: {
      backend:
        "Contratos seguros y procedimientos componibles para el servidor.",
      frontend:
        "El cliente React infiere tipos y estados sin duplicar esquemas.",
      utilidad: "Reduce errores de integración y acelera el desarrollo diario.",
      relevancia: "Es una referencia activa para stacks TypeScript modernos.",
      potencial:
        "Escala desde prototipos hasta aplicaciones full-stack complejas.",
      identidad: "Representa la filosofía Forge10 de precisión sin ruido.",
    },
  },
  {
    id: "react",
    name: "React",
    description:
      "Biblioteca declarativa para construir interfaces componibles y mantenibles.",
    repository: "https://github.com/facebook/react",
    stars: 238000,
    layer: "frontend",
    scores: {
      backend: 10,
      frontend: 10,
      utilidad: 10,
      relevancia: 10,
      potencial: 10,
      identidad: 10,
    },
    verdict: "approved",
    perfect: true,
    justifications: {
      backend:
        "Se integra con cualquier backend mediante contratos bien definidos.",
      frontend:
        "Modelo declarativo, ecosistema sólido y composición de componentes.",
      utilidad:
        "Resuelve interfaces desde paneles hasta experiencias de producto.",
      relevancia:
        "Mantiene una posición central en el desarrollo web profesional.",
      potencial:
        "Permite evolucionar hacia aplicaciones ricas, accesibles y rápidas.",
      identidad:
        "Es la capa visual ideal para una auditoría centrada en claridad.",
    },
  },
  {
    id: "playwright",
    name: "Playwright",
    description:
      "Automatización de navegador para pruebas end-to-end confiables y multiplataforma.",
    repository: "https://github.com/microsoft/playwright",
    stars: 78000,
    layer: "backend",
    scores: {
      backend: 10,
      frontend: 9,
      utilidad: 10,
      relevancia: 10,
      potencial: 10,
      identidad: 9,
    },
    verdict: "rejected",
    perfect: false,
    justifications: {
      backend: "Encaja en pipelines de calidad y verificación de servicios.",
      frontend:
        "Prueba flujos reales, aunque su foco principal es la automatización.",
      utilidad: "Convierte criterios de calidad en comprobaciones repetibles.",
      relevancia: "Es una herramienta de referencia para testing web moderno.",
      potencial:
        "Permite cubrir regresiones críticas a medida que crece el producto.",
      identidad:
        "Alta precisión, pero no define por sí sola la identidad visual.",
    },
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    description:
      "Sistema de utilidades para construir sistemas visuales consistentes con rapidez.",
    repository: "https://github.com/tailwindlabs/tailwindcss",
    stars: 89000,
    layer: "frontend",
    scores: {
      backend: 8,
      frontend: 10,
      utilidad: 10,
      relevancia: 10,
      potencial: 10,
      identidad: 10,
    },
    verdict: "rejected",
    perfect: false,
    justifications: {
      backend:
        "No es una solución de servidor; su valor está en la capa visual.",
      frontend:
        "Permite expresar tokens, estados y responsive con consistencia.",
      utilidad: "Acelera iteraciones sin sacrificar un lenguaje visual propio.",
      relevancia: "Es ampliamente adoptado en productos web contemporáneos.",
      potencial: "Facilita sistemas de diseño escalables y mantenibles.",
      identidad: "Su flexibilidad encaja con una marca precisa y editorial.",
    },
  },
];

export function assertValidScores(scores: AuditScores) {
  for (const criterion of AUDIT_CRITERIA) {
    const score = scores[criterion];
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      throw new Error(
        `Invalid Forge10 score for ${criterion}: expected 0–10, received ${score}`
      );
    }
  }
  return scores;
}

export function isPerfectScore(scores: AuditScores) {
  assertValidScores(scores);
  return AUDIT_CRITERIA.every(criterion => scores[criterion] === 10);
}

export function getAuditSummary(components: AuditComponent[]) {
  const approved = components.filter(component =>
    isPerfectScore(component.scores)
  );
  const average = AUDIT_CRITERIA.map(criterion => {
    const total = components.reduce(
      (sum, component) => sum + component.scores[criterion],
      0
    );
    return [
      criterion,
      components.length ? Number((total / components.length).toFixed(1)) : 0,
    ] as const;
  });

  return {
    total: components.length,
    approved: approved.length,
    approvalRate: components.length
      ? Math.round((approved.length / components.length) * 100)
      : 0,
    perfectCriteria: approved.length * AUDIT_CRITERIA.length,
    average: Object.fromEntries(average) as Record<AuditCriterion, number>,
  };
}

export function buildAuditExport(components: AuditComponent[]) {
  components.forEach(component => assertValidScores(component.scores));
  return {
    product: "Forge10",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    criteria: AUDIT_CRITERIA,
    scale: { min: 0, max: 10, passing: 10 },
    summary: getAuditSummary(components),
    components,
  };
}
