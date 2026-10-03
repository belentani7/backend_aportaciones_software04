# Diseño de Arquitectura HARMONÍA MVP: Web-to-Markdown Clipper Local

## 1. Visión General de la Arquitectura
El sistema **Web-to-Markdown Clipper Local** opera bajo un modelo **Local-First**, ejecutándose enteramente en el navegador del usuario mediante una extensión Manifest V3 y una aplicación móvil/web de apoyo construida en React Native / Expo dentro del entorno.

### Componentes Principales
1. **Content Script (`extractor.ts`):** Extrae el DOM legible de la página activa mediante heurísticas limpias, eliminando barras de navegación, anuncios y elementos irrelevantes.
2. **Background Service Worker (`background.ts`):** Orquesta los eventos de la extensión, gestiona la cola de extracción y coordina el almacenamiento persistente con IndexedDB.
3. **Motor de Persistencia Durable (`storage.ts`):** Mantiene el estado de cada trabajo de extracción utilizando claves de idempotencia (`idempotency_key`) para evitar duplicados.
4. **Protocolo de Tres Fases (`workflow-engine.ts`):** Garantiza que cada extracción pase estrictamente por **Preparar (A)**, **Confirmar (B)** y **Commit (C)** antes de generar el archivo final.

---

## 2. Modelo de Datos Persistente (IndexedDB / Local State)

Cada operación de conversión se modela como un workflow durable:

```ts
export type NodePhase = 'prepare' | 'confirm' | 'commit';
export type NodeStatus = 'pending' | 'preparing' | 'awaiting_confirmation' | 'executing' | 'succeeded' | 'failed' | 'cancelled';

export interface ExtractionWorkflow {
  workflowId: string;
  url: string;
  title: string;
  markdownContent: string;
  phase: NodePhase;
  status: NodeStatus;
  inputHash: string;
  idempotencyKey: string;
  approvalRequired: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Protocolo de Confirmación en Tres Fases (Aplicado al Clipper)

### Fase A — PREPARAR
- El content script extrae el título, URL y texto principal de la pestaña activa.
- Se calcula un hash SHA-256 del contenido (`inputHash`).
- Se genera una propuesta de conversión con metadatos (número de palabras, imágenes detectadas, tamaño estimado).
- El estado del workflow se marca como `awaiting_confirmation`.

### Fase B — CONFIRMAR
- El usuario recibe una vista previa limpia del contenido Markdown convertido en una tarjeta flotante de cristal o modal.
- El usuario verifica que el título y el contenido sean correctos.
- Se exige clic explícito en "Confirmar y Guardar" (Commit). Si el usuario rechaza, el workflow pasa a `cancelled`.

### Fase C — COMMIT / EJECUTAR
- Una vez aprobado, se ejecuta la función idempotente de guardado local (descarga automática o guardado en el historial de extracciones).
- Se genera un registro de auditoría y el workflow pasa a `succeeded`.
- Si ocurre un fallo de escritura en disco, se activa la compensación y el workflow se marca como `failed` con opción de reintento seguro.

---

## 4. Seguridad y Cumplimiento
- **Permisos mínimos:** La extensión solicita únicamente `activeTab` y `scripting`, sin acceso general a todo el historial de navegación.
- **Protección XSS:** El contenido extraído se procesa de forma segura en texto plano y se sanitiza antes de renderizarse en la interfaz de vista previa.
- **Privacidad absoluta:** Ningún texto ni URL sale del dispositivo del usuario hacia servidores externos.
