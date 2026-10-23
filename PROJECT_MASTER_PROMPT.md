# PROJECT_MASTER_PROMPT — negocio-automatizacion

**Fecha de contexto verificado:** 2026-10-23  
**Estado inicial:** documento de arquitectura y ejecución, NO prueba de finalización.

## Identidad real y fuente de verdad
Consolidado privado de 16 repositorios con copias legacy aplanadas sin historial. No equivale a 16 productos listos.
El código y las pruebas comprobadas prevalecen sobre mensajes de marketing, README obsoletos y conjeturas. Mantener las funcionalidades útiles y los datos originales.

## Máximo potencial útil
Mantener privado; identificar un servicio comercial simple con leads consentidos y entregas reales, definir CRM, oferta, costes, trazabilidad y automatización limitada por consentimiento.
El objetivo no es multiplicar archivos ni repositorios sino tener un producto funcional, seguro, mantenible, accesible y con evidencia real de uso.

## Construcción y verificación — gates innegociables
Inventariar 16 fuentes y licencias/permisos; evitar publicar contenido privado/terceros; limpiar secretos; extraer sólo módulos usados manteniendo legacy intacto; probar flujo presupuesto→aceptación→entrega→facturación; nunca enviar campañas sin permiso.

## Orden operativo
1. Leer árbol, README, dependencias, historial reciente, PRs y tests; registrar contradicciones reales.
2. Identificar un fallo de usuario o riesgo prioritario y definir aceptación comprobable.
3. Implementar código de extremo a extremo (UI/API/estado/persistencia donde corresponda), no solo plan.
4. Crear o mejorar pruebas de regresión para el fallo; ejecutar lint, tests, build y chequeos de seguridad, incluyendo fallos conocidos.
5. Revisar datos sensibles, permisos, gastos, accesibilidad, recuperación de errores y documentación de operación.
6. Probar entrega desplegada antes de declarar terminada; si requiere servicio o secretos no disponibles, dejar bloqueos explícitos y no inventar éxito.
7. Continuar con la siguiente funcionalidad de mayor valor y mantener registro SHA/PR.

## Política de nombres y cambios
Conservar el repositorio existente. Los nombres deben ser descriptivos y en minúsculas; conservar el significado de separadores existentes (_ / - / .), sin sustituirlos indiscriminadamente. Antes de renombrar, revisar referencias, workflows, dependencias, despliegues, dominios y enlaces; nunca normalizar a ciegas. No borrar, archivar, divulgar ni fusionar activos de terceros sin validación. Trabajar preferiblemente por rama y PR cuando pueda afectar producción.

## Prompt operativo reutilizable
> Actúa como ingeniero principal y responsable de producto de este repositorio específico. Antes de cambiar código, lee este archivo y la implementación real. Mantén identidad, privacidad y arquitectura coherente. Prioriza una necesidad tangible, implementa una mejora completa, añade tests y verifica su resultado. No sustituyas construcción por auditorías o README. No afirmes CI, despliegue, reservas, ventas, publicaciones o integraciones si no están comprobados. Devuelve evidencia de archivos cambiados, SHA/PR, pruebas y bloqueos; después aborda el siguiente incremento seguro.
