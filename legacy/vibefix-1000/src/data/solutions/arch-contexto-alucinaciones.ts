import type { Archetype } from '../core'

/** Dominio 1: Contexto y memoria (10 arquetipos reales) */
export const CTX_ARCHETYPES: Archetype[] = [
  {
    id: 'ctx-01',
    domain: 'contexto',
    title: 'El agente olvida decisiones tomadas hace media sesión',
    problem:
      'A mitad de sesión larga, el agente propone una solución que contradice una decisión ya tomada y confirmada (p. ej. "usaremos Zustand, no Redux") y reescribe código acorde a la decisión olvidada.',
    rootCause:
      'La ventana de contexto es finita y la atención del modelo se diluye: lo antiguo se trunca o pesa menos que los mensajes recientes. No existe un registro de decisiones que sobreviva al truncado.',
    steps: [
      'Crea un archivo DECISIONS.md en la raíz con formato "fecha — decisión — motivo" y exige al agente que lo actualice con cada decisión confirmada.',
      'Al iniciar cada tarea nueva dentro de la sesión, pide al agente que lea DECISIONS.md antes de planificar.',
      'Añade una regla permanente (CLAUDE.md / .cursorrules / copilot-instructions.md): "Cualquier decisión de arquitectura o stack debe registrarse en DECISIONS.md y respetarse."',
      'Antes de aceptar un diff, pide al agente que liste qué decisiones de DECISIONS.md afectan al cambio y cómo las respeta.',
    ],
    codeFix: `# DECISIONS.md
## 2026-02-10 · Estado global: Zustand (NO Redux)
Motivo: bundle menor + API simple. Rechazar propuestas de Redux.
## 2026-02-11 · Validación: zod en el borde del API
Nunca validar en el cliente como única barrera.`,
    prevention:
      'Convierte el registro de decisiones en parte del ritual: toda decisión verbal se materializa en el archivo en el mismo turno. Si no está en DECISIONS.md, no existe.',
    tags: ['context-drift', 'decisiones', 'memoria'],
    severity: 'alta',
    frequency: 72,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'ctx-02',
    domain: 'contexto',
    title: '/compact degrada el resumen y pierde detalles críticos',
    problem:
      'Al compactar el contexto, el resumen automático pierde nombres de variables, rutas exactas y requisitos finos; el agente empieza a "recordar mal" y a corregir código que ya estaba bien.',
    rootCause:
      'El compactado es una re-escritura con pérdida: el modelo resume lo semánticamente frecuente, no lo que a TI te importa (tests concretos, nombres de endpoints, decisiones de tipado).',
    steps: [
      'Antes de compactar, pide al agente que escriba un HANDOFF.md: objetivo actual, archivos tocados, decisiones, próximos pasos, errores conocidos.',
      'Compacta y luego reinyecta: pide que lea HANDOFF.md como primera acción tras el compactado.',
      'Haz el compactado proactivo al ~75% de contexto, nunca cuando ya está saturado (a más presión, peor resumen).',
      'Verifica post-compactado: "Enumera los 5 requisitos de esta sesión según tu memoria" y corrige huecos contra HANDOFF.md.',
    ],
    codeFix: `<!-- HANDOFF.md (plantilla) -->
# Objetivo: <tarea>
# Tocados: src/app/api/orders.ts, prisma/schema.prisma
# Decisiones: idempotencia con clave Idempotency-Key
# Pendiente: test de duplicados + revisar rollback
# No tocar: payments/legacy/* sin aprobación`,
    prevention:
      'Trata cada compactado como un relevo de turno: sin HANDOFF.md no se compacta. La disciplina del handoff elimina el 90% de las pérdidas.',
    tags: ['compact', 'handoff', 'degradación'],
    severity: 'alta',
    frequency: 64,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'ctx-03',
    domain: 'contexto',
    title: 'CLAUDE.md / reglas gigantes que el modelo ignora a medias',
    problem:
      'El archivo de instrucciones creció a cientos de líneas con historial, ADRs y preferencias; el modelo ignora reglas importantes mezcladas entre ruido y aplica las que no debería.',
    rootCause:
      'Las instrucciones compiten por atención limitada. Un archivo de 800 líneas con reglas contradictorias ("sé conciso" junto a 40 ejemplos) garantiza incumplimientos parciales.',
    steps: [
      'Divide: CLAUDE.md raíz solo con invariantes (<100 líneas), reglas por subdirectorio en archivos locales (packages/api/CLAUDE.md).',
      'Elimina duplicados y ejemplos muertos; cada regla debe ser accionable y verificable ("usa zod en routers", no "código de calidad").',
      'Separa en secciones SIEMPRE vs SOLO CUANDO (p. ej. reglas de DB solo dentro de src/db).',
      'Audita trimestralmente: borra toda regla que no se haya incumplido en 3 meses (si nunca se incumple, sobra ruido o es redundante con el código).',
    ],
    codeFix: `# CLAUDE.md (raíz — solo invariantes)
- Stack: Next.js 16 + TS + Prisma/SQLite. No proponer alternativas.
- Tests primero en cambios de lógica. Nunca saltar CI.
- Prohibido: push a main, editar infra/, eliminar TODOs ajenos.
- Detalles por módulo: ver CLAUDE.md del subdirectorio.`,
    prevention:
      'Piensa en las reglas como un código con presupuesto: cada línea compite por atención. Menos reglas, más obedecidas.',
    tags: ['reglas', 'CLAUDE.md', 'atención'],
    severity: 'media',
    frequency: 58,
    source: 'r/cursor (Reddit)',
  },
  {
    id: 'ctx-04',
    domain: 'contexto',
    title: 'El agente relee archivos enormes y agota el contexto en lecturas',
    problem:
      'Para tareas simples, el agente abre y reabre archivos de 3000 líneas, dumps de datos o lockfiles; el contexto se llena de ruido antes de empezar a trabajar.',
    rootCause:
      'El agente busca señal con fuerza bruta cuando no tiene un mapa del repo ni pistas de dónde está lo relevante. Los archivos generados (dist/, dumps, .next) son imanes de tokens.',
    steps: [
      'Añade al ignore del indexado y del agente: dist/, .next/, coverage/, *.lock, fixtures grandes y dumps.',
      'Proporciona un mapa: README de arquitectura con "qué vive dónde" para que el agente salte directo al módulo correcto.',
      'Prohíbe lecturas completas de archivos >500 líneas: primero pide índice (grep de funciones/exports) y luego lectura por rangos.',
      'Delega la exploración a un subagente/busca que solo devuelva el resumen y las líneas relevantes.',
    ],
    codeFix: `# .claude/settings.json (fragmento)
{ "permissions": { "deny": ["Read(dist/**)", "Read(.next/**)",
  "Read(coverage/**)", "Read(**/*.sql dump)"] } }
# En Cursor: @codebase ignores | En Aider: .aiderignore`,
    prevention:
      'El contexto es un presupuesto escaso: cada byte de build o lockfile es un byte robado a tu tarea. Ignora lo generado, mapea lo importante.',
    tags: ['tokens', 'lecturas', 'ignore'],
    severity: 'media',
    frequency: 61,
    source: 'GitHub Issues · Aider',
  },
  {
    id: 'ctx-05',
    domain: 'contexto',
    title: 'Sesión larga: repite trabajo ya hecho o contradice lo anterior',
    problem:
      'Tras 40+ intercambios, el agente re-escribe una función que ya arregló o reintroduce un bug corregido dos turnos atrás, quemando tiempo y confianza.',
    rootCause:
      'Sin memoria de trabajo estructurada, el "estado del proyecto" vive disperso en la conversación; a partir de cierto tamaño, el modelo reconstruye el estado desde los mensajes recientes y se equivoca.',
    steps: [
      'Mantén un TODO viva en un archivo (tasks.md) que el agente marque [x]/[ ] en cada turno; en Claude Code usa su sistema de tareas nativo.',
      'Cada hito completado → commit con mensaje descriptivo: el historial de git pasa a ser memoria externa autoritativa.',
      'Al retomar tras un paréntesis, pide: "Resume el estado según git log --oneline -10 y tasks.md antes de tocar nada".',
      'Cierra y abre sesión nueva por tarea: sesiones monolóticas de día completo degradan más rápido que varias sesiones enfocadas.',
    ],
    codeFix: `# tasks.md
- [x] Extraer servicio de pricing (PR #42)
- [x] Tests de regresión pricing
- [ ] Migrar checkout a nuevo pricing  <- AHORA
- [ ] Borrar pricing legacy tras QA`,
    prevention:
      'La memoria de trabajo debe ser externa y verificable: git + checklist escrita. La conversación es chat, no base de verdad.',
    tags: ['sesiones-largas', 'repetición', 'estado'],
    severity: 'alta',
    frequency: 69,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'ctx-06',
    domain: 'contexto',
    title: 'Contexto envenenado: el modelo "recuerda" bugs ya corregidos',
    problem:
      'Errores antiguos, stack traces ya resueltos o hipótesis descartadas siguen flotando en el contexto y el agente vuelve a "precauciones" inútiles o re-introduce defensas contra bugs inexistentes.',
    rootCause:
      'El historial conversacional es aditivo: lo descartado no desaparece, solo se marca verbalmente. Los modelos dan peso a lo mencionado recientemente, aunque esté invalidado.',
    steps: [
      'Cierra hipótesis formalmente: "Confirmado: el bug NO era X. Ignora la línea de investigación X de aquí en adelante."',
      'Cuando una línea de investigación muere, resume el hallazgo en una línea y pide que se descarte el resto de los mensajes de esa investigación.',
      'Si el veneno persiste, reinicia sesión limpia y reinyecta solo el estado válido (HANDOFF.md + git log).',
      'Evita pegar stack traces completos repetidamente: pega solo el frame relevante y el error de una línea.',
    ],
    codeFix: `User: "DESCARTADO: la causa no era el caché de Prisma
(Confirmado con logs). Causa real: índice faltante en user_id.
Memoria activa: solo hypótesis índice. No reintroducir cachés."`,
    prevention:
      'Gestiona el contexto como un workspace: lo que ya no vale se archiva explícitamente, no se deja pudrir en el historial.',
    tags: ['contaminación', 'hipótesis', 'reset'],
    severity: 'media',
    frequency: 55,
    source: 'Hacker News · hilo "The problem with vibe coding"',
  },
  {
    id: 'ctx-07',
    domain: 'contexto',
    title: 'Multi-repo: el agente no sabe dónde está la fuente de verdad',
    problem:
      'Con varios repos (frontend, backend, infra, lib compartida), el agente edita la copia equivocada o duplica lógica porque no tiene mapa de repositorios ni reglas de fronteras.',
    rootCause:
      'El agente solo ve el directorio abierto. Las dependencias entre repos (p. ej. tipos compartidos en un paquete publicado) son invisibles hasta que algo se rompe en el otro repo.',
    steps: [
      'Crea un REPOS.md con: para qué sirve cada repo, quién depende de quién, dónde viven los tipos compartidos y el orden de despliegue.',
      'Define fronteras duras en las reglas: "Los tipos de dominio SOLO se editan en packages/domain; nunca se redefinen localmente".',
      'Para cambios cross-repo, haz un plan explícito por repo con PRs enlazados y orden de merge (lib → consumidores).',
      'En monorepos parciales, usa git submodules/paquetes privados con versionado claro y exige bump de versión en el plan.',
    ],
    codeFix: `# REPOS.md
- packages/domain: tipados compartidos. Consumen: web, api.
  Cambios aquí → PR primero, bump minor, luego consumidores.
- api: Fastify + Prisma. No duplicar tipos de domain.
- web: Next.js. Solo consume DTOs validados de api.
Orden de deploy: domain → api → web`,
    prevention:
      'Cada repo nuevo debe actualizar el mapa (REPOS.md). Las fronteras no escritas no existen para un agente.',
    tags: ['multi-repo', 'fronteras', 'tipos'],
    severity: 'alta',
    frequency: 47,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'ctx-08',
    domain: 'contexto',
    title: 'Goal drift: el plan inicial se pierde tras varios pasos',
    problem:
      'Pediste X con restricciones Y; a los 15 pasos el agente está puliendo Z y ha relajado restricciones sin avisar (p. ej. "temporalmente" elimina la validación).',
    rootCause:
      'Cada turno re-pondera el objetivo desde los mensajes recientes; los requisitos originales se alejan en el historial y el objetivo se desliza hacia lo operativo inmediato.',
    steps: [
      'Escribe el PLAN.md antes de ejecutar: objetivo, restricciones inamovibles, criterio de "hecho" y fuera de alcance.',
      'Haz que el agente repita el objetivo y las restricciones al inicio de cada fase: "¿Qué estás construyendo y qué NO puedes tocar?"',
      'Establece un checkpoint de validación por fase: nada de avanzar sin confirmar que la fase cumple el criterio de hecho.',
      'Si detectas drift, detén, corrige el plan y empieza sesión nueva con el plan como primer mensaje.',
    ],
    codeFix: `# PLAN.md
Objetivo: checkout con idempotencia.
Restricciones INAMOVIBLES: sin cambios de schema; sin
dependencias nuevas; tests existentes pasan siempre.
Hecho = PR < 400 líneas + tests verdes + e2e checkout.
Fuera de alcance: refactor de payments.`,
    prevention:
      'El objetivo debe estar escrito, no conversado. Un plan de 10 líneas en archivo vale más que 30 mensajes de chat.',
    tags: ['goal-drift', 'plan', 'alcance'],
    severity: 'alta',
    frequency: 66,
    source: 'Estudio METR · jul 2025',
  },
  {
    id: 'ctx-09',
    domain: 'contexto',
    title: 'Sin memoria entre sesiones: re-explicar el proyecto cada día',
    problem:
      'Cada mañana empiezas el prompt con el mismo párrafo de contexto: stack, convenciones, qué se hizo ayer. Pierdes 20 minutos y el agente aún se equivoca.',
    rootCause:
      'Las sesiones de agentes son sin estado por defecto; sin mecanismos de persistencia (reglas + memoria + resúmenes), el onboarding se repite cada día.',
    steps: [
      'Bootstrap una vez: CLAUDE.md / .cursorrules / AGENTS.md con stack, convenciones, comandos y zonas vetadas.',
      'Institucionaliza el HANDOFF.md de fin de día (5 líneas: estado, pendiente, riesgos) y léelo al arrancar la sesión siguiente.',
      'Usa la memoria nativa disponible: Claude Code (memoria de proyecto), Windsurf (Cascade Memories), Cursor (reglas persistentes).',
      'Automatiza: un alias/scripts que arranque la sesión leyendo los tres archivos (reglas, handoff, git log -5).',
    ],
    codeFix: `# ~/.bashrc
alias session-start='claude "Lee CLAUDE.md, HANDOFF.md y
git log --oneline -10. Resume estado en 5 líneas y espera
instrucciones."'`,
    prevention:
      'El contexto repetitivo debe ser archivo versionado, no prompt. Si lo escribes dos veces, es un archivo que falta.',
    tags: ['memoria', 'onboarding', 'sesiones'],
    severity: 'media',
    frequency: 63,
    source: 'r/ClaudeAI (Reddit)',
  },
  {
    id: 'ctx-10',
    domain: 'contexto',
    title: 'Ventana saturada por logs de build y de tests',
    problem:
      'El agente ejecuta builds/tests que escupen miles de líneas de output; se queda pegado al contexto y las siguientes respuestas se degradan mientras el coste sube.',
    rootCause:
      'El output de herramientas (Vitest, tsc, webpack) es verboso por diseño; sin filtrado, cada ejecución inunda el contexto de stack traces repetidos.',
    steps: [
      'Configura salida silenciosa: --reporter=dot en Vitest, --pretty=false + filtrado de warnings en tsc, BUILD_QUIET=1 en toolchains.',
      'Redirige a archivo y pega solo el resumen: `bun test 2>&1 | tail -30 > /tmp/test.log` y comparte eso.',
      'Pide al agente que no repita el mismo comando completo en bucle: si falla, que extraiga el primer error y arregle antes de re-ejecutar.',
      'Para builds largos, usa watch/turbo cache y ejecuta solo los targets afectados al iterar.',
    ],
    codeFix: `# En vez de pegar 5000 líneas:
bun test --reporter=dot 2>&1 | tail -40 | tee /tmp/t.log
# El agente lee /tmp/t.log o solo el resumen pegado.
# Primer error primero: rg "FAIL|Error" /tmp/t.log | head -5`,
    prevention:
      'Logs son para grep, no para contexto. Enséñale al agente el patrón "ejecuta → filtra → muestra solo el fallo relevante".',
    tags: ['logs', 'saturación', 'tests'],
    severity: 'media',
    frequency: 57,
    source: 'GitHub Issues · anthropics/claude-code',
  },
]

