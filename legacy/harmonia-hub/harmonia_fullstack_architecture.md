# Arquitectura Full-Stack Separada: BELENTANI + Protocolo PVC-U & CRM

## 1. Visión General del Sistema
El sistema se desglosa en cuatro capas independientes pero conectadas mediante contratos tipados (tRPC / REST) y persistencia robusta:

1. **Backend API Independiente (`/server`):**
   - Servidor Express + tRPC + MySQL (Drizzle ORM).
   - Endpoints de autenticación, gestión de usuarios, entidades CRM, ejecución de flujos y tareas automatizadas en segundo plano.
2. **CRM Web Operativo (`/client/src/pages/crm`):**
   - Panel de control de administración con vista de contactos, leads, pipeline comercial y monitor de automatizaciones en tiempo real.
3. **Aplicación Móvil Android (`/app`):**
   - Expo Router (React Native) para usuarios finales, conectada al backend API mediante cliente tRPC autenticado por cookies de sesión seguras.
4. **Motor de Automatización y Tareas Programadas (`/server/_core/heartbeat.ts` y workers):**
   - Gestión de tareas recurrentes, procesamiento de webhooks y validación criptográfica inmutable mediante el Protocolo de Validación Universal (PVC-U).

---

## 2. Estructura de Datos (Esquema Drizzle Ampliado)
- **`users`**: Autenticación, perfiles y roles (`user`, `admin`).
- **`crm_contacts`**: Gestión de contactos y clientes (nombre, email, estado, valor, notas).
- **`crm_leads`**: Pipeline de oportunidades y conversión.
- **`automation_jobs`**: Registro de tareas automatizadas, frecuencia, estado de ejecución y logs de errores.
- **`validation_ledger_records`**: Registro inmutable de encriptación y auditoría PVC-U.
