import type { Archetype } from '../core'

/** Dominio 7: Rendimiento (10 arquetipos reales) */
export const PERF_ARCHETYPES: Archetype[] = [
  {
    id: 'perf-01',
    domain: 'rendimiento',
    title: 'N+1 queries por ORM mal usado',
    problem:
      'La lista de 50 pedidos hace 150 queries (1 + 50 usuarios + 50 direcciones); en local ni se nota, en producción con latencia real la página tarda 8 segundos.',
    rootCause:
      'El agente escribe el acceso a datos "natural" (iterar y consultar); el lazy loading por defecto de los ORMs multiplica las queries y el modelo no ve el coste de red de cada una.',
    steps: [
      'Activa el log de queries en desarrollo y cuenta: si el número crece con el tamaño de la lista, es N+1.',
      'Resuelve con include/join del ORM: una query con relaciones anidadas en vez de N consultas por fila.',
      'Agrega en la misma query lo que se pueda (counts con _count, sumas con aggregate) en vez de consultar por elemento.',
      'Guardia en CI: test de rendimiento con 50 registros que falle si las queries superan un umbral (p. ej. 5).',
    ],
    codeFix: `// Antes: 1 + N queries
for (const o of orders) await db.user.findUnique({ where: { id: o.userId } });
// Después: 1 query
const rows = await db.order.findMany({
  include: { user: { select: { name: true, email: true } } },
});`,
    prevention:
      'El log de queries es el profilador básico: cada lista que crece con datos debe tener sus queries acotadas (include/aggregate), verificado por test.',
    tags: ['n+1', 'orm', 'queries'],
    severity: 'alta',
    frequency: 58,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'perf-02',
    domain: 'rendimiento',
    title: 'Re-renders infinitos en React (useEffect en bucle)',
    problem:
      'La UI parpadea, dispara fetches sin parar o agota la memoria: un useEffect que setea estado del que depende, o dependencias de objeto/array recreadas en cada render.',
    rootCause:
      'El ciclo render→effect→setState→render es fácil de activar con dependencias mal declaradas; el agente no simula el ciclo de vida, solo la lógica puntual.',
    steps: [
      'Detecta: React StrictMode + React DevTools Profiler muestran el bucle; en logs, un fetch repetido N veces es la firma.',
      'Corrige la dependencia: valores derivados van en useMemo (o fuera de componente si son constantes), no en el array de dependencias.',
      'Para fetch en mount: patrón correcto con abort (signal) y guard de estado, o lib de fetching (SWR/TanStack) que ya lo resuelve.',
      'Regla del agente: "Un useEffect que actualiza una de sus propias dependencias es un bug; propón alternativa antes de escribirlo".',
    ],
    codeFix: `// Patrón fetch seguro en mount
useEffect(() => {
  const c = new AbortController();
  getOrders(c.signal).then(setOrders).catch(ignoraAbort);
  return () => c.abort(); // no hay loop ni estado fantasma
}, []); // deps: solo lo que de verdad cambia el efecto`,
    prevention:
      'Efecto que alimenta su propia dependencia = bucle garantizado. La regla + StrictMode en dev lo caza en el primer arranque.',
    tags: ['react', 'useeffect', 're-renders'],
    severity: 'alta',
    frequency: 62,
    source: 'r/cursor (Reddit)',
  },
  {
    id: 'perf-03',
    domain: 'rendimiento',
    title: 'Bundle enorme por imports incorrectos (barrel files)',
    problem:
      'Importar un icono o utilidad desde el index del paquete arrastra cientos de módulos al bundle cliente; el Lighthouse cae y el TTI se dispara sin que el código "esté mal".',
    rootCause:
      'Los barrel files (index.ts que re-exporta todo) rompen el tree-shaking en muchos setups; el agente usa el import más cómodo sin conocer el coste del grafo.',
    steps: [
      'Mide primero: `npx @next/bundle-analyzer` para ver qué paquete ocupa; las sorpresas suelen ser iconos, fechas y utilidades.',
      'Importa directo al módulo: `@/components/ui/button` y `lucide-react` con imports concretos; evita re-exportar desde barrels propios en código cliente.',
      'Configura sideEffects: false en package.json de tus librerías internas y modularizeImports donde aplique.',
      'Presupuesto de bundle en CI (size-limit): falla si el JS inicial crece >X KB — el crecimiento silencioso se vuelve visible.',
    ],
    codeFix: `// ❌ import { Check, X } from "@/components"  (barrel)
// ✅ import { Check } from "@/components/icons/check";
// CI: size-limit con presupuesto
[["dist/chunk-*.js", "80 KB", "JS inicial"]]`,
    prevention:
      'El bundle se presupuesta como la nómica del rendimiento: análisis + imports directos + límite en CI que impide el crecimiento silencioso.',
    tags: ['bundle', 'tree-shaking', 'barrels'],
    severity: 'media',
    frequency: 51,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'perf-04',
    domain: 'rendimiento',
    title: 'Waterfall de fetches en server components',
    problem:
      'La página lanza fetch→fetch→fetch en secuencia (datos del usuario, luego su equipo, luego sus proyectos): cada hop suma latencia y el TTFB llega a 4-6 segundos.',
    rootCause:
      'El código secuencial es el natural para el modelo; sin analizar dependencias entre datos, no detecta que dos de los tres fetches son independientes.',
    steps: [
      'Clasifica: ¿qué fetch depende de qué? Los independientes van en Promise.all en el mismo server component.',
      'Elimina intermediarios: si B solo necesita un campo de A, pásalo por props en vez de re-fetch desde el hijo.',
      'Suspense por bloques: lo lento envuelto en <Suspense> con skeleton para que lo rápido pinte ya (streaming).',
      'Caché consciente: fetch con revalidate/next tags para que la segunda visita no repita el costo.',
    ],
    codeFix: `// Paralelo + streaming
const [user, config] = await Promise.all([getUser(), getConfig()]);
return (<>
  <Header user={user} />
  <Suspense fallback={<Skeleton />}>
    <SlowProjects userId={user.id} /> {/* fetch interno */}
  </Suspense></>);`,
    prevention:
      'El waterfall se diseña fuera: dependencias explícitas, Promise.all para lo independiente y Suspense para lo lento.',
    tags: ['waterfall', 'rsc', 'suspense'],
    severity: 'media',
    frequency: 49,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'perf-05',
    domain: 'rendimiento',
    title: 'Imágenes sin optimizar (sin next/image, sin responsive)',
    problem:
      'La landing sirve una foto de 4MB en un contenedor de 300px: LCP de 6 segundos y penalización SEO; el agente usa <img> con la ruta original del CMS.',
    rootCause:
      'La etiqueta <img> es el camino corto; la optimización (formatos, tamaños, lazy) es infraestructura que el código "de la tarea" no incluye.',
    steps: [
      'Regla: "Imágenes siempre con next/image (o equivalente): srcset generado, lazy por defecto, priority solo en el LCP".',
      'Tamaños declarados (sizes) según el layout real para que el servidor sirva el ancho correcto, no el original.',
      'Formatos modernos en el pipeline (AVIF/WebP) — next/image lo hace solo con un loader configurado.',
      'Presupuesto de imagen: no subir originales >1MB; el CMS/manifiesto los comprime al subir.',
    ],
    codeFix: `<Image
  src={post.cover}
  alt={post.title}
  width={1200} height={630}
  sizes="(max-width: 768px) 100vw, 600px"
  priority={isLCP} // solo la imagen del hero
/>`,
    prevention:
      'Imagen subida = imagen optimizada: next/image + sizes por layout + presupuesto de peso en el pipeline de subida.',
    tags: ['imagenes', 'lcp', 'next-image'],
    severity: 'media',
    frequency: 55,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'perf-06',
    domain: 'rendimiento',
    title: 'Memory leaks por listeners y timers no limpiados',
    problem:
      'Tras navegar entre páginas la app va cada vez más lenta: intervals, event listeners y websockets que sobreviven al desmontaje acumulándose en cada visita.',
    rootCause:
      'El setup (addEventListener, setInterval) es parte de la tarea; el cleanup del return del efecto no lo genera si no se le pide explícitamente.',
    steps: [
      'Regla: "Todo addEventListener/interval/observer en un efecto tiene cleanup en el return; si no puede, explica por qué".',
      'Patrón estándar: return () => { clearInterval(t); el.removeEventListener("resize", h); ws.close(); }.',
      'Detecta en dev: Chrome DevTools → Memory → snapshots antes/después de navegar 10 veces; los objetos retenidos delatan al culpable.',
      'Para websockets, usa hooks de ciclo de vida (useSWRSubscription o similar) que gestionan reconexión y cierre.',
    ],
    codeFix: `useEffect(() => {
  const onResize = () => setW(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []); // setup y teardown SIEMPRE juntos`,
    prevention:
      'Setup sin teardown es un leak en diferido: la regla obliga a escribirlos juntos y el snapshot de memoria confirma.',
    tags: ['memory-leak', 'listeners', 'cleanup'],
    severity: 'media',
    frequency: 47,
    source: 'Stack Overflow 2025',
  },
  {
    id: 'perf-07',
    domain: 'rendimiento',
    title: 'Falta debounce/throttle en inputs y scrolls costosos',
    problem:
      'Cada tecla del buscador dispara una query a la API (o un re-render de 500 filas): la UI se arrasta y la DB se ahoga con peticiones idénticas intermedias.',
    rootCause:
      'El handler "on cada evento" es el código natural; la política de frecuencia (debounce) es una decisión de diseño que el agente no toma sin indicación.',
    steps: [
      'Regla: "Inputs que disparan fetch o cálculos pesados: debounce 300-500ms; scroll/resize: throttle o rAF".',
      'Implementa con useDeferredValue (React 18+) para lo más simple, o hook de debounce con cleanup correcto.',
      'Cancela la petición obsoleta con AbortController al escribir de nuevo: evita respuestas viejas sobrescribiendo a nuevas (race condition).',
      'En listas grandes, virtualiza (tanstack-virtual) además del debounce: el DOM de 5000 filas no es renderizable en cada tecla.',
    ],
    codeFix: `const q = useDeferredValue(rawQ); // React 18+
useEffect(() => {
  const c = new AbortController();
  fetch(\`/api/search?q=\${encodeURIComponent(q)}\`, { signal: c.signal })
    .then(r => r.json()).then(setResults).catch(ignoraAbort);
  return () => c.abort(); // la tecla nueva cancela la vieja
}, [q]);`,
    prevention:
      'Frecuencia de eventos = decisión de diseño: debounce en inputs, cancelación de fetch obsoleto y virtualización en listas largas.',
    tags: ['debounce', 'input', 'abort'],
    severity: 'media',
    frequency: 50,
    source: 'r/cursor (Reddit)',
  },
  {
    id: 'perf-08',
    domain: 'rendimiento',
    title: 'Índices de base de datos faltantes en consultas frecuentes',
    problem:
      'La consulta del dashboard hace full scan sobre una tabla de 500k filas; en dev con 20 filas vuela, en prod el p95 se dispara y la DB se satura con pocas visitas.',
    rootCause:
      'El esquema se diseña sin conocer el patrón de consultas real; el índice es una decisión de datos, no de código, y el agente no la toma si no se le enseña el plan de ejecución.',
    steps: [
      'Identifica las queries frecuentes (logs, slow query log) y sus WHERE/ORDER BY: esos campos son candidatos a índice.',
      'Verifica con EXPLAIN QUERY PLAN (o $queryRaw) que usa índice y no SCAN; añade índices compuestos en el orden de las columnas filtradas.',
      'En Prisma, declara @@index en el schema y genera la migración; nunca CREATE INDEX ad hoc fuera del historial de migraciones.',
      'Mide el impacto: p95 antes/después en una carga representativa; un índice que no mejora p95 es peso de escritura gratis.',
    ],
    codeFix: `// prisma/schema.prisma
model Order {
  @@index([userId, createdAt(sort: Desc)])
}
// Verificación: EXPLAIN QUERY PLAN
// SELECT ... WHERE userId = ? ORDER BY createdAt DESC
// → "SEARCH orders USING INDEX idx_..." (no SCAN)`,
    prevention:
      'El índice sigue al patrón de consulta: logs → EXPLAIN → índice compuesto → medición. Nunca al revés.',
    tags: ['índices', 'sql', 'p95'],
    severity: 'alta',
    frequency: 45,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'perf-09',
    domain: 'rendimiento',
    title: 'TTFB alto por SSR pesado en cada request',
    problem:
      'Cada visita reconstruye la página entera contra la DB (sin caché ni streaming): el servidor sufre, el usuario espera un panel blanco y la factura de cómputo sube.',
    rootCause:
      'RSC por defecto no significa "todo dinámico siempre": sin decidir qué es estático, qué se cachea y qué se streamea, el SSR de todo es el default accidental.',
    steps: [
      'Clasifica cada ruta: estática (build), ISR (revalidate N), dinámica con streaming (Suspense), o tiempo real (WS). Documenta la decisión.',
      'Extrae lo estático: textos, nav, layouts quedan en el build; solo el bloque de datos va dentro de <Suspense> con su fetch.',
      'Caché de datos: revalidate/tag en los fetches que pueden ser stale 30-60s; invalidación on-demand en mutaciones.',
      'Mide TTFB p95 por ruta (Vercel analytics o logs) y ataca las >500ms: normalmente es una query o un fetch upstream no cacheado.',
    ],
    codeFix: `// cache: fetch con revalidate + streaming del lento
fetch(url, { next: { revalidate: 60, tags: ["orders"] } });
<SlowStats /> // dentro de <Suspense>: el resto pinta ya`,
    prevention:
      'Cada ruta declara su estrategia de frescura: estático/ISR/streaming/dinámico. SSR de todo por defecto es la factura que llegará.',
    tags: ['ttfb', 'isr', 'streaming'],
    severity: 'media',
    frequency: 46,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'perf-10',
    domain: 'rendimiento',
    title: 'Cómputo pesado en el hilo principal (sin workers)',
    problem:
      'Al procesar el CSV/graficar/parsear, la UI se congela un segundo o diez: el parseo de 10MB corre en el hilo principal y los clicks no responden.',
    rootCause:
      'El código secuencial en el evento es lo natural; el límite de un solo hilo de JS no está en el modelo del agente cuando escribe el handler.',
    steps: [
      'Regla: "Procesamiento >50ms (parseo, cifrado, cálculo) va a Web Worker o se trocea con scheduling (requestIdleCallback)".',
      'Worker mínimo: postMessage con el input, transferibles para no copiar (buffer), y estado "procesando" en UI.',
      'Para streams grandes, procesa por chunks con generator + rAF: la UI respira entre chunks sin infraestructura extra.',
      'Comprime donde toca: si el dato viene del servidor, procesa en server (edge/Node) y manda solo el resultado.',
    ],
    codeFix: `// worker.parse.ts + uso
const w = new Worker(new URL("./worker.parse.ts", import.meta.url));
w.postMessage(buffer, [buffer]); // transferible, sin copia
w.onmessage = (e) => setRows(e.data); // UI fluida mientras parsea`,
    prevention:
      'El hilo principal es para pintar, no para masticar: >50ms de cómputo se muda a worker o se trocea con scheduling.',
    tags: ['workers', 'hilo-principal', 'chunks'],
    severity: 'media',
    frequency: 38,
    source: 'Stack Overflow 2025',
  },
]

