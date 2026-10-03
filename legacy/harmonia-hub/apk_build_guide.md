# BELENTANI — Guía reproducible de APK Android

## Estado del proyecto

La configuración Expo está validada para Android con `com.app.belentani`, orientación vertical, icono BELENTANI y perfiles EAS definidos en `eas.json`. El entorno local no incluye Android SDK, Gradle ni una sesión Expo autenticada; por eso la compilación binaria debe ejecutarse mediante EAS desde una máquina o cuenta Expo con acceso de build.

## Requisito de conexión

La APK nativa no puede inferir el hostname del navegador. Antes de iniciar el build hay que definir `EXPO_PUBLIC_API_BASE_URL` con la URL HTTPS estable del backend publicado, sin la ruta `/api/trpc`. No se debe usar `localhost`, `127.0.0.1` ni la URL temporal del sandbox para una APK que vaya a distribuirse.

Ejemplo de sesión local:

```bash
export EXPO_PUBLIC_API_BASE_URL="https://api.tu-dominio.com"
```

El loader de Expo también acepta `VITE_API_BASE_URL` y lo transforma en `EXPO_PUBLIC_API_BASE_URL` durante la configuración.

## Build de prueba instalable (.apk)

Desde la raíz del proyecto:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec expo config --type public --json
npx eas-cli@latest login
eas build --platform android --profile preview
```

El perfil `preview` genera un APK de distribución interna (`android.buildType: apk`). EAS devuelve una URL de artefacto cuando termina el build. Descarga el `.apk`, habilita la instalación desde esa fuente en Android e instálalo en un dispositivo de prueba.

## Build de distribución (.aab)

Para Google Play se debe usar el perfil `production`, que genera un Android App Bundle:

```bash
export EXPO_PUBLIC_API_BASE_URL="https://api.tu-dominio.com"
eas build --platform android --profile production
```

El `.aab` no es un APK instalable directo; es el artefacto de publicación para Google Play. La primera compilación puede pedir crear o vincular el proyecto Expo y sus credenciales de firma Android.

## Verificación después de instalar

La prueba mínima debe comprobar que la app abre en vertical, que el generador de playlists responde, que el login conserva la sesión, que el mini-player no bloquea la navegación y que el endpoint configurado aparece en los logs sin ser `localhost`. Para validar el backend antes del build:

```bash
curl -fsS "$EXPO_PUBLIC_API_BASE_URL/api/health"
curl -fsS "$EXPO_PUBLIC_API_BASE_URL/api/health/automation"
```

## Limitación actual declarada

La configuración y el procedimiento están listos y verificados, pero este entorno no puede entregar honestamente un archivo `.apk` sin una sesión EAS/Expo autenticada y sin Android SDK local. El siguiente operador debe ejecutar el comando de EAS; el código no requiere cambios adicionales para iniciar ese build.
