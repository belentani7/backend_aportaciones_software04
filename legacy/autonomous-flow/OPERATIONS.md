# Maquinaria operativa

Autonomous Flow funciona como un motor desatendido. El panel de control solo observa el estado y permite gestionar configuraciones; no es necesario mantenerlo abierto para procesar eventos.

## Flujo real

1. `POST /api/webhook/:flowId` valida el secreto, el JSON y la idempotencia, y persiste el evento con estado `recibido`.
2. `POST /api/scheduled/process-events` autentica una identidad cron, reclama hasta 25 eventos disponibles y los procesa con el mismo motor determinista/LLM.
3. Cada reclamación escribe `claimedAt`, `claimToken` y `attempts`. Una segunda instancia no puede reclamar el mismo evento porque la actualización exige que siga en estado `recibido`.
4. Un lease `procesando` abandonado durante más de dos minutos vuelve a `recibido` y puede ser recuperado por el siguiente ciclo.
5. Los fallos transitorios se reprograman con backoff hasta cinco intentos; los fallos no recuperables pasan a `fallido` y conservan `lastError`.
6. El reproceso de excepciones usa el callback `/api/scheduled/reprocess-exceptions` y conserva la trazabilidad en `exceptions` y `executions`.

## Activación

La operación desatendida requiere crear un Heartbeat en producción con callback `/api/scheduled/process-events`. La UI no participa en la ejecución. El proyecto debe tener la variable `WEBHOOK_SHARED_SECRET` configurada y el sistema externo debe enviar el valor en `x-webhook-secret`.

## Política de fallos terminales

Cuando un evento no puede recuperarse después de los reintentos permitidos, o falla por una causa permanente, el worker no lo contabiliza como completado. Crea una entrada en la cola de excepciones con el payload y el motivo, registra una ejecución con resultado `excepcion` y deja el evento en estado `excepcion`. Los fallos transitorios permanecen en `recibido` con `availableAt` calculado mediante backoff persistente.
