# BELENTANI × HARMONÍA — manifiesto de entrega

## Alcance entregado

La revisión integra una aplicación móvil Android-first, API Express/tRPC, CRM web independiente, MySQL mediante Drizzle, worker durable, motor HARMONÍA de tres fases y ledger PVC-U. La biblioteca se conserva localmente primero y se sincroniza con el backend cuando existe una sesión autenticada. La interfaz no presenta reproducción, integraciones musicales, pagos ni acciones del Consejo como disponibles cuando no existe una fuente o integración verificada.

| Área | Entrega verificable |
|---|---|
| Móvil | Biblioteca, favoritos e historial persistentes; generador con configuración explícita; reproductor que informa cuando no hay fuente válida; perfiles, onboarding y planes sin claims comerciales no integrados. |
| Consejo | Controles persistentes, acceso administrativo, auditoría y kill switch que bloquea commits nuevos del worker. |
| Automatización | Ejecución Prepare → Confirm → Commit, clave de idempotencia, PVC-U, ledger y callback cron autenticado. |
| CRM | Contactos, jobs, ejecuciones y panel owner para ledger/auditoría/kill switch bajo autorización administrativa. |
| Seguridad | CORS por allow-list, cabeceras defensivas, limitación por identidad, cifrado AES-256-GCM, CSRF HMAC verificable, rutas sin traversal y respuestas de callback sin trazas internas. |
| Operación | `docker-compose.yml`, MySQL aislado, migraciones, API/CRM, worker local, healthchecks, CI y guía de variables. |

## Evidencia de validación

| Control | Resultado |
|---|---|
| TypeScript | Validado sin errores mediante `pnpm exec tsc --noEmit --pretty false --incremental false`. |
| Lint estricto | Validado con ESLint y cero advertencias de reglas de proyecto. |
| Pruebas críticas | **27/27 aprobadas**: HARMONÍA clipper, PVC-U, durable store, integración, validación de playlists y núcleo de seguridad. |
| Bundle API | Construido mediante `pnpm build`. |
| Expo | Configuración validada con `pnpm exec expo config --json`. |
| CRM | Sintaxis JavaScript comprobada con `node --check crm/app.js`. |
| Superficie HTTP | Healthcheck, cabeceras, CORS denegado para origen no permitido y callback cron no autenticado verificados. |

## Operación reproducible

La guía [`environment-and-operations.md`](./environment-and-operations.md) documenta las variables y el arranque. En un host con Docker, el punto de entrada es:

```bash
docker compose up --build
```

El compose crea una red `data` interna para MySQL, migraciones y worker. Solo el servicio API expone un puerto de host. Antes de cualquier exposición pública se deben inyectar secretos reales, definir dominios HTTPS exactos en `ALLOWED_ORIGINS`, configurar OAuth y asignar un `OWNER_OPEN_ID` verificado.

## Límites honestos de la entrega

La APK EAS no se compiló en esta sesión porque requiere una sesión autenticada de Expo/EAS. El archivo `eas.json` y la guía de compilación quedan preparados para lanzar el build desde una cuenta autenticada. Docker no está disponible en este sandbox; el compose se ha generado y revisado estáticamente, pero su arranque requiere ejecutarse en un host Docker. La automatización 24/7 necesita que ese host o el scheduler gestionado permanezcan ejecutándose con las credenciales de producción configuradas.
