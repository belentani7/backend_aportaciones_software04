# Project TODO

- [x] Panel de control con lista de flujos activos
- [x] Estado en tiempo real de los flujos
- [x] Métricas visibles: tickets procesados, tasa de automatización, coste estimado y fallos
- [x] Log de ejecuciones con trazabilidad completa por evento
- [x] Endpoint webhook público que reciba eventos en JSON
- [x] Validación de estructura de entrada del webhook
- [x] Asignación de idempotency key y prevención de duplicados
- [x] Motor de reglas deterministas configurable antes de invocar IA
- [x] Llamada a LLM únicamente para casos ambiguos
- [x] Extracción estructurada con schema JSON validado
- [x] Campos LLM: categoría, prioridad, sentimiento, resumen, acción sugerida y nivel de confianza
- [x] Reintentos automáticos con backoff exponencial para códigos 429 y 5xx
- [x] Derivación directa de fallos permanentes a la cola de excepciones
- [x] Cola de excepciones con payload completo, motivo del fallo y estado pendiente / resuelto
- [x] Reproceso manual y automático de excepciones
- [x] Registro de timestamp, duración, coste de tokens y resultado
- [x] Configuración de flujos: nombre, descripción, reglas, umbral de confianza mínima y acción destino
- [x] Acción destino: webhook saliente o log interno
- [x] Interfaz refinada, elegante y sofisticada sin añadir nomenclatura fuera de los requisitos
- [x] Pruebas Vitest de validación, idempotencia, reglas, reintentos y excepciones
- [x] Verificación visual responsive del panel
- [x] Checkpoint final del proyecto

## Historial

- [x] Solicitud inicial: construir la plataforma completa a partir de los requisitos del usuario
- [x] Activar el proceso programado de reproceso después de publicar la plataforma

## Correcciones de auditoría

- [x] Implementar schema Zod del payload del webhook y rechazar entradas inválidas por estructura/campos
- [x] Generar idempotency key en servidor cuando no venga, manteniendo deduplicación consistente
- [x] Alinear exactamente los nombres de campos estructurados del LLM con la nomenclatura requerida
- [x] Implementar reproceso automático de excepciones con política explícita y trazabilidad
- [x] Calcular y persistir coste de tokens real por ejecución LLM
- [x] Añadir pruebas Vitest para idempotencia, retry/backoff y cola de excepciones
- [x] Crear checkpoint final del proyecto antes de marcarlo como terminado
- [x] Reducir la UI a la nomenclatura requerida y conservar solo texto funcional necesario

## Última auditoría

- [x] Calcular y persistir coste monetario real por ejecución LLM a partir de precios configurables y uso registrado
- [x] Añadir pruebas unitarias para deduplicación, backoff y creación/reproceso de excepciones
- [x] Eliminar copy y etiquetas no requeridas de la interfaz

## Auditoría final de conformidad

- [x] Añadir pruebas Vitest que cubran deduplicación real por idempotency key en processEvent
- [x] Añadir pruebas Vitest para creación y reproceso de excepciones con cambios de estado y trazabilidad
- [x] Eliminar copy no especificado y el campo extra destino webhook de la UI, manteniendo la funcionalidad requerida

## Correcciones de conformidad finales

- [x] Probar creación de excepción desde processEvent, cambios pendiente/resuelto, intentos y trazabilidad de ejecuciones
- [x] Restaurar la configuración funcional de webhook saliente sin añadir nomenclatura de negocio ajena
- [x] Eliminar copy no funcional restante de la interfaz y conservar únicamente la nomenclatura requerida

## Verificación de destino y nomenclatura

- [x] Implementar configuración verificable y funcional para webhook saliente por flujo
- [x] Añadir prueba del envío cuando acción destino sea webhook saliente
- [x] Eliminar o justificar todo copy no requerido en Home.tsx

## Auditoría de cierre

- [x] Validar por flujo que webhook saliente siempre resuelve un destinationUrl válido
- [x] Probar processEvent completo con acción destino webhook saliente y verificar envío e idempotency key
- [x] Justificar o retirar copy técnico necesario de autenticación, guardado y estados vacíos en Home.tsx

## Contrato final

- [x] Exigir y validar en backend un destinationUrl válido cuando acción destino sea webhook saliente
- [x] Añadir prueba del contrato de creación que rechace webhook saliente sin URL válida
- [x] Documentar en Home.tsx que las etiquetas auxiliares son controles de acceso y estados requeridos para operar el panel

## Prueba de creación

- [x] Añadir prueba Vitest de createFlow que rechace webhook saliente sin destino válido y confirme que no se persiste

## No persistencia de flujo inválido

- [x] Añadir prueba con getDb e insert mockeados que confirme cero inserciones al rechazar webhook saliente sin URL

## Verificación literal del repositorio

- [x] Añadir una prueba que mockee explícitamente getDb e insert para confirmar cero inserciones ante webhook saliente sin URL

