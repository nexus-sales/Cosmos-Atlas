# Correcciones de la auditoría del motor celeste

Se contrastó el informe aportado sobre el commit cdae287 con el código local. Sus hallazgos sobre constantes de cámara, identidad NGC, niveles Gaia y filtros de magnitud se confirmaron por lectura del código. Las comparaciones universales con otras aplicaciones y la imposibilidad general de representar fuentes de magnitud 22 exceden lo demostrado por una auditoría estática. La profundidad depende del catálogo, la banda, el campo consultado y la cobertura del survey.

## Implementado

- F1–F3 y F12. Los manejadores de zoom permanecen fuera del Suspense de recursos de la escena. FOV compartido de 1,5° a 90°, rueda proporcional con normalización de unidades, pinch proporcional al FOV y botones multiplicativos. Los vuelos a DSO usan cuatro veces su diámetro angular, con máximo 30°. Los objetos sin tamaño publicado conservan su encuadre previo. Se prueban límites, niveles Gaia y tamaños de encuadre.
- F4 y F9. Generador reproducible en `scripts/`, copia OpenNGC incluida con licencia, identificadores reales, clasificación explícita de cúmulos y magnitud V publicada. Búsqueda local hasta V 10 y selección de los puntos dibujados. El número de registros baja de 10.000 a 3.987 por el filtro de calidad documentado en `data-sources/openngc.md`.
- F5. Techo estelar compartido de magnitud 7 en Bortle 1. Bortle resta 0,6 por nivel, con la reducción de calidad adicional existente en Hipparcos.
- F6 y F10. Techo NGC hasta V 14 en el mejor caso, atenuación gradual, selección por frustum antes del cupo y hasta ocho etiquetas separadas en campo menor de 5°.
- F7. Nivel Gaia profundo hasta G 17 y 6.000 fuentes en calidad alta, con cupos inferiores por calidad y Bortle. Se conservan las cachés y el retraso de consultas existentes. Documentación alineada y banda G indicada en la ficha.
- F8. Se retira del árbol de renderizado la capa sintética sin estrellas visibles. El archivo histórico sigue disponible.
- F11. Se omiten coincidencias posicionales con el catálogo curado y se elimina el recorte del diámetro de M31. Los planos de texturas se orientan hacia la cámara mediante Billboard.
- F13. Selector 2MASS, DSS2 y Pan-STARRS DR1. Se conserva la instancia Aladin al cambiar survey, con actualización de objetivo y FOV desde la bóveda. El desplazamiento y zoom dentro de HiPS se mantienen en esa vista. Se indican bandas y cobertura parcial de Pan-STARRS.

## Error adicional de Hipparcos

La inspección de la captura móvil mostró coordenadas imposibles en una ficha. El generador pedía `_RAJ2000` y `_DEJ2000` en grados, pero volvía a multiplicarlas por 180/π. El binario anterior tenía 14.981 registros fuera del dominio angular entre sus 14.983 estrellas.

Se corrigió la conversión y se regeneró el binario desde el espejo oficial VizieR de Harvard, pues el servidor de Estrasburgo devolvía 404. El resultado contiene 14.211 estrellas con coordenadas válidas. La deduplicación nominal existente descarta ahora correctamente 773 entradas y se omiten 16 filas incompletas. La selección está limitada a las primeras 15.000 filas por brillo, con magnitud máxima 6,97 en la respuesta actual.

El cargador valida los dominios RA [0,360) y Dec [-90,90], conserva compatibilidad con registros antiguos de 16 bytes y usa `?v=2` para renovar la caché. Las pruebas de regresión inspeccionan todas las coordenadas distribuidas y rechazan la antigua doble conversión. Se reproduce mediante `node scripts/generate-hipparcos.mjs` y requiere acceso al servicio público `https://vizier.cfa.harvard.edu/viz-bin/asu-tsv`, catálogo I/239/hip_main de ESA (1997).

## Verificación

- 338 pruebas unitarias en 32 archivos, todas correctas.
- TypeScript y ESLint sin errores. ESLint excluye ahora los informes generados por Playwright.
- Compilación de producción correcta.
- Playwright sobre la compilación final con `--workers=1`, tres recorridos correctos y tres omisiones por plataforma esperadas. Incluye escritorio, móvil emulado y registro/recarga offline de la PWA.
- Recorrido de escritorio en Edge headless sobre producción local, correcto. Incluye rueda, botones hasta 1,5°, búsqueda NGC 2360, encuadre menor de 3°, M31, Polaris y apertura del sistema solar.
- Recorrido móvil emulado en Edge, correcto. Incluye layout, gesto multitáctil mediante CDP y apertura del panel.
- El arranque de las pruebas se actualizó para pulsar Continuar, esperar a que termine la salida de la portada y comprobar que los manejadores de zoom están montados. La instrumentación confirmó que el fallo móvil intermitente enviaba el gesto a la portada durante su desvanecimiento, activando zoom del navegador. La comprobación de limpieza de selección al abrir el sistema solar se limita a los paneles de objetos, pues las etiquetas de la escena siguen montadas bajo el modal.
- La transición del FOV usa amortiguación por tiempo transcurrido, para mantener su duración con distintas tasas de fotogramas.
- Se detectó y corrigió el solapamiento entre la barra lateral y los controles de zoom en escritorio.
- La regeneración del binario con la fuente comprimida incluida reproduce 3.987 registros y el mismo hash de entrada.

