# Forge10 — Checklist de calidad

## Accesibilidad verificada

| Área               | Verificación                                                                                                                                                                | Resultado |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Teclado            | Navegación mediante botones nativos, enlaces y controles accionables; no se usan elementos `div` como controles.                                                            | Conforme  |
| Foco               | Los elementos interactivos muestran `outline` visible mediante `:focus-visible` con color cian de alto contraste.                                                           | Conforme  |
| Landmarks          | La aplicación utiliza `aside`, `nav`, `main` y `header`, con etiquetas `aria-label` para navegación principal y móvil.                                                      | Conforme  |
| Nombres accesibles | El botón de exportación y el botón de cierre del diálogo tienen `aria-label`; la navegación mantiene texto visible.                                                         | Conforme  |
| Diálogo            | La ficha técnica usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby`.                                                                                              | Conforme  |
| Contraste          | El texto principal usa blanco sobre superficies oscuras; estados aprobados usan cian/esmeralda y los rechazados ámbar, manteniendo diferenciación textual además del color. | Conforme  |
| Responsive         | Se verificaron capturas de escritorio (1280 px) y móvil (390 px); la navegación lateral se convierte en navegación horizontal.                                              | Conforme  |

## Revisión visual

Forge10 utiliza una dirección de **cockpit de certificación técnica**: superficies oscuras por capas, una rejilla instrumental de fondo, una banda numerada de los seis criterios, acentos mint/cian para estados certificados, lenguaje de protocolo, barras calibradas 0–10, sellos `✓ CERTIFIED`, badges de veredicto y un registro de candidatos atenuado cuando no supera el filtro. La identidad evita depender de gradientes decorativos y concentra el color en aprobación, precisión y acción primaria. La captura final de escritorio posterior a estos cambios confirma la presencia conjunta de la banda 01–06, la rejilla técnica y los sellos de certificación en tRPC y React.

## Verificación técnica

`pnpm check` — conforme.

`pnpm test` — conforme: 2 archivos, 5 pruebas.

`pnpm build` — conforme. Vite y esbuild generan la salida de producción; queda una advertencia no bloqueante de tamaño de chunk frontend superior a 500 kB.
