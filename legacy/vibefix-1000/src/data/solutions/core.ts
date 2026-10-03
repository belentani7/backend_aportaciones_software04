/**
 * VibeFix 1000 — núcleo de datos
 * 100 arquetipos de problema real × 10 combos herramienta+entorno = 1000 soluciones.
 * Las quejas provienen de fuentes públicas reales (2024-2026): GitHub Issues,
 * Reddit (r/ClaudeAI, r/cursor), Hacker News, encuesta Stack Overflow 2025,
 * estudio METR y el paper arXiv 2509.19056 "Vibe Coding in Practice".
 */

export type DomainKey =
  | 'contexto'
  | 'alucinaciones'
  | 'entorno'
  | 'git'
  | 'despliegue'
  | 'seguridad'
  | 'rendimiento'
  | 'costes'
  | 'colaboracion'
  | 'pruebas'

export type Severity = 'baja' | 'media' | 'alta' | 'critica'

export interface Archetype {
  id: string
  domain: DomainKey
  title: string
  problem: string
  rootCause: string
  steps: string[]
  codeFix: string
  prevention: string
  tags: string[]
  severity: Severity
  frequency: number
  source: string
}

export interface SolutionSeed {
  code: number
  title: string
  problem: string
  category: DomainKey
  tool: string
  environment: string
  severity: Severity
  frequency: number
  source: string
  rootCause: string
  steps: string[]
  codeFix: string
  prevention: string
  tags: string[]
}

export const DOMAINS: { key: DomainKey; label: string }[] = [
  { key: 'contexto', label: 'Contexto y memoria' },
  { key: 'alucinaciones', label: 'Alucinaciones de API' },
  { key: 'entorno', label: 'Config. y entorno' },
  { key: 'git', label: 'Git y versionado' },
  { key: 'despliegue', label: 'Despliegue y prod.' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'rendimiento', label: 'Rendimiento' },
  { key: 'costes', label: 'Costes y límites' },
  { key: 'colaboracion', label: 'Colaboración humano-IA' },
  { key: 'pruebas', label: 'Pruebas y calidad' },
]

export const TOOLS = [
  'Claude Code',
  'GitHub Copilot',
  'Cursor',
  'Windsurf',
  'Aider',
  'Codex CLI',
  'Gemini CLI',
  'Replit Agent',
  'Bolt / Lovable',
  'Devin',
] as const

export const ENVIRONMENTS = [
  'monorepo',
  'código legacy',
  'proyecto nuevo',
  'serverless',
  'app móvil',
  'data / ML',
  'empresa corporativa',
  'solo dev',
  'equipo distribuido',
  'open source',
] as const

export const SEVERITIES: Severity[] = ['baja', 'media', 'alta', 'critica']

/**
 * Consejos reales por herramienta (pool de 5 por herramienta).
 * Cada solución recibe uno rotando de forma determinista.
 */
