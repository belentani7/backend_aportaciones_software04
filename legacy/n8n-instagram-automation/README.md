# Automatización n8n para contenido realista de Instagram

**Autor:** Manus AI  
**Licencia:** MIT  
**Estado:** preparado para importación, revisión humana obligatoria y publicación desactivada por defecto.

Este repositorio contiene una automatización n8n para preparar contenido visual de un personaje virtual **adulto, ficticio y divulgado como generado con IA**. El paquete genera un briefing editorial, delega la creación de una foto o vídeo a un proveedor configurable y separa por completo la publicación en Instagram en un workflow distinto con aprobación explícita.

> Esta solución no crea cuentas, no elude controles de Meta, no automatiza inicios de sesión, no usa granjas de dispositivos y no publica nada tras importarse. Nunca uses semejanzas de personas reales sin una autorización verificable y evita cualquier representación de menores, contenido sexualizado o prácticas engañosas.

## Características

| Capacidad | Implementación |
|---|---|
| Planificación editorial | Disparador diario y selección de temas cotidianos rotativos |
| Prompt seguro | Personaje virtual adulto, sin semejanza real, sin texto incrustado y formato vertical 9:16 |
| Generación intercambiable | Nodo HTTP configurable mediante variables de entorno |
| Revisión humana | Paquete de aprobación separado antes de cualquier publicación |
| Control de lanzamiento | La publicación exige exactamente `publish=true`; en caso contrario, se detiene |
| Protección de secretos | `.env.example`, `.gitignore` y flujo de CI que evita `.env` rastreados |
| Calidad | Validación automatizada de JSON, conexiones, estado inactivo y barreras de aprobación |
| Respaldo | Script reproducible que genera ZIP y SHA-256 sin secretos |

Meta limita las capacidades de publicación por API a cuentas profesionales y permisos apropiados. La ruta compatible se implementa mediante Graph API; n8n ofrece nodos de Graph API y peticiones HTTP que permiten configurar este patrón [1] [2] [3] [4].

## Estructura del repositorio

```text
n8n-instagram-automation/
├── .github/workflows/main.yml          # Integración continua
├── assets/                              # Recursos visuales o ejemplos no sensibles
├── docs/                                # Diseño, operaciones y respaldo
├── scripts/create_backup.sh             # ZIP y suma SHA-256 reproducibles
├── src/workflows/
│   ├── 01_prepare_realistic_content.json
│   └── 02_approved_publish_instagram.json
├── tests/validate_workflows.py          # Pruebas estructurales y de seguridad
├── .env.example                         # Variables requeridas, sin valores reales
├── .gitignore
├── LICENSE
└── README.md
```

## Requisitos

| Herramienta | Versión recomendada | Uso |
|---|---:|---|
| n8n | Versión estable reciente | Importar y ejecutar workflows |
| Python | 3.11 o posterior | Ejecutar validaciones |
| ZIP | Versión del sistema | Crear respaldo portable |
| Cuenta de Meta | Profesional Business o Creator | Publicación oficial por API, si se habilita |
| Proveedor visual | Según el proveedor seleccionado | Crear imagen o vídeo desde el briefing |

## Instalación y configuración

Clona el repositorio y crea la configuración local a partir del ejemplo. No añadas `.env` al control de versiones.

```bash
git clone https://github.com/TU_USUARIO/n8n-instagram-automation.git
cd n8n-instagram-automation
cp .env.example .env
python -m unittest discover -s tests -p 'test_*.py'
```

En n8n, importa los archivos de `src/workflows/` desde **Import from File**. Mantén ambos workflows desactivados hasta haber probado el proveedor de generación y las credenciales de Meta en una cuenta de ensayo.

| Variable | Finalidad |
|---|---|
| `MEDIA_GENERATION_URL` | Endpoint del proveedor que crea imagen o vídeo |
| `MEDIA_GENERATION_API_KEY` | Secreto del proveedor de generación |
| `MEDIA_MODEL` | Modelo de generación seleccionado |
| `MEDIA_CALLBACK_URL` | Callback opcional para trabajos asíncronos |
| `META_GRAPH_VERSION` | Versión de Graph API validada para la cuenta |
| `INSTAGRAM_USER_ID` | ID de la cuenta profesional de Instagram |
| `META_ACCESS_TOKEN` | Token de Meta con permisos concedidos |
| `N8N_APPROVAL_SHARED_SECRET` | Valor aleatorio para proteger el webhook de aprobación |

## Flujo operativo

El workflow `01_prepare_realistic_content.json` genera una propuesta diaria y envía una petición al proveedor configurado. El resultado queda como `awaiting_human_approval`. La persona responsable debe comprobar realismo, derechos, divulgación de IA, formato y URL HTTPS accesible antes de enviar el payload de aprobación.

```json
{
  "publish": false,
  "media_url": "https://storage.example/approved-image.jpg",
  "caption": "Un momento normal de mi día. Personaje virtual generado con IA."
}
```

El ejemplo anterior no publica. El segundo workflow no atraviesa la barrera de seguridad hasta recibir `"publish": true`. Antes de habilitar esa ruta, proteja el webhook con autenticación, firma o lista de IPs y pruebe con una cuenta de Meta no productiva.

## Pruebas

Ejecute el conjunto de pruebas desde la raíz del repositorio:

```bash
python -m unittest discover -s tests -p 'test_*.py'
```

La suite comprueba que ambos JSON se parsean, que los workflows se importan inactivos, que no existen nodos duplicados ni conexiones rotas, y que el flujo de publicación contiene una barrera explícita y una salida segura.

## Copia de seguridad y Google Drive

Cree un ZIP de código y documentación, excluyendo dependencias, metadatos Git, archivos de entorno y backups anteriores:

```bash
chmod +x scripts/create_backup.sh
./scripts/create_backup.sh
```

El resultado aparece en `backups/Proyecto_n8n-instagram-automation_Backup_<UTC>.zip`, acompañado de su SHA-256 en pantalla. Para mantener una estructura clara en Google Drive, cree o seleccione la carpeta `Automatizaciones/n8n-instagram-automation/` y suba el ZIP junto con estas carpetas de referencia: `/src`, `/docs`, `/tests` y `/assets`. Antes de subir, compare la suma SHA-256 y compruebe que no se haya incluido un `.env`.

## GitHub

El repositorio está configurado para usar la rama `main` y ejecutar validaciones en cada push y pull request. Si se crea desde un directorio local nuevo, los comandos de referencia son:

```bash
git init
git branch -M main
git add .
git commit -m "feat: add safe n8n Instagram content automation"
git remote add origin https://github.com/TU_USUARIO/n8n-instagram-automation.git
git push -u origin main
```

## Limitaciones

El endpoint de generación es un marcador intercambiable; cada proveedor define su propio cuerpo de petición y respuesta. La publicación incluida es deliberadamente conservadora y está orientada a imágenes con URL pública. Los vídeos pueden requerir carga por partes, comprobación de estado y requisitos adicionales de Meta, por lo que deben implementarse y verificarse contra la documentación vigente antes de activar publicación. La versión de Graph API debe revisarse durante la configuración de la cuenta.

## Referencias

[1]: https://developers.facebook.com/products/instagram/apis/ "Meta — Instagram APIs"

[2]: https://developers.facebook.com/documentation/instagram-platform "Meta — Instagram Platform"

[3]: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.facebookgraphapi "n8n — Facebook Graph API node"

[4]: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest "n8n — HTTP Request node"
