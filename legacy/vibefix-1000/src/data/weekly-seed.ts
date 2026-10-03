/**
 * Análisis semanales iniciales (redactados a partir de la investigación real:
 * METR jul-2025, encuesta Stack Overflow 2025, BBC 2025 sobre límites de
 * Claude Code, y paper arXiv 2509.19056). Los siguientes los genera la IA.
 */
export interface WeeklySeed {
  weekLabel: string
  title: string
  trendSummary: string
  keyFindings: string[]
  proposedSolution: { name: string; description: string; steps: string[] }
  skillIdea: string
  reposStudied: { name: string; description: string; why: string }[]
}

export const WEEKLY_SEEDS: WeeklySeed[] = [
  {
    weekLabel: 'Semana 06 · 2026',
    title: 'La paradoja de la percepción: 19% más lento sintiéndote un 24% más rápido',
    trendSummary:
      'La evidencia de esta semana vuelve a golpear al vibe coding optimista. El estudio METR midió a desarrolladores experimentados con IA y encontró un 19% de ralentización real frente a una percepción de +24% de velocidad: una brecha de 43 puntos entre lo que sentimos y lo que ocurre. La encuesta de Stack Overflow 2025 lo explica en parte: el 46% de los devs desconfía de la precisión de la IA y el 66% reporta perder tiempo depurando código "casi correcto". Mientras tanto, la BBC recogía quejas masivas de usuarios de Claude Code agotando sus límites "más rápido de lo esperado". La comunidad está descubriendo que el cuello de botella no es escribir código, sino verificarlo y dirigirlo.',
    keyFindings: [
      'METR (jul 2025): los devs con IA tardan un 19% MÁS en completar issues, aunque creen ser un 24% más rápidos — brecha de percepción de 43 puntos.',
      'Stack Overflow 2025: el 46% de desarrolladores desconfía activamente de la precisión de la IA; solo el 3% confía plenamente.',
      'El 66% de los devs reporta frustración por pasar más tiempo corrigiendo código de IA "casi correcto".',
      'Usuarios de Claude Code reportan agotar límites semanales mucho antes de lo previsto (BBC, 2025): el consumo de contexto, no los mensajes, es el driver.',
      'El paper arXiv 2509.19056 confirma que los riesgos del vibe coding se concentran en calidad, seguridad y mantenibilidad, no en velocidad.',
    ],
    proposedSolution: {
      name: 'Protocolo de Revisión Diferida (PRD)',
      description:
        'Un ritual de 15 minutos que ataca la brecha de percepción: cada bloque de trabajo del agente se cierra con una verificación humana estructurada en tres tiempos, convirtiendo la "sensación de velocidad" en evidencia medible.',
      steps: [
        'Checkpoint: commit antes de cada bloque del agente (3 segundos, salida barata garantizada).',
        'Verificación activa: corre los tests + lee el diff de las zonas críticas (auth, datos, pagos) — nunca auto-accept allí.',
        'Comprensión en 3 líneas: escribe qué hace, cómo y el trade-off. Si no puedes, no está revisado.',
        'Registro de evidencia: anota el tiempo real de la tarea vs lo estimado; a las 2 semanas revisa la brecha con datos propios.',
      ],
    },
    skillIdea:
      'Skill "perception-auditor": analiza tu historial de commits asistidos por IA y contrasta el tiempo estimado vs real por tipo de tarea, mostrando dónde tu percepción diverge más de la realidad.',
    reposStudied: [
      {
        name: 'All-Hands-AI/OpenHands',
        description: 'Plataforma abierta de agentes de software con arquitectura event-driven.',
        why: 'Su historial de eventos como fuente de verdad resuelve exactamente el drift de contexto que amplifica la brecha de percepción.',
      },
      {
        name: 'princeton-nlp/SWE-bench',
        description: 'Benchmark con issues reales y verificación por tests.',
        why: 'Medir antes de creer: la metodología que METR aplicó a humanos, aplicada a tu propio stack de agentes.',
      },
      {
        name: 'Aider-AI/aider',
        description: 'Pair-programmer con repo-map y commits atómicos.',
        why: 'Su disciplina de commits por hito es la implementación más simple del checkpoint del protocolo PRD.',
      },
    ],
  },
  {
    weekLabel: 'Semana 05 · 2026',
    title: 'La economía del contexto: por qué tu cuota se agota y tu seguridad se resiente',
    trendSummary:
      'Dos frentes convergen esta semana. Por un lado, la economía del contexto: los límites de Claude Code (reportados por BBC y GitHub Issues) y los análisis de Octomind muestran que el ~7% de usuarios intensivos agota límites en 15-30 minutos — el driver es el tamaño de contexto y las re-lecturas, no el número de tareas. Por otro, la seguridad: el mismo paper de vibe coding que documenta la velocidad documenta también las fugas — secretos hardcodeados, paquetes alucinados ("slopquatting") y RLS omitido son los tres incidentes más repetidos. La lección: el contexto es presupuesto financiero y de seguridad a la vez; gastarlo mal cuesta dinero hoy y vulnerabilidades mañana.',
    keyFindings: [
      'El ~7% de usuarios intensivos de Claude Code reporta límites agotados tras 15-30 min de uso intensivo (Octomind, 2025-2026).',
      'La causa dominante del gasto no es el número de tareas sino el tamaño de contexto: re-lecturas de archivos, logs y dumps.',
      '"Slopquatting": los paquetes alucinados por LLMs ya se explotan en la práctica vía typosquatting en registries públicos.',
      'Los tres incidentes de seguridad más frecuentes en código generado: secretos hardcodeados, inyección SQL por concatenación y RLS omitido.',
      'El enrutado por dificultad (modelo pequeño para lo trivial) reduce el coste mensual típicamente entre 30-60% sin perder calidad crítica.',
    ],
    proposedSolution: {
      name: 'Token Budget Guard',
      description:
        'Un guardarraíles operativo que convierte el contexto en presupuesto: límites de lectura por tarea, política de ignora-lo-generado y enrutado por dificultad, medidos con un registro de gasto por tarea.',
      steps: [
        'Ignora siempre dist/, .next/, dumps y lockfiles en la config de lectura del agente.',
        'Regla de lectura: archivos >500 líneas primero por índice (grep de símbolos), luego por rangos.',
        'Enruta lo trivial a modelo barato: commits, renames, docs, CSS; reserva el modelo grande para arquitectura y debugging.',
        'Registra el gasto por tarea (tokens aprox.) y revisa semanalmente las "comes-tokens" para cortarlas.',
      ],
    },
    skillIdea:
      'Skill "context-budgeter": hook que intercepta lecturas del agente, calcula el coste estimado en tokens antes de ejecutarlas y bloquea o trunca lo que supere el presupuesto de la tarea.',
    reposStudied: [
      {
        name: 'mem0ai/mem0',
        description: 'Capa de memoria persistente para agentes LLM.',
        why: 'Memoria entre sesiones = menos re-lecturas = menos gasto: el antídoto directo a la economía del contexto.',
      },
      {
        name: 'letta-ai/letta',
        description: 'MemGPT: memoria jerárquica self-editada para LLMs.',
        why: 'Su modelo core/archival de memoria es la arquitectura más avanzada para presupuestar contexto.',
      },
      {
        name: 'continuedev/continue',
        description: 'Asistente open-source con reglas por repo y modelos intercambiables.',
        why: 'Su hub de reglas demuestra el enrutado por dificultad en la práctica, agnóstico de proveedor.',
      },
    ],
  },
]
