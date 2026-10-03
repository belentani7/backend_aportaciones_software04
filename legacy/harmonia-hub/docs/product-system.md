# Sistema de Producto — BELENTANI / HARMONÍA

## Principio rector

**BELENTANI convierte una intención musical en una playlist explicable; HARMONÍA convierte esa actividad en operaciones supervisadas.** La interfaz no promete catálogo, reproducción, pagos ni automatización que no estén conectados a un proveedor y a controles reales.

## Experiencia central

| Momento | Resultado esperado | Fuente de verdad |
|---|---|---|
| Entrada | La persona expresa una intención, mood o contexto en una frase. | Estado local efímero hasta solicitar generación. |
| Generación | La API devuelve una playlist validada con insights, o un error recuperable. | `playlist.generate` y el proveedor LLM. |
| Revisión | La persona puede leer el razonamiento, reproducir solo una fuente de audio válida o guardar la playlist. | Playlist persistida y estado de audio real. |
| Biblioteca | Se muestran únicamente playlists y favoritos del usuario autenticado. | MySQL. |
| Consejo | Un administrador revisa análisis, permisos, logs y propuestas. | MySQL, PVC-U y autorización administrativa. |
| Automatización | Un job preparado se ejecuta solo si está activo, validado y no detenido por el owner override. | Heartbeat, `automation_runs`, ledger PVC-U y control persistente. |

## Voz y verdad operativa

La interfaz utiliza lenguaje breve y humano. Los estados informan con precisión: **Generando con IA**, **No se pudo generar**, **Audio no conectado**, **Guardado en tu biblioteca**, **Autorización de owner requerida**. Nunca debe presentar una playlist de respaldo, una métrica de negocio o un evento de agente como si procediera de un proveedor real cuando no sea así.

## Sistema visual

| Token | Valor | Uso |
|---|---:|---|
| Fondo | `#0A0A0E` | Superficie base, continuidad entre pestañas y pantallas. |
| Superficie | `rgba(10,10,14,0.45)` | Una capa de vidrio por bloque funcional; no aplicar blur a listas densas. |
| Acento | `#8B5CF6` | Estado seleccionado, acción primaria y foco. |
| Texto principal | `#FFFFFF` | Titulares y acciones de máxima prioridad. |
| Texto secundario | `#D1D5DB` | Descripción y metadatos legibles. |
| Texto tenue | `#9CA3AF` | Contexto no crítico sin perder contraste. |
| Error | `#F44336` | Bloqueo, kill switch y fallo recuperable. |

La composición usa un único foco por pantalla. En móvil, el composer de intención aparece en el tercio superior, las selecciones secundarias quedan plegadas y la acción principal permanece dentro del alcance del pulgar. Las superficies usan radios de 16–24 px, espaciado de 8 px y transiciones de 120–300 ms. Toda acción táctil debe tener un área mínima de 44 × 44 px y las animaciones no son necesarias para entender un cambio de estado.

## Accesibilidad y resiliencia

Los selectores tienen etiquetas de accesibilidad, los estados de carga anuncian progreso semántico y el error incluye una acción de reintento. Los estados vacíos explican qué falta y qué hacer. En ausencia de red o LLM, el generador conserva la intención introducida y permite reintentar; nunca sustituye la respuesta por contenido ficticio. En ausencia de una URL de audio reproducible, el reproductor expone `unavailable` y no inicia un temporizador de progreso.

## Autonomía del Consejo

| Rol | Puede hacer | No puede hacer sin owner override |
|---|---|---|
| CEO | Analizar contexto y proponer prioridades. | Cambiar estrategia operativa o activar campañas. |
| COO | Preparar operaciones idempotentes y reportar estado. | Comprometer procesos externos. |
| CMO | Proponer mensajes y segmentos. | Publicar, comprar medios o contactar terceros. |
| CPO | Proponer mejoras de producto a partir de señales permitidas. | Activar funciones o borrar contenido. |
| CTO | Diagnosticar salud técnica y proponer mantenimiento. | Modificar secretos, infraestructura o políticas. |

El **kill switch** es un control persistente de owner. Toda ejecución de worker debe comprobarlo antes de la fase de commit. Cada cambio de estado, propuesta, aprobación o rechazo genera un registro de auditoría de solo adición, vinculado a su usuario y a un hash PVC-U.

## Estados de implementación

| Dominio | Estado objetivo |
|---|---|
| IA de playlists | Implementado con LLM real; error recuperable si el proveedor no responde. |
| Biblioteca | Persistida por usuario y sin playlists de muestra en la experiencia productiva. |
| Audio | `unavailable` hasta que cada track disponga de una URL reproducible con derechos. |
| Consejo | Análisis persistido; propuestas auditables; ejecución externa bloqueada por defecto. |
| Monetización | Integración pendiente hasta disponer de proveedor de pagos y entitlements. |
| Catálogos musicales | Integración pendiente hasta disponer de credenciales, licencias y política de uso. |
