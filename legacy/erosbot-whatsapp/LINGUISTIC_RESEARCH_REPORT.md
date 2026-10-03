# Banco de datos para comprensión lingüística de AUREA

## Resumen

La investigación recomienda separar tres capas. La primera contiene recursos con licencia clara para intención, slots, morfología y traducción. La segunda contiene fuentes públicas de lenguaje informal, foros, comentarios y anuncios, pero solo se utiliza para descubrir candidatos de abreviaciones, variantes y errores; no se copian perfiles ni textos completos. La tercera conserva evaluación humana y métricas por idioma. Esta separación mejora la estabilidad y reduce el riesgo de incorporar datos personales o material cuya licencia no permita uso comercial.

| Fuente | Utilidad | Cobertura | Licencia/estado | Decisión |
|---|---|---:|---|---|
| MASSIVE 1.1 | Intenciones, slots, anotaciones de gramática y ortografía | 52 idiomas; incluye los 12 objetivos principales salvo búlgaro y checo en la lista consultada | CC BY 4.0 según su ficha | Candidato principal para taxonomía y evaluación; atribución obligatoria |
| Universal Dependencies | Tokenización, lemas, morfología, expresiones multi-palabra y errores | Amplia cobertura europea | Mixta por treebank; algunas licencias NC | Usar solo treebanks revisados individualmente |
| OPUS | Alineación de traducciones y conexiones entre idiomas | Más de mil corpus y numerosas lenguas | Mixta por corpus | Usar corpus individuales con licencia comprobada |
| European Language Grid | Descubrimiento de recursos y herramientas | Lenguas europeas | Por recurso | Catálogo, no permiso automático de copia |
| Common Corpus | Cobertura léxica y terminología | Multilingüe | Por fuente y documento | Solo registros con procedencia y licencia explícitas |
| Foros, comentarios y anuncios | Abreviaciones, ortografía no estándar y jerga regional | Depende del sitio | Términos del sitio | Pattern mining únicamente, sin republicación ni datos personales |

## Hallazgos relevantes

La ficha de **MASSIVE 1.1** describe aproximadamente un millón de expresiones en 52 idiomas, 60 intenciones y 55 tipos de slots. También documenta anotaciones de calidad gramatical, ortográfica e identificación de idioma, además de afirmar que el corpus no contiene información personal o sensible. Esto lo hace adecuado como fuente de evaluación y diseño de taxonomías, no como permiso para copiar automáticamente cualquier otro sitio [1].

**Universal Dependencies** advierte que sus treebanks tienen licencias diferentes y que algunos son no comerciales. La licencia del árbol individual y la procedencia del texto subyacente deben revisarse por separado. Este punto es esencial para un producto de pago, aunque el acceso premium sea la única monetización de AUREA [2].

**OPUS** es una colección de corpus paralelos y no una licencia única. Su valor para AUREA está en alinear términos, equivalencias y variación entre idiomas; cada corpus debe conservar su propia trazabilidad y no debe redistribuirse sin comprobar sus condiciones [3].

La investigación sobre lenguaje informal confirma que los datos públicos de foros y comentarios pueden contener identificadores, información sensible y restricciones de copyright. Por ello, la política de AUREA debe convertir esas fuentes en señales agregadas: idioma, variante, patrón normalizado, categoría, frecuencia aproximada y confianza. No se deben guardar el anuncio, el perfil, la conversación o el contacto originales.

## Diseño de integración

El registro `data/linguistic-sources-v3.json` contiene la procedencia y el estado de cada fuente. `server/sourceRegistry.ts` lo carga con caché y expone únicamente candidatos aprobados, sin texto bruto. La aplicación puede usar este registro para mostrar qué fuente respalda una regla, decidir si una fuente está pendiente de revisión y revertir una incorporación sin tocar el motor crítico de seguridad.

Los patrones derivados deben tener un identificador estable, idioma, variante regional, categoría, severidad, confianza, fuente, versión y fecha de revisión. Las reglas que afecten a menores, coerción, violencia, trata, fraude o privacidad deben generar una señal para revisión humana; nunca deben decidir por sí solas, bloquear permanentemente una cuenta ni producir respuestas sensibles.

## Recomendación práctica

La incorporación de foros y anuncios debe comenzar con una lista pequeña de dominios previamente aprobados. Para cada dominio se registra el término de uso, robots.txt, base jurídica, frecuencia máxima, campos excluidos, retención y método de anonimización. Si cualquiera de estos elementos no está claro, la fuente se mantiene en estado `review_required` y no se descarga.

El siguiente ciclo de mejora debería extraer únicamente candidatos de normalización y clasificación, probarlos contra un conjunto separado por idioma y medir precisión, cobertura y falsos positivos. Las reglas no deben incorporarse directamente al catálogo v2 sin revisión porque un patrón frecuente puede ser ambiguo o regional.

## Referencias

[1]: https://huggingface.co/datasets/AmazonScience/massive "MASSIVE 1.1 — dataset card"

[2]: https://universaldependencies.org/contributing/licensing.html "Universal Dependencies — Licensing treebanks"

[3]: https://opus.nlpl.eu/ "OPUS — multilingual parallel corpora"

[4]: https://live.european-language-grid.eu/catalogue/?page=1 "European Language Grid catalogue"

[5]: https://huggingface.co/blog/Pclanglais/two-trillion-tokens-open "Common Corpus — open multilingual data release"

## Validación de la integración v3

Se ejecutó una ingestión transitoria de 100 registros de MASSIVE en español. El proceso aceptó 100 registros y rechazó 0; eliminó raw text del flujo de persistencia y guardó patrones normalizados con `sourceId`, idioma, región, intención, etiquetas de contexto, confianza, estado de revisión y procedencia. Tras deduplicación quedaron 99 entradas únicas.

El loader v3 mantiene caché en proceso, limita el banco a 5.000 entradas y selecciona `data/enriched-patterns-v3.active.json` cuando existe; si no, utiliza el catálogo base. El script `scripts/rollback-enrichment-v3.mjs` activa una versión, conserva un respaldo y restaura el respaldo anterior. El flujo activate → rollback → activate se probó correctamente.

El benchmark reproducible de 1.000 búsquedas obtuvo una carga inicial aproximada de 0,78 ms y una media cacheada de 0,0037 ms por búsqueda en el entorno de demo. Estas cifras son orientativas y no sustituyen una prueba con tráfico real ni un corpus de los 12 idiomas.

### Benchmark integral del pipeline

La medición completa sobre 100 registros obtuvo los siguientes resultados: lectura/fetch 558,164 ms, sanitización 3,086 ms, escritura temporal 2,030 ms, 99 entradas tras deduplicación, búsqueda cacheada de 1.000 iteraciones en 5,026 ms y tiempo total 569,582 ms. El archivo de benchmark elimina el artefacto temporal al finalizar. El coste dominante es la red; la transformación local permanece por debajo de 6 ms en esta muestra.
