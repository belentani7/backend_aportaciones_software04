import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface SolutionDTO {
  id: string
  code: number
  title: string
  problem: string
  category: string
  tool: string
  environment: string
  severity: string
  frequency: number
  source: string
  rootCause: string
  steps: string[]
  codeFix: string
  prevention: string
  tags: string[]
}

function toDTO(row: {
  id: string
  code: number
  title: string
  problem: string
  category: string
  tool: string
  environment: string
  severity: string
  frequency: number
  source: string
  rootCause: string
  steps: string
  codeFix: string
  prevention: string
  tags: string
}): SolutionDTO {
  let steps: string[] = []
  let tags: string[] = []
  try {
    steps = JSON.parse(row.steps)
  } catch {
    steps = []
  }
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return { ...row, steps, tags }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? '').trim()
    const category = (sp.get('category') ?? '').trim()
    const tool = (sp.get('tool') ?? '').trim()
    const severity = (sp.get('severity') ?? '').trim()
    const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      48,
      Math.max(1, Number.parseInt(sp.get('pageSize') ?? '9', 10) || 9)
    )

    const where: Prisma.SolutionWhereInput = {}
    if (category) where.category = category
    if (tool) where.tool = tool
    if (severity) where.severity = severity
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { problem: { contains: q } },
        { rootCause: { contains: q } },
        { prevention: { contains: q } },
        { tags: { contains: q } },
        { tool: { contains: q } },
        { environment: { contains: q } },
      ]
    }

    const [rows, total] = await Promise.all([
      db.solution.findMany({
        where,
        orderBy: { code: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.solution.count({ where }),
    ])

    return NextResponse.json({
      items: rows.map(toDTO),
      total,
      page,
      pageSize,
    })
  } catch (e) {
    console.error('GET /api/solutions', e)
    return NextResponse.json(
      { error: 'No se pudieron cargar las soluciones' },
      { status: 500 }
    )
  }
}
