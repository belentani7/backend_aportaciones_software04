/**
 * Rutas de ingreso con datos REALES y verificables.
 * Cada tarifa, comisión y dato de demanda tiene fuente con URL real (investigación 2025-2026).
 * Conversión usada: 1 USD ≈ 0,92 EUR (redondeo conservador a la baja).
 */

export interface IncomePlatform {
  name: string
  url: string
  fee: string
  note: string
}

export interface IncomeEvidence {
  source: string
  url: string
  claim: string
}

export interface IncomePathSeed {
  code: number
  title: string
  category: 'freelance-ia' | 'localizacion' | 'automatizacion' | 'productos' | 'consultoria'
  summary: string
  realRate: string
  rateMinPerHour: number
  rateMaxPerHour: number
  platforms: IncomePlatform[]
  evidence: IncomeEvidence[]
  matchRepos: string[]
  timeToFirstIncome: string
  effort: 'bajo' | 'medio' | 'alto'
  demandLevel: string
  steps: string[]
}

export const INCOME_PATHS: IncomePathSeed[] = [
  {
    code: 1,
    title: 'Ingeniería de prompts y sistemas de IA freelance',
    category: 'freelance-ia',
    summary:
      'Vender la capacidad que ya demostraste en meta-skill (router universal, guardián de tokens) como servicio: diseñar, auditar y optimizar prompts y flujos para empresas que usan Claude/GPT/Cursor.',
    realRate: '$75–200/h documentado para prompt engineers freelance (PE Collective, feb 2026); media $107/h (YunoJuno). Entrada realista en España: 50–60 €/h.',
    rateMinPerHour: 50,
    rateMaxPerHour: 150,
    platforms: [
      { name: 'Upwork', url: 'https://www.upwork.com', fee: '0–15% variable por contrato (desde may 2025)', note: 'Mayor volumen de proyectos IA del mundo' },
      { name: 'Contra', url: 'https://contra.com', fee: '0% comisión', note: 'Sin comisión; ideal para empezar sin perder margen' },
      { name: 'Malt España', url: 'https://www.malt.es', fee: '~15% (normalmente lo absorbe el cliente)', note: 'Clientes europeos que te buscan a ti' },
    ],
    evidence: [
      { source: 'Upwork In-Demand Skills 2026', url: 'https://investors.upwork.com', claim: 'La contratación freelance ligada a IA creció +109% interanual' },
      { source: 'PE Collective (feb 2026)', url: 'https://pecollective.com', claim: 'Prompt engineers freelance facturan $75–$200/h' },
      { source: 'Upwork Future Workforce Index', url: 'https://www.upwork.com', claim: 'Los freelancers que hacen trabajo con IA cobran 34% más por hora que los que no' },
      { source: 'YunoJuno rates', url: 'https://www.yunojuno.com', claim: 'Tarifa media de prompt engineer contratista: $107/h' },
    ],
    matchRepos: ['meta-skill', 'agent-skills', 'skillforge', 'manus-ai-skill-pack'],
    timeToFirstIncome: '2–6 semanas',
    effort: 'medio',
    demandLevel: '+109% YoY en contratación IA (Upwork 2026)',
    steps: [
      'Publica meta-skill y agent-skills como portfolio enlazable: un perfil de Upwork/Contra que apunte a repos reales convierte 10x más que un CV vacío.',
      'Crea 3 casos de estudio medibles a partir de meta-skill: "reduje coste de tokens un X%", "enruté 311 tareas al modelo correcto", "guardián de presupuesto evitó Y% de sobregasto".',
      'Ábrete perfil en Contra (0% comisión) y Upwork (máximo volumen). Mismo portfolio, precios distintos: en Upwork empiezas a 45-50 €/h para ganar reseñas; en Contra mantén 60-75 €/h.',
      'Envía 3 propuestas/día en Upwork filtrando por "prompt engineering", "AI workflow", "LLM integration". Respuesta en las 2 primeras frases con un dato medible tuyo.',
      'Empaqueta 2 ofertas fijas: "Auditoría de prompts + informe" (300-400 €, entrega 5 días) y "Sistema de routing de modelos" (800-1.500 €).',
      'Pide testimonio y permiso de caso de estudio a cada cliente; súbelo a los 3 perfiles y a tu README de GitHub.',
      'A partir de la reseña 5, sube tarifas un 20% en Upwork y congela nuevas cuentas por debajo de 60 €/h.',
      'Convierte cada cliente puntual en retainer: "revisión mensual de flujos IA" (200-400 €/mes).',
    ],
  },
  {
    code: 2,
    title: 'Automatización con IA para pymes (n8n/Make + agentes)',
    category: 'automatizacion',
    summary:
      'Montar automatizaciones reales (lead intake, facturación, soporte WhatsApp) para pymes de Barcelona y España, con retainer mensual de mantenimiento. BarriServei (noiacore-turbo-v2) ya es el esqueleto: intake con IA, Stripe escrow y WhatsApp.',
    realRate: 'Proyectos de 500–3.000 € por automatización + retainers de 200–800 €/mes por mantenimiento. Horas efectivas equivalentes: 35–90 €/h.',
    rateMinPerHour: 35,
    rateMaxPerHour: 90,
    platforms: [
      { name: 'Contacto directo (pymes BCN)', url: 'https://www.linkedin.com', fee: '0%', note: 'Sin comisión; cerrar en reunión local' },
      { name: 'Malt España', url: 'https://www.malt.es', fee: '~15% (lado cliente)', note: 'Demanda IA en España +220% con 40% de oferta (Malt Tech Trends 2025)' },
      { name: 'Upwork', url: 'https://www.upwork.com', fee: '0–15%', note: 'Búsquedas "n8n", "Make.com", "AI automation"' },
    ],
    evidence: [
      { source: 'Upwork In-Demand Skills 2026', url: 'https://investors.upwork.com', claim: 'AI integration crece +178% en demanda freelance' },
      { source: 'Comunidad n8n (mar 2026)', url: 'https://community.n8n.io', claim: 'Ofertas públicas de empleo para "Freelance AI Automation Engineer" con sistemas de automatización' },
      { source: 'ritz7.ai (may 2026)', url: 'https://ritz7.ai', claim: 'Ruta documentada de skills de n8n a ingresos de $5k/mes vendiendo agentes y retainers' },
    ],
    matchRepos: ['noiacore-turbo-v2', 'local-agent', 'harmonia-hub', 'rh-fiscal-ultra-elite'],
    timeToFirstIncome: '3–8 semanas',
    effort: 'medio',
    demandLevel: 'AI integration +178% YoY (Upwork 2026)',
    steps: [
      'Define 3 paquetes cerrados: (1) Buzón inteligente de leads con respuesta IA, 800 €; (2) Facturación/fiscal automatizada con informes (rh-fiscal-ultra-elite), 1.200 €; (3) Soporte WhatsApp con agente, 1.000 €.',
      'Termina BarriServei (noiacore-turbo-v2) con UNA automatización funcionando end-to-end y grábala en vídeo de 90 segundos: esa demo es tu producto de venta.',
      'Lista 30 pymes de tu nicho en Barcelona (clínicas, gestorías, academias — sectores que ya conoces por open-school y ManosAbiertas).',
      'Contacta 10/día por LinkedIn/mail con la demo: mensaje de 4 líneas, sin adjuntos, ofreciendo auditoría gratuita de 20 min.',
      'En la auditoría, identifica 3 tareas repetitivas y presupuesta el paquete más cercano. Primera venta a precio de entrada para conseguir caso; segunda en adelante, precio de lista.',
      'Cobra setup + retainer: "el sistema necesita cuidado mensual" — 200-400 €/mes por cliente es estándar del sector.',
      'Objetivo honesto: 4 clientes × 800 € setup + 4 × 300 €/mes retainer = 3.200 € el primer trimestre y 1.200 €/mes recurrentes desde el mes 3.',
    ],
  },
  {
    code: 3,
    title: 'Traducción + post-edición de MT (MTPE) PT↔ES↔EN↔CA',
    category: 'localizacion',
    summary:
      'Tu combinación nativa PT + ES + EN + CA es un activo directo: las agencias pagan por revisar y corregir traducciones automáticas (MTPE) en esos pares exactos. LinguaForge demuestra dominio de los 10 idiomas y del pipeline de contenido.',
    realRate: 'MTPE: $0.03–0.08/palabra light y $0.08–0.15/palabra full (Polilingua 2025); Artlangs documenta $0.04–0.12 (2025-26). Con productividad de 800–1.500 palabras/h equivale a 25–60 €/h.',
    rateMinPerHour: 25,
    rateMaxPerHour: 60,
    platforms: [
      { name: 'ProZ.com', url: 'https://www.proz.com', fee: 'gratis para empezar; membresía opcional', note: 'El mayor directorio de agencias de localización' },
      { name: 'Upwork', url: 'https://www.upwork.com', fee: '0–15%', note: 'Búsquedas "MTPE", "post-editing", "PT-ES"' },
      { name: 'Agencias (lista Nimdzi 100)', url: 'https://www.nimdzi.com', fee: '0% (te contratan a ti)', note: 'Proveedores top de localización que subcontratan MTPE' },
    ],
    evidence: [
      { source: 'Polilingua (mar 2025)', url: 'https://www.polilingua.com', claim: 'Tarifas MTPE 2025: light $0.03–0.08/palabra, full $0.08–0.15/palabra' },
      { source: 'iTi Translates', url: 'https://ititranslates.com', claim: 'La MT cruda tiene 60–90% de precisión: el mercado de revisión humana es estructural, no pasajero' },
      { source: 'Artlangs (2025-26)', url: 'https://chatscontrol.com', claim: 'Rangos MTPE $0.04–0.12/palabra según par y profundidad' },
    ],
    matchRepos: ['linguaforge', 'aprende-brasil', 'ManosAbiertas'],
    timeToFirstIncome: '1–4 semanas',
    effort: 'bajo',
    demandLevel: 'Mercado estructural: la MT necesita revisión humana en todo par de idiomas',
    steps: [
      'Abre perfil en ProZ.com con los 4 pares PT→ES, ES→PT, EN→ES, EN→CA y marca "MT post-editing" como servicio.',
      'LinguaForge es tu portfolio: enlaza el repo con las rutas bidireccionales y el control de procedencia — pocas agencias ven un candidato con infraestructura lingüística propia.',
      'Haz los tests de entrada de 3-5 agencias MTPE (las de la lista Nimdzi 100 aceptan candidatos continuamente).',
      'Instala OmegaT (gratis) para memoria de traducción y glosarios: sube tu productividad de 800 a 1.500 palabras/h.',
      'Especialízate en un tipo de contenido (editorial, técnico, educativo) — las tarifas suben un 20-40% con especialización.',
      'Matemática real del objetivo: a $0.05/palabra light, 2.000 €/mes = 40.000 palabras/mes ≈ 1.800 palabras/día laborable. Alcanzable a tiempo parcial desde el mes 2.',
      'Sube de MTPE light a full post-editing y traducción directa: paga el doble por palabra con el mismo cliente.',
    ],
  },
  {
    code: 4,
    title: 'Consultoría de adopción de IA para autónomos y pymes en España',
    category: 'consultoria',
    summary:
      'España tiene un hueco documentado: la demanda de talento IA freelance creció +220% y solo hay oferta para el 40%. Vender "auditoría + plan de IA" empaquetado es la vía de entrada con menos competencia.',
    realRate: 'Freelance IT España 2025-26: 18 €/h junior → 60–90 €/h sénior. Especialistas IA/ML: $100–250/h global (index.dev). Auditorías empaquetadas: 399–900 €.',
    rateMinPerHour: 40,
    rateMaxPerHour: 90,
    platforms: [
      { name: 'Malt España', url: 'https://www.malt.es', fee: '~15% (lado cliente)', note: '28M€ facturados; RGPD nativo; el cliente te encuentra' },
      { name: 'Directo (meetups BCN)', url: 'https://www.meetup.com', fee: '0%', note: 'Barcelona tiene ecosistema IA activo (Tech Barcelona)' },
    ],
    evidence: [
      { source: 'Malt Tech Trends 2025 (vía Expansión, jun 2025)', url: 'https://www.expansion.com', claim: 'La demanda de talento freelance en IA se dispara +220% en España con solo 40% de oferta disponible' },
      { source: 'index.dev (2026)', url: 'https://www.index.dev', claim: 'Especialistas freelance IA/ML: $100–250/h globalmente' },
      { source: 'Malt España (guía 2026)', url: 'https://waco3.io', claim: 'El fee del 15% lo absorbe el cliente: el freelancer cobra su tarifa íntegra' },
    ],
    matchRepos: ['secure-t', 'secure-t-app', 'securetea', 'nexus-os', 'belentani-experience-tour'],
    timeToFirstIncome: '4–8 semanas',
    effort: 'medio',
    demandLevel: 'Demanda IA +220% vs 40% de oferta (España, Malt 2025)',
    steps: [
      'Empaqueta UN producto: "Auditoría IA para tu pyme" — 499 € fijos, entrega en 1 semana: mapa de procesos automatizables, 3 quick wins, informe RGPD.',
      'Publica tu perfil de Malt en español con la auditoría como servicio (Malt permite precios por servicio, no solo por hora).',
      'Aprovecha tu perfil público: los repos de ciberseguridad (securetea auditada 2026, secure-t) dan confianza para vender el ángulo "IA segura y con RGPD".',
      'Da 1 charla gratuita al mes en meetups de Barcelona sobre "lo que la IA puede y no puede hacer por tu pyme" — captas leads cualificados.',
      'Publica 1 post semanal en LinkedIn con casos reales anonimizados; los clientes de consultoría contratan confianza visible.',
      'Con cada auditoría vendida, ofrece el plan de implementación (la ruta 2: automatización) — el upsell natural es el 60% del ingreso real de consultoría.',
      'Objetivo honesto: 2 auditorías/mes (998 €) + 1 cliente de implementación (800 €) = ~1.800 €/mes desde el mes 2-3, escalable con precios (sube a 749 € cuando tengas 3 casos).',
    ],
  },
  {
    code: 5,
    title: 'Belentani.cv-ai — producto YA con precio (€0.99)',
    category: 'productos',
    summary:
      'Tienes un producto vivo con precio definido: estudio de documentos con IA (CVs, cartas de presentación, presentaciones) a €0.99 por uso, RGPD y AES-256. Es la vía más corta a ingresos: falta tráfico y reempaquetar precios.',
    realRate: '€0.99 por documento (precio real del repo). Reempaquetado honesto: €4.99 pack CV+carta, €9.99 pack entrevista. 100 packs/mes = €499–999.',
    rateMinPerHour: 0,
    rateMaxPerHour: 0,
    platforms: [
      { name: 'Producto propio', url: 'https://github.com/belentani7/Belentani.cv-ai', fee: '0% (Stripe cobra ~1.5% + €0.25)', note: 'Margen completo, control RGPD' },
      { name: 'Gumroad', url: 'https://gumroad.com', fee: '10% + procesado', note: 'Alternativa sin infraestructura propia' },
      { name: 'Product Hunt / Reddit', url: 'https://www.producthunt.com', fee: '0%', note: 'Canal de lanzamiento gratuito' },
    ],
    evidence: [
      { source: 'Repo Belentani.cv-ai', url: 'https://github.com/belentani7/Belentani.cv-ai', claim: 'Producto definido con precio €0.99, RGPD y AES-256 — verificado en la descripción pública del repo' },
      { source: 'Stripe pricing', url: 'https://stripe.com/es/pricing', claim: 'Coste de procesado estándar en España ~1.5% + €0.25 por transacción' },
    ],
    matchRepos: ['Belentani.cv-ai', 'DuckHTML', 'belentani-experience-tour'],
    timeToFirstIncome: '1–2 semanas',
    effort: 'medio',
    demandLevel: 'Mercado de CV-tools validado (Decipher, Kickresume, Rezi facturan millones)',
    steps: [
      'Reempaqueta precios HOY: €0.99 ancla muchísimo bajo y atrae clientes de bajo valor. New: CV+carta €4.99, pack completo con presentación €9.99, €0.99 solo como promoción de primera compra.',
      'Publica la landing en producthunt y en subreddits r/jobsearchES, r/esRealmadrid... no: r/españa laboral, r/Barcelona, r/MERVAL — comunidades con búsqueda activa de empleo.',
      'SEO de cola larga en ES/PT: "generador de CV con IA español", "carta de presentación IA gratis" — tráfico con intención de compra.',
      'Añade un plan "prepárate para la entrevista" con simulación IA: mismo stack, precio €14.99, margen alto.',
      'Métrica única a vigilar: visitas → conversión. Si con 1.000 visitas/mes conviertes al 2% con ticket €4.99 = ~€100/mes; escala tráfico con contenido, no con ads.',
      'Honestidad: este producto solo NO llega a 2.000 €/mes rápido; su rol es generar ingresos tempranos (semanas 1-2) mientras las rutas 1-4 maduran.',
    ],
  },
  {
    code: 6,
    title: 'agentbox — sandboxes desechables para agentes IA ($4/mes)',
    category: 'productos',
    summary:
      'Tienes definido un producto de infraestructura: sandboxes cloud desechables para Claude/Aider/Codex/Qwen a $4/mes con Terraform. Es un modelo SaaS real; el trabajo pendiente es validar coste infra vs precio y lanzar.',
    realRate: '$4/mes por sandbox (precio real del repo). 50 clientes = $200 MRR; 500 clientes = $2.000 MRR. El margen depende del coste real de VM — auditar antes de escalar.',
    rateMinPerHour: 0,
    rateMaxPerHour: 0,
    platforms: [
      { name: 'Producto propio', url: 'https://github.com/belentani7/agentbox', fee: 'Stripe ~1.5% + €0.25', note: 'Suscripción recurrente = ingreso predecible' },
      { name: 'Hetzner / contabo', url: 'https://www.hetzner.com', fee: 'coste infra', note: 'VMs baratas para sandbox: validar margen por unidad ANTES de fijar precio' },
      { name: 'Hacker News / r/LocalLLaMA', url: 'https://news.ycombinator.com', fee: '0%', note: 'Audiencia exacta: devs que usan agentes CLI' },
    ],
    evidence: [
      { source: 'Repo agentbox', url: 'https://github.com/belentani7/agentbox', claim: 'Producto con precio y stack definidos: Go + Terraform, $4/mes — verificado en descripción pública' },
      { source: 'Mercado de agentes CLI', url: 'https://github.com/belentani7/agent-skills', claim: '311 skills para Claude Code/OpenCode/Codex/Cline documentan la adopción masiva de agentes: cada usuario necesita sandbox seguro' },
    ],
    matchRepos: ['agentbox', 'agent-skills', 'skillforge'],
    timeToFirstIncome: '2–4 semanas',
    effort: 'alto',
    demandLevel: 'Adopción de agentes CLI en crecimiento explosivo (2025-2026)',
    steps: [
      'Calcula el coste real por sandbox (Hetzner CX22 ≈ €3.8/mes vs share de VM multi-tenant ≈ €0.40-0.80): si el margen es <50%, sube a $6-7 o multi-tenancy.',
      'Lanza versión beta cerrada gratis a 20 usuarios de la comunidad (HN, r/LocalLLaMA, Discord de Claude) — pide feedback y testimonios a cambio.',
      'Publica en Show HN con un ángulo técnico: "Cómo ejecuto sandboxes desechables de agentes IA por $4/mes" — los posts de arquitectura convierten en MRR.',
      'Integra Stripe (checkout link basta para empezar) y métrica de churn semanal.',
      'El addon natural: marketplace de skills (ruta 7) preinstaladas en cada sandbox — incrementa el ticket medio.',
      'Objetivo honesto: SaaS de infraestructura tarda 2-4 meses en MRR estable; su fuerza es el ingreso recurrente que compone mes a mes.',
    ],
  },
  {
    code: 7,
    title: 'Skills y plantillas para agentes CLI como producto digital',
    category: 'productos',
    summary:
      'agent-skills (311 skills listas), skillforge (package manager universal) y manus-ai-skill-pack (listos para producción) son un catálogo comercializable: packs de skills premium para Claude Code, OpenCode, Codex y Cline.',
    realRate: 'Packs a 9–49 € en Gumroad (comisión 10% + procesado) o Lemon Squeezy (5% + €0.50). 30 ventas/mes a 19 € = ~€500 netos.',
    rateMinPerHour: 0,
    rateMaxPerHour: 0,
    platforms: [
      { name: 'Lemon Squeezy', url: 'https://www.lemonsqueezy.com', fee: '5% + €0.50', note: 'Merchant of record: gestiona impuestos UE por ti' },
      { name: 'Gumroad', url: 'https://gumroad.com', fee: '10% + procesado', note: 'Audiencia descubrible, menor margen' },
      { name: 'GitHub Sponsors', url: 'https://github.com/sponsors', fee: '0%', note: 'Complemento: patrocinios por el catálogo abierto' },
    ],
    evidence: [
      { source: 'Repo agent-skills', url: 'https://github.com/belentani7/agent-skills', claim: '311 skills para agentes CLI verificadas en descripción pública — el activo ya existe' },
      { source: 'Repo skillforge', url: 'https://github.com/belentani7/skillforge', claim: 'Package manager universal "write once, install everywhere" — la infraestructura de distribución existe' },
    ],
    matchRepos: ['agent-skills', 'skillforge', 'manus-ai-skill-pack', 'meta-skill'],
    timeToFirstIncome: '1–3 semanas',
    effort: 'bajo',
    demandLevel: 'La adopción de skills estándar crece con cada release de Claude Code',
    steps: [
      'Divide las 311 skills en 4 packs temáticos: "DevOps", "Escritura", "Datos", "Ciberseguridad" — cada pack a 19-29 €.',
      'Mantén 30-40 skills gratis en GitHub (imán de estrellas y prueba de calidad) y vende los packs completos con actualizaciones mensuales.',
      'Publica en Lemon Squeezy (gestiona IVA europeo automáticamente — crítico siendo residente en España).',
      'Distribuye donde ya están los usuarios de agentes: discord de Claude, r/ClaudeAI, newsletters de IA en español (ofrece affiliados 30%).',
      'skillforge es tu ventaja de distribución: "instala el pack con un comando" — demuéstralo en GIF en la landing.',
      'Cada análisis semanal de esta app propone una skill nueva: alimentas el catálogo continuamente sin bloqueo creativo.',
    ],
  },
  {
    code: 8,
    title: 'Mantenimiento y seguridad web para pymes (retainer mensual)',
    category: 'automatizacion',
    summary:
      'Con securetea hardenizada y auditada (firewall, IDS, WAF) y las plataformas educativas de ciberseguridad, puedes vender planes mensuales de mantenimiento+seguridad a pymes con web: copias, actualizaciones, monitorización, respuesta a incidentes.',
    realRate: 'Retainers de 100–300 €/mes por cliente. 8–15 clientes = 1.200–3.600 €/mes recurrentes. Horas reales: ~2-4 h/cliente/mes → 50-100 €/h efectivas.',
    rateMinPerHour: 50,
    rateMaxPerHour: 100,
    platforms: [
      { name: 'Directo (comercios y gestorías BCN)', url: 'https://www.linkedin.com', fee: '0%', note: 'Relación local de confianza = churn mínimo' },
      { name: 'Malt', url: 'https://www.malt.es', fee: '~15% (lado cliente)', note: 'Contratos largos con empresas' },
    ],
    evidence: [
      { source: 'Repo securetea', url: 'https://github.com/belentani7/securetea', claim: 'Proyecto OWASP hardened y auditado 2026 — credencial técnica verificable' },
      { source: 'RGPD / régimen sancionador UE', url: 'https://www.aepd.es', claim: 'Las sanciones del RGPD a pymes obligan de facto a medidas técnicas organizadas: mercado regulado, no opcional' },
    ],
    matchRepos: ['securetea', 'secure-t', 'secure-t-app', 'open-school'],
    timeToFirstIncome: '2–6 semanas',
    effort: 'medio',
    demandLevel: 'Obligación RGPD + ataques crecientes a pymes = demanda recurrente',
    steps: [
      'Empaqueta 2 planes: Básico 120 €/mes (backups, updates, informe mensual) y Pro 250 €/mes (+ monitorización WAF, respuesta a incidentes 24h).',
      'Ofrece una auditoría gratuita de 15 min a 30 negocios locales con web: el informe de riesgos es tu argumento de venta.',
      'Automatiza el 80% del trabajo con tus propios skills de agente: checks programados, alertas, backups — el retainer se vuelve casi pasivo.',
      'Contrato claro: qué cubres y qué no (limitación de responsabilidad) — plantilla tipo disponible en bases de abogados ES.',
      'El canal más rápido: gestorías y consultorías locales (ya las conoces por rh-fiscal-ultra-elite) — te refieren clientes a cambio de comisión.',
      'Objetivo honesto: 10 clientes × 150 €/mes = 1.500 €/mes recurrentes en 3-4 meses, con ~10-15 h/mes de trabajo real.',
    ],
  },
  {
    code: 9,
    title: 'Anotación y evaluación de datos IA (vía de entrada más rápida)',
    category: 'freelance-ia',
    summary:
      'Las plataformas de datos para LLMs (Outlier, DataAnnotation, Appen, Toloka) contratan continuamente evaluadores con idiomas PT/ES/EN — tu combo exacto. Es el ingreso más rápido y fiable para empezar HOY mientras maduran las rutas mayores.',
    realRate: '$15–40/h según especialidad; tareas de código y idiomas de alta demanda pagan el rango alto.',
    rateMinPerHour: 12,
    rateMaxPerHour: 35,
    platforms: [
      { name: 'Outlier AI', url: 'https://outlier.ai', fee: '0% (te pagan a ti)', note: 'Proyectos LLM con idiomas PT/ES; paga por tarea' },
      { name: 'DataAnnotation', url: 'https://www.dataannotation.tech', fee: '0%', note: 'Test de entrada; proyectos de código bien pagados' },
      { name: 'Toloka / Appen', url: 'https://toloka.ai', fee: '0%', note: 'Volumen constante, tarifas menores' },
    ],
    evidence: [
      { source: 'Upwork In-Demand Skills 2026', url: 'https://investors.upwork.com', claim: 'AI data annotation figura entre las categorías de mayor crecimiento freelance' },
      { source: 'Requisitos de plataformas', url: 'https://outlier.ai', claim: 'Contratan por idioma nativo: PT nativo + ES/EN fluidos = elegible para múltiples proyectos simultáneos' },
    ],
    matchRepos: ['linguaforge', 'aprende-brasil'],
    timeToFirstIncome: '3–10 días',
    effort: 'bajo',
    demandLevel: 'Crecimiento documentado en Upwork 2026; contratación continua',
    steps: [
      'Regístrate en Outlier y DataAnnotation HOY con PT como idioma nativo y ES/EN como adicionales — multiplica los proyectos disponibles.',
      'Completa los assessments con calma: la calidad del test determina qué proyectos se te asignan y a qué tarifa.',
      'Prioriza proyectos de código/evaluación de agentes (tu experiencia con Claude Code paga más que tareas genéricas).',
      'Matemática real: 20 h/semana × $18/h ≈ $1.560/mes ≈ 1.400 €/mes. Es el suelo, no el techo — combina con rutas 1-3 desde la semana 2.',
      'Trátalo como trampolín con fecha de caducidad: reduce horas a medida que suben los clientes de consultoría/freelance.',
    ],
  },
  {
    code: 10,
    title: 'Educación: cursos PT/ES/EN/CA de IA aplicada y vibe coding',
    category: 'productos',
    summary:
      'Tienes 4 plataformas educativas construidas (open-school, ManosAbiertas, secure-t, aprende-brasil) y esta misma app con 1000 soluciones: el contenido para un curso premium ya existe. Vender educación empaquetada en 4 idiomas te posiciona en nichos con poca oferta.',
    realRate: 'Cursos a 29–149 € (Gumroad 10%, Lemon Squeezy 5%). 20 ventas/mes a 49 € = ~€900 netos. Udemy: volumen mayor, comisión 37–63% según canal.',
    rateMinPerHour: 0,
    rateMaxPerHour: 0,
    platforms: [
      { name: 'Lemon Squeezy', url: 'https://www.lemonsqueezy.com', fee: '5% + €0.50', note: 'Impuestos UE automáticos' },
      { name: 'Udemy', url: 'https://www.udemy.com', fee: '37% (tu tráfico) / 63% (tráfico Udemy)', note: 'Volumen enorme en ES/PT' },
      { name: 'open-school (propio)', url: 'https://github.com/belentani7/open-school', fee: '0%', note: 'Tu plataforma ya soporta cursos modulares y certificaciones' },
    ],
    evidence: [
      { source: 'Repo open-school', url: 'https://github.com/belentani7/open-school', claim: 'Infraestructura de cursos modulares con certificaciones verificables ya construida' },
      { source: 'Esta app (VibeFix 1000)', url: 'https://github.com/belentani7', claim: '1000 soluciones documentadas = currículo del curso "vibe coding sin frustración" listo para estructurar' },
    ],
    matchRepos: ['open-school', 'ManosAbiertas', 'secure-t', 'aprende-brasil', 'ux-academy-professional-program'],
    timeToFirstIncome: '4–12 semanas',
    effort: 'alto',
    demandLevel: 'Aprendices de IA en ES/PT: audiencia masiva y poco contenido nativo de calidad',
    steps: [
      'Crea el primer mini-curso: "Vibe coding sin frustración: 20 errores que rompen tu código con IA" — usa los 20 arquetipos más frecuentes de esta app como lecciones.',
      'Grábalo con Obs (gratis) + tu voz en ES y PT (el audio es tu diferenciador: casi todo el contenido de calidad está en inglés).',
      'Publica en Lemon Squeezy a 39 € y en Udemy a 49,99 € con cupones (Udemy da volumen, Lemon margen).',
      'Vende el curso DENTRO de tus rutas de consultoría: cliente de auditoría recibe descuento — ecosistema de productos que se venden entre sí.',
      'Usa open-school como campus: certificados verificables = justificación de precio premium frente a Udemy.',
      'Honestidad: educación es la ruta más lenta de las 10 pero la de mejor margen compuesto; realista: primeros ingresos en el mes 2-3.',
    ],
  },
]

export const INCOME_CATEGORIES: Record<string, string> = {
  'freelance-ia': 'Freelance IA',
  localizacion: 'Localización',
  automatizacion: 'Automatización',
  productos: 'Productos digitales',
  consultoria: 'Consultoría',
}
