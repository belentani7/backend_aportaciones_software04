# Auditoría de alineación EROS-BOT EU v2.0

**Fecha de auditoría:** 2026-08-21. **Ámbito:** snapshot restaurado de `erosbot-whatsapp`, antes de implementar la siguiente tanda de maquinaria.

> **Conclusión ejecutiva:** la base demo ya contiene una capa determinista de seguridad antes de la respuesta, transporte Meta/Mock, normalización para 12 idiomas, seudonimización y una cola de revisiones. No obstante, todavía no puede declararse alineada con el contrato de producción porque la sesión, la deduplicación del webhook y la observabilidad operativa siguen dependiendo de memoria de proceso, no existe una ruta Heartbeat montada, y los endpoints sensibles no tienen estados persistentes de consentimiento, IDV ni acceso Premium real.

## Matriz de hallazgos

| Área | Estado observado | Riesgo | Acción requerida |
|---|---|---|---|
| Menores y señales críticas | `server/patterns.ts` clasifica señales críticas y `server/demo.ts` pausa antes de responder normalmente. | Cobertura determinista limitada; la declaración adulta del demo no es IDV. | Ampliar pruebas y separar declaración, consentimiento e IDV externo. |
| Coerción, trata y violencia | Existen categorías y `stop_and_escalate`/`pause_and_review`. | Algunas expresiones y lenguas no tienen cobertura suficiente para producción. | Mantener bloqueo seguro, añadir reglas de consentimiento denegado y pruebas multilingües. |
| IA previa | El flujo actual no invoca LLM y calcula seguridad antes de la respuesta. | Si se incorpora IA, no hay contrato técnico que fuerce el orden. | Encapsular la entrada generativa detrás de una función que reciba solo decisiones `continue`. |
| Consentimiento | El FSM usa respuestas afirmativas para términos y adultez. | No se conserva un consentimiento vigente, finalidad, versión ni revocación. | Añadir modelo durable de consentimiento y revocación. |
| Verificación de edad | No existe proveedor IDV. | Riesgo de confundir una declaración con verificación. | Diseñar adaptador externo desactivado por defecto y almacenar solo resultado mínimo. |
| Webhook e idempotencia | HMAC y anti-replay presentes; deduplicación en memoria. | Reinicio o múltiples instancias pueden reprocesar un mensaje. | Persistir clave idempotente y estado de procesamiento. |
| Sesiones | Mapa en memoria con TTL y límite. | Se pierde recuperación tras reinicio y no existe retención durable. | Persistir estado mínimo, TTL y limpieza mediante Heartbeat. |
| Cola humana | Existe `safety_reviews` y lista pendiente. | Falta ciclo completo de asignación, resolución, prioridad y alerta. | Añadir estados, actor, timestamps y alertas sanitizadas. |
| Heartbeat | SDK presente; no hay `POST /api/scheduled/*` montado. | El mantenimiento documentado no puede ejecutarse. | Montar callback autenticado e idempotente antes del fallthrough. |
| Pagos | La demo expone `premiumAccess: demo-active`; no hay Checkout real en el snapshot. | No existe control real de acceso ni separación verificable de pagos de terceros. | Implementar Stripe únicamente para suscripción Premium propia, con webhook y permisos mínimos. |
| Persistencia | Esquema limitado a `users` y `safety_reviews`. | Faltan auditoría, consentimiento, dedup, sesiones, IDV, Premium y alertas. | Diseñar migración no destructiva y verificarla en base de datos. |
| Observabilidad | Contadores y errores sanitizados en memoria. | Reinicios eliminan métricas y no hay umbrales de alerta. | Persistir agregados o enviar alertas sanitizadas; nunca registrar PII. |

## Criterio de prioridad

La prioridad P0 es impedir que una capacidad nueva degrade los guardrails existentes: no se añade IA, IDV ni pagos a un flujo que carezca de bloqueo determinista, idempotencia durable y consentimiento trazable. La prioridad P1 es convertir el demo en un servicio recuperable mediante persistencia mínima y Heartbeat. La prioridad P2 incluye automatización avanzada de alertas, proveedor IDV concreto y cuenta comercial de alto riesgo, siempre después de una revisión jurídica y de cumplimiento del país de operación.

## Decisiones externas que no deben inventarse

El código no debe elegir por su cuenta un proveedor IDV, país de residencia fiscal, precio Premium, cuenta high-risk, periodo legal de retención ni política de transferencia internacional. Esas decisiones requieren datos del operador y revisión profesional. Mientras falten, la plataforma debe permanecer en modo demo o en modo seguro desactivado, sin simular verificaciones ni cobros.

## Evidencia revisada

Se revisaron el flujo `server/demo.ts`, el detector `server/patterns.ts`, la superficie `server/routers.ts`, el esquema `drizzle/schema.ts`, el webhook, el SDK Heartbeat y las pruebas existentes. La auditoría encontró que la seguridad básica previa a la respuesta está implementada, pero no hay evidencia suficiente para afirmar recuperación durable, operación multiinstancia, IDV externo, Checkout Premium real ni mantenimiento programado en producción.

## Delta implementado después de la auditoría

Se añadió `server/maintenance.ts` con autenticación cron mediante `sdk.authenticateRequest`, rechazo de llamadas no cron, ejecución idempotente de limpieza y errores JSON sanitizados. La ruta `POST /api/scheduled/maintenance` quedó montada explícitamente antes del fallthrough de Vite/estáticos y la guía de operación ahora documenta la creación post-despliegue con una expresión UTC de seis campos.

El detector determinista incorpora señales críticas de consentimiento ausente y señales de extorsión de severidad alta. Además, `isAmbiguousSafetyInput` deriva a revisión humana los mensajes inciertos que contienen vocabulario sensible. La función `runGuardedGeneration` constituye el único guardián reutilizable previsto para futuros pasos generativos: rechaza cualquier decisión distinta de `continue` o cualquier entrada ambigua. La suite alcanza 27 pruebas Vitest y TypeScript compila sin errores.

Persisten como brechas de producción la deduplicación durable multiinstancia, el estado durable de sesión, el proveedor IDV externo, el acceso Premium Stripe real, la retención configurable y las alertas persistentes. No se simulan esas capacidades.
