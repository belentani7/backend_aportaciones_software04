# Frontera de verificación externa de edad e identidad

EROS-BOT EU no verifica edad mediante una fecha de nacimiento, una respuesta `YES` ni una declaración conversacional. El módulo `server/idv.ts` define el contrato mínimo que debe cumplir un proveedor externo: identificador del proveedor, hash seudonimizado del sujeto, estado, marca temporal, expiración y versión de política.

La integración permanece **desactivada por defecto**. Antes de activarla, el operador debe elegir un proveedor de identidad autorizado para la jurisdicción aplicable, formalizar la base legal, revisar transferencias internacionales y configurar credenciales mediante secretos del entorno. El sistema debe recibir solo el resultado mínimo necesario; no debe almacenar documentos de identidad ni biometría salvo que exista una necesidad legal documentada y controles específicos.

Un resultado `verified` caducado, revocado, pendiente, fallido o sin versión de política se rechaza con `external_idv_required`. La plataforma no decide que una persona es adulta por inferencia lingüística y no presenta la presencia de este módulo como garantía jurídica universal.