export const TOOL_TIPS: Record<string, string[]> = {
  'Claude Code': [
    'En Claude Code, entra en Plan Mode (Shift+Tab ×2) antes de tocar código y aprueba el plan paso a paso; evita --dangerously-skip-permissions fuera de sandboxes.',
    'En Claude Code, usa /compact solo al ~75% de contexto y pide explícitamente que se conserven el plan y las decisiones, no la conversación completa.',
    'En Claude Code, delega las búsquedas pesadas a subagentes Task (tipo Explore) para que no ensucien tu ventana de contexto principal; vigila /context.',
    'En Claude Code, instalarráiles con hooks (PreToolUse/PostToolUse) que bloqueen edits fuera de ruta o comandos peligrosos como rm -rf o force push.',
    'En Claude Code, retoma sesiones con claude --resume en vez de repetir contexto cada día, y ancla las notas permanentes en CLAUDE.md.',
  ],
  'GitHub Copilot': [
    'En Copilot, usa el modo ask para entender y el modo edit/agent para cambiar; ancla contexto con @workspace o #file en lugar de pegar código a mano.',
    'En Copilot, crea .github/copilot-instructions.md con convenciones y prohibiciones del repo: se inyecta en cada chat y reduce drásticamente las alucinaciones de estilo.',
    'En Copilot, define prompt files reutilizables en .github/prompts para tareas recurrentes (migraciones, review, generación de tests).',
    'En Copilot, elige modelo en el selector: uno rápido para tareas triviales y uno potente para arquitectura; así controlas coste y latencia.',
    'En Copilot, revisa cada diff en el editor antes de aceptar; si no vas a revisar, desactiva la auto-aplicación del modo agent.',
  ],
  Cursor: [
    'En Cursor, define reglas por proyecto en .cursor/rules (MDs con frontmatter) y acota contexto con @codebase, @files o @folders.',
    'En Cursor, aprovecha los checkpoints del modo Agent/Composer para revertir iteraciones malas sin perder el historial de la sesión.',
    'En Cursor, activa Bugbot o pide una review del diff antes del commit; la revisión integrada detecta regresiones que el propio agente introdujo.',
    'En Cursor, usa el modo plan (Cmd+. → plan) para cualquier tarea de más de 3 archivos y aprueba el plan antes de ejecutar.',
    'En Cursor, excluye node_modules, builds, .env y secretos del indexado (@codebase ignores) para evitar tanto ruido como fugas.',
  ],
  Windsurf: [
    'En Windsurf, cura Cascade Memories (auto-memories + rules) para persistir decisiones y evitar re-explicar el proyecto en cada sesión.',
    'En Windsurf, escribe .windsurfrules con convenciones y verbos prohibidos (p. ej. "no tocar infra", "no regenerar lockfiles").',
    'En Windsurf, revisa los steps de Cascade uno a uno antes de "Accept All"; cada step es reversible y aceptar en bloque es cómo se cuelan regresiones.',
  ],
  Aider: [
    'En Aider, controla el contexto con /add y /drop: solo los archivos estrictamente necesarios; el repo-map hace el resto.',
    'En Aider, ejecuta /run <cmd> tras cada cambio para que el modelo vea el error real y lo corrija en el mismo turno en lugar de inventar.',
    'En Aider, desactiva --auto-commits y revisa el diff antes de /commit; usa --attribute para dejar trazabilidad de coautoría IA.',
  ],
  'Codex CLI': [
    'En Codex CLI, define AGENTS.md en la raíz del repo con convenciones, comandos de test/build y zonas vetadas.',
    'En Codex CLI, usa el modo de aprobación por pasos (suggest) para flujo interactivo; full-auto solo dentro de sandbox aislado.',
    'En Codex CLI, sandboxea la red cuando el agente no necesite instalar dependencias nuevas: reduce tanto riesgo como gasto en retrys.',
  ],
  'Gemini CLI': [
    'En Gemini CLI, pon convenciones en GEMINI.md y usa checkpoints para revertir cambios no deseados.',
    'En Gemini CLI, aprovecha la ventana de 1M tokens para inyectar documentación completa de las APIs que usa el proyecto: menos alucinaciones de firma.',
    'En Gemini CLI, vigila /stats y /memory para saber qué hay en contexto y cuánto consume cada turno.',
  ],
  'Replit Agent': [
    'En Replit Agent, crea checkpoint nombrado antes de cada fase grande; el rollback por hito es tu seguro de vida.',
    'En Replit Agent, pide planes por fases (MVP primero) y saca DB, secrets e infra del alcance declarado del agente.',
    'En Replit Agent, sincroniza con GitHub desde el día 1: el historial real debe vivir fuera de la plataforma.',
  ],
  'Bolt / Lovable': [
    'En Bolt/Lovable, divide el mega-prompt en fases (estructura → UI → lógica → integración); un solo prompt gigante produce spaghetti no revisable.',
    'En Bolt/Lovable, conecta GitHub y despliega a producción real temprano; itera sobre PRs revisables, no sobre un preview eterno.',
    'En Bolt/Lovable, revisa la pestaña de cambios (diff) antes de aceptar y pide rollback inmediato si la iteración degradó la UI o la lógica.',
  ],
  Devin: [
    'En Devin, exige interactive plan y aprueba hito a hito antes de dejarle ejecutar; el plan aprobado es tu contrato.',
    'En Devin, acota cada sesión a un objetivo verificable; sesiones abiertas de "mejora el proyecto" devuelven PRs de miles de líneas.',
    'En Devin, conecta CI real y exige que corrija el pipeline en la misma sesión antes de abrir el PR.',
  ],
}

/**
 * Consejos reales por entorno (pool de 3 por entorno).
 */
