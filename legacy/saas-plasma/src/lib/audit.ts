export interface RepoMeta {
  fullName: string;
  description: string | null;
  stars: number;
  language: string | null;
  archived: boolean;
  pushedAt: string;
  license: string | null;
}

export interface AuditCheck {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  hint: string;
}

export interface AuditResult {
  repo: string;
  description: string;
  stars: number;
  language: string | null;
  archived: boolean;
  pushedAt: string;
  license: string | null;
  score: number;
  grade: string;
  passed: number;
  total: number;
  checks: AuditCheck[];
  missing: AuditCheck[];
  recommendations: string[];
}

interface CheckDef {
  id: string;
  label: string;
  weight: number;
  hint: string;
  test: (paths: string[]) => boolean;
}

const has = (paths: string[], re: RegExp) => paths.some((p) => re.test(p));

export const CHECK_DEFS: CheckDef[] = [
  {
    id: "readme",
    label: "README",
    weight: 10,
    hint: "Anade un README con que hace, como se instala y como se ejecuta.",
    test: (p) => has(p, /(^|\/)readme(\.md|\.mdx)?$/i),
  },
  {
    id: "license",
    label: "LICENSE",
    weight: 6,
    hint: "Incluye una licencia explicita (MIT, Apache-2.0...) para uso y contribucion.",
    test: (p) => has(p, /(^|\/)licen[cs]e(\.md|\.txt)?$/i),
  },
  {
    id: "agents",
    label: "AGENTS.md",
    weight: 8,
    hint: "Reglas para agentes/personas: proposito, comandos, limites y convenciones.",
    test: (p) => has(p, /(^|\/)agents\.md$/i),
  },
  {
    id: "cursorrules",
    label: ".cursorrules",
    weight: 6,
    hint: "Reglas compactas para editores con IA (Cursor/Kilo/OpenCode).",
    test: (p) => has(p, /(^|\/)\.cursorrules$/i),
  },
  {
    id: "prd",
    label: "docs/prd",
    weight: 8,
    hint: "PRD con MoSCoW, criterios GWT y out-of-scope.",
    test: (p) => has(p, /(^|\/)docs\/prd\//i),
  },
  {
    id: "srs",
    label: "docs/srs",
    weight: 8,
    hint: "SRS con requisitos FR/NFR trazables al PRD.",
    test: (p) => has(p, /(^|\/)docs\/srs\//i),
  },
  {
    id: "design",
    label: "docs/design o ADR",
    weight: 8,
    hint: "SDD (arquitectura) y/o ADRs con contexto, decision y consecuencias.",
    test: (p) => has(p, /(^|\/)docs\/(design|adr)\//i),
  },
  {
    id: "plan",
    label: "docs/plans",
    weight: 6,
    hint: "Plan por fases con QA final y Definition of Done.",
    test: (p) => has(p, /(^|\/)docs\/plans\//i),
  },
  {
    id: "ci",
    label: "CI (.github/workflows)",
    weight: 10,
    hint: "Workflow de integracion continua: typecheck, lint, test y build.",
    test: (p) => has(p, /(^|\/)\.github\/workflows\/.+\.ya?ml$/i),
  },
  {
    id: "tests",
    label: "Tests",
    weight: 10,
    hint: "Suite de tests (tests/, test/, __tests__/ o *.test.*). Minimo 4 categorias (P2).",
    test: (p) =>
      has(p, /(^|\/)(tests?|__tests__)\//i) ||
      has(p, /\.(test|spec)\.[cm]?[jt]sx?$/i) ||
      has(p, /(^|\/)test_.+\.py$/i),
  },
  {
    id: "security",
    label: "SECURITY / .env.example",
    weight: 8,
    hint: "SECURITY.md y/o .env.example: cero secretos en git y politica de reporte.",
    test: (p) => has(p, /(^|\/)security\.md$/i) || has(p, /(^|\/)\.env\.example$/i),
  },
  {
    id: "deploy",
    label: "Deploy config",
    weight: 6,
    hint: "Config de despliegue (vercel.json, netlify.toml, wrangler.toml, Dockerfile...).",
    test: (p) =>
      has(
        p,
        /(^|\/)(vercel\.json|netlify\.toml|wrangler\.toml|railway\.json|firebase\.json|dockerfile)$/i,
      ),
  },
  {
    id: "build",
    label: "Build config",
    weight: 6,
    hint: "package.json / pyproject.toml con scripts de build-dev-test.",
    test: (p) => has(p, /(^|\/)(package\.json|pyproject\.toml|go\.mod|cargo\.toml)$/i),
  },
];

export function gradeOf(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function scoreRepo(meta: RepoMeta, paths: string[]): AuditResult {
  const checks: AuditCheck[] = CHECK_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    weight: def.weight,
    passed: def.test(paths),
    hint: def.hint,
  }));

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = Math.round((earned / total) * 100);
  const missing = checks.filter((c) => !c.passed);

  return {
    repo: meta.fullName,
    description: meta.description ?? "",
    stars: meta.stars,
    language: meta.language,
    archived: meta.archived,
    pushedAt: meta.pushedAt,
    license: meta.license,
    score,
    grade: gradeOf(score),
    passed: checks.length - missing.length,
    total: checks.length,
    checks,
    missing,
    recommendations: missing.slice(0, 6).map((c) => c.hint),
  };
}
