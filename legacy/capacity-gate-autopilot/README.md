# Capacity Gate Autopilot

**Capacity Gate Autopilot** es un sistema full-stack de gestión de capacidad operativa. Su objetivo no es generar demanda indiscriminadamente, sino decidir automáticamente qué solicitudes se pueden aceptar sin sobrecargar la operación.

> **Principio de producto:** acepta únicamente la demanda que puede absorberse con capacidad, margen, calidad y plazo controlados.

## Qué resuelve

El sistema centraliza la entrada de solicitudes y las evalúa contra una capacidad segura calculada con capacidad teórica, factor de calidad, disponibilidad humana y colchón de seguridad. Cada solicitud recibe una decisión estructurada: `accept`, `waitlist`, `route`, `reject`, `human_review` o `stop`.

El dashboard utiliza cinco estados operativos exactos: **VERDE**, **AMARILLO**, **NARANJA**, **ROJO** y **NEGRO**. Los estados no son decorativos: gobiernan la admisión, la lista de espera, la derivación y el apagado de seguridad.

## Funcionalidades

| Módulo | Responsabilidad |
|---|---|
| Control room | Estado operativo, capacidad segura, carga, margen y tasa de error. |
| Capacity Gate | Motor determinista de decisión con salida JSON estructurada. |
| Parámetros | Capacidad, factores de protección, margen, plazo, riesgo, canales y umbrales. |
| Cola | Prioridad, carga, estado, reintentos, expiración e idempotencia. |
| Auditoría | Modelo, timestamp, versión de reglas, confianza y motivo de cada decisión. |
| Métricas | Utilización, respuesta, errores, intervención humana, margen, duplicados e incidencias. |
| Respuestas | Configuración de mensajes para aceptación, espera, derivación y rechazo. |

## Arquitectura

```text
Solicitud autorizada
        |
        v
Prevalidación + idempotencia
        |
        v
Capacity Gate
  capacidad · margen · riesgo · plazo · canal
        |
        +--> accept ------> cola de ejecución
        +--> waitlist ----> cola priorizada con expiración
        +--> route -------> derivación sin compromiso
        +--> reject ------> respuesta de rechazo
        +--> human_review -> revisión limitada
        +--> stop --------> cierre de seguridad
        |
        v
Decisión JSON + auditoría + métricas
```

## Ecuación de capacidad

```text
capacidad_segura = capacidad_teórica
                 × factor_calidad
                 × factor_humano
                 × colchón_seguridad

unidades_carga = carga_estimada × complejidad × urgencia
capacidad_restante = capacidad_segura − carga_actual − carga_en_cola
```

Una solicitud solo puede aceptarse si el canal está autorizado, el riesgo está dentro del máximo, el margen supera el mínimo, el plazo es viable y las unidades de carga caben en la capacidad restante.

## Estados operativos

| Estado | Regla general | Comportamiento |
|---|---|---|
| VERDE | Operación estable | Admisión normal dentro de límites. |
| AMARILLO | Uso preventivo | Reserva capacidad para prioridades superiores. |
| NARANJA | Admisión selectiva | Solo admite prioridades altas o solicitudes de baja carga. |
| ROJO | Capacidad o plazo agotados | Detiene nuevas obligaciones y protege lo ya comprometido. |
| NEGRO | Error, duplicación o incidencia crítica | Cierre de seguridad y revisión operativa. |

## Contrato de decisión

```json
{
  "requestKey": "req-1048",
  "outcome": "accept",
  "capacityState": "VERDE",
  "confidence": 0.98,
  "reason": "Capacidad, margen, riesgo, canal y plazo dentro de los límites.",
  "modelUsed": "capacity-gate-rules",
  "rulesVersion": "1.0.0",
  "safeCapacity": 51,
  "remainingCapacity": 27,
  "loadUnits": 4
}
```

## Protocolo resolutivo autónomo

El procedimiento `autonomy.create` genera internamente el caso cuando el título no se proporciona, construye un prompt resolutivo estricto y persiste la ejecución mediante `runKey`. El prompt no permite texto libre como salida: exige JSON estructurado, una sola elevación por iteración, idempotencia y respeto de los límites operativos persistidos.

