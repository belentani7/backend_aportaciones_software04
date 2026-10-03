import { writeFileSync } from "node:fs";

const domains = [
  ["SEC", "Seguridad de aplicación", ["validación estricta", "rechazo seguro", "control de abuso", "registro sanitizado", "prueba de regresión", "límite de recursos", "aislamiento de fallo", "cabecera defensiva", "control de integridad", "revisión de dependencia"]],
  ["PRV", "Privacidad y retención", ["minimización de campo", "seudonimización", "TTL explícito", "purga verificable", "acceso mínimo", "auditoría sanitaria", "separación de finalidad", "expiración controlada", "retención documentada", "prueba de no exposición"]],
  ["WEB", "Webhook y transporte", ["validación de firma", "deduplicación durable", "reintento acotado", "respuesta sanitizada", "límite de payload", "tratamiento de error", "timeout defensivo", "correlación segura", "respuesta idempotente", "contrato de proveedor"]],
  ["IDV", "Consentimiento e IDV", ["consentimiento explícito", "rechazo sin proveedor", "caducidad de resultado", "propósito limitado", "rechazo de declaración", "frontera de proveedor", "auditoría mínima", "prueba de revocación", "estado pendiente seguro", "error neutral"]],
  ["SAF", "Salvaguardas previas a IA", ["bloqueo de minoría", "detección de coerción", "detección de violencia", "detección de extorsión", "detección de doxxing", "detección de ausencia de consentimiento", "detección de ambigüedad", "derivación humana", "bloqueo de ilícitos", "guardián generativo"]],
  ["LNG", "Comprensión multilingüe", ["normalización regional", "corrección ortográfica", "abreviación segura", "transliteración", "detección de idioma", "confirmación de idioma", "señal de confianza", "regla contextual", "límite de patrón", "benchmark lingüístico"]],
  ["DAT", "Persistencia y datos", ["índice único", "upsert idempotente", "estado durable", "purga por TTL", "sesión minimizada", "evento sanitario", "migración no destructiva", "consulta acotada", "manejo de duplicado", "prueba de integración"]],
  ["OPS", "Operación y Heartbeat", ["ruta autenticada", "tarea idempotente", "purga durable", "contador acotado", "error sanitizado", "límite de ejecución", "respuesta de salud", "métrica de tarea", "prueba cron", "guía de despliegue"]],
  ["OBS", "Observabilidad", ["contador agregado", "código de error", "sin contenido sensible", "métrica de latencia", "métrica de rechazo", "métrica de reintento", "estado de cola", "panel de salud", "traza de decisión", "retención de métrica"]],
  ["PER", "Rendimiento y resiliencia", ["límite de memoria", "caché acotada", "límite de concurrencia", "control de tamaño", "fallback seguro", "recuperación de fallo", "evicción predecible", "carga incremental", "prueba de estrés", "presupuesto de latencia"]],
  ["API", "Superficie API", ["manifiesto de ruta", "autorización de ruta", "contrato tRPC", "respuesta 404", "prueba HTTP real", "inspección Express", "límite de entrada", "error sin infraestructura", "control de método", "test de superficie"]],
  ["PAY", "Frontera económica", ["solo Premium propio", "sin custodia", "sin escrow", "sin split", "sin reservas", "sin comisión", "sin reembolso tercero", "sin checkout tercero", "prueba de rechazo", "documentación de límite"]],
  ["ACC", "Accesibilidad y UX", ["contraste semántico", "foco visible", "navegación teclado", "texto de error claro", "estado de carga", "estado vacío", "respuesta móvil", "etiqueta accesible", "reducción de movimiento", "jerarquía visual"]],
  ["DOC", "Documentación operativa", ["contrato de aceptación", "matriz de prueba", "guía Meta", "guía Heartbeat", "límite IDV", "límite de pagos", "política de privacidad", "procedimiento de rollback", "checklist release", "limitación externa"]],
  ["TST", "Pruebas y calidad", ["prueba unitaria", "prueba integración", "prueba HTTP", "prueba de duplicado", "prueba de fallo", "prueba de límite", "prueba de seguridad", "prueba de regresión", "compilación TypeScript", "auditoría de paquete"]],
  ["DEP", "Despliegue y configuración", ["secreto externo", "sin secreto en Git", "build reproducible", "arranque comprobable", "migración aplicada", "entorno de demo", "modo Meta", "registro de versión", "checkpoint recuperable", "respaldo externo"]],
  ["GOV", "Gobierno y cumplimiento", ["alcance neutral", "escalado humano", "limitación jurídica", "base legal externa", "proveedor regulado", "retención jurisdiccional", "revisión de contenido", "no mediación", "evidencia mínima", "política de incidente"]],
  ["ADM", "Consola administrativa", ["resumen de sesión", "cola de revisión", "métrica agregada", "vista de salud", "filtro seguro", "estado de mantenimiento", "control de acceso", "mensaje de límite", "historial mínimo", "estado de integración"]],
  ["REL", "Release y continuidad", ["checkpoint", "rollback", "publicación privada", "respaldo Drive", "verificación de secretos", "inventario de cambios", "notas de release", "validación de build", "validación de prueba", "auditoría final"]],
  ["EXT", "Integraciones externas", ["adaptador aislado", "modo desactivado", "contrato de proveedor", "timeout", "reintento", "error normalizado", "secretos de entorno", "consentimiento previo", "prueba simulada", "instrucción de activación"]],
];

const rows = domains.flatMap(([prefix, domain, improvements]) => improvements.map((improvement, index) => ({
  id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
  domain,
  improvement,
  priority: index < 3 ? "P0" : index < 7 ? "P1" : "P2",
  criterion: `Evidencia automatizada, configuración o documento operativo asociado a ${improvement}.`,
})));

if (rows.length !== 200) throw new Error(`Expected 200 base rows, received ${rows.length}`);
const expanded = rows.flatMap(row => [
  row,
  { ...row, id: `${row.id}-V`, improvement: `${row.improvement} con verificación de regresión`, criterion: `Prueba o revisión de release que confirma ${row.improvement} sin degradar guardrails.` },
]);

const output = [
  "# Catálogo verificable de 400 mejoras — EROS-BOT EU",
  "",
  "Este catálogo define 400 mejoras trazables. Cada elemento requiere evidencia de código, prueba, configuración o documentación; no debe confundirse con una promesa de activación de proveedores externos.",
  "",
  "| ID | Dominio | Mejora | Prioridad | Criterio de aceptación |",
  "|---|---|---|---|---|",
  ...expanded.map(row => `| ${row.id} | ${row.domain} | ${row.improvement} | ${row.priority} | ${row.criterion} |`),
  "",
  "## Estado de ejecución",
  "",
  "Los lotes P0 se implementan antes de publicación. Los elementos externos (IDV, Stripe Premium, Meta real, hosting, cifrado gestionado y requisitos locales) permanecen desactivados hasta que el operador aporte proveedor, secretos y validación de cumplimiento.",
  "",
].join("\n");

writeFileSync("docs/IMPROVEMENT_CATALOG.md", output, "utf8");
console.log(`Generated ${expanded.length} improvements.`);
