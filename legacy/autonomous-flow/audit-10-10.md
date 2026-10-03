# Auditoría de aceptación 10/10 — Autonomous Flow

## Dictamen actual

**Resultado: listo para operación, pero no certificado 10/10 productivo todavía.** La maquinaria real está implementada y desplegada: el webhook encola, el worker reclama y procesa sin navegador, los leases abandonados se recuperan, los fallos transitorios se reprograman con backoff y los fallos permanentes crean una excepción pendiente con trazabilidad. Sin embargo, el historial del scheduler todavía no muestra una ejecución autenticada registrada; declarar 10/10 productivo sin esa evidencia sería falso.

## Matriz de evidencia

| Criterio | Evidencia | Estado |
|---|---|---|
| Contratos de entrada y salida | `eventPayloadSchema`, `analysisSchema`, validación tRPC y pruebas de payload | Aprobado |
| Autenticación y aislamiento | Procedimientos protegidos, `ownerId`, filtros de propiedad y validación de destino HTTPS | Aprobado en código |
| Webhook público | `WEBHOOK_SHARED_SECRET`, comparación resistente a timing y rechazo runtime no autenticado con `403` | Aprobado |
| Idempotencia y concurrencia | Clave acotada por flujo, índice único, carrera de inserción y reclamación condicionada por estado | Aprobado en código y pruebas |
| Motor determinista y uso de LLM | Las reglas se evalúan antes del LLM; el LLM solo se invoca en casos sin coincidencia | Aprobado |
| Salida estructurada y coste | Schema estricto, validación Zod, umbral de confianza y coste monetario calculado por uso | Aprobado |
| Reintentos y fallos | Backoff para `429`/`5xx`; fallos permanentes crean `exceptions` y dejan el evento en `excepcion` | Aprobado en código y pruebas |
| Cola y trazabilidad | Payload, intentos, disponibilidad, lease, error, timestamps, excepciones y ejecuciones vinculadas | Aprobado en código y pruebas |
| Panel y responsive | Capturas de escritorio y móvil, métricas, flujos, excepciones y log | Aprobado |
| Operación desatendida | Worker persistente, callbacks `/api/scheduled/process-events` y `/api/scheduled/reprocess-exceptions`, dos Heartbeats habilitados | **Pendiente de ejecución registrada** |

## Verificación ejecutada

`pnpm check` terminó sin errores de TypeScript. `pnpm test` terminó con **9 archivos y 23 pruebas aprobadas**. `pnpm build` generó correctamente el bundle de cliente y servidor. La URL pública `https://autoflow-xdvybsrd.manus.space` respondió `403` a solicitudes no autenticadas contra ambos callbacks programados, demostrando que las rutas existen y están protegidas. El runtime de producción arrancó sin errores nuevos.

Los Heartbeats activos son `autonomous-flow-event-worker`, con callback `/api/scheduled/process-events`, y `autonomous-flow-exception-reprocessor`, con callback `/api/scheduled/reprocess-exceptions`. Ambos tienen cron de seis campos y están habilitados. Su historial consultado muestra `runs: []`; por eso no se presenta una ejecución cron como evidencia cuando todavía no existe.

## Corrección terminal importante

El worker ya no contabiliza como éxito un proceso que termina en excepción. En errores transitorios conserva el evento en `recibido`, incrementa los intentos y calcula `availableAt` con backoff. En errores permanentes crea una excepción pendiente, registra una ejecución con `outcome: "excepcion"`, conserva `lastError` y cambia el evento a `excepcion`.

## Condición objetiva para cerrar 10/10

La única evidencia pendiente es una ejecución autenticada real de cada callback programado, visible en el historial del Heartbeat y acompañada por una respuesta `2xx`. Después habrá que repetir la lectura de logs y confirmar que no hay errores de runtime. Hasta completar ese paso, el estado correcto es **maquinaria construida, desplegada y lista; certificación productiva 10/10 pendiente de evidencia operacional**.
