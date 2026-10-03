import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { DOMAINS } from '@/data/solutions'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function isoWeekLabel(d: Date): string {
  // ISO 8601: semana del año (lunes = inicio)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `Semana ${String(week).padStart(2, '0')} · ${date.getUTCFullYear()}`
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('La IA no devolvió JSON')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function isStrArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

export async function POST() {
  try {
    // 0. Rate-limit ligero: no regenerar si el último tiene <20h
    const latest = await db.weeklyAnalysis.findFirst({
      orderBy: { generatedAt: 'desc' },
    })
    if (latest && Date.now() - latest.generatedAt.getTime() < 20 * 3600 * 1000) {
      return NextResponse.json(
        { error: 'El análisis de esta semana ya existe. Vuelve la próxima semana.' },
        { status: 429 }
      )
    }

    // 1. Estadísticas reales de la base local
    const [byCat, byTool, total] = await Promise.all([
      db.solution.groupBy({ by: ['category'], _count: { _all: true } }),
      db.solution.groupBy({ by: ['tool'], _count: { _all: true } }),
      db.solution.count(),
    ])
    const labelFor = (key: string) => DOMAINS.find((d) => d.key === key)?.label ?? key
    const topCats = byCat
      .sort((a, b) => b._count._all - a._count._all)
      .map((c) => `${labelFor(c.category)} (${c._count._all})`)
      .join(', ')
    const toolsList = byTool.map((t) => t.tool).join(', ')

    // 2. Investigación web real de las últimas noticias/quejas
    let searchContext = '(sin resultados de búsqueda disponibles)'
    try {
      const zai0 = await ZAI.create()
      const results = (await zai0.functions.invoke('web_search', {
        query: 'AI coding agents complaints news Claude Copilot vibe coding limits',
        num: 8,
        recency_days: 10,
      })) as { name: string; snippet: string; host_name: string; date?: string }[]
      if (Array.isArray(results) && results.length > 0) {
        searchContext = results
          .map(
            (r, i) =>
              `${i + 1}. [${r.host_name}${r.date ? ` · ${r.date}` : ''}] ${r.name}\n   ${String(r.snippet).slice(0, 300)}`
          )
          .join('\n')
      }
    } catch (e) {
      console.error('web_search falló, se continúa sin él', e)
    }

    // 3. Generación del análisis con el LLM
    const zai = await ZAI.create()
    const system = [
      'Eres un analista senior de la comunidad de desarrollo asistido por IA (vibe coding).',
      'Analizas quejas reales (GitHub Issues, Reddit, Hacker News, encuestas) y propones soluciones accionables.',
      'Respondes SOLO con un objeto JSON válido, sin texto fuera del JSON, en ESPAÑOL.',
      'Esquema exacto:',
      '{ "title": string, "trendSummary": string (2-4 frases),',
      '  "keyFindings": string[] (4-6 hallazgos concretos, con números si los hay),',
      '  "proposedSolution": { "name": string, "description": string, "steps": string[] (4 pasos accionables) },',
      '  "skillIdea": string (idea de skill/herramienta automatizable),',
      '  "reposStudied": [ { "name": string, "description": string, "why": string } ] (2-3 repos reales y relevantes) }',
    ].join('\n')

    const user = [
      `Base local: ${total} soluciones catalogadas en dominios: ${topCats}.`,
      `Herramientas cubiertas: ${toolsList}.`,
      '',
      'Resultados de búsqueda web (últimos ~10 días):',
      searchContext,
      '',
      'Genera el análisis semanal de ESTA semana: tendencias, hallazgos con datos de la búsqueda,',
      'una solución propuesta concreta a un problema reciente, una idea de skill, y 2-3 repos reales',
      'de GitHub que merezcan estudiarse esta semana (pueden ser nuevos o cambios recientes de conocidos).',
      'No inventes URLs. Sé específico y cuantitativo donde puedas.',
    ].join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: user },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw || !raw.trim()) throw new Error('Respuesta vacía del LLM')
    const parsed = extractJson(raw) as Record<string, unknown>

    // 4. Validación defensiva del JSON
    const title = typeof parsed.title === 'string' ? parsed.title : 'Análisis semanal'
    const trendSummary =
      typeof parsed.trendSummary === 'string'
        ? parsed.trendSummary
        : 'Análisis generado automáticamente.'
    const keyFindings = isStrArray(parsed.keyFindings) ? parsed.keyFindings : []
    const sol = (parsed.proposedSolution ?? {}) as Record<string, unknown>
    const proposedSolution = {
      name: typeof sol.name === 'string' ? sol.name : 'Solución propuesta',
      description: typeof sol.description === 'string' ? sol.description : '',
      steps: isStrArray(sol.steps) ? sol.steps : [],
    }
    const skillIdea =
      typeof parsed.skillIdea === 'string'
        ? parsed.skillIdea
        : 'Sin idea de skill esta semana.'
    const reposRaw = Array.isArray(parsed.reposStudied) ? parsed.reposStudied : []
    const reposStudied = reposRaw
      .filter(
        (r): r is { name: string; description: string; why: string } =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as Record<string, unknown>).name === 'string'
      )
      .map((r) => ({
        name: String(r.name),
        description:
          typeof r.description === 'string' ? r.description : '',
        why: typeof r.why === 'string' ? r.why : '',
      }))

    const created = await db.weeklyAnalysis.create({
      data: {
        weekLabel: isoWeekLabel(new Date()),
        title,
        trendSummary,
        keyFindings: JSON.stringify(keyFindings),
        proposedSolution: JSON.stringify(proposedSolution),
        skillIdea,
        reposStudied: JSON.stringify(reposStudied),
      },
    })

    return NextResponse.json({
      item: {
        id: created.id,
        weekLabel: created.weekLabel,
        title: created.title,
        trendSummary: created.trendSummary,
        keyFindings,
        proposedSolution,
        skillIdea,
        reposStudied,
        generatedAt: created.generatedAt.toISOString(),
      },
      nextDue: new Date(created.generatedAt.getTime() + WEEK_MS).toISOString(),
    })
  } catch (e) {
    console.error('POST /api/weekly/generate', e)
    return NextResponse.json(
      {
        error:
          'No se pudo generar el análisis semanal. Revisa los logs e inténtalo de nuevo.',
      },
      { status: 500 }
    )
  }
}
