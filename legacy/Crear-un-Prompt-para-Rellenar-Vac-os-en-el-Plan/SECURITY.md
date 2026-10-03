# Security and Privacy

## Controles implementados

- Autenticación Manus OAuth y procedimientos protegidos para el workspace.
- Filtrado por propietario en cada consulta y mutación de dominio.
- Validación de inputs con Zod; tamaños máximos para CSV, textos y URLs.
- Normalización de emails a minúsculas y teléfonos a caracteres de marcación.
- No se aceptan leads sin email o teléfono.
- Un lead `pending`, `unknown`, `revoked` o `doNotContact=true` nunca es elegible para dry-run.
- Baja pública que activa `revoked`, `doNotContact=true` y estado `disqualified`.
- Templates con lista cerrada de variables; variables desconocidas generan error.
- Campañas siempre creadas como `simulation`; no existe endpoint de envío live.
- Límite diario de 1–100 por campaña y rate limit de 120 requests/minuto por IP.
- Audit log de operaciones críticas.
- Health checks separados de la API de negocio.
- Secretos solo por variables de entorno; el frontend no recibe claves de proveedor.

## Riesgos deliberadamente evitados

No se implementa scraping de personas ni bypass de captchas, ni enriquecimiento de perfiles sensibles, ni campañas sin opt-in. El sistema no debe usarse para contactar a personas extraídas de redes sociales o grupos sin una base legal documentada. Los mensajes no deben inventar relaciones, descuentos, urgencias o hechos clínicos.

## Pendientes para producción

1. Definir jurisdicción, base legal, retención, derechos de acceso/borrado y contrato con cada cliente.
2. Añadir roles distintos de `user/admin` solo si existe una necesidad real; actualmente el scaffold trae esos roles.
3. Implementar CSRF adicional si se exponen formularios cross-site con cookies fuera del gateway actual.
4. Añadir rate limiting distribuido si se despliega con múltiples instancias.
5. Añadir provider de email/WhatsApp con webhook firmado, idempotencia y sandbox.
6. Añadir revisión de contenido y aprobación humana antes de cualquier live send.
7. Añadir cifrado de campos sensibles y política de retención si la evaluación legal lo exige.

## Incidentes

Ante una queja o baja, detener campañas, comprobar `consent_events` y `audit_logs`, marcar el lead como revocado, preservar la evidencia mínima y documentar el incidente. Nunca eliminar la suppression list para “reactivar” un contacto.
