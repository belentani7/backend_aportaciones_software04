import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { GITHUB_PROFILE } from '@/data/github-repos'

export const dynamic = 'force-dynamic'

export interface GithubRepoDTO {
  name: string
  description: string
  language: string | null
  category: string
  monetization: string
  relatedPath: number | null
}

export async function GET() {
  try {
    const rows = await db.githubRepo.findMany({ orderBy: { name: 'asc' } })
    const repos: GithubRepoDTO[] = rows.map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      category: r.category,
      monetization: r.monetization,
      relatedPath: r.relatedPath,
    }))
    const byCategory: Record<string, number> = {}
    for (const r of repos) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1
    const withMonetization = repos.filter((r) => r.relatedPath !== null).length
    return NextResponse.json({
      profile: GITHUB_PROFILE,
      repos,
      total: repos.length,
      withMonetization,
      byCategory,
    })
  } catch (e) {
    console.error('GET /api/github', e)
    return NextResponse.json(
      { error: 'No se pudo cargar el análisis del perfil' },
      { status: 500 }
    )
  }
}
