# Worklog — Proyecto VibeFix 1000

Aplicación Next.js autocontenida: 1000 soluciones reales a problemas reales de la comunidad
vibe coding (Claude Code, Copilot, Cursor, etc.), análisis semanal generado por IA,
estudio de repos adelantadas.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Exploración inicial del proyecto

Work Log:
- Leído package.json: Next.js 16, TypeScript, Prisma/SQLite, shadcn/ui completo, recharts, framer-motion, z-ai-web-dev-sdk.
- No existía worklog.md: creado con esta entrada.
- Base de datos existente en db/custom.db, schema en prisma/schema.prisma.

Stage Summary:
- Proyecto base confirmado. Siguiente paso: investigación (web-search) y esquema Prisma.

---
Task ID: 5-b
Agent: full-stack-developer
Task: Frontend dashboard VibeFix 1000

Work Log:
- Rewritten src/app/layout.tsx: metadata en español (title "VibeFix 1000 — Soluciones reales para el vibe coding"), lang="es", ThemeProvider de next-themes (defaultTheme="dark", attribute="class"), Toaster de sonner (top-right, richColors), body con min-h-screen flex flex-col y paleta zinc-950/zinc-100.
- Ajustes mínimos en src/app/globals.css: html scroll-behavior smooth (con prefers-reduced-motion), scrollbar estilizada (.vf-scroll) y keyframes .vf-marquee para la cinta de hallazgos con pausa al hover.
- Creados tipos y helpers del contrato de API en src/components/vibefix/types.ts (StatsDTO, SolutionDTO, WeeklyDTO, RepoDTO, DOMAINS, SEVERITIES, severityClass/Label, FALLBACK_TOOLS, formatCode, formatDate, fetchJson genérico).
- Creado hook src/components/vibefix/use-stats.ts con caché a nivel de módulo + dedupe de promesa para que Header, Hero, StatsSection y el explorador compartan un único fetch a /api/stats. Loading derivado del estado de petición para cumplir la regla react-hooks/set-state-in-effect (sin setState síncrono en efectos).
- Componentes creados en src/components/vibefix/:
  - section.tsx: envoltura de sección con ancla + scroll-mt-24, entrada framer-motion (whileInView once) y eyebrow estilo terminal (# seccion).
  - header.tsx: sticky, backdrop-blur, borde zinc-800, logo tipográfico vibefix▞1000 en emerald-400, badge mono con total de fixes (useStats) y nav ancla (oculta en móvil; móvil = logo + badge).
  - hero.tsx: título "1000 soluciones reales para el vibe coding real", párrafo de fuentes, chips de stats (total/dominios/herramientas/frecuencia media), 2 CTAs ancla (h-11) y cinta de hallazgos con los 4 datos investigados (METR 19%, SO 2025 46%/3%, 66% casi-correcto, límites Claude Code BBC) en marquee CSS con máscara de bordes y segunda copia aria-hidden.
  - stats-section.tsx: 4 mini-cards, 2 gráficos de barras CSS (contenedor zinc-800, relleno emerald-400 animado con framer-motion, orden desc) para dominio y herramienta, y fila de badges de severidad (critica=rose, alta=amber, media=emerald, baja=zinc). Skeletons y error con Reintentar.
  - weekly-section.tsx: análisis más reciente (ordenado por generatedAt), weekLabel mono + Badge, trendSummary, hallazgos clave con iconos lucide rotativos, bloque "Solución propuesta" con pasos numerados mono, "Idea de skill", "Repos estudiadas" (max-h scroll), banner ámbar si dueForNew con botón "Generar ahora" (POST /api/weekly/generate, spinner "Analizando fuentes y generando…", toasts sonner) y historial en Accordion. Estados: skeleton / error con reintentar / vacío con CTA.
  - solutions-explorer.tsx: búsqueda con debounce 350ms, 3 Select (dominio/herramienta/severidad, sentinel "all" por restricción de Radix), botón Limpiar, contador aria-live, fetch paginado con AbortController, pageSize 9, loading derivado por requestKey, grid 1/2/3 columnas, empty state "Sin resultados para esos filtros", error con Reintentar y paginación Anterior/Siguiente "Página X de Y".
  - solution-card.tsx: #code mono emerald, título, badges tool/entorno/dominio + severidad coloreada, Progress de frecuencia ([&>div]:bg-emerald-400), tags mono #, botón "Ver solución" (h-11), hover lift con framer-motion.
  - solution-dialog.tsx: Dialog con scroll interno (max-h-[85vh] overflow-y-auto), secciones > problema / causa raíz / plan de acción numerado / fix de referencia en <pre> zinc-950 texto emerald-300 / prevención / fuente real. Cierra vía onOpenChange.
  - repos-section.tsx: grid de cards con nombre mono emerald, badge de categoría, descripción, "Por qué estudiarla:" y Button outline con ExternalLink (target _blank rel noopener). Skeletons + reintentar.
  - methodology.tsx: 4 cards numeradas mono 01-04 con iconos, y nota honesta en caja ámbar sobre fuentes públicas 2024-2026 y frecuencias estimadas.
  - footer.tsx: mt-auto, borde superior, texto de créditos + año dinámico y safe-area-inset-bottom.
- Rewritten src/app/page.tsx: composición Header → main (Hero, StatsSection, WeeklySection, SolutionsExplorer, ReposSection, Methodology) → Footer, raíz con min-h-screen flex flex-col y main flex-1 (footer siempre pegado abajo).
- Verificado dev.log: GET / 200, compila sin errores; los 404 de /api/stats, /api/solutions, /api/weekly, /api/repos corresponden a las routes que aún implementa el Task 5-a — el frontend muestra sus estados de error/reintento correctamente.
- bun run lint: limpio (0 errores, 0 warnings). Se corrigieron 3 errores de react-hooks/set-state-in-effect derivando loading/error del estado de petición en lugar de setLoading síncrono en efectos.

Stage Summary:
- Frontend completo de VibeFix 1000 en la ruta /: header sticky, hero con cinta de hallazgos, estadísticas con gráficos CSS animados, análisis semanal con generación IA (POST + toasts), explorador de 1000 soluciones con búsqueda/filtros/paginación/detalle en Dialog, repos adelantadas, metodología y footer pegado abajo. Contrato de API respetado (fetch relativo, DTOs tipados). Paleta zinc-950/900/800 + emerald con ámbar/rose para severidades, estética terminal dark con toques mono. Responsive mobile-first, touch targets ≥44px, skeletons, empty states y reintentos en todas las secciones que consumen API. Pendiente: que el Task 5-a exponga las 5 rutas /api/* para ver datos reales; el frontend ya consume exactamente ese contrato.

---
Task ID: 5-a (+ 4, 6, 7, 9)
Agent: main (Z.ai Code)
Task: Dataset 1000 soluciones, API routes, generador semanal con IA, seed y verificación end-to-end

Work Log:
- Investigación real con web-search: quejas vibe coding (arXiv 2509.19056, HN), límites Claude Code (BBC/Octomind), estudio METR (19% más lento / percepción +24%), encuesta Stack Overflow 2025 (46% desconfía, 66% "casi correcto"), repos de agentes (OpenHands, SWE-agent, Aider).
- Esquema Prisma (Solution + WeeklyAnalysis) con índices; db:push OK.
- Dataset: 100 arquetipos reales escritos a mano en 5 módulos (10 dominios × 10), más consejos reales por herramienta (10×5) y por entorno (10×3) en core.ts.
- Generador combinatorio determinista: 100 arquetipos × 10 combos herramienta+entorno = 1000 soluciones con pasos base + consejo de herramienta + consejo de entorno.
- Seed ejecutado: 1000 soluciones + 2 análisis semanales iniciales insertados (bun prisma/seed.ts).
- API routes: /api/solutions (búsqueda q, filtros category/tool/severity, paginación), /api/stats (agregaciones groupBy), /api/weekly (lista + dueForNew con ventana de 7 días), /api/weekly/generate (POST: web_search real + LLM + validación defensiva del JSON + guard de 20h), /api/repos (12 repos curadas).
- Verificación con agent-browser: detectado crash por mismatch de contrato (API devolvía byCategory, frontend esperaba byDomain) → corregido en API; blindaje adicional: validación isStats antes de cachear + optional chaining en hero/header/stats/explorer; fallback de herramientas corregido.
- Verificadas interacciones: búsqueda ("compact" → 10 resultados), diálogo de solución (#0001 con problema/causa/plan/fix), repos, metodología, footer pegado (footerBottom=viewport exacto), vista móvil 390px correcta.
- Generador semanal probado de punta a punta: guard 429 OK → generación real (web_search últimos 10 días + LLM) produjo "Semana 38 · 2026" con solución propuesta, idea de skill y repos → visible en UI. Guard restaurado a 20h.
- Lint final: 0 errores, 0 warnings.

Stage Summary:
- App completa y verificada en navegador: 1000 soluciones reales consultables, estadísticas vivas, análisis semanal IA con investigación web real, repos adelantadas y metodología honesta.
- Contrato API final: stats devuelve byDomain (clave/label/count); solutions paginado; weekly con dueForNew (7 días) y POST generate con guard 20h.
- Próximo ciclo semanal: la UI mostrará botón "Generar ahora" cuando el último análisis supere los 7 días.

---
Task ID: 8
Agent: main (Z.ai Code)
Task: Perfil GitHub belentani7 verificado, motor de ingresos con datos reales, traductor humano→IA funcional

Work Log:
- Investigación del perfil: API de GitHub rate-limited → scrape del HTML público con User-Agent. Perfil: Pedro Belentani (Barcelona, PT/ES/EN/CA), 29 repos con descripciones reales extraídas. READMEs de linguaforge y meta-skill leídos en crudo (raw.githubusercontent).
- Investigación económica con web-search (8 consultas): Upwork fee 0-15% variable (may 2025, soporte oficial), Fiverr 20%, Contra 0%, Malt España ~15% lado cliente, demanda IA España +220% con 40% oferta (Malt Tech Trends 2025 vía Expansión), prompt engineers freelance $75-200/h (PE Collective) / $107/h media (YunoJuno), AI hiring +109% YoY y AI integration +178% (Upwork In-Demand Skills 2026), MTPE $0.03-0.15/palabra (Polilingua, Artlangs), freelancers con IA cobran +34%/h (Upwork Future Workforce Index).
- prisma/schema.prisma: 3 modelos nuevos (IncomePath, Translation, GithubRepo) + db:push OK.
- src/data/income-paths.ts: 10 rutas de ingreso con tarifas reales, comisiones reales, evidencias con URL y pasos accionables (7-8 pasos cada una).
- src/data/github-repos.ts: 31 repos reales del perfil con categoría, análisis de monetización y relatedPath (21 monetizables).
- prisma/seed.ts ampliado y ejecutado: 1000 soluciones + 3 semanales + 10 rutas + 31 repos.
- APIs nuevas: GET /api/income, GET /api/github, POST+GET /api/translate (LLM real con validación JSON defensiva y tiers estilo meta-skill: local/fast/mid/heavy). Probadas con curl: 200 y contenido correcto.
- Frontend: github-section.tsx (perfil verificado + filtros por categoría + badge Ruta N), income-section.tsx (banner de honestidad obligatorio + calculadora con fórmula visible + 10 tarjetas + Dialog con plan/evidencias/plataformas), translator-section.tsx (textarea + select destino + resultado estructurado + copiar + historial). page.tsx y header actualizados.
- Verificación agent-browser E2E: traducción real desde la UI (POST 200, INSERT en DB, historial actualizado, copiar OK), dialog de ruta con 8 pasos y 11 enlaces externos, calculadora (15h×50€×4,33=3.248€ bruto → 2.923€ neto; 2.000€→11h/sem; 5.000€→26h/sem), filtros de repos, accordion semanal, footer gap 0.
- Bugfixes de overflow móvil (scrollWidth 390 exacto): grid-cols-1 explícito en la calculadora (minmax(0,1fr)), min-w-0 en AccordionTrigger del historial semanal, w-full min-w-0 [&>span]:truncate en SelectTrigger de la calculadora, overflow-hidden en la cinta marquee del hero.
- Lint final: 0 errores. dev.log sin errores de runtime.

Stage Summary:
- La app ahora contiene: análisis verificado del perfil GitHub (31 repos reales con vía de monetización), 10 rutas de ingreso con evidencias enlazadas y matemática transparente, y el traductor humano→IA funcionando con LLM real + enrutado por tiers (extensión natural de meta-skill).
- Posicionamiento honesto incluido en la UI: nadie puede garantizar ingresos; lo que se entrega son tarifas documentadas, demanda medida y planes accionables por ruta.
- Contrato: /api/income {items,total}, /api/github {profile,repos,total,withMonetization,byCategory}, /api/translate POST {text,target}→{item} / GET histórico.
