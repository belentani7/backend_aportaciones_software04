import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export interface IncomePlatformDTO {
  name: string
  url: string
  fee: string
  note: string
}

export interface IncomeEvidenceDTO {
  source: string
  url: string
  claim: string
}

export interface IncomePathDTO {
  id: string
  code: number
  title: string
  category: string
  summary: string
  realRate: string
  rateMinPerHour: number
  rateMaxPerHour: number
  platforms: IncomePlatformDTO[]
  evidence: IncomeEvidenceDTO[]
  matchRepos: string[]
  timeToFirstIncome: string
  effort: string
  demandLevel: string
  steps: string[]
}

function parseArray<T>(raw: string, fallback: T[]): T[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as T[]) : fallback
  } catch {
    return fallback
  }
}

export async function GET() {
  try {
    const rows = await db.incomePath.findMany({ orderBy: { code: 'asc' } })
    const items: IncomePathDTO[] = rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      category: r.category,
      summary: r.summary,
      realRate: r.realRate,
      rateMinPerHour: r.rateMinPerHour,
      rateMaxPerHour: r.rateMaxPerHour,
      platforms: parseArray<IncomePlatformDTO>(r.platforms, []),
      evidence: parseArray<IncomeEvidenceDTO>(r.evidence, []),
      matchRepos: parseArray<string>(r.matchRepos, []),
      timeToFirstIncome: r.timeToFirstIncome,
      effort: r.effort,
      demandLevel: r.demandLevel,
      steps: parseArray<string>(r.steps, []),
    }))
    return NextResponse.json({ items, total: items.length })
  } catch (e) {
    console.error('GET /api/income', e)
    return NextResponse.json(
      { error: 'No se pudieron cargar las rutas de ingreso' },
      { status: 500 }
    )
  }
}
