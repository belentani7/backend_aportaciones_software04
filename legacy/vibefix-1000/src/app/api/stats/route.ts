import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DOMAINS } from '@/data/solutions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [total, avg, byCategoryRaw, byToolRaw, bySeverityRaw, byEnvRaw] =
      await Promise.all([
        db.solution.count(),
        db.solution.aggregate({ _avg: { frequency: true } }),
        db.solution.groupBy({ by: ['category'], _count: { _all: true } }),
        db.solution.groupBy({ by: ['tool'], _count: { _all: true } }),
        db.solution.groupBy({ by: ['severity'], _count: { _all: true } }),
        db.solution.groupBy({ by: ['environment'], _count: { _all: true } }),
      ])

    const labelFor = (key: string) =>
      DOMAINS.find((d) => d.key === key)?.label ?? key

    const byDomain = byCategoryRaw
      .map((r) => ({
        key: r.category,
        label: labelFor(r.category),
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count)

    const byTool = byToolRaw
      .map((r) => ({ name: r.tool, count: r._count._all }))
      .sort((a, b) => b.count - a.count)

    const order = ['critica', 'alta', 'media', 'baja']
    const bySeverity = bySeverityRaw
      .map((r) => ({ name: r.severity, count: r._count._all }))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))

    const byEnvironment = byEnvRaw
      .map((r) => ({ name: r.environment, count: r._count._all }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      total,
      byDomain,
      byTool,
      bySeverity,
      byEnvironment,
      avgFrequency: Math.round(avg._avg.frequency ?? 0),
    })
  } catch (e) {
    console.error('GET /api/stats', e)
    return NextResponse.json(
      { error: 'No se pudieron cargar las estadísticas' },
      { status: 500 }
    )
  }
}