/** Dominio 2: Alucinaciones de API y código (10 arquetipos reales) */
export const ALUC_ARCHETYPES: Archetype[] = [
  {
    id: 'aluc-01',
    domain: 'alucinaciones',
    title: 'Importa paquetes que no existen ("slopquatting")',
    problem:
      'El agente importa con confianza una librería plausible que no existe (o es un typosquatting real en npm/PyPI); `npm install` falla, o peor: instala un paquete malicioso con nombre similar.',
    rootCause:
      'El modelo predice el nombre más probable de una librería a partir de patrones del ecosistema; sin verificación contra el registro, lo plausible se presenta como real. Slopquatting ya se ha explotado en la práctica.',
    steps: [
      'Instala la regla: "Antes de añadir cualquier dependencia, lista la URL oficial (npmjs.com/p/... o docs) y pide confirmación."',
      'Verifica siempre: `npm view <paquete> version description repository` antes de aceptar el import; si no existe, pide alternativa con la API estándar.',
      'Fija el allowlist de dependencias del proyecto en las reglas del agente y bloquea instalaciones fuera de ella.',
      'Ejecuta `npx slopquat-check`-equivalente: revisa el diff de package.json en CI con herramientas de análisis de supply chain (Socket, snyk).',
    ],
    codeFix: `# Verificación previa a aceptar un import nuevo
npm view @company/json-utils version || echo "NO EXISTE"
# Si NO EXISTE → pedir implementación local o librería
# verificada en allowlist (package.json actual).`,
    prevention:
      'Toda dependencia nueva es un cambio de seguridad, no un detalle de estilo: revisión humana obligatoria + allowlist + verificación de registro.',
    tags: ['slopquatting', 'supply-chain', 'npm'],
    severity: 'critica',
    frequency: 51,
    source: 'arXiv 2509.19056 · Vibe Coding in Practice',
  },
  {
    id: 'aluc-02',
    domain: 'alucinaciones',
    title: 'Usa APIs deprecadas o de versiones antiguas',
    problem:
      'El código generado usa `ReactDOM.render`, `next/head` con App Router, `moment.js` u otras APIs muertas que el modelo aprendió en su ventana de entrenamiento.',
    rootCause:
      'El conocimiento del modelo tiene fecha de corte y mezcla épocas: mezcla Next 12/13/15, React 17/19, Node CJS/ESM. Sin anclaje a TU versión, tiende a la convención más común en su corpus.',
    steps: [
      'Declarar el stack y versiones exactas en las reglas del agente (framework, librerías clave y versión mayor).',
      'Ancla con documentación: inyecta los docs/CHANGELOG de tus versiones (o usa fetch de docs) y prohíbe APIs fuera de ellas.',
      'Configura el linter con las reglas de deprecación (eslint-plugin-deprecation, tsconfig de strict) para que la API muerta rompa el build, no producción.',
      'En migraciones, pide el mapa "antes → después" de la versión objetivo antes de escribir código.',
    ],
    codeFix: `# CLAUDE.md / copilot-instructions.md
Stack congelado: Next 16 (App Router, RSC), React 19,
Bun, Prisma 6, Tailwind 4.
- Prohibido: getServerSideProps, next/head, ReactDOM.render,
  moment (usar date-fns), APIs CJS (require).
- Fuente de verdad: docs/ del repo + CHANGELOG.`,
    prevention:
      'El modelo no adivina tu versión: la lee o la mezcla. Versiones exactas en reglas + linter que rompa = alucinación de época interceptada.',
    tags: ['deprecado', 'versiones', 'framework'],
    severity: 'alta',
    frequency: 70,
    source: 'Stack Overflow 2025',
  },
  {
    id: 'aluc-03',
    domain: 'alucinaciones',
    title: 'Inventa props de componentes (p. ej. de tu design system o shadcn)',
    problem:
      'El agente usa `<Button variant="glass" loading />` en componentes que no tienen esa prop; TypeScript lo salva a veces, pero en componentes genéricos o JS el error llega a runtime.',
    rootCause:
      'Sin la definición real del componente en contexto, el modelo extrapola props típicas de la librería y de tu propio estilo previo.',
    steps: [
      'Inyecta las definiciones reales: @file del componente (o su .d.ts) antes de pedir usos nuevos.',
      'Para design systems propios, genera un catálogo (docs/*.d.ts o Storybook) y referéncialo en las reglas como única fuente de props.',
      'Activa noImplicitAny y strict en el tsconfig del proyecto: la mayoría de props inventadas pasa a ser error de compilación, no sorpresa de runtime.',
      'Pide al agente, antes de escribir JSX nuevo, que liste las props disponibles del componente que va a usar.',
    ],
    codeFix: `// Antes de usar, verificar la firma real:
import type { ButtonProps } from "@/components/ui/button";
// ^ hover / go-to-definition. Si la prop no está en el
// tipo, no existe. Extender el tipo explícitamente,
// no "esperar que funcione".`,
    prevention:
      'Props que no están en el tipo no existen. TS strict + catálogo del design system convierten la alucinación en error de compilación barato.',
    tags: ['props', 'design-system', 'typescript'],
    severity: 'media',
    frequency: 62,
    source: 'r/cursor (Reddit)',
  },
  {
    id: 'aluc-04',
    domain: 'alucinaciones',
    title: 'Alucina endpoints de APIs de terceros',
    problem:
      'El agente escribe llamadas a endpoints de Stripe/Auth0/una API interna con rutas, parámetros o payloads inventados; falla en integración real con errores 404/400 crípticos.',
    rootCause:
      'El modelo tiene memoria estadística de la API, no su contrato actual. Endpoints renombrados, versionados o poco frecuentes son los más vulnerables a invención.',
    steps: [
      'Inyecta el contrato real: OpenAPI spec, schema de la API o un curl de ejemplo capturado, y exige que el código se limite a él.',
      'Prohíbe inventar: "Si no está en el spec adjunto, detente y pregunta" como regla permanente.',
      'Prueba la integración contra sandbox/stub real (msw, prism mock del OpenAPI) antes de aceptar el código.',
      'Aísla las llamadas externas en un módulo client tipado; revisa diffs solo ahí cuando toque integraciones.',
    ],
    codeFix: `// client/stripe.ts — solo rutas del spec oficial
import type { paths } from "@/types/stripe-oapi";
const get = <P extends keyof paths>(p: P) => p; // tipado
// Cada endpoint usado DEBE existir en paths, si no: build roto.`,
    prevention:
      'La API de terceros es territorio extranjero: sin contrato inyectado (OpenAPI/tipos), el agente improvisa. Contrato primero, código después.',
    tags: ['integraciones', 'openapi', 'contratos'],
    severity: 'alta',
    frequency: 54,
    source: 'GitHub Community · Copilot Discussions',
  },
  {
    id: 'aluc-05',
    domain: 'alucinaciones',
    title: 'Firma de función plausible pero incorrecta',
    problem:
      'El código llama a funciones con argumentos en orden o tipo erróneo (`slice(start, length)`, `test(path, options)`) — compila o pasa en JS y falla sutilmente en runtime.',
    rootCause:
      'Sin ver la firma real, el modelo rellena los argumentos "como suelen ser". Las APIs con overloads o parámetros opcionales ambiguos son las más propensas.',
    steps: [
      'Trabaja con el tipo visible: usa go-to-definition / inyecta el .d.ts de la función que se va a llamar.',
      'Pide al agente que verifique cada llamada nueva contra la firma real (léela del nodo de TS/definición) antes de proponerla.',
      'Añade tests unitarios de los límites: parámetros opcionales, orden, tipos de union — ahí es donde la firma inventada se delata.',
      'En JS puro, migra los módulos críticos a TS con checkJs para obtener verificación de firma gratis.',
    ],
    codeFix: `// jsconfig/tsconfig.json
{ "compilerOptions": { "checkJs": true, "strict": true } }
// La firma inventada deja de compilar: el error se mueve
// de producción a tu editor.`,
    prevention:
      'Llamadas a funciones sin su firma a la vista = coin flip. Types visible + strict mode convierten el azar en error inmediato.',
    tags: ['firmas', 'runtime', 'typescript'],
    severity: 'media',
    frequency: 59,
    source: 'Stack Overflow 2025',
  },
  {
    id: 'aluc-06',
    domain: 'alucinaciones',
    title: 'Mezcla convenciones de versiones de framework (Next 13 vs 15/16)',
    problem:
      'En el mismo commit conviven directivas de cliente con layouts de server components mal anidados, options de `fetch` obsoletas o configuraciones que ya no existen, con errores que solo aparecen en build.',
    rootCause:
      'Los frameworks de moda acumulan cambios de paradigma rápidos (pages→app, RSC, server actions); el modelo combina patrones de épocas distintas cuando no hay anclas de versión.',
    steps: [
      'Fija la versión y el paradigma en reglas: "App Router puro, RSC por defecto, client components solo donde hay estado/eventos".',
      'Mantén un NEXT_MIGRATION.md con los patrones válidos de tu versión (3-5 ejemplos canónicos) y prohíbe los invalidados.',
      'Usa los codemods oficiales (npx @next/codemod) para las migraciones en vez de pedir al agente que "actualice" a mano.',
      'Deja que el build sea el juez: typecheck + build en CI por PR; nunca aceptes diffs que no hayan compilado en CI.',
    ],
    codeFix: `# Regla de proyecto (App Router Next 16)
- Server Component por defecto; 'use client' SOLO con
  estado/eventos/hooks de navegador.
- Data fetching: async server components + fetch con
  { next: { revalidate } }. NO axios en RSC.
- Mutaciones: server actions. NO API routes para CRUD interno.`,
    prevention:
      'Un paradigma por repo, escrito y con ejemplos canónicos. Los codemods oficiales migran; el agente improvisa mezclas.',
    tags: ['nextjs', 'app-router', 'rsc'],
    severity: 'alta',
    frequency: 65,
    source: 'Discusiones Vercel / Next.js',
  },
  {
    id: 'aluc-07',
    domain: 'alucinaciones',
    title: 'Inventa variables de entorno o claves de configuración',
    problem:
      'El código generado lee `process.env.STRIPE_WEBHOOK_SECRET_ALT` o config keys que nunca definiste; en local falla silenciosamente con undefined y en producción revienta o, peor, se desactiva una protección.',
    rootCause:
      'El modelo asume configuración por convención de nombres. Sin un inventario visible de env vars reales, completa los huecos con nombres plausibles.',
    steps: [
      'Mantén .env.example como catálogo autoritativo y actualizado; valida en arranque con zod (fail-fast si falta algo).',
      'Regla para el agente: "Toda variable de entorno nueva debe añadirse a .env.example y documentar para qué sirve antes de usarse".',
      'Tipa el env: exporta un `env` validado (zod + dotenv) y prohíbe `process.env.X` directo fuera de ese módulo.',
      'En CI, corre el arranque con .env.example para detectar keys usadas pero no declaradas.',
    ],
    codeFix: `// lib/env.ts — única puerta de salida para env
import { z } from "zod";
export const env = z.object({
  DATABASE_URL: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
}).parse(process.env); // falla al arrancar si falta algo`,
    prevention:
      'Env no declarada no existe. Un módulo env tipado y validado convierte la alucinación de configuración en error de arranque claro.',
    tags: ['env', 'config', 'zod'],
    severity: 'alta',
    frequency: 56,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'aluc-08',
    domain: 'alucinaciones',
    title: 'Usa identificadores de modelos obsoletos (gpt-4-32k, claude-2…)',
    problem:
      'Código que invoca modelos retirados o nombres nunca existentes; la API devuelve model_not_found y el fallback del agente "prueba otro nombre" también inventado.',
    rootCause:
      'Los IDs de modelos cambian rápido y el corpus del modelo está lleno de nombres históricos. Es la alucinación más directa de memoria caducada.',
    steps: [
      'Lista los modelos válidos con la API real (`GET /v1/models` o tabla de docs) y pega el resultado en las reglas del agente.',
      'Centraliza los IDs en un módulo config (models.ts) con constantes tipadas; prohíbe strings de modelo inline.',
      'Añade un test de humo que llame al endpoint de models y verifique que las constantes existen.',
      'Al cambiar de modelo, actualiza una sola constante y revisa el changelog de deprecaciones del proveedor.',
    ],
    codeFix: `// lib/models.ts — generada desde GET /v1/models
export const MODELS = {
  fast: "gpt-5-mini",
  deep: "gpt-5.2",
  embed: "text-embedding-3-small",
} as const; // sin strings de modelo fuera de este archivo`,
    prevention:
      'ID de modelo = constante en config validada contra la API real, jamás string escrita por un LLM de memoria.',
    tags: ['modelos', 'api', 'config'],
    severity: 'media',
    frequency: 44,
    source: 'GitHub Issues · anthropics/claude-code',
  },
  {
    id: 'aluc-09',
    domain: 'alucinaciones',
    title: 'Escribe SQL válido para otro motor (Postgres vs SQLite vs MySQL)',
    problem:
      'Con SQLite local, el agente genera `ON CONFLICT (col) DO UPDATE` con sintaxis de Postgres, tipos JSONB o `RETURNING` mal soportados; falla solo al ejecutar, o peor, en producción con otro motor.',
    rootCause:
      'El SQL del corpus está dominado por Postgres/MySQL; el motor específico de tu proyecto (SQLite en dev, Postgres en prod…) requiere anclaje explícito del dialecto.',
    steps: [
      'Declara el motor y versión en las reglas: "SQLite 3.4x con Prisma: sin JSONB, sin ILIKE, ni Upsert complejo: usa el API de Prisma".',
      'Prohibido SQL crudo salvo necesidad demostrada; para lo habitual, el query builder/ORM tipado elimina el dialecto del problema.',
      'Añade tests de integración que corran contra el motor real en CI (no mocks de SQL).',
      'Para SQL crudo inevitable: usa parámetros tipados del driver y un test por query en transacción que haga rollback.',
    ],
    codeFix: `// En Prisma + SQLite, upsert del ORM, no SQL crudo:
await db.user.upsert({
  where: { email },
  update: { name },
  create: { email, name },
}); // cero dialecto, cero inyección, tipado extremo a extremo`,
    prevention:
      'Dialecto escrito en reglas + ORM por defecto + CI contra el motor real. El SQL crudo requiere aprobación y test.',
    tags: ['sql', 'dialectos', 'prisma'],
    severity: 'media',
    frequency: 49,
    source: 'Stack Overflow 2025',
  },
  {
    id: 'aluc-10',
    domain: 'alucinaciones',
    title: 'Código que compila pero la librería no hace eso',
    problem:
      'El uso de la librería es sintácticamente correcto pero semánticamente falso: opciones que no existen pero aceptadas por tipos laxos, comportamientos asumidos (reintentos, caché) que no hay.',
    rootCause:
      'La alucinación semántica no rompe tipos ni compilación: el modelo asume comportamiento estándar (retry, idempotencia) que la librería concreta no implementa.',
    steps: [
      'Inyecta el README/sección de la librería para el área que vas a usar y pide código solo con opciones documentadas.',
      'Escribe un test de comportamiento mínimo para cada asunción crítica ("¿retryea?", "¿cachea?") antes de construir encima.',
      'Revisa el package.json + changelog de la versión instalada (no la última publicada): el agente puede describir otra versión.',
      'Prefiere wrappers propios delgados sobre librerías críticas: el comportamiento asumido se testea una vez, en tu wrapper.',
    ],
    codeFix: `// test/assumptions/fetch-with-retry.test.ts
it("reintenta en 5xx (asunción del wrapper)", async () => {
  let calls = 0;
  const srv = mockServer({ handler: () => { calls++; return 503; } });
  await withRetry(() => fetch(srv.url));
  expect(calls).toBe(3); // si no, la lib no retryea: se sabe HOY
});`,
    prevention:
      'Nunca construyas sobre comportamiento asumido: cada "seguro que retryea" se convierte en un test de 5 líneas el mismo día.',
    tags: ['semántica', 'librerías', 'asunciones'],
    severity: 'alta',
    frequency: 53,
    source: 'Hacker News · hilo "The problem with vibe coding"',
  },
]
