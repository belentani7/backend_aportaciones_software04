'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Brain, 
  Target, 
  DollarSign, 
  Bug, 
  Zap, 
  BookOpen,
  MessageSquare,
  ChevronRight,
  X
} from 'lucide-react'

interface DiagnosisState {
  phase: 'intent' | 'discovery' | 'analysis' | 'solution'
  intent?: string
  intentConfidence?: number
  answers: Record<string, string>
  currentQuestion?: string
  questionIndex: number
  matchedArchetypes: string[]
  recommendedSolutions: number[]
  incomePaths: number[]
  sessionId: string
  categories: { id: string; label: string }[]
  showCategoryPicker: boolean
  solutions?: any[]
  incomePathDetails?: any[]
}

const INTENT_ICONS: Record<string, any> = {
  income: DollarSign,
  debug: Bug,
  skill: Zap,
  weekly: BookOpen,
  translate: MessageSquare,
}

const INTENT_COLORS: Record<string, string> = {
  income: 'bg-green-500/20 text-green-400 border-green-500/30',
  debug: 'bg-red-500/20 text-red-400 border-red-500/30',
  skill: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  weekly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  translate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export function DiagnosticWizard() {
  const [state, setState] = useState<DiagnosisState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Iniciar sesión al montar
  useEffect(() => {
    startDiagnosis()
  }, [])

  const apiCall = async (body: any) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setState(data)
      return data
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  const startDiagnosis = async (freeText?: string) => {
    await apiCall({ action: 'start', freeText })
  }

  const answerQuestion = async (answer: string) => {
    if (!state) return
    await apiCall({ action: 'answer', sessionId: state.sessionId, answer })
  }

  const setIntent = async (intent: string) => {
    if (!state) return
    await apiCall({ action: 'setIntent', sessionId: state.sessionId, intent })
  }

  const runAnalysis = async () => {
    if (!state) return
    await apiCall({ action: 'analyze', sessionId: state.sessionId })
  }

  const restart = () => {
    setState(null)
    setError(null)
    startDiagnosis()
  }

  if (!state) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const currentCategory = state.categories.find(c => c.id === state.intent)
  const Icon = currentCategory ? INTENT_ICONS[state.intent!] : Brain
  const colorClass = currentCategory ? INTENT_COLORS[state.intent!] : ''

  const progress = state.intent ? Math.min(100, (state.questionIndex / Math.max(1, state.categories.find(c => c.id === state.intent)?.questions?.length || 1)) * 100) : 0

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Diagnóstico Inteligente</h2>
              <p className="text-sm text-muted-foreground">
                {state.phase === 'intent' ? '¿Qué necesitas hoy?' :
                 state.phase === 'discovery' ? `Pregunta ${state.questionIndex + 1} de ${state.categories.find(c => c.id === state.intent)?.questions?.length || 0}` :
                 state.phase === 'analysis' ? 'Analizando...' : 'Resultados listos'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={restart}>
            <X className="h-4 w-4 mr-1" /> Reiniciar
          </Button>
        </div>
        
        {state.intent && state.phase === 'discovery' && (
          <Progress value={progress} className="mt-4 h-2" />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Phase: Intent Selection */}
        {state.phase === 'intent' && state.showCategoryPicker && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">¿Qué necesitas resolver hoy? Elige una o describe tu situación en lenguaje natural.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {state.categories.map(cat => {
                const CatIcon = INTENT_ICONS[cat.id]
                const catColor = INTENT_COLORS[cat.id]
                return (
                  <Button
                    key={cat.id}
                    variant="outline"
                    className={`h-24 text-left ${catColor} hover:border-current/50`}
                    onClick={() => setIntent(cat.id)}
                    disabled={loading}
                  >
                    <div className="flex flex-col items-start gap-2 w-full">
                      <CatIcon className="h-5 w-5" />
                      <span className="font-medium">{cat.label}</span>
                    </div>
                  </Button>
                )
              })}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label className="text-sm">O describe tu problema en tus palabras:</Label>
              <Textarea
                placeholder="Ej: 'Quiero cobrar 3k€/mes haciendo prompt engineering', 'Mi agente olvida decisiones cada 20 min', 'Necesito un skill que automatice facturas en n8n'..."
                rows={3}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), startDiagnosis((e.target as HTMLTextAreaElement).value))}
                disabled={loading}
              />
              <Button onClick={() => startDiagnosis((document.querySelector('textarea') as HTMLTextAreaElement)?.value)} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" /> Analizar mi situación
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Discovery Questions */}
        {state.phase === 'discovery' && state.currentQuestion && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{state.questionIndex + 1} / {state.categories.find(c => c.id === state.intent)?.questions?.length || 0}</span>
              <span className="flex-1 h-px bg-border" />
            </div>
            
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-lg font-medium mb-2">{state.currentQuestion}</p>
              
              {(() => {
                const cat = state.categories.find(c => c.id === state.intent)
                const q = cat?.questions[state.questionIndex]
                const key = q?.key
                
                if (!key) return null
                
                // Input type based on question
                const isLong = ['symptom', 'goal', 'rawInput', 'context', 'tried'].includes(key)
                const isSelect = ['tool', 'env', 'frequency', 'blocked', 'focus', 'timeBudget', 'style', 'monetize', 'targetModel'].includes(key)
                
                const options: Record<string, { value: string; label: string }[]> = {
                  tool: [
                    { value: 'Claude Code', label: 'Claude Code' },
                    { value: 'GitHub Copilot', label: 'GitHub Copilot' },
                    { value: 'Cursor', label: 'Cursor' },
                    { value: 'Aider', label: 'Aider' },
                    { value: 'Windsurf', label: 'Windsurf' },
                    { value: 'Codex CLI', label: 'Codex CLI' },
                    { value: 'Gemini CLI', label: 'Gemini CLI' },
                    { value: 'Replit Agent', label: 'Replit Agent' },
                    { value: 'Bolt/Lovable', label: 'Bolt / Lovable' },
                    { value: 'Devin', label: 'Devin' },
                    { value: 'Otro', label: 'Otro' },
                  ],
                  env: [
                    { value: 'monorepo', label: 'Monorepo' },
                    { value: 'legacy', label: 'Código legacy' },
                    { value: 'nuevo', label: 'Proyecto nuevo (greenfield)' },
                    { value: 'serverless', label: 'Serverless' },
                    { value: 'móvil', label: 'App móvil' },
                    { value: 'ML/data', label: 'Data / ML' },
                    { value: 'enterprise', label: 'Empresa corporativa' },
                    { value: 'solo', label: 'Solo dev' },
                    { value: 'equipo', label: 'Equipo distribuido' },
                    { value: 'open-source', label: 'Open source' },
                  ],
                  frequency: [
                    { value: '1', label: '1 vez' },
                    { value: '2-5', label: '2-5 veces' },
                    { value: '6-10', label: '6-10 veces' },
                    { value: '10+', label: '10+ veces (diario)' },
                  ],
                  blocked: [
                    { value: 'sí', label: 'Sí, me bloquea' },
                    { value: 'no', label: 'No, solo molesta' },
                    { value: 'ralentiza', label: 'Me ralentiza mucho' },
                  ],
                  focus: [
                    { value: 'profundizar', label: 'Profundizar en lo que sé' },
                    { value: 'nuevo', label: 'Explorar algo NUEVO' },
                    { value: 'ambos', label: 'Ambos' },
                  ],
                  timeBudget: [
                    { value: '2-5', label: '2-5 horas' },
                    { value: '6-10', label: '6-10 horas' },
                    { value: '11-20', label: '11-20 horas' },
                    { value: '20+', label: '20+ horas' },
                  ],
                  style: [
                    { value: 'construir', label: 'Construir proyecto real' },
                    { value: 'paper', label: 'Leer paper + replicar' },
                    { value: 'curso', label: 'Curso guiado' },
                    { value: 'reverse', label: 'Reverse-engineer repo' },
                  ],
                  monetize: [
                    { value: 'sí-ya', label: 'Sí, ya' },
                    { value: 'sí-1-3m', label: 'Sí, en 1-3 meses' },
                    { value: 'no-curiosidad', label: 'No, curiosidad' },
                    { value: 'portfolio', label: 'Portfolio' },
                  ],
                  targetModel: [
                    { value: 'Claude', label: 'Claude (Sonnet/Opus)' },
                    { value: 'GPT-4o', label: 'GPT-4o' },
                    { value: 'Gemini', label: 'Gemini' },
                    { value: 'Local', label: 'Modelo local (Ollama)' },
                    { value: 'no-sé', label: 'No sé / da igual' },
                  ],
                }

                if (isSelect && options[key]) {
                  return (
                    <Select 
                      value={state.answers[key] || ''} 
                      onValueChange={v => answerQuestion(v)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options[key].map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }

                return isLong ? (
                  <Textarea
                    value={state.answers[key] || ''}
                    onChange={e => answerQuestion(e.target.value)}
                    placeholder="Escribe tu respuesta detallada..."
                    rows={4}
                    disabled={loading}
                    className="font-mono text-sm"
                  />
                ) : (
                  <Input
                    value={state.answers[key] || ''}
                    onChange={e => answerQuestion(e.target.value)}
                    placeholder="Tu respuesta..."
                    disabled={loading}
                  />
                )
              })()}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => answerQuestion(state.answers[state.categories.find(c => c.id === state.intent)?.questions[state.questionIndex]?.key || ''] || '')} disabled={loading || !state.answers[state.categories.find(c => c.id === state.intent)?.questions[state.questionIndex]?.key || '']}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Phase: Analysis */}
        {state.phase === 'analysis' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analizando tus respuestas...</p>
            <p className="text-sm text-muted-foreground mt-1">Buscando en 1000 soluciones + 10 rutas de ingreso + tus 31 repos</p>
            <div className="mt-4 w-64">
              <Progress value={50} className="h-2" />
            </div>
          </div>
        )}

        {/* Phase: Solution */}
        {state.phase === 'solution' && (
          <Tabs defaultValue="solutions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="solutions">
                <CheckCircle className="h-4 w-4 mr-2" /> Soluciones ({state.recommendedSolutions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="income">
                <DollarSign className="h-4 w-4 mr-2" /> Rutas Ingreso ({state.incomePathDetails?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="archetypes">
                <Target className="h-4 w-4 mr-2" /> Arquetipos ({state.matchedArchetypes?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="solutions" className="mt-4">
              {state.solutions && state.solutions.length > 0 ? (
                <ScrollArea className="h-[500px] space-y-3">
                  {state.solutions.map((sol: any) => (
                    <Card key={sol.code} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`capitalize ${sol.severity === 'critica' ? 'border-destructive text-destructive' : sol.severity === 'alta' ? 'border-orange-500 text-orange-400' : 'border-muted'}`}>
                                {sol.severity}
                              </Badge>
                              <Badge variant="secondary">{sol.tool}</Badge>
                              <Badge variant="secondary">{sol.environment}</Badge>
                              <span className="text-xs text-muted-foreground ml-auto">{sol.frequency}% freq.</span>
                            </div>
                            <h4 className="font-semibold mb-1">{sol.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sol.problem}</p>
                            <div className="space-y-1 text-xs">
                              <p className="font-medium text-primary">Causa raíz:</p>
                              <p className="text-muted-foreground">{sol.rootCause}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => showSolutionDetail(sol)}>
                            Ver plan completo
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron soluciones exactas para tus respuestas.</p>
                  <p className="text-sm mt-1">Prueba a reformular o elige otra categoría.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="income" className="mt-4">
              {state.incomePathDetails && state.incomePathDetails.length > 0 ? (
                <ScrollArea className="h-[500px] space-y-3">
                  {state.incomePathDetails.map((path: any) => (
                    <Card key={path.code} className="hover:border-green-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                {path.category}
                              </Badge>
                              <span className="text-lg font-semibold text-green-400 ml-auto">{path.realRate}</span>
                            </div>
                            <h4 className="font-semibold mb-1">{path.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{path.summary}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{path.timeToFirstIncome}</Badge>
                              <Badge variant="outline">{path.effort}</Badge>
                              <Badge variant="outline">{path.demandLevel}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => showIncomeDetail(path)}>
                            Ver plan de acción
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay rutas de ingreso relevantes para este diagnóstico.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="archetypes" className="mt-4">
              <ScrollArea className="h-[500px] space-y-2">
                {state.matchedArchetypes.map((archId: string) => (
                  <Badge key={archId} variant="outline" className="w-full justify-start text-left p-3 gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>{archId}</span>
                  </Badge>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

// Detail modals would go here - simplified for now
function showSolutionDetail(sol: any) {
  alert(`SOLUCIÓN #${sol.code}: ${sol.title}\n\nPROBLEMA:\n${sol.problem}\n\nCAUSA RAÍZ:\n${sol.rootCause}\n\nPLAN DE ACCIÓN (${sol.steps?.length || 0} pasos):\n${sol.steps?.map((s: string, i: number) => `${i+1}. ${s}`).join('\n')}\n\nFIX DE CÓDIGO:\n${sol.codeFix}\n\nPREVENCIÓN:\n${sol.prevention}\n\nFUENTE: ${sol.source} | FREQ: ${sol.frequency}%`)
}

function showIncomeDetail(path: any) {
  alert(`RUTA #${path.code}: ${path.title}\n\nTARIFA REAL: ${path.realRate}\n\nPLATAFORMAS:\n${JSON.parse(path.platforms).map((p: any) => `- ${p.name}: ${p.fee} (${p.note})`).join('\n')}\n\nEVIDENCIAS:\n${JSON.parse(path.evidence).map((e: any) => `- ${e.source}: ${e.claim} (${e.url})`).join('\n')}\n\nREPOS TUYOS QUE APLICAN: ${JSON.parse(path.matchRepos).join(', ')}\n\nPASOS (${JSON.parse(path.steps).length}):\n${JSON.parse(path.steps).map((s: string, i: number) => `${i+1}. ${s}`).join('\n')}`)
}