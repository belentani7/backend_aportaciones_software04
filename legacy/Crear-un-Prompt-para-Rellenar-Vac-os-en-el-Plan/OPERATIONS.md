# Operations

## Rutina diaria

Revisar leads pendientes, verificar evidencia, comprobar suppression y ejecutar dry-runs pequeños. Revisar audit logs y errores antes de tocar límites. Mantener mensajes claros, identificables y con una salida sencilla.

## Estados de campaña

- `draft`: plantilla y audiencia en revisión.
- `running`: permitido para simulación; cada ejecución queda auditada.
- `paused`: no ejecutar.
- `completed`: conservar histórico, no reactivar sin revisión.

## Activación futura

La activación de un proveedor externo debe ser una tarea separada: credenciales en secret manager, sandbox, dominio/remitente verificado, plantilla aprobada, webhook firmado, límites por canal, cooldown e idempotencia. Después debe existir una acción administrativa explícita y auditada. La implementación actual no incluye ese botón ni el envío live.

## Fail-safe

Si la base no está disponible, `/readyz` devuelve 503 y las operaciones protegidas no procesan. Si un lead no tiene evidencia, canal o permiso, se bloquea. Si el rate limit se supera, la API responde 429. Ante una baja, no se elimina el contacto de suppression ni se intenta reactivar automáticamente.

## Observabilidad

Consulta `/healthz`, `/readyz`, los últimos `audit_logs` del dashboard y los estados `messages`. No registres tokens, cuerpos innecesarios ni datos sensibles en logs de infraestructura.
