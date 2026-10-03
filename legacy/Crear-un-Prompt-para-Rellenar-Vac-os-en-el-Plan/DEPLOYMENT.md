# Deployment

El proyecto está preparado para el runtime web gestionado que ya creó el scaffold. No requiere Docker ni una máquina persistente para el MVP: el servidor Node atiende la UI y la API, y la base MySQL/TiDB se configura por entorno.

## Preflight

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

Configura las variables de `.env.example` en el entorno de despliegue. Ejecuta las migraciones de Drizzle de forma controlada antes de publicar una versión que use nuevas tablas. Comprueba `GET /healthz` y `GET /readyz` después del despliegue.

## Rollback

Conserva el checkpoint o versión anterior del proyecto antes de cada cambio de esquema. Si el build falla, vuelve al checkpoint anterior. No ejecutes `DROP TABLE` para revertir una funcionalidad; usa una migración explícita y revisada.

## Producción de mensajería

La versión actual no necesita credenciales de SMTP, WhatsApp ni CRM porque todo es `SIMULATION`. Antes de conectar un proveedor, añade sus secretos solo en el entorno, activa sandbox, verifica webhooks y prueba idempotencia. El modo live no debe habilitarse solo por existir una variable.
