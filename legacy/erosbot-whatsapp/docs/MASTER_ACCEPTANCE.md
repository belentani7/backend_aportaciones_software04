# EROS-BOT EU v2.0 — Contrato maestro de aceptación

**Versión:** 2.0.0. **Estado:** especificación operativa del proyecto. **Ámbito:** asistente privado multilingüe para adultos independientes, sin captación, control, explotación ni intermediación de terceros.

> La plataforma automatiza asistencia operativa, traducción contextual, gestión de disponibilidad y escalado seguro. No sustituye la verificación regulada de identidad, la revisión jurídica ni la intervención humana cuando existe riesgo.

## 1. Guardrails no negociables

| Identificador | Requisito verificable | Criterio de aceptación |
|---|---|---|
| G-01 | Protección de menores | Toda sospecha razonable de minoría de edad bloquea el flujo, evita IA y crea una revisión prioritaria. No existe bypass por fecha declarada. |
| G-02 | Coerción y trata | Indicadores de coerción, control, captación, explotación o vigilancia no consentida producen `stop_and_escalate`; no se envía una respuesta operativa normal. |
| G-03 | Violencia y extorsión | Amenazas, violencia, extorsión o instrucciones para daño producen bloqueo y escalado humano. |
| G-04 | Privacidad | Doxxing, solicitud de datos sensibles o seguimiento no consentido se rechazan; los registros usan minimización, seudonimización y retención limitada. |
| G-05 | Consentimiento | No se gestiona una operación sensible sin consentimiento explícito, vigente y trazable de la persona autorizada. |
| G-06 | Prohibiciones técnicas | El sistema no afirma que puede borrar remotamente historiales de WhatsApp, crear coartadas, simular llamadas o validar edad mediante una simple fecha de nacimiento. |
| G-07 | IA posterior | La capa determinista de seguridad se ejecuta antes de cualquier traducción generativa, clasificación generativa o respuesta LLM. En decisión de bloqueo no se invoca IA. |
| G-08 | Escalado ambiguo | Cualquier señal ambigua de riesgo se deriva a revisión humana y adopta una respuesta segura, sin improvisar. |

## 2. Identidad, edad y consentimiento

La declaración conversacional de mayoría de edad no es una verificación de identidad. Los endpoints y procedimientos sensibles deben requerir un estado de consentimiento y, cuando proceda, un resultado de un proveedor externo de verificación de identidad y edad regulada. El proveedor, país, finalidad, versión de política y fecha de expiración deben quedar registrados sin almacenar documentos innecesarios.

Una comprobación de edad solo puede habilitar una capacidad concreta y durante un periodo limitado. Un resultado fallido, caducado, revocado o ambiguo debe bloquear la capacidad y escalarla. La plataforma nunca debe aceptar como prueba suficiente una fecha introducida por la persona.

## 3. Privacidad y seguridad

Los datos se minimizan desde la entrada. Los identificadores de WhatsApp seudonimizan para observabilidad; los mensajes se almacenan solo cuando existe una finalidad operativa o de seguridad documentada. Los secretos permanecen en variables de entorno gestionadas, el tráfico usa HTTPS, las firmas de webhook se validan con comparación constante y los eventos poseen protección anti-replay e idempotencia.

La retención debe ser explícita por categoría. Las sesiones expiradas, hashes de deduplicación y revisiones cerradas deben someterse a limpieza periódica mediante un callback `/api/scheduled/*`, nunca mediante temporizadores en proceso. Los logs no deben contener texto completo, tokens, teléfonos sin seudonimizar ni credenciales.

## 4. Traducción y moderación contextual

La normalización multilingüe admite 12 lenguas europeas, errores ortográficos, abreviaciones y jerga contextual, pero comprensión lingüística no equivale a autorización de una acción. La capa de seguridad conserva el significado de riesgo, evita suavizar amenazas o coerción y no convierte jerga abusiva en una respuesta normalizada.

El flujo permitido es: validación de tamaño y esquema, deduplicación, normalización determinista, detección de seguridad, decisión `continue`/`pause_and_review`/`stop_and_escalate`, y solo después traducción o generación. Cada decisión debe ser trazable mediante un código de regla y una versión de reglas, sin guardar PII innecesaria.

## 5. Arquitectura operativa

Los webhooks son eventos externos y deben responder con rapidez, registrar una deduplicación durable y delegar trabajo pesado a una cola persistente o a una revisión pendiente. Los reintentos son seguros porque cada mensaje posee una clave idempotente estable. La degradación controlada debe priorizar bloqueo seguro, respuesta de servicio no disponible y recuperación posterior antes que perder el control de seguridad.

Heartbeat se reserva para mantenimiento determinista, expiración de sesiones, compactación y alertas periódicas. Los callbacks deben autenticar `user.isCron === true`, usar `user.taskUid`, responder de forma idempotente y estar montados explícitamente bajo `/api/scheduled/`.

## 6. Economía y límites de producto

La única monetización propia permitida por defecto es el acceso Premium de la plataforma. No se retienen, distribuyen, liquidan ni median pagos entre profesionales y clientes. Cualquier futuro módulo de pagos de alto riesgo debe estar aislado, desactivado por defecto, usar un proveedor autorizado y exigir revisión de cumplimiento fiscal y jurídico antes de activarse.

No se publican nombres, imágenes, reseñas, valoraciones ni mensajes de marketing sexualizados. La posición del producto es la de asistente privado, traducción y respuesta operativa neutral.

## 7. Observabilidad y respuesta

Las métricas mínimas son webhooks recibidos y rechazados, mensajes procesados, duplicados, bloqueos por seguridad, revisiones humanas, errores de transporte, latencia de cola y expiraciones ejecutadas. Las alertas deben evitar PII y distinguir entre fallo transitorio, cola detenida, aumento de bloqueos y fallo de proveedor externo.

Una revisión humana debe incluir severidad, regla activada, hash de mensaje, idioma, hora UTC, estado y motivo sanitizado. El revisor no recibe más contenido del estrictamente necesario para resolver el riesgo.

## 8. Evidencia de aceptación

La versión se considera alineada cuando `pnpm check`, `pnpm test`, `pnpm build` y la auditoría de dependencias pasan; cuando existen pruebas de bloqueo previo a IA, sesión/consentimiento, deduplicación durable, callback Heartbeat y errores sanitizados; y cuando la guía operativa documenta secretos, despliegue, configuración Meta, recuperación y límites de Stripe.

**Decisiones pendientes que no bloquean la demo:** proveedor IDV, país de operación, periodo exacto de retención, precio Premium y cuenta comercial de alto riesgo. Ninguna de esas decisiones se simula ni se inventa en producción.
