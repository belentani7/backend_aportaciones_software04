# Matriz 1:1 de aceptación EROS-BOT EU v2.0

La siguiente matriz enlaza cada guardrail operativo del prompt maestro con una implementación concreta y una prueba existente. Las integraciones externas no se consideran activas solo por tener una interfaz: deben aportar un resultado verificable y vigente.

| ID | Guardrail del prompt | Implementación verificable | Prueba automatizada |
|---|---|---|---|
| G-01 | Menores: bloqueo y derivación inmediata | `server/patterns.ts` detecta señales de minoría; `processDemoMessage` fuerza `human_review` | `masterContract.test.ts` — caso `minor`; `demo.test.ts` — señales críticas |
| G-02 | Coerción y trata: sin control ni captación | Reglas `coercion` y `trafficking`, decisión `stop_and_escalate` | `demo.test.ts` — coerción previa a respuesta |
| G-03 | Violencia y extorsión | Reglas de violencia y acoso/extorsión con revisión humana | `masterContract.test.ts` — violencia; `demo.test.ts` — extorsión |
| G-04 | Doxxing y datos sensibles | Reglas `privacy`, hashes de sesión, logs sanitizados | `masterContract.test.ts` — privacy |
| G-05 | Encuentros o acciones sin consentimiento | Regla crítica `CONSENT_ABSENT` y `assertSensitiveCapability` | `demo.test.ts`; `capabilities.test.ts` |
| G-06 | Verificación de edad solo por proveedor externo | `server/idv.ts` rechaza ausencia, caducidad o estado no verificado; capacidad tRPC rechaza si no hay proveedor | `idv.test.ts`; `capabilities.test.ts` |
| G-07 | Prohibir borrado remoto, coartadas y llamadas simuladas | `server/policy.ts` detecta las cuatro familias de solicitudes prohibidas | `policy.test.ts` |
| G-08 | Prohibir drogas y evasión fiscal sistemática | `server/policy.ts` bloquea solicitudes explícitas de drogas o evasión fiscal | `policy.test.ts` |
| G-09 | Seguridad antes de IA | `server/generativeGuard.ts` solo permite `continue`, `shouldCallModel=true` y ausencia de ambigüedad | `generativeGuard.test.ts` |
| G-10 | Ambigüedad: escalar a humano | `isAmbiguousSafetyInput` cambia la FSM a `human_review` | `demo.test.ts` — consentimiento ambiguo |
| G-11 | No generar lenguaje degradante o ilícito | Comprensión determinista separada de generación; entrada bloqueada antes del guardián | `generativeGuard.test.ts`; `policy.test.ts` |
| G-12 | Sin contenido sexualizado ni mediación | **Limitación de producto:** la neutralidad visual/copy se valida como revisión de contenido; la superficie económica sí está bloqueada por código | `apiSurface.test.ts`; `expressSurface.test.ts`; `paymentBoundary.test.ts` |
| E-01 | Solo acceso Premium propio | `assertPlatformPaymentPurpose` admite únicamente `premium_access` y `custodial=false` | `paymentBoundary.test.ts` |
| E-02 | Sin escrow, split, reservas de terceros, reembolsos o comisiones | La frontera económica rechaza `third_party_booking`, `escrow`, `split_payment`, `refund` y `commission` | `paymentBoundary.test.ts` |
| P-01 | Minimización, seudonimización y retención | Hashes, `audit_events`, `assistant_sessions`, `message_idempotency` y purga Heartbeat | `operational.integration.test.ts`; `db.operational.test.ts` |
| P-02 | Cifrado y secretos | **Limitación externa:** HTTPS, cifrado en reposo y gestión de secretos dependen del proveedor de hosting/DB; el código no afirma verificarlos criptográficamente | No existe una prueba local honesta de cifrado gestionado; se valida en el entorno de despliegue |
| O-01 | Webhook autenticado y anti-replay | HMAC constante, límites, ventana anti-replay y errores limpios | `webhook.test.ts` |
| O-02 | Dedupl. durable y reintentos seguros | `claimMessageId`, estados `processing/processed/failed`, reintento solo de `failed` | `webhook.operational.test.ts`; `db.operational.test.ts` |
| O-03 | Degradación controlada | 503 retryable sanitizado, estado fallido persistido y Heartbeat de purga | `webhook.operational.test.ts`; `maintenance.test.ts` |
| O-04 | Heartbeat autenticado e idempotente | Ruta explícita `/api/scheduled/maintenance`, `isCron`, `taskUid`, purga acotada | `maintenance.test.ts` |

P-02 está marcado deliberadamente como limitación externa porque una prueba local no puede demostrar el cifrado gestionado por el proveedor sin inspeccionar el entorno de producción. Las pruebas documentales de configuración no sustituyen la revisión profesional del operador. Proveedor IDV, jurisdicción, precio Premium, cuenta high-risk, retención legal y secretos de producción siguen requiriendo configuración externa y revisión de cumplimiento antes de activar integraciones reales.
