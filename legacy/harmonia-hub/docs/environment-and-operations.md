# Operación local y variables de HARMONÍA

> **Principio operativo:** el paquete Docker arranca MySQL, aplica las migraciones, expone API/CRM y mantiene un worker local aislado. Ninguna credencial real se versiona en el repositorio.

## Arranque de desarrollo autocontenido

La siguiente instrucción construye los servicios, crea el volumen persistente de MySQL, espera su healthcheck, ejecuta las migraciones y levanta la API/CRM junto al worker local:

```bash
docker compose up --build
```

El CRM queda servido por `http://localhost:3000/crm/` y las comprobaciones de disponibilidad en `http://localhost:3000/api/health`. La red `data` es interna: solo API, migración, worker y MySQL pueden comunicarse con la base de datos. La única publicación de puertos es el API configurado mediante `API_PORT`.

| Variable | Uso | Regla de producción |
|---|---|---|
| `MYSQL_DATABASE` | Nombre de la base MySQL | Debe ser distinto por entorno. |
| `MYSQL_USER` | Usuario de aplicación MySQL | Debe tener únicamente permisos sobre su base. |
| `MYSQL_PASSWORD` | Clave de usuario MySQL | Secreto obligatorio; reemplazar el valor de desarrollo. |
| `MYSQL_ROOT_PASSWORD` | Clave de administración MySQL | Secreto obligatorio; no usar desde la API. |
| `JWT_SECRET` | Firma de cookies y token CSRF | Secreto aleatorio de alta entropía. |
| `OWNER_OPEN_ID` | Identidad que obtiene el rol `admin` | Debe corresponder a una identidad OAuth verificada. |
| `ALLOWED_ORIGINS` | Orígenes web permitidos, separados por coma | Listar dominios HTTPS exactos; no usar comodines. |
| `OAUTH_SERVER_URL` | Servicio OAuth existente | Necesario para sesiones reales fuera del entorno local. |
| `BUILT_IN_FORGE_API_URL` | API de scheduler gestionado | Necesario solo para jobs Heartbeat gestionados. |
| `BUILT_IN_FORGE_API_KEY` | Credencial del scheduler gestionado | Secreto obligatorio cuando se habilita Heartbeat. |

## Modos de automatización

| Modo | Servicio | Garantías |
|---|---|---|
| Local autocontenido | `worker` en Docker | Examina schedules UTC admitidos, usa una clave idempotente por minuto y pasa por kill switch y PVC-U antes de commit. |
| Gestionado | Callback `/api/scheduled/automation` | Exige identidad cron autenticada, resuelve `taskUid`, conserva idempotencia y bloquea callbacks no autenticados. |

El worker local no sustituye al scheduler gestionado cuando se requiere alta disponibilidad multiinstancia. Para ese caso se debe ejecutar un único scheduler líder o utilizar la programación gestionada; ambos modos deben compartir MySQL para preservar claves de idempotencia y el ledger PVC-U.

## Publicación segura

Antes de publicar, se deben inyectar los secretos mediante la configuración segura del entorno de despliegue, asignar dominios HTTPS a `ALLOWED_ORIGINS`, confirmar el `OWNER_OPEN_ID`, y verificar los healthchecks. La aplicación rechaza orígenes no listados en producción y no revela trazas internas desde el callback de automatización.
