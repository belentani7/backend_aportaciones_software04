# Privacidad, trazabilidad y frontera económica

## Privacidad por diseño

La demo usa claves de sesión seudonimizadas mediante hash, hashes de evidencia opcionales y errores sanitizados. Los registros operativos no deben incluir texto completo, teléfonos sin seudonimizar, tokens, documentos de identidad, biometría ni números de tarjeta. Los datos se conservan solo cuando son necesarios para seguridad, soporte o funcionamiento del servicio.

La persistencia de producción debe aplicar cifrado en tránsito mediante HTTPS y cifrado en reposo proporcionado por la base de datos y su proveedor gestionado. El código no incorpora claves criptográficas en el repositorio. Las sesiones efímeras del demo tienen TTL y límite de memoria; el mantenimiento Heartbeat elimina expiradas y compacta revisiones resueltas. La deduplicación y las sesiones multiinstancia siguen siendo una ampliación de producción pendiente y no se presentan como resueltas por el modo demo.

## Trazabilidad mínima

Cada revisión humana conserva un código de regla, severidad, hash de sesión, hora UTC y estado. Las métricas registran eventos agregados y errores sanitizados. El acceso humano debe limitarse por función y conservar solo la información necesaria para decidir una revisión de seguridad.

## Frontera económica

La plataforma solo puede cobrar por el acceso Premium propio. No recibe, retiene, divide, liquida ni concilia fondos de profesionales y clientes. No existe escrow, split payment, depósito, reembolso de reserva, comisión ni mediación de precio.

Una futura cuenta comercial de alto riesgo sería una integración externa separada, desactivada por defecto y sujeta a proveedor autorizado, evaluación de riesgo, obligaciones fiscales, KYC/KYB, términos de uso y revisión jurídica de la jurisdicción. EROS-BOT EU no selecciona por sí mismo el proveedor, la jurisdicción, el precio ni la estructura fiscal.
