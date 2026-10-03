# Plan maestro de mejora 0–10 para AUREA

## 1. Propósito operativo

AUREA debe evolucionar desde una demo de contestador y traductor hacia una **plataforma de asistencia privada, neutral y multilingüe**, capaz de comprender mensajes ruidosos, abreviaciones, errores, variantes regionales y cambios de idioma sin perder seguridad, trazabilidad ni control humano. El producto no debe intermediar servicios, fijar precios, gestionar clientes por cuenta del operador ni custodiar pagos de terceros. Su única relación económica propia es el acceso premium.

La mejora radical no consiste en añadir miles de reglas sin control. Consiste en combinar un núcleo determinista rápido, un banco lingüístico versionado, modelos opcionales con salida estructurada, revisión humana, métricas por idioma y rollback inmediato. El objetivo operativo es pasar de una comprensión demo aproximada a una comprensión **medible, auditable y resistente a errores**.

## 2. Criterio de evaluación sobre 10

| Dimensión | Peso | 0–3 insuficiente | 4–6 funcional | 7–8 sólido | 9–10 objetivo |
|---|---:|---|---|---|---|
| Comprensión multilingüe | 25 % | Solo frases limpias | Detecta variantes comunes | Tolera ruido, mezcla y abreviaciones | Métricas por idioma, región y dominio con revisión nativa |
| Seguridad y privacidad | 20 % | Decisiones opacas | Reglas básicas | PII minimizada, revisión humana y auditoría | Evidencia reproducible, rollback y control de abuso |
| Estabilidad | 20 % | Fallos y crecimiento ilimitado | Límites básicos | Caché, TTL, timeouts, idempotencia y pruebas | Degradación controlada, recuperación y pruebas de carga |
| Utilidad conversacional | 15 % | Respuestas genéricas | FSM funcional | Contexto persistente y traducción consistente | Recuperación de errores, memoria mínima y tono configurable |
| Coste y eficiencia | 10 % | Dependencia de servicios caros | Carga bajo demanda | Código determinista primero | Casi cero llamadas externas y presupuesto por flujo |
| UX y administración | 10 % | Panel de demo | Consola funcional | Estados, incidentes y métricas claros | Accesibilidad, trazabilidad y operaciones sin fricción |

**Regla de aceptación:** ninguna versión puede subir de nivel si empeora seguridad, privacidad o estabilidad aunque mejore la comprensión.

## 3. Skills que deben gobernar la estrategia

| Skill | Uso en AUREA | Decisión práctica |
|---|---|---|
| `builtin-llm-models` | Selección de modelos, JSON estructurado, batching, evaluación y control de coste | Código determinista primero; `gpt-5-mini` para clasificación acotada; modelos fuertes solo para casos ambiguos y evaluación |
| `automation-and-scheduling` | Webhooks, jobs, procesos persistentes, polling y elección de alojamiento | Eventos por webhook; tareas deterministas en el backend; nada de polling de alta frecuencia mediante sesiones completas |
| `manus-api` | Coordinación externa de tareas, proyectos, agentes y webhooks si se decide automatizar subagentes fuera del ciclo local | Usar API v2, tareas idempotentes, salida estructurada y webhooks firmados; no es requisito para la demo |
| `persistent-computing` | Evaluación de cargas masivas, workers y necesidades de proceso continuo | Mantener el camino gratuito en el backend gestionado; escalar solo si existe una limitación medible |
| `webdev-readme-fullstack` | Convenciones del proyecto, base de datos, tRPC, tests y almacenamiento | Mantener contratos tRPC, migraciones seguras, pruebas Vitest y S3 para archivos |
| `manus-config` | Conectores, secretos, tareas y configuración compartida | Nunca almacenar credenciales en repositorios, catálogos o fixtures |

No se recomienda usar generación de imágenes ni un modelo generativo para resolver problemas que son de normalización, seguridad o clasificación. La comprensión se debe mejorar con datos y evaluación, no con una capa visual innecesaria.

## 4. Organización de subagentes

Cada subagente trabaja sobre un contrato de entrada y salida. Ninguno modifica producción directamente. Todos entregan un informe JSON o Markdown con evidencias, coste estimado, riesgos, pruebas y recomendación. Un agente integrador acepta, rechaza o devuelve cada propuesta.

