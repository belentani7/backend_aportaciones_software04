# Auditoría integral AUREA — coste cero

## Resultado ejecutivo

La demo queda en un estado estable para revisión local y demostración de bajo volumen. Se verificaron TypeScript, pruebas unitarias y build de producción. La auditoría no puede convertir la demo en una garantía de cumplimiento legal, aprobación de Meta, seguridad absoluta o disponibilidad de producción; esas cuestiones requieren revisión independiente, credenciales propias, configuración de infraestructura y pruebas con tráfico real.

| Área | Resultado | Corrección aplicada |
|---|---|---|
| Dependencias | Mejorada | Actualizados Axios, NanoID, AWS SDK, Drizzle, Body Parser y dependencias relacionadas; retirados Streamdown y Mermaid no usados por la demo |
| Vulnerabilidades | Sin críticas en la última auditoría de producción | Persisten avisos bajos/moderados y algunos altos indirectos ligados a componentes de plantilla no enrutados; deben revisarse antes de producción |
| Webhook | Endurecido | HMAC, anti-replay, límite de 256 KiB, JSON inválido, timestamps, IDs y mensajes acotados |
| Transporte | Endurecido | E.164 estricto en Meta, timeout de 10 s, mensajes de 4.096 caracteres, historial Mock limitado y seudonimizado |
| Entradas tRPC | Endurecidas | Regex de identificador, trim, máximo de 4.000 caracteres y rate limit de 30 solicitudes/minuto por origen |
| Memoria | Acotada | TTL de 30 minutos, máximo de 5.000 sesiones, 1.000 revisiones y 10.000 claves de rate limit |
| Privacidad | Mejorada | Hash de sesiones, cola de revisión y destinatarios Mock; no se guarda el número completo en el snapshot |
| Motor lingüístico v2 | Validado | 40.320 reglas, 1.200 correcciones, 12 idiomas, IDs únicos y expresiones compiladas en caché |
| Calidad | Verificada | 13 pruebas Vitest pasan, TypeScript pasa y el build de producción pasa |

## Riesgos residuales

El motor v2 es un catálogo determinista generado y no un corpus validado por hablantes nativos. No debe interpretarse como detector fiable de trata, violencia, minoría de edad o consentimiento. Una coincidencia es una señal para revisión, no una conclusión. La demo tampoco implementa una evaluación estadística de falsos positivos y falsos negativos.

El adaptador Meta está preparado, pero la demo se ejecuta en Mock. La activación real exige credenciales propias, revisión de políticas, configuración de webhook, límites de Meta, gestión de errores y prueba controlada. No se incluyen credenciales ni tokens extraídos de GitHub.

La monetización está limitada al acceso premium de la propia plataforma. No existen depósitos, escrow, split payments, comisiones, reembolsos ni conciliación de pagos entre terceros. Las funciones de reservas comerciales, jobs de producción y retención avanzada están fuera del alcance de esta demo.

## Criterio de salida

La versión auditada se considera apta para demostración local de bajo volumen cuando se usa Mock, se mantienen secretos fuera del repositorio y se informa a los evaluadores de sus límites. No se considera apta para producción hasta completar revisión legal, threat modeling independiente, gestión de secretos, persistencia de sesiones, observabilidad, pruebas de carga, evaluación lingüística por idioma y revisión de la política de Meta.

## Verificación visual

La revisión desktop confirma jerarquía clara, contraste suficiente, tarjetas consistentes y una consola operativa legible. La revisión móvil muestra apilado vertical correcto, navegación sin desbordamiento horizontal visible, título adaptable y tarjetas accesibles mediante scroll. Como mejora posterior de coste cero, puede añadirse un foco visible más prominente para teclado y una navegación de revisión más compacta en pantallas estrechas.

## Verificación final de la auditoría

Después de actualizar tRPC y Express, adaptar el proxy wildcard a Express 5, retirar componentes gráficos no usados y repetir la validación, el resultado fue: TypeScript correcto, 14 pruebas Vitest correctas, build de producción correcto y `pnpm audit --prod` con 0 vulnerabilidades informativas, bajas, moderadas, altas o críticas en dependencias de producción. El build aún muestra una advertencia de bundle JavaScript superior a 500 kB; no bloquea la demo, pero puede mejorarse mediante code splitting en una iteración posterior.

## Referencias técnicas y alcance consolidado

La implementación tomó como referencia repositorios públicos con licencia identificable y la documentación oficial de Meta para el contrato del webhook y el envío de mensajes. Las referencias concretas están registradas en la documentación del proyecto; no se copiaron tokens, App Secrets, configuraciones privadas ni datos de usuarios.

AUREA es un SaaS neutral de asistencia, traducción y preparación de respuestas. No fija precios, no hace matching, no administra reservas económicas, no cobra clientes finales, no recibe comisiones y no custodia dinero entre terceros. El acceso premium es la única relación económica propia de la plataforma.

Las fuentes lingüísticas públicas se utilizan únicamente para derivar patrones agregados y anonimizados. Se excluyen perfiles, nombres, teléfonos, imágenes, coordenadas, conversaciones privadas, páginas con login y material sin licencia compatible.
