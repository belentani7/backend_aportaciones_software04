import {
  DOMAINS,
  ENVIRONMENTS,
  ENV_TIPS,
  SOURCES,
  TOOLS,
  TOOL_TIPS,
  type Archetype,
  type DomainKey,
  type SolutionSeed,
} from './core'
import { ALUC_ARCHETYPES, CTX_ARCHETYPES } from './arch-contexto-alucinaciones'
import { ENT_ARCHETYPES, GIT_ARCHETYPES } from './arch-entorno-git'
import { DEP_ARCHETYPES, SEG_ARCHETYPES } from './arch-despliegue-seguridad'
import { COST_ARCHETYPES, PERF_ARCHETYPES } from './arch-rendimiento-costes'
import { COLAB_ARCHETYPES, TEST_ARCHETYPES } from './arch-colaboracion-pruebas'

export const ARCHETYPES: Archetype[] = [
  ...CTX_ARCHETYPES,
  ...ALUC_ARCHETYPES,
  ...ENT_ARCHETYPES,
  ...GIT_ARCHETYPES,
  ...DEP_ARCHETYPES,
  ...SEG_ARCHETYPES,
  ...PERF_ARCHETYPES,
  ...COST_ARCHETYPES,
  ...COLAB_ARCHETYPES,
  ...TEST_ARCHETYPES,
]

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

/**
 * Genera las 1000 soluciones: cada arquetipo real (100) se resuelve para
 * 10 combos deterministas de herramienta + entorno. Cada variante añade
 * un consejo real de herramienta y uno de entorno a los pasos base.
 */
export function buildSolutions(): SolutionSeed[] {
  const solutions: SolutionSeed[] = []
  let code = 0

  for (const { key } of DOMAINS) {
    const archetypes = ARCHETYPES.filter((a) => a.domain === key)
    for (let a = 0; a < archetypes.length; a++) {
      const arch = archetypes[a]
      for (let t = 0; t < TOOLS.length; t++) {
        const tool = TOOLS[t]
        const env = ENVIRONMENTS[(a + t) % ENVIRONMENTS.length]
        const toolTip = TOOL_TIPS[tool][(a + t) % TOOL_TIPS[tool].length]
        const envTip = ENV_TIPS[env][(a + t) % ENV_TIPS[env].length]
        code += 1
        solutions.push({
          code,
          title: arch.title,
          problem: arch.problem,
          category: arch.domain as DomainKey,
          tool,
          environment: env,
          severity: arch.severity,
          frequency: clamp(arch.frequency + ((a * 7 + t * 3) % 9) - 4, 15, 95),
          source: arch.source ?? SOURCES[code % SOURCES.length],
          rootCause: arch.rootCause,
          steps: [...arch.steps, toolTip, envTip],
          codeFix: arch.codeFix,
          prevention: arch.prevention,
          tags: [...arch.tags, tool, env],
        })
      }
    }
  }

  return solutions
}

export * from './core'
