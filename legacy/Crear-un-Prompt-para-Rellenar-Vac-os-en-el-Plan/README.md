# Consent Lead Engine

Consent Lead Engine es un centro de operaciones para captación basada en permisos. Gestiona negocios, contactos, consentimiento verificable, campañas de email en modo simulación, importación CSV, atribución de citas y auditoría. No incorpora scraping de datos personales ni envíos comerciales silenciosos.

## Estado actual

El proyecto está construido sobre React + TypeScript + Tailwind en frontend, Express + tRPC en backend, Drizzle ORM sobre MySQL/TiDB y autenticación Manus OAuth. La producción queda protegida por defecto: las campañas se crean como `simulation` y el único ejecutor disponible es `runSimulation`, que escribe entregas simuladas y nunca llama a un proveedor externo.

## Funcionalidades implementadas

- Dashboard responsive con KPIs de leads, consentimiento, campañas, mensajes y citas.
- Alta manual de leads con normalización de email/teléfono.
- Importación CSV con preview local, validación, deduplicación por email/teléfono y reporte de filas omitidas.
- Estado de consentimiento: `verified`, `pending`, `revoked`, `unknown`.
- Evidencia, fuente y fecha de consentimiento; historial de eventos de consentimiento.
- Suppression list mediante `doNotContact` y baja pública por email coincidente.
- Campañas de email en modo `SIMULATION`, límites diarios y variables de plantilla validadas.
- Idempotencia operativa por ciclo de vida: un lead contactado no vuelve a entrar en el dry-run.
- Audit log para altas, importaciones, cambios de estado, consentimiento, simulaciones y citas.
- Health checks `/healthz` y `/readyz`.
- Rate limit básico de 120 requests/minuto por IP sobre `/api/trpc`.
- Tests unitarios de consentimiento, suppression, variables y límites.

## Arranque local

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

La aplicación requiere autenticación para acceder al workspace. Sin sesión muestra una página de introducción. Las variables del entorno se describen en `.env.example`; no se deben copiar secretos reales al repositorio.

## Flujo recomendado

1. Entrar al workspace.
2. Crear un lead procedente de un formulario o fuente donde exista una base legal documentada.
3. Registrar la evidencia de consentimiento; sin ella el contacto permanece `pending`.
4. Crear una campaña; se guarda en `simulation`.
5. Ejecutar `dry-run` y revisar cuántos contactos serían elegibles y qué entregas se generarían.
6. Registrar respuestas y citas desde una integración o extensión controlada, manteniendo la suppression list como autoridad final.

## Integraciones externas

Email transaccional, WhatsApp Business, CRM y pagos no están activados porque requieren credenciales y decisiones de negocio que no existen en el proyecto. El core está aislado para poder añadir adaptadores después. No se inventan claves ni se envían mensajes reales. Antes de activar un proveedor hay que añadir consentimiento contractual, plantillas aprobadas, webhooks verificados, timeout/retry/idempotencia y una activación administrativa auditada.

## Decisiones de seguridad

No se recomienda scrapear personas desde grupos, redes sociales o directorios para campañas. El producto acepta contactos aportados con permiso verificable y conserva la evidencia mínima necesaria. La personalización solo utiliza campos disponibles y variables permitidas. Para reclamaciones de privacidad, retención, exportación o borrado debe definirse la política aplicable al negocio y jurisdicción.

## Documentación

- [Arquitectura](ARCHITECTURE.md)
- [Seguridad y privacidad](SECURITY.md)
- [API](API.md)
- [Base de datos](DATABASE.md)
- [Despliegue](DEPLOYMENT.md)
- [Testing](TESTING.md)
- [Variables de entorno](ENVIRONMENT.md)
- [Operaciones](OPERATIONS.md)
- [Prompt maestro](PROMPT_MAESTRO.md)