| Subagente | Misión | Entrada | Salida verificable |
|---|---|---|---|
| A. Arquitectura | Mapear cuellos de botella, dependencias y límites | Código, logs, métricas | Diagrama, riesgos P0/P1/P2 y cambios mínimos |
| B. Lingüística | Mejorar normalización, idioma, jerga y ortografía | Corpus aprobado y ejemplos anonimizados | Patrones con idioma, región, intención, confianza y procedencia |
| C. Seguridad | Revisar coerción, menores, violencia, fraude, abuso y prompt injection | Reglas, payloads y falsos positivos | Matriz de amenazas, casos de bloqueo y revisión humana |
| D. Privacidad | Auditar PII, retención, hashes, logs y licencias | Esquema, ingestión y registros | Informe de minimización, sanitizadores y pruebas de fuga |
| E. Evaluación | Construir un conjunto ciego y medir 0–10 | Casos por idioma y dificultad | Precisión, recall, latencia, coste y regresiones |
| F. Producto/UX | Mejorar consola, errores, accesibilidad y operaciones | Capturas, estados y feedback | Cambios priorizados y criterios de aceptación |
| G. Plataforma | Estabilidad, caché, rate limit, jobs, rollback y observabilidad | Logs y benchmarks | SLO, límites, recuperación y pruebas de carga |
| H. Integrador | Resolver conflictos y producir una versión candidata | Informes A–G | Release candidate, changelog y decisión de activación |

### Protocolo de coordinación

Primero se ejecutan A, B, C y D en paralelo porque sus resultados son independientes. Después E usa los datos aprobados por B y las restricciones de C/D. F y G trabajan en paralelo sobre la consola y la infraestructura. H integra únicamente propuestas que tengan pruebas, procedencia y reversibilidad.

La regla de consenso es **dos aprobaciones técnicas y una de seguridad** para cada cambio que afecte al detector. Una regla sin fuente, idioma, versión, confianza y caso de prueba no entra en el catálogo activo. Un agente no puede aprobar sus propios cambios.

## 5. Arquitectura objetivo

> **Preprocesar → detectar riesgo → detectar idioma → normalizar → recuperar contexto mínimo → clasificar intención → traducir o preparar respuesta → revisión humana cuando corresponda → enviar mediante adaptador autorizado.**

La capa de seguridad siempre precede a cualquier modelo generativo. El motor determinista debe resolver normalización, límites, PII, idioma y señales críticas. Un modelo opcional solo recibe texto ya minimizado, con un esquema JSON estricto y sin permiso para ejecutar acciones irreversibles.

El banco lingüístico debe estar separado en cuatro zonas. `raw-quarantine` no se conserva tras el proceso. `derived-candidates` contiene patrones sanitizados pendientes de revisión. `active-catalog` contiene únicamente reglas aprobadas. `rollback` mantiene la versión anterior. Cada entrada incluye `sourceId`, `language`, `region`, `variant`, `normalizedForm`, `intentCategory`, `contextTags`, `confidence`, `reviewStatus`, `provenance` y `schemaVersion`.

## 6. Roadmap radical por fases

| Fase | Resultado | Prioridad | Coste externo | Criterio de salida |
|---|---|---:|---:|---|
| 0. Baseline | Congelar versión, métricas y casos de referencia | P0 | 0 | Dataset ciego y benchmark repetible |
| 1. Comprensión | Expandir 12 idiomas, variantes, transliteraciones y mezcla de idiomas | P0 | 0–bajo | Mejora medible sin caída de seguridad |
| 2. Seguridad | Threat model, PII, anti-abuso, revisión y explicabilidad | P0 | 0 | Cero secretos y decisiones críticas revisables |
| 3. Estabilidad | Caché, límites, TTL, backpressure, rollback y degradación | P0 | 0 | Recuperación probada y latencia estable |
| 4. Contexto | Memoria mínima por sesión, intención y contexto de canal | P1 | 0 | Menos repeticiones y sin retención excesiva |
| 5. Evaluación | Matriz por idioma, región, ruido y severidad | P1 | 0–bajo | Score >= 8 en casos críticos |
| 6. UX | Panel operativo, filtros, revisión, métricas y accesibilidad | P1 | 0 | Tareas administrativas completables sin código |
| 7. IA opcional | Clasificación ambigua y traducción estructurada | P2 | Variable | Solo se llama al modelo cuando el código no basta |
| 8. Escala | Workers y colas solo si los benchmarks lo justifican | P2 | Variable | Carga real y coste por 1.000 mensajes medidos |
| 9. Release 10 | Auditoría independiente y activación gradual | P0 | 0–bajo | Rollback en un paso y checklist firmado |

## 7. Mejoras de comprensión prioritarias

La primera mejora debe ser un **detector de idioma por fragmento**, no solo por mensaje. AUREA debe reconocer español con inglés, francés o alemán incrustado, transliteración, errores de teclado, ausencia de tildes, abreviaciones, repetición de caracteres, audio transcrito imperfectamente y mensajes cortados en varias partes.

La segunda mejora debe ser un **normalizador reversible**. El sistema conserva el texto original solo donde sea estrictamente necesario y genera una representación normalizada para comparar patrones. Cada transformación debe indicar su tipo: ortográfica, fonética, abreviación, transliteración, región o separación de tokens.

