import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

export interface TranslationDTO {
  id: string
  humanInput: string
  aiPrompt: string
  framework: {
    role: string
    context: string
    task: string
    constraints: string[]
    outputFormat: string
  }
  tier: string
  createdAt: string
}

function toDTO(row: {
  id: string
  humanInput: string
  aiPrompt: string
  framework: string
  tier: string
  createdAt: Date
}): TranslationDTO {
  let framework: TranslationDTO['framework'] = {
    role: '',
    context: '',
    task: '',
    constraints: [],
    outputFormat: '',
  }
  try {
    const parsed = JSON.parse(row.framework) as Record<string, unknown>
    framework = {
      role: typeof parsed.role === 'string' ? parsed.role : '',
      context: typeof parsed.context === 'string' ? parsed.context : '',
      task: typeof parsed.task === 'string' ? parsed.task : '',
      constraints: isStrArray(parsed.constraints) ? parsed.constraints : [],
      outputFormat: typeof parsed.outputFormat === 'string' ? parsed.outputFormat : '',
    }
  } catch {
    // framework por defecto vacío
  }
  return {
    id: row.id,
    humanInput: row.humanInput,
    aiPrompt: row.aiPrompt,
    framework,
    tier: row.tier,
    createdAt: row.createdAt.toISOString(),
  }
}

const TIER_HINTS: Record<string, string> = {
  local: 'Tarea simple/formateo — modelo local o tier barato (meta-skill: local_zero_token)',
  fast: 'Tarea de clasificación/redacción corta — modelo rápido y barato',
  mid: 'Tarea de razonamiento moderado — modelo intermedio',
  heavy: 'Tarea compleja de código/análisis largo — modelo top (precio alto justificado)',
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      text?: string
      target?: string
    }
    const text = (body.text ?? '').trim()
    const target = (body.target ?? 'claude-code').trim()

    if (text.length < 10) {
      return NextResponse.json(
        { error: 'Escribe al menos 10 caracteres describiendo lo que quieres.' },
        { status: 400 }
      )
    }
    if (text.length > 4000) {
      return NextResponse.json(
        { error: 'El texto supera los 4000 caracteres.' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const system = [
      'Eres el Traductor Humano→IA del proyecto LinguaForge/Meta-Skill de belentani7.',
      'Tu trabajo: convertir lo que una persona escribe en lenguaje humano (vago, informal, con errores)',
      'en un prompt profesional y estructurado que un agente de IA (Claude Code, Cursor, ChatGPT) ejecute bien a la primera.',
      'Respondes SOLO con un objeto JSON válido, sin texto fuera del JSON, en ESPAÑOL.',
      'Esquema exacto:',
      '{ "role": string (rol experto que debe asumir la IA, 1 frase),',
      '  "context": string (contexto técnico explícito que la IA necesita, 1-3 frases),',
      '  "task": string (tarea concreta y verificable, imperativo, 1-2 frases),',
      '  "constraints": string[] (3-6 restricciones/condiciones de calidad),',
      '  "outputFormat": string (formato de salida esperado, 1 frase),',
      '  "aiPrompt": string (el prompt FINAL completo y listo para copiar, que integra todo lo anterior en prosa profesional),',
      '  "tier": string (uno de: local | fast | mid | heavy, según el coste de modelo necesario) }',
      'Reglas: no inventes requisitos que el usuario no dijo; si falta información crítica, añade la restricción',
      '"Si falta X, pregunta antes de asumir" en constraints. El aiPrompt debe ser autosuficiente y sin placeholders vagos.',
    ].join('\n')

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        {
          role: 'user',
          content: [
            `Objetivo del usuario (en lenguaje humano):`,
            text,
            '',
            `Herramienta de destino del prompt: ${target}.`,
            'Traduce al lenguaje de la IA siguiendo el esquema.',
          ].join('\n'),
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw || !raw.trim()) throw new Error('Respuesta vacía del LLM')
    const parsed = extractJson(raw) as Record<string, unknown>

    const framework = {
      role: typeof parsed.role === 'string' ? parsed.role : '',
      context: typeof parsed.context === 'string' ? parsed.context : '',
      task: typeof parsed.task === 'string' ? parsed.task : '',
      constraints: isStrArray(parsed.constraints) ? parsed.constraints : [],
      outputFormat: typeof parsed.outputFormat === 'string' ? parsed.outputFormat : '',
    }
    const aiPrompt = typeof parsed.aiPrompt === 'string' ? parsed.aiPrompt : ''
    const tier = typeof parsed.tier === 'string' && parsed.tier in TIER_HINTS ? parsed.tier : 'mid'

    if (!aiPrompt) throw new Error('La IA no devolvió el prompt final')

    const created = await db.translation.create({
      data: {
        humanInput: text,
        aiPrompt,
        framework: JSON.stringify(framework),
        tier,
      },
    })

    return NextResponse.json({
      item: {
        ...toDTO(created),
        tierHint: TIER_HINTS[tier],
      },
    })
  } catch (e) {
    console.error('POST /api/translate', e)
    return NextResponse.json(
      { error: 'No se pudo traducir el texto. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.nextUrl.searchParams.get('limit') ?? '8', 10) || 8)
    )
    const rows = await db.translation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ items: rows.map(toDTO) })
  } catch (e) {
    console.error('GET /api/translate', e)
    return NextResponse.json(
      { error: 'No se pudo cargar el historial' },
      { status: 500 }
    )
  }
}
