# Operación de copias de seguridad en Google Drive

La copia de seguridad se crea localmente con `scripts/create_backup.sh`. El script excluye configuraciones de entorno, dependencias, metadatos Git, logs y respaldos previos. Por tanto, el archivo resultante contiene únicamente los archivos necesarios para reconstruir y auditar el proyecto.

## Estructura recomendada

Cree en Google Drive una carpeta con esta organización:

```text
Automatizaciones/
└── n8n-instagram-automation/
    ├── backups/    # Archivos ZIP con fecha UTC y comprobación SHA-256
    ├── src/        # Copia legible de workflows importables
    ├── docs/       # README, decisiones y documentación operativa
    ├── tests/      # Validación de integridad y controles de seguridad
    └── assets/     # Recursos aprobados que no incluyan datos personales
```

## Procedimiento seguro

Ejecute el script de respaldo desde la raíz del repositorio y conserve el hash que imprime. Abra el ZIP para comprobar que no contiene `.env`, claves, tokens, `node_modules` ni `.git`. Luego suba el archivo a `backups/` mediante la interfaz de Google Drive o mediante una integración autorizada. Compare el SHA-256 local con el archivo descargado si necesita una verificación adicional.

No se incluye un token de Google Drive ni un script que fuerce autenticación. La cuenta y la carpeta de destino deben ser controladas por el propietario del proyecto. Nunca conceda acceso de edición a una cuenta desconocida ni permita que un archivo de respaldo se comparta públicamente si pudiera contener información interna.
