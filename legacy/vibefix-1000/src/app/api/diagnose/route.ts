import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface DiagnosisState {
  phase: 'intent' | 'discovery' | 'analysis' | 'solution'
  intent?: string
  intentConfidence?: number
  answers: Record<string, string>
  currentQuestion?: string
  questionIndex: number
  matchedArchetypes: string[]
  recommendedSolutions: number[]
  sessionId: string
}

const INTENT_CATEGORIES = [
  {
    id: 'income',
    label: 'Generar ingresos con mis skills de IA',
    keywords: ['dinero', 'ingresos', 'freelance', 'cliente', 'facturar', 'trabajo', 'upwork', 'contrato', 'propuesta', 'portafolio', 'monetizar'],
    questions: [
      { key: 'currentIncome', text: '¿Cuánto facturas HOY mensualmente con trabajo relacionado a IA/desarrollo? (€ exactos)' },
      { key: 'targetIncome', text: '¿Cuál es tu objetivo realista a 6 meses? (€/mes)' },
      { key: 'availableHours', text: '¿Cuántas horas/semana PUEDES dedicar de forma consistente? (no ideal, real)' },
      { key: 'strongestSkill', text: '¿Cuál es tu skill técnico MÁS fuerte y demostrable? (ej: "router de modelos", "RAG evals", "prompt engineering", "n8n/Make")' },
      { key: 'portfolio', text: '¿Tienes 3+ casos de estudio medibles en GitHub/web que un cliente pueda ver en 30 seg? (sí/no + links)' },
      { key: 'location', text: '¿Desde dónde operas? (ciudad/país — afecta plataformas y tarifa)' },
      { key: 'languages', text: '¿En qué idiomas trabajas profesionalmente? (PT/ES/EN/CA/otros)' },
    ]
  },
  {
    id: 'debug',
    label: 'Arreglar un problema técnico concreto AHORA',
    keywords: ['error', 'bug', 'falla', 'no funciona', 'rompe', 'crash', 'lento', 'timeout', 'memoria', 'token', 'contexto', 'alucina', 'ignora', 'repite'],
    questions: [
      { key: 'tool', text: '¿Qué herramienta estás usando? (Claude Code / Copilot / Cursor / Aider / Windsurf / Codex / otro)' },
      { key: 'env', text: '¿Entorno? (monorepo / legacy / nuevo / serverless / móvil / ML / enterprise / solo / equipo / open-source)' },
      { key: 'symptom', text: 'Describe el síntoma EXACTO en una frase: (ej: "olvida decisiones a los 30 min", "alucina imports inexistentes", "agota tokens leyendo lockfiles")' },
      { key: 'frequency', text: '¿Cuántas veces te ha pasado en la última semana? (1 / 2-5 / 6-10 / 10+)' },
      { key: 'tried', text: '¿Qué has probado ya? (compact / reglas / handoff / subagentes / ignorar archivos / nada)' },
      { key: 'blocked', text: '¿Te bloquea para entregar? (sí / no / ralentiza)' },
    ]
  },
  {
    id: 'skill',
    label: 'Crear/Mejorar skills, agentes o automatizaciones',
    keywords: ['skill', 'agente', 'automatización', 'n8n', 'make', 'workflow', 'mcp', 'prompt', 'sistema', 'arquitectura', 'pipeline', 'router'],
    questions: [
      { key: 'goal', text: '¿Qué quieres que haga el skill/agente? (una frase, outcome medible)' },
      { key: 'targetUser', text: '¿Para quién es? (tú solo / tu equipo / vender a clientes / open source)' },
      { key: 'stack', text: '¿Stack preferido? (Python stdlib / Node / TypeScript / n8n / Make / MCP / LangGraph / otro)' },
      { key: 'integrations', text: '¿Qué APIs/servicios debe tocar? (GitHub, Slack, Gmail, DB, Stripe, WhatsApp, Azure, AWS, ninguno)' },
      { key: 'budget', text: '¿Presupuesto de tokens/coste por ejecución? (gratis local / <$0.01 / <$0.10 / no me importa)' },
      { key: 'timeline', text: '¿Cuándo lo necesitas funcionando? (hoy / esta semana / este mes / explorando)' },
    ]
  },
  {
    id: 'weekly',
    label: 'Saber qué estudiar/construir ESTA SEMANA',
    keywords: ['qué estudiar', 'qué aprender', 'próximo', 'skill', 'tendencia', 'oportunidad', 'mercado', 'demanda', 'roadmap'],
    questions: [
      { key: 'focus', text: '¿Quieres profundizar en lo que ya sabes o explorar algo NUEVO? (profundizar / nuevo / ambos)' },
      { key: 'timeBudget', text: '¿Cuántas horas PUEDES meter ESTA semana? (2-5 / 6-10 / 11-20 / 20+)' },
      { key: 'style', text: '¿Cómo aprendes mejor? (construir proyecto real / leer paper + replicar / curso guiado / reverse-engineer repo)' },
      { key: 'monetize', text: '¿El objetivo final es monetizarlo? (sí, ya / sí, en 1-3 meses / no, curiosidad / portfolio)' },
    ]
  },
  {
    id: 'translate',
    label: 'Traducir mi lenguaje natural a prompt estructurado para IA',
    keywords: ['traducir', 'prompt', 'estructurar', 'mejorar prompt', 'ia entienda', 'claude entienda', 'prompt engineering'],
    questions: [
      { key: 'rawInput', text: 'Pega aquí lo que quieres decirle a la IA (tu lenguaje natural, tal cual piensas):' },
      { key: 'targetModel', text: '¿Qué modelo va a recibir el prompt? (Claude / GPT-4o / Gemini / Local / No sé)' },
      { key: 'context', text: '¿Contexto extra? (archivos, reglas, stack, constraints, output format esperado)' },
    ]
  }
]