La tercera mejora debe ser un **grafo de equivalencias**, no una lista plana de sinónimos. Cada relación debe indicar idioma, región, confianza, fuente, fecha y si es segura para traducir. Las expresiones ambiguas no se traducen automáticamente; se preguntan o se derivan a revisión.

La cuarta mejora debe ser una memoria de contexto corta y explícita. El sistema debe recordar el idioma confirmado, la intención de la sesión, preferencias de tono y la última pregunta pendiente, pero no necesita almacenar nombres, teléfonos, ubicación precisa ni historial completo.

## 8. Estrategia de coste cero o mínimo

El 80 % de la mejora inicial debe ser determinista: regex compiladas, diccionarios versionados, caché, tests, compresión, deduplicación, límites y revisión humana. El banco público se consulta por lotes pequeños y se convierte a patrones; no se descarga en cada mensaje.

Cuando haga falta IA, el flujo recomendado es: modelo barato para clasificar o extraer, validación programática, y modelo más fuerte solo para los casos fallidos. En el proxy interno, la guía de modelos recomienda `gpt-5-mini` para clasificación, traducción y extracción a escala; el uso de modelos de razonamiento fuerte debe reservarse para evaluación y casos difíciles. La elección final debe comprobarse contra el catálogo vivo y no fijarse solo con documentación histórica.

No se debe desplegar un proceso persistente de pago mientras la carga no lo justifique. La consola y el backend actual pueden seguir siendo el camino base. Si el volumen crece, se activa una cola o un worker solo después de medir memoria, latencia y coste real.

## 9. Métricas y puertas de calidad

| Métrica | Objetivo inicial | Bloquea release si… |
|---|---:|---|
| Identificación de idioma | >= 97 % en casos limpios; >= 90 % con mezcla | Confunde idioma en mensajes de seguridad |
| Normalización útil | >= 95 % de casos de referencia | Introduce cambios semánticos no explicables |
| Recall de señales críticas | >= 99 % en conjunto de seguridad | Se pierde una señal de riesgo crítica |
| Falsos positivos | < 5 % en conversaciones normales | Escala demasiados casos inocuos |
| Latencia p95 determinista | < 50 ms local | Crece sin control al ampliar reglas |
| Disponibilidad de procesamiento | >= 99 % en demo estable | Hay errores no recuperables |
| Fuga de PII en derivados | 0 casos | Se guarda un contacto, teléfono o ubicación |
| Rollback | < 1 minuto | No se puede restaurar versión anterior |
| Coste externo por mensaje | 0 en ruta determinista | Se invoca un servicio sin necesidad |
| UX de revisión | 100 % de casos con explicación | El operador no entiende por qué se escaló |

## 10. Primer sprint de mejora radical

Durante el primer sprint se debe congelar el baseline, crear 600 casos ciegos —50 por idioma—, equilibrar mensajes limpios, ruidosos, mixtos y ambiguos, y etiquetar dificultad. Después se ejecutan los subagentes A–D en paralelo. El integrador produce una matriz de cambios, no una reescritura total.

La primera implementación debe añadir detector por fragmento, normalización reversible, métricas por idioma y un panel de comparación entre versión activa y candidata. La promoción se realiza solo si la candidata supera a la versión anterior en comprensión y no empeora recall de seguridad, PII, latencia o coste.

## 11. Riesgos que deben evitarse

No se debe convertir una web de anuncios en una fuente de perfiles. No se deben descargar comentarios masivamente si los términos no autorizan ese uso. No se deben conservar textos completos cuando basta una señal derivada. No se debe permitir que un modelo genere respuestas basándose directamente en una jerga detectada como riesgosa. No se debe llamar a subagentes para tareas deterministas que pueden resolverse con código local.

Tampoco se debe confundir **cantidad de reglas** con comprensión. Cuarenta mil reglas duplicadas o sin evaluación pueden empeorar la estabilidad. La unidad de progreso debe ser una mejora medida por idioma y dificultad, con rollback disponible.

## 12. Resultado esperado

El objetivo realista del siguiente ciclo es alcanzar **8/10** en comprensión y estabilidad con coste externo prácticamente cero, y reservar el 9–10 para después de disponer de corpus nativos revisados, evaluación independiente, carga real y revisión jurídica/operativa. La arquitectura propuesta permite llegar a ese nivel sin comprometer la neutralidad del producto ni su separación de los acuerdos entre terceros.

## Referencias de metodología

[1]: https://huggingface.co/datasets/AmazonScience/massive "MASSIVE dataset card"

[2]: https://universaldependencies.org/contributing/licensing.html "Universal Dependencies licensing"

[3]: https://opus.nlpl.eu/ "OPUS multilingual corpora"

[4]: https://live.european-language-grid.eu/catalogue/?page=1 "European Language Grid catalogue"

[5]: https://huggingface.co/blog/Pclanglais/two-trillion-tokens-open "Common Corpus overview"
