# Auditoría de Elevación de Producto — BELENTANI / HARMONÍA

**Fecha:** 2026-08-22  
**Alcance:** aplicación móvil Expo, API Express/tRPC, MySQL/Drizzle, CRM web, workers HARMONÍA y automatizaciones PVC-U.

## Diagnóstico de producto

BELENTANI es una plataforma de descubrimiento musical guiado por IA: la acción principal es describir una intención musical, generar una playlist contextual y conservarla en una biblioteca privada. HARMONÍA es la capa de gestión operativa: CRM, jobs programados, ejecución de tres fases y ledger PVC-U. La identidad que se preserva es **music × AI × control humano**, con una interfaz oscura, tipografía sobria y acento púrpura.

El valor inicial real debe ocurrir en menos de un minuto: elegir una intención, generar una playlist y poder guardarla. El momento distintivo debe ser una explicación concisa de por qué la IA eligió cada pista, no una colección de tarjetas decorativas. Las automatizaciones del Consejo se restringen a análisis y recomendaciones hasta que una persona autorice una acción con impacto externo.

## Arquitectura encontrada

| Capa | Implementación encontrada | Estado de auditoría |
|---|---|---|
| Móvil | Expo SDK 54, React Native 0.81, Expo Router, NativeWind | Estructura funcional; varias pantallas usan estado local y datos de muestra. |
| API | Express 4, tRPC 11, SuperJSON, OAuth | API compilable; rutas de CRM y automatización ya usan autenticación, pero generación y consejo permanecen públicos. |
| Persistencia | MySQL/TiDB con Drizzle | CRM, jobs, runs y ledger PVC-U existen; faltan entidades de biblioteca, preferencias, Consejo y auditoría de override. |
| Worker | Callback Heartbeat con ejecución Prepare → Confirm → Commit | Flujo durable básico existente; debe respetar kill switch persistente y registrar decisiones del Consejo. |
| CRM | HTML/CSS/JS independiente en `/crm` | Acceso autenticado y endpoints básicos; falta visualización de control humano y ledger administrativo. |
| CI | GitHub Actions con TypeScript y subconjunto de Vitest | Insuficiente: no valida bundle de backend, configuración Expo, seguridad HTTP ni contratos de flujo. |

## Hallazgos prioritarios

| Severidad | Hallazgo | Riesgo | Decisión de corrección |
|---|---|---|---|
| Crítica | El reproductor simula progreso con `setInterval` sin fuente de audio. | La interfaz aparenta reproducción que no existe. | Sustituir por máquina de estados honesta: `idle`, `unavailable`, `loading`, `playing`, `paused`, `ended`, `error`; desactivar controles de audio cuando no haya URL reproducible. |
| Crítica | Biblioteca, perfil y Consejo mezclan datos ficticios con estado de usuario sin etiquetarlos. | El usuario no puede distinguir contenido real de semilla. | Migrar biblioteca, historial, preferencias y análisis del Consejo a persistencia; mostrar estados vacíos cuando no existan datos. |
| Crítica | El kill switch del Consejo solo cambia estado local. | No detiene workers ni queda auditado. | Crear control persistente por propietario, autorización administrativa y registros de override; el worker consultará su estado antes de ejecutar. |
| Alta | Generador y Consejo devuelven fallback presentado como resultado real si falla la IA. | La app presenta contenido generado artificialmente como respuesta válida. | Eliminar fallback productivo; devolver error recuperable y mantener fallback únicamente en pruebas explícitas. |
| Alta | CORS refleja cualquier origen y el middleware de seguridad no se monta. | Riesgo de abuso de cookies, peticiones cross-site y política inconsistente. | Montar una política CORS de allowlist, cabeceras de seguridad, límites de petición y respuestas de error seguras. |
| Alta | Controles avanzados del generador no llegan a la API; guardar en biblioteca es solo un aviso. | Preferencias y acciones primarias no tienen efecto. | Extender contrato, persistir la playlist y mostrar confirmación basada en respuesta del servidor. |
| Media | CI no compila backend ni valida Expo/CRM. | Regresiones publicadas sin señal suficiente. | Añadir quality gates para TypeScript, Vitest, bundle backend, Expo config y smoke HTTP. |
| Media | Planes de pago y claims comerciales son estáticos. | Se sugieren beneficios no aplicados por lógica. | Mostrar planes como “integración pendiente” mientras no existan entitlements y feature gates reales. |

## Estados de datos

| Tipo | Uso permitido tras la elevación | Estado actual |
|---|---|---|
| Real | Datos autenticados y persistidos de usuario, CRM, jobs, ledger y análisis. | Parcialmente implementado. |
| Semilla | Datos de desarrollo solamente, separados de la experiencia productiva. | Actualmente mezclado en `lib/mock-data.ts`. |
| Simulado | Solo pruebas unitarias y stories de desarrollo, nunca UX productiva. | Actualmente visible en player, library y Council. |
| Pendiente de integración | Audio y proveedores de catálogo/streaming sin credenciales o licencia. | Deben reflejar estado `unavailable`, sin progreso falso. |

## Criterios de aceptación de la elevación

La aplicación solo se considerará verificada para los flujos implementados cuando la playlist se genere mediante IA real o devuelva un error recuperable, la biblioteca persista los resultados autenticados, el Consejo y el kill switch dependan de datos del servidor, y la UI comunique claramente si el audio o los pagos siguen pendientes de un proveedor externo. Las rutas críticas deberán pasar pruebas de contratos, propiedad de datos, idempotencia y control de acceso.

## Límites conocidos

La conexión a catálogos musicales, la reproducción con licencias y los cobros requieren proveedores, credenciales y acuerdos que no están presentes en este proyecto. Estas capacidades no se simularán. El APK requiere una cuenta Expo/EAS autenticada para obtener un binario distribuible; el proyecto ya dispone de perfiles reproducibles, pero no existe una sesión de Expo disponible en el entorno actual.
