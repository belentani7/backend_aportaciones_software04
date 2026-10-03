# Dirección visual Sonix Elite AI

La revisión de W3C WCAG 2.2 confirma que el texto normal debe mantener un contraste mínimo de 4.5:1, mientras que el texto grande requiere al menos 3:1. Los controles y estados no deben depender únicamente del color para comunicar su estado.

La referencia de diseño para modo oscuro recomienda evitar el negro puro, usar una escala de superficies elevadas para crear profundidad, reducir la saturación de los acentos, utilizar blancos suaves en lugar de blanco absoluto para grandes bloques de texto y reservar el color de marca para acciones primarias y estados activos.

Decisión aplicada: sustituir el azul frío y el dorado saturado por una armonía editorial basada en Obsidian (`#0B0D12`), Ink (`#11151D`), Slate (`#1A2230`), Champagne (`#E7C88F`), Mist (`#F3F0E8`) y un acento secundario Teal Smoke (`#86B9B0`). El oro se usará como señal de acción y prestigio; el teal como señal de sistema, éxito y tecnología; los neutros mantendrán jerarquía y legibilidad.

Referencias: W3C WCAG 2.2 Contrast Minimum — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html; Dark Mode Color Palette Guide — https://www.unixlytools.com/blog/dark-mode-color-palette-guide/

## Tokens propuestos

| Token | Valor | Uso |
|---|---|---|
| Obsidian | `#0B0D12` | Canvas principal |
| Ink | `#11151D` | Header y superficies base |
| Slate | `#1A2230` | Tarjetas y paneles |
| Slate elevated | `#242E3D` | Dropdowns, tabs y controles |
| Champagne | `#E7C88F` | CTA y foco de marca |
| Champagne soft | `#F3E2BE` | Hover y texto de marca |
| Teal Smoke | `#86B9B0` | Éxito, sistema y acento técnico |
| Mist | `#F3F0E8` | Texto primario |
| Fog | `#A9B2C0` | Texto secundario |
| Danger | `#D98B8B` | Errores y riesgos |

La implementación debe preservar la funcionalidad actual, elevar la legibilidad de tabs y controles, y añadir estados de foco visibles y transiciones breves respetando `prefers-reduced-motion`.
