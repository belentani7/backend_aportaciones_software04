# Activación de WhatsApp Cloud API: Mock → Meta

La demo inicia con `MockWhatsAppTransport` y no necesita credenciales. Para conectar una cuenta propia de Meta, configura las siguientes variables únicamente en los secretos del proyecto; nunca las pegues en GitHub, el frontend o los logs.

| Variable | Finalidad |
|---|---|
| `WHATSAPP_MODE=meta` | Activa explícitamente el adaptador real; cualquier otro valor mantiene Mock |
| `META_WHATSAPP_ACCESS_TOKEN` | Token de acceso de sistema para llamar a la Messages API |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Identificador del número de WhatsApp Business |
| `META_WHATSAPP_VERIFY_TOKEN` | Secreto elegido para el desafío GET del webhook |
| `META_APP_SECRET` | App Secret utilizado para comprobar `X-Hub-Signature-256` |

## Procedimiento

Primero crea o selecciona una aplicación de Meta for Developers, añade el producto WhatsApp Business Platform y registra un número de prueba o un número propio según las condiciones de Meta. Copia el Phone Number ID, genera un token de sistema con los permisos mínimos necesarios y define un Verify Token aleatorio. El App Secret se obtiene en la configuración básica de la aplicación.

Después registra el endpoint público:

```text
https://TU-DOMINIO/api/webhooks/whatsapp
```

En la configuración de webhooks, utiliza el Verify Token exactamente igual al valor de `META_WHATSAPP_VERIFY_TOKEN` y suscribe el campo de mensajes. Meta ejecutará una petición GET con `hub.mode`, `hub.verify_token` y `hub.challenge`; el servidor solo devuelve el challenge si el token coincide.

Para los POST, el servidor conserva el cuerpo bruto y valida `X-Hub-Signature-256` mediante HMAC SHA-256 y `META_APP_SECRET`. También rechaza mensajes duplicados mediante su identificador y una ventana anti-replay. La demo procesa mensajes de texto; antes de producción deben añadirse pruebas para estados de entrega, errores, multimedia, plantillas e idempotencia de todos los eventos.

## Envío real

La demo actual mantiene el transporte Mock por seguridad. Antes de habilitar el envío real debe implementarse y probarse un `MetaWhatsAppTransport` que llame a:

```text
POST https://graph.facebook.com/{GRAPH_API_VERSION}/{META_WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer META_WHATSAPP_ACCESS_TOKEN
Content-Type: application/json
```

El adaptador debe enviar únicamente mensajes permitidos por la política de Meta, manejar respuestas 2xx/4xx/5xx, aplicar timeout, no reintentar operaciones no idempotentes sin una clave de correlación y registrar solo el ID del mensaje, el tipo y el resultado. No debe registrar tokens, texto completo ni datos sensibles innecesarios.

## Checklist de verificación

1. Mantén `WHATSAPP_MODE` distinto de `meta` durante las pruebas locales.
2. Prueba el flujo Mock desde el panel y confirma que el mensaje permanece simulado.
3. Configura los cinco secretos en el entorno de desarrollo protegido.
4. Valida el GET de Meta y comprueba que devuelve el challenge correcto.
5. Envía un POST de prueba firmado y confirma respuesta 200.
6. Reenvía el mismo evento y confirma que el anti-replay lo rechaza.
7. Prueba un evento sin firma válida y confirma respuesta 401 cuando el modo es `meta`.
8. Verifica mensajes de texto, estados de entrega y errores de API.
9. Solo después de la revisión legal, de seguridad y de políticas activa el envío real.

## Resolución de problemas

Si Meta no valida el endpoint, revisa que la URL sea pública, que use HTTPS, que la ruta sea exactamente `/api/webhooks/whatsapp` y que el Verify Token coincida sin espacios. Si los POST devuelven 401, comprueba que el App Secret pertenece a la misma aplicación y que la firma se calcula sobre los bytes originales, antes de parsear JSON. Si no llegan mensajes, revisa la suscripción al campo `messages`, el estado del WABA y los permisos del token. Si el servidor sigue enviando respuestas Mock, verifica que `WHATSAPP_MODE=meta` se haya aplicado al entorno correcto y que el despliegue se haya reiniciado.

Esta guía no garantiza la aprobación de Meta. La empresa operadora debe revisar la política vigente, el contenido enviado, el posicionamiento del producto y las obligaciones legales de cada jurisdicción antes de activar el canal real.

## Checklist de auditoría coste cero

La versión auditada limita payloads, mensajes, destinatarios y tasa de solicitudes; aplica timeout de red y mantiene el modo Mock como ruta de prueba sin coste. Antes de activar Meta, confirma que el cuerpo bruto se conserva para HMAC, que ningún token aparece en logs, que el destinatario usa formato E.164 y que la configuración de políticas de Meta ha sido revisada de forma independiente.

## Alcance operativo consolidado

AUREA es un SaaS neutral de asistencia, traducción y preparación de respuestas. No fija precios, no hace matching, no gestiona reservas económicas, no cobra a clientes finales, no recibe comisiones y no custodia fondos de terceros. El único cobro propio previsto es el acceso premium.

El modo inicial es Mock. El adaptador Meta solo se activa con credenciales propias, `WHATSAPP_MODE=meta`, verificación HMAC y revisión independiente de las políticas aplicables. La demo no incluye catálogo de servicios, escrow, split payments, reembolsos de reservas, geolocalización exacta, contenido sexual explícito ni decisiones sensibles automatizadas.

Las referencias GitHub utilizadas están documentadas en el informe de auditoría y se emplearon solo como patrones técnicos con licencia identificable; no se copiaron credenciales, tokens ni configuraciones privadas.

## Mantenimiento programado con Heartbeat

El mantenimiento se expone en `POST /api/scheduled/maintenance` y solo acepta identidades cron autenticadas por el SDK del proyecto. El callback no acepta `taskUid` desde el cuerpo de la petición: usa la identidad firmada por la plataforma, ejecuta una limpieza acotada y devuelve JSON idempotente.

Debe crearse después de publicar la aplicación, porque el planificador llama a la URL de producción y no al sandbox local. La expresión usa seis campos UTC, incluidos los segundos. Ejemplo de job de proyecto:

```bash
manus-heartbeat create \
  --name aurea-maintenance \
  --cron "0 0 3 * * *" \
  --path /api/scheduled/maintenance \
  --description "Expiración de sesiones y compactación de revisiones sanitizadas"
```

Conserva el `task_uid` devuelto para consultar logs, pausar o eliminar el job. El handler tiene un límite operativo de dos minutos y debe seguir siendo seguro ante reintentos. No se deben usar `setInterval`, `node-cron` ni temporizadores en proceso para mantenimiento de producción.
