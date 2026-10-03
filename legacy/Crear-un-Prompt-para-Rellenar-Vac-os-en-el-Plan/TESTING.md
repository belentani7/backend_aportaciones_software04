# Testing

## Comandos

```bash
pnpm check
pnpm test
pnpm build
```

## Cobertura actual

`server/leadEnginePolicy.test.ts` prueba: consentimiento sin evidencia, bloqueo por suppression/revocación, requisitos por canal, lifecycle ya contactado, variables desconocidas y clamp de límites. `server/auth.logout.test.ts` prueba la limpieza de cookie de sesión.

## Escenarios manuales

1. Entrar sin sesión y verificar que no se muestra el workspace protegido.
2. Crear un lead con email pero sin evidencia; comprobar estado `pending`.
3. Crear un lead con evidencia; comprobar `verified`.
4. Crear campaña y ejecutar dry-run; comprobar que solo se registran mensajes `simulated`.
5. Ejecutar de nuevo; comprobar que el lead ya contactado no se duplica.
6. Revocar consentimiento; comprobar que queda en suppression y fuera de cualquier simulación.
7. Importar CSV con duplicados y filas sin canal; comprobar preview y errores por fila.
8. Consultar `/healthz` y `/readyz`.
9. Superar 120 requests/minuto desde una IP de prueba; comprobar HTTP 429.

## Antes de live

Añadir tests de contrato para el proveedor de email/WhatsApp, webhooks duplicados, timeouts, retries acotados, idempotency keys, bounce handling y autorización administrativa. La ausencia de credenciales no se simula como éxito de producción.