/** Dominio 8: Costes y límites (10 arquetipos reales) */
export const COST_ARCHETYPES: Archetype[] = [
  {
    id: 'cost-01',
    domain: 'costes',
    title: 'Quema de tokens leyendo archivos enormes completos',
    problem:
      'La sesión se queda sin límite en minutos: el agente leyó tres archivos de 4000 líneas (logs, dumps, generados) para una tarea de 20 líneas; tu cuota semanal se esfumó.',
    rootCause:
      'El agente paga tokens por todo lo que entra en contexto; sin política de qué leer y cómo (rangos, grep, índices), la lectura bruta es su modo por defecto de "entender".',
    steps: [
      'Ignora lo generado (dist, dumps, lockfiles) en la config de lectura del agente; los archivos grandes se leen por rangos tras localizar con grep.',
      'Regla: "Para archivos >500 líneas: primero grep/índice de símbolos, luego leer solo las secciones relevantes".',
      'Resume una vez y reutiliza: tras entender un módulo grande, pide un resumen de 10 líneas en notas de proyecto para futuras sesiones.',
      'Divide tareas: una sesión por módulo gasta menos que una sesión "arregla todo" que acabará leyendo medio repo.',
    ],
    codeFix: `# Patrón de lectura barata
rg -n "export (async )?function|class " src/big.ts | head -20
# → leer solo las líneas de las 2 funciones objetivo
# (sed -n '120,180p' src/big.ts)`,
    prevention:
      'Tokens = dinero: el agente localiza con grep y lee por rangos; lo generado y los dumps fuera de alcance siempre.',
    tags: ['tokens', 'lecturas', 'quema'],
    severity: 'alta',
    frequency: 71,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'cost-02',
    domain: 'costes',
    title: 'Rate limit 429 en picos: límites agotados "más rápido de lo esperado"',
    problem:
      'Como reportó la BBC (2025), usuarios de Claude Code agotan sus límites semanales mucho antes de lo previsto: sesiones matutinas muertas, equipo bloqueado en horas pico.',
    rootCause:
      'Los límites cuentan tokens totales (input+output, caché incluida) no "mensajes"; el uso intensivo con contexto grande y re-lecturas consume la cuota de forma no lineal.',
    steps: [
      'Raciona por tarea: sesión enfocada con contexto mínimo (archivos necesarios) en vez de sesiones todo-en-uno que arrastran 100k tokens.',
      'Distribuye: tareas triviales a modelos/herramientas más baratas (Copilot/mini-models) y Claude para arquitectura/debugging duro.',
      'Programa el trabajo pesado (migraciones grandes, refactors) en valles de uso (tarde/noche/fin de semana) si tu plan lo permite.',
      'Monitorea consumo: anota el gasto por tipo de tarea y detecta las "comes-tokens" (agente en bucle leyendo logs) para cortarlas.',
    ],
    codeFix: `# Politica de equipo (README del repo)
# Tarea trivial → Copilot/mini. Arquitectura/debug → Claude.
# Sesión máx: 1 objetivo + archivos mínimos. Compactar al 75%.
# Refactors grandes: viernes tarde, rama aparte.`,
    prevention:
      'La cuota se administra como presupuesto: tamaño de sesión, enrutado por dificultad y calendario. El 7% que agota límites en 15-30 min casi siempre está en modo bruto.',
    tags: ['rate-limit', 'cuota', '429'],
    severity: 'alta',
    frequency: 66,
    source: 'BBC · Claude Code usage limits 2025',
  },
  {
    id: 'cost-03',
    domain: 'costes',
    title: 'Subagentes en bucle consumen cuota sin avanzar',
    problem:
      'El agente lanza subagentes (o planes paralelos) que reintentan la misma operación fallida: cada retry cuesta tokens y el resultado es el mismo error multiplicado por 5.',
    rootCause:
      'El paralelismo amplifica lo que el orquestador no sabe cortar: sin criterio de aborto, cada brazo del abanico repite el error hasta agotar intentos.',
    steps: [
      'Define aborto explícito: si un subagente falla 2 veces con el mismo error, reporta y aborta el brazo, no reintenta.',
      'Acota el scope de cada subagente a un entregable verificable (un archivo, un test) para que el fracaso sea local y barato.',
      'El orquestador compara resultados: dos brazos con la misma conclusión no se relanzan; se fusiona y avanza.',
      'Registra el coste por tarea (tokens consumidos) y revisa semanalmente los patrones que más gastan por menos valor.',
    ],
    codeFix: `# Regla de orquestación
# Subagente: máx 2 intentos, scope = 1 entregable.
# Mismo error 2x → reportar y matar el brazo.
# Coste por tarea → task-cost.md (revisión semanal).`,
    prevention:
      'Paralelismo sin criterio de aborto es un multiplicador de gasto: scope pequeño, límite de reintentos y fusión de conclusiones.',
    tags: ['subagentes', 'bucles', 'paralelismo'],
    severity: 'alta',
    frequency: 43,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'cost-04',
    domain: 'costes',
    title: 'Retries automáticos amplifican el gasto tras errores',
    problem:
      'Un error de API (o un test roto) dispara reintentos del agente: cada reintento re-envía el contexto completo; diez intentos = diez veces el coste sin progreso real.',
    rootCause:
      'El retry es la respuesta por defecto a fallos transitorios, pero el agente no distingue "fallo de red" (reintenta) de "fallo lógico" (cambia el enfoque).',
    steps: [
      'Clasifica el error antes de reintentar: 429/5xx de red → backoff exponencial; error lógico/test rojo → cambiar enfoque, no repetir.',
      'Límite duro de reintentos idénticos (2) en las reglas del agente; al llegar, resume el error y pide decisión humana.',
      'Con backoff real: espera 2s/4s/8s con jitter en vez de martillear; los 429 con Retry-After se respetan literalmente.',
      'Si el fallo es de test, primero lee el fallo concreto (1 aserción), no re-ejecutes la suite completa en cada intento.',
    ],
    codeFix: `# Regla de reintento (agente)
# Red (429/5xx): backoff 2s→4s→8s, máx 3, respetar Retry-After.
# Lógica/test: NO reintentar igual. Leer 1er fallo, cambiar
# enfoque. 2 intentos idénticos → ESCALAR al humano.`,
    prevention:
      'Reintentar sin clasificar es quemar dinero en bucle: red espera, lógica cambia de plan. Dos intentos idénticos = escalado.',
    tags: ['retries', 'backoff', 'gasto'],
    severity: 'media',
    frequency: 52,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'cost-05',
    domain: 'costes',
    title: 'Modelo caro usado para tareas triviales',
    problem:
      'El agente top de gama renombra variables, escribe CSS trivial o documenta funciones: calidad sobrada y coste inútil; el límite mensual se consume en tareas que otro modelo haría gratis.',
    rootCause:
      'La herramienta no enruta por dificultad: todo pasa por el modelo más potente disponible porque es el que está configurado por defecto.',
    steps: [
      'Enruta por dificultad: nomenclatura, formato, boilerplate y docs → modelo pequeño (o autocompletado); arquitectura, debugging difícil y revisión → modelo grande.',
      'En Copilot/Cursor usa el selector de modelo conscientemente; en Claude Code, delega lo trivial a modelos Haiku vía subagentes.',
      'Crea prompts plantilla para tareas repetitivas con el modelo barato (commits, changelogs, tests unitarios simples).',
      'Revisa el gasto mensual por categoría de tarea: si el 60% del coste está en tareas triviales, el enrutado está roto.',
    ],
    codeFix: `# Matriz de enrutado (reglas de equipo)
# Haiku/mini: commits, renames, docs, CSS, tests simples.
# Sonnet/medio: features estándar, refactors acotados.
# Opus/grande: arquitectura, debugging hard, review crítico.`,
    prevention:
      'El modelo caro es un especialista caro: enruta lo trivial al barato y reserva el top para donde de verdad cambia el resultado.',
    tags: ['enrutado', 'modelos', 'coste'],
    severity: 'media',
    frequency: 57,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'cost-06',
    domain: 'costes',
    title: 'Cuota semanal agotada a mitad de sprint',
    problem:
      'Llegas al miércoles sin límites disponibles justo cuando toca la parte crítica del sprint; el equipo improvisa con herramientas peores o se bloquea.',
    rootCause:
      'El consumo no se planifica contra el calendario: los primeros días absorben la cuota en tareas que podían esperar, y la parte crítica se queda sin munición.',
    steps: [
      'Presupuesto semanal por prioridad: reserva (mental o real) el ~40% de cuota para las tareas críticas del sprint; lo accesorio, con el resto.',
      'Congela el uso en tareas no críticas cuando el medidor baje del 30%: switch explícito a herramienta barata o trabajo sin IA.',
      'Agrupa lo pesado: un refactor grande consume menos en una sesión bien preparada (contexto mínimo) que en tres sesiones dispersas.',
      'Plan B operativo: pair programming humano + autocompletado para mantener avance mientras se recarga la cuota.',
    ],
    codeFix: `# Tablero de cuota (notion/issue pinned)
# Lun-Mar: cruft y tareas menores (30% máx)
# Mie-Jue: tareas críticas (reserva 40%)
# Vie: buffer + revisión + deuda pequeña
# Regla: <30% cuota → solo tareas críticas`,
    prevention:
      'La cuota es un recurso de sprint: se presupuesta por prioridad y se protege para lo crítico, no se gasta por orden de llegada.',
    tags: ['cuota', 'planificación', 'sprint'],
    severity: 'alta',
    frequency: 54,
    source: 'BBC · Claude Code usage limits 2025',
  },
  {
    id: 'cost-07',
    domain: 'costes',
    title: 'Embeddings e índices regenerados innecesariamente',
    problem:
      'El pipeline de RAG/agente re-embede todo el corpus en cada deploy (o cada arranque): horas de API de embeddings y coste creciente sin mejora de calidad.',
    rootCause:
      'El script regenera "por simplicidad" en lugar de cachear por hash de contenido; el coste crece linealmente con el tamaño del corpus y la frecuencia de deploys.',
    steps: [
      'Cachea por fingerprint: hash del contenido + modelo + versión de chunking → solo re-embed de lo cambiado.',
      'Persistencia del índice entre deploys (blob storage o DB vectorial con upsert), no reconstrucción en memoria cada vez.',
      'Lote y cota: embeddings por lotes con backoff y presupuesto diario; alerta al 80% del presupuesto.',
      'Reevalúa el chunking como cambio versionado (con re-embed completo planificado), no como ajuste diario.',
    ],
    codeFix: `// Solo re-embed lo cambiado
const fp = sha256(\`\${model}:\${chunkerV}:\${text}\`);
if (await db.embedding.findUnique({ where: { fp } })) continue;
await embed(text); await db.embedding.create({ data: { fp, ...} });`,
    prevention:
      'Embedding = cálculo caro cacheable: fingerprint por contenido/modelo y upsert. Regenerar todo por deploy es una fuga de dinero.',
    tags: ['embeddings', 'caché', 'rag'],
    severity: 'media',
    frequency: 34,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'cost-08',
    domain: 'costes',
    title: 'Contexto duplicado en sesiones paralelas',
    problem:
      'Tienes 3 sesiones del agente abiertas sobre el mismo repo: cada una leyó los mismos 50 archivos y mantiene su copia del contexto. Pagas el triple por el mismo conocimiento.',
    rootCause:
      'Cada sesión es un mundo aparte que reconstruye su comprensión desde cero; sin área de conocimiento compartida, la duplicidad es el estado natural.',
    steps: [
      'Serializa cuando toque el mismo código: una sesión activa por módulo; las demás esperan o trabajan en módulos disjuntos.',
      'Comparte comprensión vía archivos: notas de módulo (module-notes.md) que la primera sesión escribe y las demás leen en 2k tokens en vez de 80k.',
      'Para exploración paralela legítima (investigar 2 enfoques), acota cada sesión a su hipótesis y comparte solo conclusiones.',
      'Revisa el coste de tu flujo: 3 sesiones simultáneas = 3× tokens; si no hay ganancia real de tiempo, serializa.',
    ],
    codeFix: `# module-notes.md (escrito por la sesión 1)
# orders/: flujo checkout, idempotencia por header,
# tabla orders + items, tests en orders.test.ts (3 casos).
# No releer: confía en este resumen (actualízalo si cambias).`,
    prevention:
      'El conocimiento del repo debe existir una vez: notas versionadas que todas las sesiones consumen, no tres contextos paralelos pagando por lo mismo.',
    tags: ['paralelismo', 'duplicación', 'contexto'],
    severity: 'media',
    frequency: 41,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'cost-09',
    domain: 'costes',
    title: 'Factura API sorpresa a final de mes',
    problem:
      'El uso de la API (o del agente en CI, o los hooks automáticos) creció sin control; la factura llega multiplicada por 10 y nadie puede explicar qué tarea la generó.',
    rootCause:
      'No hay presupuesto ni alerta: el consumo crece con cada experimento, CI que llama a modelos, o agentes lanzados por cron, sin techo ni atribución.',
    steps: [
      'Presupuesto duro: límite de gasto en el proveedor (hard cap) + alertas al 50/80/95% al canal del equipo.',
      'Atribución: claves/metadata por proyecto o job para saber quién gasta qué; el CI usa una clave propia con cap propio.',
      'Audita los consumidores automáticos: crons, webhooks, bots de CI — cada uno con presupuesto y logs de uso.',
      'Revisión mensual de 15 minutos: top consumidores, coste por feature, decisiones de recorte (caché, modelo barato, menos contexto).',
    ],
    codeFix: `# Guardarraíles de gasto
# 1. Hard cap en proveedor + alerta 80% a Slack
# 2. Clave por proyecto/job (metadata de atribución)
# 3. CI con cap diario propio; sin cap, sin deploy del job`,
    prevention:
      'Sin presupuesto + atribución, la factura sorpresa es cuestión de tiempo: cap duro, claves por consumidor y revisión mensual.',
    tags: ['factura', 'presupuesto', 'alertas'],
    severity: 'alta',
    frequency: 47,
    source: 'Hacker News · hilo "The problem with vibe coding"',
  },
  {
    id: 'cost-10',
    domain: 'costes',
    title: 'Doble trabajo por sesiones paralelas sobre el mismo código',
    problem:
      'Dos sesiones del agente arreglan el mismo bug por caminos distintos (o uno refactoriza lo que la otra está editando): conflicto de merge, horas perdidas y el doble de tokens gastados.',
    rootCause:
      'Sin coordinación de acceso al código, el paralelismo crea carreras: cada sesión optimiza su tarea local y la colisión se descubre en el merge, ya pagada dos veces.',
    steps: [
      'Partición por módulo: mapa simple de "quién toca qué" antes de lanzar sesiones paralelas; archivos compartidos = cola, no paralelo.',
      'Rama por tarea y rebase frecuente: la colisión se detecta en el merge pequeño, no en el conflicto gigante del viernes.',
      'La sesión que va a tocar un área compartida lo anuncia (issue/comment) y la otra espera o cambia de módulo.',
      'Si la colisión ya ocurrió: elige una resolución como referencia, descarta la otra rama (con backup) y documenta por qué.',
    ],
    codeFix: `# Tablero de partición (antes de lanzar agentes)
# S1 → src/app/api/orders/* (rama feat/orders-idem)
# S2 → src/components/checkout/* (rama feat/checkout-ui)
# Compartido (lib/pricing.ts) → SOLO S1 esta semana`,
    prevention:
      'El paralelismo se diseña con partición de archivos: dos agentes en el mismo módulo no son velocidad, son dos facturas para el mismo diff.',
    tags: ['colisiones', 'paralelismo', 'merge'],
    severity: 'media',
    frequency: 44,
    source: 'r/cursor (Reddit)',
  },
]
