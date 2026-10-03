import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function parseItem(row: {
  id: string
  weekLabel: string
  title: string
  trendSummary: string
  keyFindings: string
  proposedSolution: string
  skillIdea: string
  reposStudied: string
  generatedAt: Date
}) {
  let keyFindings: string[] = []
  let proposedSolution: unknown = { name: '', description: '', steps: [] }
  let reposStudied: unknown = []
  try {
    keyFindings = JSON.parse(row.keyFindings)
  } catch {
    keyFindings = []
  }
  try {
    proposedSolution = JSON.parse(row.proposedSolution)
  } catch {
    proposedSolution = { name: '', description: '', steps: [] }
  }
  try {
    reposStudied = JSON.parse(row.reposStudied)
  } catch {
    reposStudied = []
  }
  return {
    id: row.id,
    weekLabel: row.weekLabel,
    title: row.title,
    trendSummary: row.trendSummary,
    keyFindings,
    proposedSolution,
    skillIdea: row.skillIdea,
    reposStudied,
    generatedAt: row.generatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const rows = await db.weeklyAnalysis.findMany({
      orderBy: { generatedAt: 'desc' },
    })
    const items = rows.map(parseItem)
    const latest = rows[0]
    const dueForNew =
      !latest || Date.now() - latest.generatedAt.getTime() > WEEK_MS
    return NextResponse.json({ items, dueForNew })
  } catch (e) {
    console.error('GET /api/weekly', e)
    return NextResponse.json(
      { error: 'No se pudo cargar el análisis semanal' },
      { status: 500 }
    )
  }
}
