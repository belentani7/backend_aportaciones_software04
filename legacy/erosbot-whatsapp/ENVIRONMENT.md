# Variables de entorno

La demo funciona sin credenciales reales en modo Mock. Los valores de producción deben configurarse exclusivamente mediante el gestor de secretos del proyecto.

```text
WHATSAPP_MODE=mock
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_VERIFY_TOKEN=
META_APP_SECRET=

# Acceso premium de la propia plataforma
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=
PREMIUM_PLAN_INTERVAL=week
PREMIUM_PLAN_PRICE_MINOR=0

# Seguridad y sesión
JWT_SECRET=
DATA_RETENTION_DAYS=30
SAFETY_REVIEW_REQUIRED=true

# IA opcional, siempre después del detector determinista
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

La demo no usa los campos de pago para reservas entre usuarios. El único producto permitido en el modelo actual es el acceso premium a la plataforma. `PREMIUM_PLAN_INTERVAL` queda fijado en `week` para la demo; el precio debe configurarse antes de cobrar. No se almacenan tarjetas ni credenciales financieras.

## Notas de auditoría coste cero

La demo funciona sin credenciales en modo Mock. El transporte Meta usa timeout de 10 segundos, destinatarios E.164 y nunca expone tokens en respuestas o logs. Las variables se deben introducir solo mediante secretos protegidos. El acceso premium es el único pago propio previsto; no se configuran depósitos, escrow, split payments ni reembolsos de reservas de terceros.
