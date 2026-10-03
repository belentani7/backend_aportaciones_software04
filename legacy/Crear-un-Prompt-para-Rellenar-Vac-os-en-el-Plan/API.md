# API

La API está expuesta bajo `/api/trpc` con contratos tRPC y sesiones OAuth. Las rutas protegidas requieren usuario autenticado y filtran por `ctx.user.id`.

| Procedimiento | Tipo | Entrada | Resultado |
|---|---|---|---|
| `auth.me` | query pública | — | Usuario actual o `null` |
| `auth.logout` | mutation pública | — | Limpia sesión |
| `leadEngine.dashboard` | query protegida | — | KPIs, negocios, campañas, leads, citas y últimos audit logs |
| `leadEngine.createBusiness` | mutation protegida | nombre, nicho, ciudad, email | Crea negocio |
| `leadEngine.createLead` | mutation protegida | nombre + email/teléfono, origen, consentimiento | Crea lead normalizado |
| `leadEngine.importCsv` | mutation protegida | CSV <= 1 MB, origen | Inserta filas válidas y devuelve errores por fila |
| `leadEngine.createCampaign` | mutation protegida | nombre, canal, plantilla, límite | Crea campaña en `simulation` |
| `leadEngine.updateLeadStatus` | mutation protegida | leadId, estado | Actualiza lifecycle |
| `leadEngine.recordConsent` | mutation protegida | leadId, verified/revoked, fuente, prueba | Actualiza consentimiento y evento |
| `leadEngine.runSimulation` | mutation protegida | campaignId | Registra entregas simuladas y marca leads contactados |
| `leadEngine.createAppointment` | mutation protegida | leadId, fecha, importes | Registra cita y atribución |
| `leadEngine.unsubscribe` | mutation pública | leadId, email | Revoca y bloquea si el email coincide; respuesta neutra si no coincide |

## Reglas de entrada

Los textos y URLs tienen límites Zod. Los emails se guardan en minúsculas y los teléfonos se reducen a caracteres de marcación. La evidencia es obligatoria para que `verified` sea efectivo. El CSV admite `name`, `email`, `phone`, `source`, `sourceUrl`, `city` y `consentProof`; sin `name` o canal de contacto la fila se reporta como error.

## Simulación

`runSimulation` selecciona únicamente consentimiento `verified`, `doNotContact=false`, canal disponible y lifecycle `new/queued`. El límite se acota entre 1 y 100. Cada entrega usa estado `simulated`; no existe llamada a SMTP, WhatsApp ni CRM.

## Health

- `GET /healthz` devuelve `{ ok: true }` si el proceso responde.
- `GET /readyz` devuelve 200 si la base de datos está disponible y 503 si no lo está.
