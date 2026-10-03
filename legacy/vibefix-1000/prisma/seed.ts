/**
 * Seed de VibeFix 1000.
 * Uso: bun prisma/seed.ts
 * Borra y regenera las 1000 soluciones + análisis semanales iniciales.
 */
import { PrismaClient } from '@prisma/client'
import { buildSolutions } from '../src/data/solutions'
import { REPOS } from '../src/data/repos'
import { WEEKLY_SEEDS } from '../src/data/weekly-seed'
import { INCOME_PATHS } from '../src/data/income-paths'
import { GITHUB_REPOS } from '../src/data/github-repos'

const db = new PrismaClient()

async function main() {
  const solutions = buildSolutions()
  console.log(`Generadas ${solutions.length} soluciones desde ${new Set(solutions.map((s) => s.title)).size} arquetipos reales.`)

  await db.solution.deleteMany()
  // insertar en lotes para no agotar los límites de parámetros de SQLite
  const BATCH = 100
  for (let i = 0; i < solutions.length; i += BATCH) {
    await db.solution.createMany({
      data: solutions.slice(i, i + BATCH).map((s) => ({
        code: s.code,
        title: s.title,
        problem: s.problem,
        category: s.category,
        tool: s.tool,
        environment: s.environment,
        severity: s.severity,
        frequency: s.frequency,
        source: s.source,
        rootCause: s.rootCause,
        steps: JSON.stringify(s.steps),
        codeFix: s.codeFix,
        prevention: s.prevention,
        tags: JSON.stringify(s.tags),
      })),
    })
  }
  console.log(`Insertadas ${await db.solution.count()} soluciones en la DB.`)

  const existingWeekly = await db.weeklyAnalysis.count()
  if (existingWeekly === 0) {
    for (const w of WEEKLY_SEEDS) {
      await db.weeklyAnalysis.create({
        data: {
          weekLabel: w.weekLabel,
          title: w.title,
          trendSummary: w.trendSummary,
          keyFindings: JSON.stringify(w.keyFindings),
          proposedSolution: JSON.stringify(w.proposedSolution),
          skillIdea: w.skillIdea,
          reposStudied: JSON.stringify(w.reposStudied),
        },
      })
    }
    console.log(`Insertados ${WEEKLY_SEEDS.length} análisis semanales iniciales.`)
  } else {
    console.log(`Análisis semanales ya presentes (${existingWeekly}), no se tocan.`)
  }

  console.log(`Repos curadas disponibles: ${REPOS.length} (servidas desde src/data/repos.ts).`)

  // Rutas de ingreso con datos reales (se regeneran siempre para reflejar investigación actualizada)
  await db.incomePath.deleteMany()
  for (const p of INCOME_PATHS) {
    await db.incomePath.create({
      data: {
        code: p.code,
        title: p.title,
        category: p.category,
        summary: p.summary,
        realRate: p.realRate,
        rateMinPerHour: p.rateMinPerHour,
        rateMaxPerHour: p.rateMaxPerHour,
        platforms: JSON.stringify(p.platforms),
        evidence: JSON.stringify(p.evidence),
        matchRepos: JSON.stringify(p.matchRepos),
        timeToFirstIncome: p.timeToFirstIncome,
        effort: p.effort,
        demandLevel: p.demandLevel,
        steps: JSON.stringify(p.steps),
      },
    })
  }
  console.log(`Insertadas ${await db.incomePath.count()} rutas de ingreso con fuentes reales.`)

  // Repos reales del perfil belentani7 (se regeneran siempre)
  await db.githubRepo.deleteMany()
  for (const r of GITHUB_REPOS) {
    await db.githubRepo.create({
      data: {
        name: r.name,
        description: r.description,
        language: r.language,
        category: r.category,
        monetization: r.monetization,
        relatedPath: r.relatedPath,
      },
    })
  }
  console.log(`Insertados ${await db.githubRepo.count()} repos reales del perfil.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
