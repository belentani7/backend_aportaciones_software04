# Plan Comercial y Guía de Instalación: HARMONÍA Web-to-Markdown Clipper

## 1. Propuesta de Valor y Posicionamiento
**HARMONÍA Web-to-Markdown Clipper** es la extensión de navegador definitiva para investigadores, creadores de contenido y desarrolladores que transforman páginas web en notas estructuradas para Obsidian, Notion o archivos locales. 

A diferencia de las alternativas tradicionales que dependen de servidores en la nube y suscripciones costosas, HARMONÍA es **100% Local-First**, protege la privacidad del usuario, no requiere registro y garantiza la integridad de los datos mediante un motor de tres fases (Preparar → Confirmar → Commit).

---

## 2. Modelo de Precios y Costes

### Coste Operativo Anual
- **Infraestructura de servidor:** 0 € (operación local-first).
- **Dominio y Hosting estático (opcional para landing):** ~12 € / año.
- **Coste total de operación:** **12 € / año** (dentro del límite solicitado de 20 € anuales).

### Modelo de Monetización (Freemium Sostenible)
1. **Versión Open Source / Gratuita:** Extensión básica con conversiones ilimitadas de páginas web a Markdown y almacenamiento local manual.
2. **Versión Pro (Pago único de 9.99 € o 2.99 € / mes):**
   - Extracción masiva (Batch clipping de múltiples pestañas).
   - Plantillas de metadatos personalizadas (Frontmatter avanzado para Obsidian).
   - Sincronización local encriptada con carpetas del sistema de archivos mediante File System Access API.

---

## 3. Guía de Instalación Local y Uso

1. **Clonar o descargar** el repositorio del proyecto en tu entorno local.
2. **Cargar la extensión en Chrome / Edge / Brave:**
   - Abre `chrome://extensions/`
   - Activa el **Modo de desarrollador** (esquina superior derecha).
   - Haz clic en **Cargar descomprimida** (`Load unpacked`) y selecciona la carpeta de la extensión.
3. **Uso del Protocolo de Tres Fases:**
   - Navega a cualquier artículo técnico o de investigación.
   - Haz clic en el icono de HARMONÍA Clipper.
   - Revisa la vista previa en la tarjeta flotante (**Fase A y B: Preparar y Confirmar**).
   - Confirma la exportación para guardar el archivo Markdown limpio en tu equipo (**Fase C: Commit**).

---

## 4. Plan de Validación con Primeros Usuarios
1. **Lanzamiento Beta Cerrado (Semana 1):** Compartir la extensión con 10 desarrolladores y redactores de confianza para validar la limpieza del formato Markdown y la robustez del motor de tres fases.
2. **Feedback y Ajustes (Semana 2):** Corregir incidencias de renderizado en sitios complejos y refinar los permisos de la extensión.
3. **Publicación en Web Stores (Semana 3):** Enviar formalmente la extensión a la Chrome Web Store y Add-ons de Firefox cumpliendo estrictamente con las políticas de Manifest V3.