Las pruebas de navegador usaron la compilación local de producción. El servidor de desarrollo reutilizado no completó de forma fiable el arranque durante el primer intento. Los accesos a proveedores externos desde el servidor están restringidos por el entorno. El selector HiPS y el nivel G17 están implementados y pendientes de comprobación remota de extremo a extremo. El registro MOCServer de CDS confirma el survey Pan-STARRS configurado, aunque su URL de metadatos respondió 404 durante esta revisión. La captura de NGC 2360 valida su selección y encuadre, con el objeto bajo el horizonte en ese momento.

## Límites

Gaia y HiPS dependen de servicios externos. Sus umbrales configurados no garantizan que todas las fuentes hasta esa magnitud se reciban ni sean distinguibles. Esta corrección no acredita rendimiento en teléfono físico, calibración AR ni profundidad fotométrica medida de imágenes remotas. La deduplicación NGC usa proximidad angular y puede necesitar refinamiento con correspondencias explícitas de catálogo.

## Segunda fase de mejoras

### Implementado

- El arrastre pausa el seguimiento y conserva la selección. La acción Volver a centrar recupera el encuadre del objeto según su tamaño angular. El clic del fondo del cielo exige un inicio de pulsación registrado y un desplazamiento máximo de seis píxeles para limpiar la selección. El mismo umbral evita activar etiquetas de constelaciones al arrastrarlas.
- El zoom manual tiene prioridad sobre el FOV del vuelo. El efecto de ampliación del viaje se desactiva al intervenir manualmente y en vuelos menores de 1,5 segundos. La duración y elevación del trayecto dependen de la separación angular.
- La representación de observación aplica Bortle una sola vez, en el umbral de magnitud de DSO. La opacidad base pasa a 0,6 y el sprite conserva al menos el 75% de su intensidad cuando aparece el volumen ilustrativo.
- Explorar cielo profundo es una opción persistente del panel Control Center (Capas), desactivada inicialmente. Realza los DSO de forma ilustrativa con opacidad base 0,85 y omite la penalización Bortle para esos objetos. Se aplica también a los puntos NGC. Las estrellas conservan su configuración de observación.
- HiPS ofrece Reintentar, con tiempos límite de carga e inicialización. Un script fallido se retira para que el siguiente intento pueda descargarse. La instancia de Aladin se conserva al cambiar survey.

### Criterios y verificación

La opacidad es orientativa e ilustrativa. La magnitud integrada disponible en el catálogo permite ordenar y filtrar, pero no determina por sí sola la detectabilidad visual de una galaxia extensa. La opción de exploración se identifica en la interfaz como independiente de Bortle.

Las 338 pruebas unitarias pasan, con regresión para conservar los cúmulos brillantes, reducir la atenuación duplicada y diferenciar observación y exploración para M51 en Bortle 6. TypeScript, ESLint y la compilación de producción pasan. Se comprobaron cuatro recorridos E2E de producción local. El de escritorio verifica zoom manual durante el vuelo, arrastre con selección conservada, Volver a centrar, activación del realce y apertura del sistema solar. Los otros recorridos cubren móvil emulado, PWA con recarga offline y recuperación de HiPS con respuestas simuladas. Todos pasaron sus ejecuciones finales.

La prueba de HiPS simula un primer script con HTTP 404 y una API satisfactoria en el segundo intento, y comprueba que cambiar de survey conserva la instancia. Valida la recuperación de la interfaz. La prueba HiPS usa un contexto aislado con service worker bloqueado para interceptar las respuestas simuladas. Las pruebas de registro y recarga offline ejercitan el service worker real.

### Comprobaciones remotas y pendientes

Las consultas reales se realizaron el 15 de noviembre de 2026. La conexión al TAP de ESA no completó la petición y el espejo oficial de Heidelberg agotó el tiempo de espera. El script Aladin 3.8.1 y los metadatos de 2MASS, DSS2 y Pan-STARRS devolvieron HTTP 404 desde este entorno. La validación visual de imágenes remotas y del nivel Gaia G17 sigue pendiente. La calibración y la correspondencia de AR requieren comprobación en teléfono físico.
