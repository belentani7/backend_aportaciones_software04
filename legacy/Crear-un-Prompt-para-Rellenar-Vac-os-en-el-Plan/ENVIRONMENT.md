# Environment

Nunca subas `.env`, tokens o claves a Git. El scaffold ignora estos archivos.

| Variable | Requerida | Uso |
|---|---:|---|
| `DATABASE_URL` | Sí en runtime | Conexión MySQL/TiDB |
| `JWT_SECRET` | Sí | Firma de sesión OAuth |
| `VITE_APP_ID` | Sí | Identificador de aplicación OAuth |
| `OAUTH_SERVER_URL` | Sí | Backend OAuth |
| `VITE_OAUTH_PORTAL_URL` | Sí | Portal de login en frontend |
| `OWNER_OPEN_ID` | Opcional | Promoción del propietario a admin |
| `OWNER_NAME` | Opcional | Nombre del propietario |
| `BUILT_IN_FORGE_API_URL` | Opcional | APIs internas del runtime |
| `BUILT_IN_FORGE_API_KEY` | Opcional | Clave server-side para APIs internas |
| `VITE_FRONTEND_FORGE_API_URL` | Opcional | APIs permitidas en frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | Opcional | Token frontend limitado; no usar para proveedores comerciales |
| `SMTP_*` | No usada | Reservada para adapter de email futuro |
| `WHATSAPP_*` | No usada | Reservada para adapter futuro; requiere credenciales reales |

Usa `.env.example` como plantilla. Los valores de proveedores externos no se inventan y no se colocan en código.
