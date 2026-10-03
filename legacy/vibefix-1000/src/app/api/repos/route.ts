import { NextResponse } from 'next/server'
import { REPOS } from '@/data/repos'

export async function GET() {
  return NextResponse.json({ items: REPOS })
}
