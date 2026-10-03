# Informe HARMONÍA: Fase 1 y Fase 2 (Investigación y Selección de MVP)

## 1. Contexto y Objetivos

Conforme al protocolo HARMONÍA, este documento presenta la investigación de cinco oportunidades reales de productos de navegador y herramientas local-first. El objetivo es identificar una solución que resuelva una tarea repetitiva frecuente, requiera infraestructura mínima o nula (presupuesto operativo de 0 a 20 euros anuales), cumpla rigurosamente con la normativa de privacidad y propiedad intelectual, y pueda construirse con código de calidad de producción.

---

## 2. Investigación de Cinco Oportunidades Candidatas

### Candidato A: Gestor de Pestañas y Sesiones con Archivado Inteligente Local
- **Usuario objetivo y contexto:** Desarrolladores, investigadores y profesionales que manejan más de 50 pestañas simultáneamente y sufren caídas de rendimiento en el navegador o pérdida de contexto al cerrar ventanas.
- **Frecuencia:** Diaria (múltiples veces al día).
- **Dolor actual y soluciones:** Las extensiones actuales de gestión de sesiones consumen memoria excesiva, guardan datos en servidores remotos de terceros o tienen interfaces recargadas.
- **Alternativas:** Session Buddy, OneTab.
- **Dependencias e infraestructura:** Almacenamiento local mediante IndexedDB. Coste operativo: 0 €.
- **Compatibilidad:** Chrome, Edge, Brave, Firefox (Manifest V3).

### Candidato B: Extractor y Conversor de Notas de Investigación Local (Web-to-Markdown)
- **Usuario objetivo y contexto:** Creadores de contenido, redactores, estudiantes e investigadores que necesitan extraer texto limpio, tablas e imágenes seleccionadas de páginas web para convertirlas instantáneamente en Markdown estructurado para Obsidian, Notion o archivos locales.
- **Frecuencia:** Diaria.
- **Dolor actual y soluciones:** Las extensiones de "Web Clipper" tradicionales fuerzan cuentas de usuario en la nube, son lentas o desestructuran el formato HTML complejo.
- **Alternativas:** MarkDownload, SingleFile.
- **Dependencias e infraestructura:** Procesamiento local con turndown / Readability en el content script. Coste operativo: 0 €.
- **Compatibilidad:** Chrome, Edge, Brave, Firefox.

### Candidato C: Validador de Accesibilidad y Contraste WCAG en Tiempo Real para Diseñadores y Desarrolladores
- **Usuario objetivo y contexto:** Diseñadores UX/UI y desarrolladores front-end que necesitan comprobar el cumplimiento de accesibilidad (contraste de colores, etiquetas ARIA, tamaños de fuente) directamente en la página activa antes de desplegar.
- **Frecuencia:** Semanal / por cada despliegue.
- **Dolor actual y soluciones:** Herramientas de auditoría completas (Lighthouse, Axe DevTools) requieren abrir consolas complejas y no ofrecen un feedback visual rápido y continuo sobre el DOM renderizado.
- **Alternativas:** WAVE Extension, ARC Toolkit.
- **Dependencias e infraestructura:** Análisis del DOM local. Coste operativo: 0 €.
- **Compatibilidad:** Motores Chromium y Gecko.

### Candidato D: Rellenador Inteligente Local de Formularios de Reclutamiento y Licitaciones (Form Vault)
- **Usuario objetivo y contexto:** Profesionales freelance, autónomos y candidatos que rellenan constantemente formularios largos idénticos en portales de empleo, subvenciones o licitaciones públicas.
- **Frecuencia:** Semanal.
- **Dolor actual y soluciones:** El autocompletado nativo del navegador falla en campos personalizados complejos y las extensiones comerciales almacenan datos personales en servidores en la nube inseguros.
- **Alternativas:** Dashlane (muy pesado), Autofill extensions genéricas.
- **Dependencias e infraestructura:** Encriptación local AES-256-GCM con contraseña maestra y almacenamiento en IndexedDB. Coste operativo: 0 €.
- **Compatibilidad:** Todos los navegadores modernos.

### Candidato E: Monitor Local de Errores de Red y Consola para QA Rápido (Mini Sentry Local)
- **Usuario objetivo y contexto:** QA testers y desarrolladores junior que necesitan capturar errores silenciosos de consola, fallos de fetch/XHR y tiempos de carga de una página web específica en una vista flotante limpia.
- **Frecuencia:** Diaria.
- **Dolor actual y soluciones:** Las herramientas de desarrollador completas son abrumadoras para pruebas funcionales rápidas.
- **Alternativas:** Network Logger, Console Exporter.
- **Dependencias e infraestructura:** Intercepción local de eventos `console` y `fetch` mediante inyección segura en el contexto de la página. Coste operativo: 0 €.
- **Compatibilidad:** Chrome, Edge, Brave, Firefox.

---

## 3. Matriz de Decisión y Puntuación (1 a 5)

| Candidato | Dolor | Frecuencia | Disposición a Pagar | Facilidad de Construcción | Independencia de Infraestructura | Riesgo Legal | Compatibilidad Multiplataforma | Puntuación Total |
|---|---|---|---|---|---|---|---|---|
| **A: Gestor de Sesiones** | 4 | 5 | 3 | 5 | 5 | 5 | 5 | **32 / 40** |
| **B: Web-to-Markdown Clipper** | 5 | 5 | 4 | 5 | 5 | 4 | 5 | **33 / 40** |
| **C: Validador WCAG** | 3 | 3 | 3 | 4 | 5 | 5 | 4 | **27 / 40** |
| **D: Form Vault Local** | 5 | 3 | 5 | 4 | 5 | 3 | 4 | **29 / 40** |
| **E: Mini Sentry Local** | 3 | 4 | 3 | 4 | 5 | 5 | 4 | **28 / 40** |

---

## 4. Selección del MVP: Candidato B (Web-to-Markdown Clipper Local)

Tras analizar la matriz, el **Candidato B (Web-to-Markdown Clipper con Persistencia y Protocolo de Tres Fases)** es el ganador indiscutible por las siguientes razones:
1. **Utilidad inmediata:** Resuelve una fricción diaria real para creadores, investigadores y programadores que necesitan documentar información web limpiamente sin depender de servicios de terceros en la nube.
2. **Arquitectura 100% Local-First:** No requiere servidores backend, bases de datos remotas ni costes operativos recurrentes (coste anual de infraestructura: **0 €**).
3. **Cumplimiento y Seguridad:** Opera exclusivamente sobre la página que el usuario visita de forma explícita mediante un comando o clic, respetando la privacidad y sin almacenar datos en servidores externos.
4. **Viabilidad técnica perfecta:** Se integra de forma nativa en Manifest V3 como extensión de navegador y aplicación web de apoyo, permitiendo aplicar el protocolo de confirmación en tres fases (Preparar → Confirmar → Commit) antes de guardar o exportar los archivos.

---

## 5. Criterio de Éxito del MVP
El MVP se considerará exitoso si un usuario puede:
1. Instalar la extensión localmente en su navegador (Chrome/Edge/Brave).
2. Navegar a cualquier artículo o documentación web, hacer clic en el icono y activar la extracción.
3. Revisar la propuesta generada en una vista previa (Fase A y B).
4. Confirmar la exportación (Fase C) para obtener un archivo Markdown limpio, con metadatos de origen y formato estructurado, guardado localmente de forma idempotente.
