# Architecture

## Componentes

| Capa | Implementación | Responsabilidad |
|---|---|---|
| UI | React 19, Vite, Tailwind, shadcn/ui | Dashboard, formularios, preview y feedback |
| API | Express 4 + tRPC 11 | Contratos tipados, validación Zod y autorización |
| Identidad | Manus OAuth | Sesión y usuario autenticado |
| Persistencia | Drizzle ORM + MySQL/TiDB | Leads, campañas, mensajes, citas y auditoría |
| Política | `server/leadEnginePolicy.ts` | Consentimiento, suppression, variables y límites |
| Runtime | Un proceso Node gestionado | HTTP, Vite en desarrollo y estáticos en producción |

## Flujo de una campaña

```text
Contacto aportado -> normalización -> consentimiento + evidencia
  -> filtro de canal -> suppression list -> estado NEW/QUEUED
  -> dry-run -> mensaje SIMULATED + audit log
  -> estado CONTACTED (sin proveedor externo)
```

El orden es intencionado: la suppression list se evalúa antes de cualquier futura entrega. El estado del lead evita que el mismo contacto entre dos veces en un ciclo normal. La activación de proveedores reales no está expuesta en el router actual.

## Separación por usuario

Todas las lecturas y mutaciones protegidas filtran por `ctx.user.id`. La UI no es una frontera de seguridad: la autorización vive en tRPC. La baja pública solo acepta un `leadId` junto con el email que coincide exactamente, responde de forma neutra si no coincide y no revela si el registro existe.

## Integraciones futuras

Cada proveedor debe implementarse detrás de un adapter con: configuración por entorno, timeout, retry acotado, idempotency key, health check, logging sin secretos y tests contractuales. La primera entrega debe seguir en sandbox hasta que un administrador active explícitamente el proveedor y la política de comunicaciones esté aprobada.

## Alternativa más ligera

Para validar solo el proceso comercial se puede usar el mismo dashboard con importación manual y `simulation`, sin ningún proveedor de mensajería. Es más barato y reversible, pero no ofrece entregas reales ni sincronización automática.
