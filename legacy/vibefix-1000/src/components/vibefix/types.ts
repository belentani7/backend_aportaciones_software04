/**
 * Contrato de API compartido y helpers para el frontend de VibeFix 1000.
 * Task 5-b — solo frontend: consume /api/*, no las implementa.
 */

export type StatsDTO = {
  total: number;
  byDomain: { key: string; label: string; count: number }[];
  byTool: { name: string; count: number }[];
  bySeverity: { name: string; count: number }[];
  byEnvironment: { name: string; count: number }[];
  avgFrequency: number;
};

export type SolutionDTO = {
  id: string;
  code: number;
  title: string;
  problem: string;
  category: string;
  tool: string;
  environment: string;
  severity: string;
  frequency: number;
  source: string;
  rootCause: string;
  steps: string[];
  codeFix: string;
  prevention: string;
  tags: string[];
};

export type SolutionsResponse = {
  items: SolutionDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type WeeklyDTO = {
  id: string;
  weekLabel: string;
  title: string;
  trendSummary: string;
  keyFindings: string[];
  proposedSolution: { name: string; description: string; steps: string[] };
  skillIdea: string;
  reposStudied: { name: string; description: string; why: string }[];
  generatedAt: string;
};

export type WeeklyResponse = {
  items: WeeklyDTO[];
  dueForNew: boolean;
};

export type RepoDTO = {
  name: string;
  url: string;
  description: string;
  why: string;
  category: string;
};

export type ReposResponse = {
  items: RepoDTO[];
};

export type IncomePlatformDTO = {
  name: string;
  url: string;
  fee: string;
  note: string;
};

export type IncomeEvidenceDTO = {
  source: string;
  url: string;
  claim: string;
};

export type IncomePathDTO = {
  id: string;
  code: number;
  title: string;
  category: string;
  summary: string;
  realRate: string;
  rateMinPerHour: number;
  rateMaxPerHour: number;
  platforms: IncomePlatformDTO[];
  evidence: IncomeEvidenceDTO[];
  matchRepos: string[];
  timeToFirstIncome: string;
  effort: string;
  demandLevel: string;
  steps: string[];
};

export type IncomeResponse = {
  items: IncomePathDTO[];
  total: number;
};

export type GithubProfileDTO = {
  user: string;
  url: string;
  name: string;
  bio: string;
  location: string;
  languages: string[];
};

export type GithubRepoItemDTO = {
  name: string;
  description: string;
  language: string | null;
  category: string;
  monetization: string;
  relatedPath: number | null;
};

export type GithubResponse = {
  profile: GithubProfileDTO;
  repos: GithubRepoItemDTO[];
  total: number;
  withMonetization: number;
  byCategory: Record<string, number>;
};

export type TranslationFrameworkDTO = {
  role: string;
  context: string;
  task: string;
  constraints: string[];
  outputFormat: string;
};

export type TranslationDTO = {
  id: string;
  humanInput: string;
  aiPrompt: string;
  framework: TranslationFrameworkDTO;
  tier: string;
  createdAt: string;
  tierHint?: string;
};

export type TranslationResponse = {
  item: TranslationDTO;
};

export type TranslationHistoryResponse = {
  items: TranslationDTO[];
};

export const INCOME_CATEGORIES: ReadonlyArray<{ key: string; label: string }> = [
  { key: "freelance-ia", label: "Freelance IA" },
  { key: "localizacion", label: "Localización" },
  { key: "automatizacion", label: "Automatización" },
  { key: "productos", label: "Productos digitales" },
  { key: "consultoria", label: "Consultoría" },
];

export function incomeCategoryLabel(key: string): string {
  return INCOME_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const GITHUB_CATEGORY_LABELS: Record<string, string> = {
  "ia-agentes": "Agentes IA",
  idiomas: "Idiomas",
  seguridad: "Seguridad",
  educacion: "Educación",
  herramientas: "Herramientas",
  social: "Social",
  otros: "Otros",
};

export function githubCategoryLabel(key: string): string {
  return GITHUB_CATEGORY_LABELS[key] ?? key;
}

export const TRANSLATION_TIERS: Record<string, { label: string; cls: string; hint: string }> = {
  local: {
    label: "Tier local",
    cls: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
    hint: "Tarea simple — modelo local o barato (meta-skill: local_zero_token)",
  },
  fast: {
    label: "Tier rápido",
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    hint: "Modelo rápido y barato: clasificación, redacción corta",
  },
  mid: {
    label: "Tier medio",
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    hint: "Razonamiento moderado — modelo intermedio",
  },
  heavy: {
    label: "Tier pesado",
    cls: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    hint: "Código/analysis complejo — modelo top justificado",
  },
};

export function tierMeta(tier: string) {
  return TRANSLATION_TIERS[tier] ?? TRANSLATION_TIERS.mid;
}

export const DOMAINS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "contexto", label: "Contexto y memoria" },
  { key: "alucinaciones", label: "Alucinaciones de API" },
  { key: "entorno", label: "Config. y entorno" },
  { key: "git", label: "Git y versionado" },
  { key: "despliegue", label: "Despliegue y prod." },
  { key: "seguridad", label: "Seguridad" },
  { key: "rendimiento", label: "Rendimiento" },
  { key: "costes", label: "Costes y límites" },
  { key: "colaboracion", label: "Colaboración humano-IA" },
  { key: "pruebas", label: "Pruebas y calidad" },
];

export function domainLabel(key: string): string {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}

export const SEVERITIES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export function severityLabel(sev: string): string {
  const normalized = sev.toLowerCase();
  return SEVERITIES.find((s) => s.value === normalized)?.label ?? sev;
}

/** Clases Tailwind por severidad: rose=crítica, amber=alta, emerald=media, zinc=baja. */
export function severityClass(sev: string): string {
  switch (sev.toLowerCase()) {
    case "critica":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300";
    case "alta":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "media":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-zinc-700 bg-zinc-800/60 text-zinc-300";
  }
}

/** Fallback si /api/stats aún no está disponible al poblar el select de herramientas. */
export const FALLBACK_TOOLS: ReadonlyArray<string> = [
  "Claude Code",
  "GitHub Copilot",
  "Cursor",
  "Windsurf",
  "Aider",
  "Codex CLI",
  "Gemini CLI",
  "Replit Agent",
  "Bolt / Lovable",
  "Devin",
];

export function formatCode(code: number): string {
  return `#${String(code).padStart(4, "0")}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