export const ENV_TIPS: Record<string, string[]> = {
  monorepo: [
    'En monorepo, limita el alcance con rutas concretas (apps/…, packages/…) y mantén reglas del agente por subdirectorio.',
    'En monorepo, usa los cachés/generadores del toolchain (Nx, Turbo) y pide al agente que ejecute solo las tareas del package afectado.',
    'En monorepo, prohíbe al agente tocar packages compartidos sin actualizar lockfiles y versiones de todos los consumidores.',
  ],
  'código legacy': [
    'En legacy, pide al agente que primero lea y explique el módulo afectado y sus tests antes de proponer un solo cambio.',
    'En legacy, refactoriza en pasos pequeños rodeados de tests de caracterización (golden master) para detectar regresiones silenciosas.',
    'En legacy, documenta las peculiaridades heredadas ("este hack existe porque…") en comentarios para que el agente no las "limpie".',
  ],
  'proyecto nuevo': [
    'En proyecto nuevo, aprueba primero estructura de carpetas y stack, y consígnalo en un ARCHITECTURE.md que el agente deba respetar.',
    'En proyecto nuevo, instala linter/formatter/CI desde el primer commit para que todo cambio del agente llegue ya validado.',
    'En proyecto nuevo, pide commits atómicos por feature para poder revisar y revertir con precisión quirúrgica.',
  ],
  serverless: [
    'En serverless, verifica límites del runtime objetivo (tiempo, memoria, payload) antes de aceptar código generado.',
    'En serverless, despliega a un preview real temprano: local nunca replica cold starts, permisos IAM ni timeouts.',
    'En serverless, mantén funciones pequeñas y sin estado en memoria; externaliza caché a Redis o a la base de datos.',
  ],
  'app móvil': [
    'En móvil, exige build real (simulador/emulador) tras cada cambio: código que "compila" puede fallar en permisos o ciclo de vida.',
    'En móvil, documenta permisos y capacidades (cámara, push, storage) en un manifiesto de referencia que el agente deba mantener.',
    'En móvil, prueba siempre en la versión mínima de SO soportada, no solo en el emulador más moderno.',
  ],
  'data / ML': [
    'En data/ML, fija seeds y versiona datasets y parámetros (DVC o similar) para que los resultados del agente sean reproducibles.',
    'En data/ML, pide validación de esquemas (pandera, great-expectations) en cada transformación que genere el agente.',
    'En data/ML, separa código de experimentación de código de producción; el agente no toca pipelines de prod sin revisión humana.',
  ],
  'empresa corporativa': [
    'En entornos corporativos, respeta el SSO/IdP interno: prohíbe al agente inventar auth propia o duplicar identidades.',
    'En entornos corporativos, convierte el checklist de seguridad/compliance interno en reglas del agente (PII, logging, retención).',
    'En entornos corporativos, registra cada cambio del agente en el ticket correspondiente para trazabilidad y auditoría.',
  ],
  'solo dev': [
    'Si trabajas solo, sé tu propio reviewer: abre PR aunque hagas merge directo y revisa el diff con calma al día siguiente.',
    'Si trabajas solo, mantén un ADR ligero (decisiones y porqués) para que tu yo del futuro —y el agente— entiendan el código.',
    'Si trabajas solo, agenda una revisión semanal de la deuda técnica que el agente ha ido dejando sembrada.',
  ],
  'equipo distribuido': [
    'En equipo, todo cambio del agente pasa por PR con review humana obligatoria; desactiva merges sin aprobación.',
    'En equipo, comparte las reglas del agente (CLAUDE.md, copilot-instructions.md) dentro del repo para un estilo coherente entre personas.',
    'En equipo, etiqueta los commits asistidos por IA para métricas honestas de productividad y trazabilidad.',
  ],
  'open source': [
    'En open source, lee CONTRIBUTING.md primero y pídeselo al agente antes de proponer cambios públicos.',
    'En open source, abre issue con repro mínimo antes del PR: la mayoría de maintainers rechaza PRs sin issue asociado.',
    'En open source, firma commits y cumple DCO/CLA; los bots de CI del proyecto tienen la última palabra.',
  ],
}

/** Fuentes reales de donde provienen las quejas */
export const SOURCES = [
  'GitHub Issues · anthropics/claude-code',
  'r/ClaudeAI (Reddit)',
  'GitHub Community · Copilot Discussions',
  'r/cursor (Reddit)',
  'Encuesta Stack Overflow 2025',
  'Hacker News · hilo "The problem with vibe coding"',
  'Estudio METR · jul 2025',
  'GitHub Issues · Aider',
  'Discusiones Vercel / Next.js',
  'arXiv 2509.19056 · Vibe Coding in Practice',
]
