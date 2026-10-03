export interface Lead {
  repo: string;
  stars: number;
  language: string;
  segment: string;
  angle: string;
  offer: string;
}

// Red de prospeccion: repos con traccion reciente y brecha de documentacion/seguridad.
// La oferta encaja: auditoria 100 -> informe + PR documental + hardening.
export const leads: Lead[] = [
  {
    repo: "bolna-ai/bolna",
    stars: 769,
    language: "Python",
    segment: "AI voice agents",
    angle:
      "Infraestructura de agentes de voz con crecimiento rapido; maneja audio y datos sensibles.",
    offer: "Auditoria de seguridad + privacidad y cadena documental completa.",
  },
  {
    repo: "automateyournetwork/netclaw",
    stars: 667,
    language: "Python",
    segment: "Network automation + AI",
    angle:
      "Automatiza redes con IA; un fallo de seguridad tiene impacto directo en infraestructura.",
    offer: "Revision de superficie de ataque + AGENTS.md/PRD/ADR para contribuidores.",
  },
  {
    repo: "joinly-ai/joinly",
    stars: 566,
    language: "Python",
    segment: "AI meeting agent",
    angle:
      "Agente que entra en reuniones y procesa conversaciones; riesgo alto de fuga de datos.",
    offer: "DPA/PII review + documentacion de arquitectura y limites.",
  },
  {
    repo: "DemocracyLab/CivicTechExchange",
    stars: 105,
    language: "TypeScript",
    segment: "Civic tech (mision social)",
    angle:
      "Plataforma civica alineada con impacto social; buen encaje de marca y portfolio.",
    offer: "Auditoria pro-bono de accesibilidad WCAG 2.1 AA + docs, con caso de estudio.",
  },
  {
    repo: "hackforla/CivicTechJobs",
    stars: 24,
    language: "TypeScript",
    segment: "Civic tech (voluntariado)",
    angle:
      "Proyecto de voluntariado con rotacion; la documentacion reduce el coste de onboarding.",
    offer: "Kit de onboarding tecnico + AGENTS.md + PRD/SRS.",
  },
];