El procedimiento `autonomy.step` reanuda una ejecución activa y avanza un presupuesto acotado de iteraciones. Cada iteración queda guardada en `autonomous_iterations` junto con outcome, estado, confianza, acción, motivo y datos de la solicitud. La ejecución sobrevive a reinicios porque el estado se almacena en `autonomous_runs`; repetir un paso terminal no crea una iteración duplicada.

El escalado es progresivo: la intensidad aumenta una vez por iteración hasta que Capacity Gate devuelve `stop`, el estado llega a **ROJO** o **NEGRO**, se alcanza el máximo de iteraciones o el sistema detecta que continuar cruzaría la capacidad segura. En ese punto el run queda marcado como `saturated`, `stopped` o `completed`; nunca se fuerza una operación por encima del perímetro para cumplir el objetivo.

### Contrato del prompt autónomo

```text
ROL: Capacity Gate Autopilot, motor de resolución operativa autónoma.
MISIÓN: convertir un objetivo en un caso ejecutable, elevarlo progresivamente y detenerlo antes de saturar recursos.
SALIDAS: accept | waitlist | route | reject | human_review | stop.
FORMATO: JSON estructurado con runKey, iterationNumber, outcome, capacityState,
confidence, action, reason, nextStep y stopReason.
REGLA: no inventar capacidad; no duplicar iteraciones; no superar capacidad segura.
```

## Estructura de carpetas

```text
capacity-gate-autopilot/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/
│       │   ├── DashboardLayout.tsx
│       │   └── ui/
│       ├── pages/
│       │   └── Home.tsx
│       ├── lib/trpc.ts
│       ├── index.css
│       └── App.tsx
├── drizzle/
│   ├── schema.ts
│   └── migrations/
├── server/
│   ├── capacityEngine.ts
│   ├── capacityEngine.test.ts
│   ├── autonomousEngine.ts
│   ├── autonomousEngine.test.ts
│   ├── autonomyPersistence.ts
│   ├── autonomyPersistence.test.ts
│   ├── autonomy.router.test.ts
│   ├── db.ts
│   ├── routers.ts
│   └── _core/
├── shared/
├── package.json
└── README.md
```

## Instalación local

```bash
pnpm install
pnpm dev
```

La aplicación utiliza la autenticación integrada del proyecto y la variable `DATABASE_URL` proporcionada por el entorno. No se deben incluir archivos `.env` ni claves privadas en el repositorio.

## Validación

```bash
pnpm test
pnpm check
pnpm build
```

Las pruebas cubren el cálculo de capacidad segura, aceptación, lista de espera, derivación, rechazo por margen, revisión humana, parada por drift crítico, los cinco estados exactos y el protocolo autónomo: generación de caso, escalado, persistencia conceptual, idempotencia y parada por saturación o presupuesto.

## Integración del motor

El procedimiento tRPC `capacity.evaluate` recibe una solicitud con `requestKey`, título, descripción, canal, prioridad, complejidad, urgencia, carga estimada, margen y riesgo. La `requestKey` funciona como clave de idempotencia para evitar que un reintento genere dos solicitudes.

El procedimiento devuelve JSON estructurado y registra la decisión cuando existe una conexión de base de datos. La persistencia incluye solicitudes, decisiones, configuración, métricas y respuestas automáticas.

## Seguridad operativa

El sistema no amplía automáticamente la capacidad, no envía captación no solicitada y no promete disponibilidad fuera de los límites. Cuando las métricas cruzan los umbrales configurados, la operación pasa a un estado restrictivo. Las solicitudes no se eliminan durante el apagado: quedan registradas con su estado y motivo.

## Despliegue

El proyecto está preparado para ejecutarse como aplicación web administrada. Para publicar una versión estable, primero hay que crear un checkpoint desde la interfaz de gestión y después utilizar el flujo de publicación. El repositorio de código puede clonarse y desplegarse siguiendo la configuración del entorno de la plantilla.

## Identidad visual

La interfaz sigue una dirección de **calm mission-control SaaS**: espacio de trabajo claro, paneles de comando oscuros, verde como señal de capacidad saludable y colores de alerta reservados exclusivamente para estados operativos. La tipografía, el espaciado y los indicadores se han diseñado para lectura rápida en un contexto de control.

## Licencia

Añade la licencia que corresponda antes de distribuir el sistema públicamente. El repositorio generado se mantiene privado por defecto para proteger la configuración operativa y la lógica del negocio.