function classifyIntent(input: string): { category: typeof INTENT_CATEGORIES[0]; confidence: number } {
  const lower = input.toLowerCase()
  let best = INTENT_CATEGORIES[0]
  let bestScore = 0

  for (const cat of INTENT_CATEGORIES) {
    let score = 0
    for (const kw of cat.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 2
      // partial match
      const words = kw.split(' ')
      for (const w of words) {
        if (w.length > 3 && lower.includes(w.toLowerCase())) score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      best = cat
    }
  }

  const confidence = Math.min(0.95, 0.3 + bestScore * 0.1)
  return { category: best, confidence }
}

function generateSessionId(): string {
  return `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, sessionId, answer, freeText } = body

    // Nueva sesión: clasificar intent
    if (action === 'start' || !sessionId) {
      const text = freeText || ''
      const { category, confidence } = classifyIntent(text)

      const state: DiagnosisState = {
        phase: text.trim() ? 'discovery' : 'intent',
        intent: category.id,
        intentConfidence: confidence,
        answers: {},
        currentQuestion: category.questions[0]?.text,
        questionIndex: 0,
        matchedArchetypes: [],
        recommendedSolutions: [],
        sessionId: generateSessionId(),
      }

      // Guardar en DB
      await db.diagnosisSession.create({
        data: {
          sessionId: state.sessionId,
          phase: state.phase,
          intent: state.intent,
          intentConfidence: state.intentConfidence,
          answers: JSON.stringify(state.answers),
          questionIndex: state.questionIndex,
          matchedArchetypes: JSON.stringify(state.matchedArchetypes),
          recommendedSolutions: JSON.stringify(state.recommendedSolutions),
          incomePaths: JSON.stringify([]),
        }
      })

      return NextResponse.json({
        ...state,
        categories: INTENT_CATEGORIES.map(c => ({ id: c.id, label: c.label })),
        showCategoryPicker: !text.trim(),
      })
    }

    // Sesión existente
    const session = await db.diagnosisSession.findUnique({ where: { sessionId } })
    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    const state: DiagnosisState = {
      phase: session.phase as any,
      intent: session.intent || undefined,
      intentConfidence: session.intentConfidence || undefined,
      answers: session.answers ? JSON.parse(session.answers) : {},
      currentQuestion: session.currentQuestion || undefined,
      questionIndex: session.questionIndex,
      matchedArchetypes: session.matchedArchetypes ? JSON.parse(session.matchedArchetypes) : [],
      recommendedSolutions: session.recommendedSolutions ? JSON.parse(session.recommendedSolutions) : [],
      incomePaths: session.incomePaths ? JSON.parse(session.incomePaths) : [],
      sessionId: session.sessionId,
    }

    const category = INTENT_CATEGORIES.find(c => c.id === state.intent) || INTENT_CATEGORIES[1]

    // Responder pregunta actual
    if (action === 'answer' && answer !== undefined) {
      const qKey = category.questions[state.questionIndex]?.key
      if (qKey) {
        state.answers[qKey] = answer
      }

      state.questionIndex++

      if (state.questionIndex < category.questions.length) {
        state.currentQuestion = category.questions[state.questionIndex].text
        state.phase = 'discovery'
      } else {
        state.phase = 'analysis'
        state.currentQuestion = undefined
      }

      await db.diagnosisSession.update({
        where: { sessionId },
        data: {
          phase: state.phase,
          answers: JSON.stringify(state.answers),
          questionIndex: state.questionIndex,
          currentQuestion: state.currentQuestion,
        }
      })

      return NextResponse.json(state)
    }

    // Cambiar intent manualmente
    if (action === 'setIntent' && body.intent) {
      const newCat = INTENT_CATEGORIES.find(c => c.id === body.intent)
      if (newCat) {
        state.intent = newCat.id
        state.intentConfidence = 1.0
        state.phase = 'discovery'
        state.questionIndex = 0
        state.answers = {}
        state.currentQuestion = newCat.questions[0]?.text
        state.matchedArchetypes = []
        state.recommendedSolutions = []

        await db.diagnosisSession.update({
          where: { sessionId },
          data: {
            phase: state.phase,
            intent: state.intent,
            intentConfidence: state.intentConfidence,
            answers: JSON.stringify(state.answers),
            questionIndex: state.questionIndex,
            currentQuestion: state.currentQuestion,
            matchedArchetypes: JSON.stringify([]),
            recommendedSolutions: JSON.stringify([]),
          }
        })

        return NextResponse.json(state)
      }
    }

    // Análisis final: buscar soluciones + income paths
    if (action === 'analyze' || state.phase === 'analysis') {
      state.phase = 'solution'

      // 1. Buscar arquetipos que matcheen las respuestas
      const allArchetypes = await db.archetype.findMany()
      const matched: string[] = []

      for (const arch of allArchetypes) {
        let score = 0
        const searchText = `${arch.title} ${arch.problem} ${arch.rootCause} ${arch.tags.join(' ')}`.toLowerCase()
        
        for (const [key, val] of Object.entries(state.answers)) {
          if (val && searchText.includes(val.toLowerCase().slice(0, 20))) score++
          if (key === 'tool' && arch.tags.some(t => val.toLowerCase().includes(t.toLowerCase()))) score += 2
          if (key === 'env' && arch.tags.some(t => val.toLowerCase().includes(t.toLowerCase()))) score += 2
        }
        if (score >= 2) matched.push(arch.id)
      }

      state.matchedArchetypes = matched.slice(0, 10)

      // 2. Buscar soluciones concretas (1000)
      const solutions = await db.solution.findMany({
        where: { archetypeId: { in: state.matchedArchetypes } },
        take: 20,
        orderBy: { frequency: 'desc' },
      })
      state.recommendedSolutions = solutions.map(s => s.code)

      // 3. Income paths relevantes
      let incomePaths: number[] = []
      if (state.intent === 'income' || state.intent === 'skill') {
        const paths = await db.incomePath.findMany({ orderBy: { code: 'asc' } })
        // Filtrar por match con repos/skills del usuario
        for (const p of paths) {
          const matchRepos = p.matchRepos as string[]
          if (matchRepos.some(r => state.answers.strongestSkill?.toLowerCase().includes(r.toLowerCase()) ||
                                state.answers.goal?.toLowerCase().includes(r.toLowerCase()))) {
            incomePaths.push(p.code)
          }
        }
        if (incomePaths.length === 0) incomePaths = paths.slice(0, 3).map(p => p.code)
      }

      await db.diagnosisSession.update({
        where: { sessionId },
        data: {
          phase: state.phase,
          matchedArchetypes: JSON.stringify(state.matchedArchetypes),
          recommendedSolutions: JSON.stringify(state.recommendedSolutions),
          incomePaths: JSON.stringify(incomePaths),
        }
      })

      return NextResponse.json({
        ...state,
        incomePaths,
        solutions: await db.solution.findMany({ where: { code: { in: state.recommendedSolutions } } }),
        incomePathDetails: await db.incomePath.findMany({ where: { code: { in: incomePaths } } }),
      })
    }

    return NextResponse.json(state)
  } catch (e) {
    console.error('Diagnose error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (sessionId) {
    const session = await db.diagnosisSession.findUnique({ where: { sessionId } })
    return NextResponse.json(session)
  }

  return NextResponse.json({ categories: INTENT_CATEGORIES.map(c => ({ id: c.id, label: c.label })) })
}