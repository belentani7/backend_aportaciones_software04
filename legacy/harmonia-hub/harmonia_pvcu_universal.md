# Protocolo de Validación Universal (PVC-U) integrado en HARMONÍA

## 1. Introducción y Resumen
La integración del **Protocolo de Validación Universal (PVC-U)** en HARMONÍA eleva el MVP local-first de Web-to-Markdown Clipper a un estándar de grado industrial. Mediante la aplicación de esferas de validación, subesferas de IA (como la **Subesfera 4-A** para prevención de inyección de prompts y **Subesfera 2-A** para semántica inteligente) y un **Validation Ledger** inmutable, ningún dato o contenido web pasa sin verificación criptográfica y cumplimiento estricto.

---

## 2. Esferas y Subesferas Activas en el Clipper
- **Esfera 1 (Tipos y Estructura):** Valida que la URL de origen tenga protocolo válido y que el título esté presente.
- **Esfera 4 (Seguridad y Privacidad):** Escanea el contenido en busca de scripts maliciosos o patrones de ejecución no autorizados.
- **Subesfera 4-A (Prompt/Response Validation):** Intercepta e impide intentos de manipulación maliciosa ("ignore previous instructions", ataques de inyección de prompt en artículos web).
- **Subesfera 2-A (Semántica Inteligente):** Verifica que el contenido extraído cumpla con umbrales mínimos de longitud y coherencia.

---

## 3. Validation Ledger Inmutable
Cada extracción genera un `ValidationEnvelope` firmado digitalmente que se anexa de forma secuencial en un ledger con encadenamiento criptográfico (`recordHash` y `previousHash`). La integridad del ledger puede verificarse mediante `verifyIntegrity()`.

---

## 4. Pruebas y Verificación
La suite de pruebas unitarias (`harmonia.pvcu.test.ts` y `harmonia.clipper.test.ts`) valida al 100% (11/11 tests exitosos):
1. Validación correcta de entradas válidas.
2. Rechazo automático de URLs inválidas (PVC-101).
3. Rechazo automático de ataques de inyección de prompt (PVC-4A-001).
4. Registro inmutable y sellado criptográfico en el Validation Ledger.
5. Cumplimiento estricto del ciclo de tres fases (**Preparar → Confirmar → Commit**).
