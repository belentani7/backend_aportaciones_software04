/**
 * Repos adelantadas que merecen estudio semanal.
 * Curadas a partir de investigación reciente (2024-2026): plataformas de
 * agentes, memoria, orquestación y benchmarking de código con IA.
 */
export interface RepoSeed {
  name: string
  url: string
  description: string
  why: string
  category: string
}

export const REPOS: RepoSeed[] = [
  {
    name: 'All-Hands-AI/OpenHands',
    url: 'https://github.com/All-Hands-AI/OpenHands',
    description:
      'Plataforma abierta de agentes de software (antes OpenDevin): agentes que escriben código, navegan y ejecutan con arquitectura event-driven.',
    why: 'Estudia su gestión de estado e historial de eventos: es la referencia abierta para resolver la pérdida de contexto en sesiones largas.',
    category: 'agentes',
  },
  {
    name: 'SWE-agent/SWE-agent',
    url: 'https://github.com/SWE-agent/SWE-agent',
    description:
      'Agente de Princeton que resuelve issues reales de GitHub; su línea de investigación es la "Agent-Computer Interface".',
    why: 'Demuestra que el diseño de las herramientas (no solo el modelo) decide la tasa de acierto: copia su patrón de interfaces minimales.',
    category: 'agentes',
  },
  {
    name: 'Aider-AI/aider',
    url: 'https://github.com/Aider-AI/aider',
    description:
      'Pair-programmer en terminal con repo-map, commits automáticos limpios y control fino del contexto por archivo.',
    why: 'El repo-map y su disciplina de git son el mejor ejemplo práctico de presupuesto de contexto y trazabilidad.',
    category: 'contexto',
  },
  {
    name: 'anthropics/claude-code',
    url: 'https://github.com/anthropics/claude-code',
    description:
      'CLI de agente de Anthropic: hooks, subagentes, CLAUDE.md y permisos granulares. Su repo de examples/docs es oro.',
    why: 'Los hooks (PreToolUse/PostToolUse) y los subagentes son los guardarraíles más completos disponibles hoy: implementables en tu flujo.',
    category: 'guardarraíles',
  },
  {
    name: 'mem0ai/mem0',
    url: 'https://github.com/mem0ai/mem0',
    description:
      'Capa de memoria persistente para agentes LLM: recuerda preferencias y hechos entre sesiones con recuperación por relevancia.',
    why: 'Ataca directamente el problema #1 (memoria entre sesiones): su modelo de memoria episódica vs semántica es transferible a tu stack.',
    category: 'memoria',
  },
  {
    name: 'letta-ai/letta',
    url: 'https://github.com/letta-ai/letta',
    description:
      'El proyecto MemGPT: LLMs con memoria jerárquica (core/archival) que gestionan su propio contexto como un sistema operativo.',
    why: 'La jerarquía de memoria self-editada es el patrón más avanzado contra la saturación y el drift de contexto.',
    category: 'memoria',
  },
  {
    name: 'langchain-ai/langgraph',
    url: 'https://github.com/langchain-ai/langgraph',
    description:
      'Orquestación de agentes como grafo de estados con checkpoints, persistencia y human-in-the-loop.',
    why: 'Sus checkpoints y estados explícitos son el antídoto contra el goal drift: el plan vive en el grafo, no en el chat.',
    category: 'orquestación',
  },
  {
    name: 'microsoft/autogen',
    url: 'https://github.com/microsoft/autogen',
    description:
      'Framework multi-agente de Microsoft con conversaciones entre agentes y aprobación humana integrada.',
    why: 'Sus patrones de human-in-the-loop y límites de conversación resuelven el descontrol de costes y alcance en flujos multi-agente.',
    category: 'orquestación',
  },
  {
    name: 'continuedev/continue',
    url: 'https://github.com/continuedev/continue',
    description:
      'Asistente de código open-source configurable: reglas por repo, modelos intercambiables, hub de bloques y reglas.',
    why: 'Su sistema de rules/blocks es un catálogo práctico de guardarraíles por repositorio, agnóstico del modelo.',
    category: 'guardarraíles',
  },
  {
    name: 'browser-use/browser-use',
    url: 'https://github.com/browser-use/browser-use',
    description:
      'Conecta agentes LLM con el navegador: navegación, formularios y extracción con visión.',
    why: 'Estudia sus defensas contra prompt injection (contenido web como dato): base para agentes que leen fuentes externas de forma segura.',
    category: 'seguridad',
  },
  {
    name: 'princeton-nlp/SWE-bench',
    url: 'https://github.com/princeton-nlp/SWE-bench',
    description:
      'Benchmark de ingeniería de software con issues reales de repos populares y tests de verificación.',
    why: 'La única forma honesta de saber si tu stack de agentes mejora: mide tu flujo con issues reales antes de creerte el hype.',
    category: 'benchmarking',
  },
  {
    name: 'x1xhlol/system-prompts-and-models-of-ai-tools',
    url: 'https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools',
    description:
      'Colección de system prompts y tool schemas reales de herramientas populares (Cursor, Devin, v0, Replit…).',
    why: 'Ingeniería inversa práctica: aprende cómo las herramientas comerciales escriben sus guardarraíles y adapta las técnicas a tus reglas.',
    category: 'guardarraíles',
  },
]
