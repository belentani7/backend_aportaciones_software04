# Database

La persistencia usa Drizzle ORM con MySQL/TiDB. Las migraciones generadas se encuentran en `drizzle/0001_sleepy_green_goblin.sql` y `drizzle/0002_special_morgan_stark.sql`; ambas crean tablas nuevas y no contienen operaciones destructivas.

## Tablas

| Tabla | Propósito | Campos clave |
|---|---|---|
| `users` | Identidad Manus | `openId`, `role` |
| `businesses` | Cliente/nicho receptor | `ownerId`, `niche`, `status` |
| `leads` | Contactos minimizados | `ownerId`, canal, consentimiento, suppression, lifecycle |
| `consent_events` | Historial de permisos | tipo, fuente, prueba, fecha |
| `campaigns` | Plantillas y límites | canal, `mode`, `status`, `dailyLimit` |
| `messages` | Historial de entregas | lead, campaña, dirección, estado |
| `appointments` | Conversión y atribución | lead, negocio, ingresos, comisión |
| `audit_logs` | Trazabilidad administrativa | usuario, acción, recurso, resultado, metadata |

Todos los timestamps son columnas `timestamp` administradas por la base. En la API se serializan mediante SuperJSON. Las relaciones lógicas usan IDs y filtros de propietario; las foreign keys físicas pueden añadirse en una migración posterior cuando se defina la política de borrado/retención.

## Estados

Consentimiento: `verified`, `pending`, `revoked`, `unknown`. Un `revoked` o `doNotContact=true` es una barrera absoluta. Lifecycle de lead: `new`, `queued`, `contacted`, `replied`, `qualified`, `booked`, `converted`, `disqualified`. Campaña: `draft`, `running`, `paused`, `completed`; modo: `simulation` o `live`, aunque el router solo crea y ejecuta `simulation`.

## Migraciones

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Revisa siempre el SQL generado antes de ejecutarlo. No uses la consola de base de datos para insertar datos de prueba en producción.