## Auditoría 10/10

- [x] Auditoría de contratos de entrada y salida
- [x] Auditoría de autenticación, autorización, exposición webhook y límites
- [x] Auditoría de idempotencia, concurrencia y consistencia persistente
- [x] Auditoría de reglas deterministas y uso exclusivo de LLM en ambigüedad
- [x] Auditoría de schema estructurado, confianza, coste y validación semántica
- [x] Auditoría de reintentos, backoff, errores permanentes y cola de excepciones
- [ ] Auditoría de reproceso automático, recuperación y trazabilidad completa
- [x] Auditoría de panel, estados, métricas y nomenclatura
- [x] Auditoría de pruebas, compilación, logs y comportamiento en runtime
- [ ] Dictamen 10/10 con evidencia reproducible

## Cierre definitivo 10/10

- [x] Configurar el secreto obligatorio del webhook público
- [x] Ejecutar la auditoría completa después de las correcciones de aislamiento y seguridad
- [x] Verificar visualmente escritorio y móvil sin errores de runtime
- [x] Actualizar la matriz de auditoría con evidencia reproducible
- [x] Guardar el checkpoint definitivo listo para Publish
- [x] Indicar al usuario el paso único de publicación

## Evidencia de auditoría pendiente

- [x] Completar y documentar la matriz Auditoría 10/10 con evidencia verificable por criterio
- [x] Registrar verificación visual auditable de escritorio y móvil con estados clave revisados
- [x] Repetir auditoría final después de aislamiento y seguridad y dejar constancia en todo.md

## Bloqueo real de aceptación productiva

- [ ] Crear y verificar el Heartbeat/cron de reproceso automático en la aplicación publicada, con al menos una ejecución real registrada
- [ ] Mantener el dictamen como listo para publicar hasta validar el reproceso automático en producción; solo entonces marcar 10/10

## Entrega GitHub

- [x] Crear repositorio privado y subir el código auditado a GitHub

## Maquinaria real de automatización

- [x] Separar explícitamente el motor operativo del panel de observación
- [x] Añadir estado persistente de cola para trabajo pendiente, procesando, completado y excepción
- [x] Implementar reclamación atómica de trabajos para impedir doble ejecución concurrente
- [x] Implementar lease/visibility timeout y recuperación de trabajos abandonados
- [x] Implementar worker que consuma eventos sin depender de solicitudes del navegador
- [x] Implementar activación programada real del worker mediante Heartbeat tras publicación
- [x] Añadir prueba de ejecución desatendida y recuperación después de fallo
- [x] Actualizar documentación del repositorio para describir la maquinaria operativa
- [x] Guardar checkpoint de la versión de maquinaria

## Auditoría del worker

- [x] Corregir processPendingEvents para tratar resultados con exception y aplicar backoff o fallo final coherente
- [x] Añadir pruebas del flujo enqueue, claim único, lease abandonado y reprogramación ante fallo transitorio

## Cobertura final del worker

- [x] Corregir processPendingEvents para reprogramar resultados con exception cuando sean transitorios y marcar fallo final cuando no lo sean
- [x] Añadir prueba del flujo completo enqueue -> processPendingEvents sin navegador
- [x] Añadir prueba de fallo transitorio con incremento de intentos y availableAt con backoff
- [x] Añadir prueba de fallo final no recuperable con estado terminal y trazabilidad

## Seguridad de callbacks

- [x] Exigir taskUid además de isCron en ambos callbacks programados y verificar compilación, pruebas y despliegue

## Runtime de callbacks endurecidos

- [x] Guardar y publicar un checkpoint posterior a la validación taskUid
- [ ] Verificar en runtime desplegado ambos callbacks con autenticación cron y taskUid

## Auditoría iterativa autónoma

- [x] Releer y consolidar estado real del código, runtime, Heartbeats, GitHub y documentación
- [ ] Verificar ejecución programada real o documentar de forma reproducible su ausencia
- [ ] Auditar callbacks, autenticación cron, taskUid, idempotencia, leases y estados terminales en producción
- [x] Ejecutar pruebas locales completas y pruebas runtime no destructivas
- [x] Corregir hallazgos adicionales y repetir validación
- [ ] Sincronizar el repositorio privado con el último código
- [ ] Guardar checkpoint final posterior a todas las correcciones
- [ ] Entregar dictamen final con evidencia y límites reales

## Corrección terminal verificada

- [x] Añadir evidencia explícita en la documentación de que los fallos permanentes del worker crean excepción pendiente y estado excepcion
- [ ] Publicar y verificar en runtime la nueva transición terminal de excepciones

## Sincronización verificada

- [ ] Confirmar que GitHub refleja automation.ts, worker tests, OPERATIONS.md y audit-10-10.md
- [ ] Confirmar que la rama remota coincide con el checkpoint final posterior a las correcciones
