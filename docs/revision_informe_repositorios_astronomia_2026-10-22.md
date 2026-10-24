# Revisión del informe de repositorios de astronomía

**Fecha:** 22 de octubre de 2026
**Documento revisado:** `informe_repositorios_astronomia_2026-10-22.md`
**Método:** lectura completa del informe, comprobación de cada repositorio citado en GitHub (licencia, estrellas, funciones) y verificación de las afirmaciones sobre Cosmos Atlas en el código local.

## Veredicto

El informe es **sólido y su recomendación principal es correcta**: no sustituir el motor y añadir un Planificador de Noche con meteorología y equipo. Los 14 repositorios existen (uno no pude abrirlo, ver abajo) y casi todas las licencias coinciden. Hay **tres correcciones, dos matices importantes y varias lagunas**.

## 1. Verificación de repositorios

| Repositorio | Licencia en el informe | Comprobado en la web | Estado |
|---|---|---|---|
| Astroplan | BSD-3-Clause | BSD-3-Clause, 226 estrellas | Correcto |
| AstroPlanner (kkotysz) | «Revisar licencia» | **No declara licencia** en la página; 1 estrella, 86 commits. Ofrece Seestar, ICS/CSV/JSON/PNG y meteo (Open-Meteo, METAR) | Cautela acertada; sin licencia = todos los derechos reservados, **no reutilizar código** |
| NightCrate | MIT | MIT, 636 commits, 1 estrella | Correcto. Proyecto muy joven y casi sin uso |
| SkyFrame | AGPL-3.0 | AGPL-3.0 o posterior; HTML/JS sin dependencias; usa OpenNGC | Correcto |
| HARP | «MIT/BSD además de GPL» | La búsqueda confirma que es un **CLI Python** (Horizon-Aware Recommender and Planner) con máscara `.hrz`, puntuación 0–100 por media geométrica y mosaicos. **No pude abrir el repositorio** (404 desde mi herramienta), así que la licencia **no está verificada** | Licencia sin confirmar |
| Astro Viewing Conditions | Revisar | **AGPL-3.0**, app iOS/watchOS (Swift) con parte Python. Usa Open-Meteo y el atlas de Lorenz | El informe no da la licencia; es AGPL |
| AstroSky | Datos con licencias separadas | Código MIT, **catálogo derivado de OpenNGC bajo CC BY-SA 4.0**, atlas de Lorenz sin licencia de reutilización explícita. 6 commits, 2 estrellas | Correcto y más grave de lo dicho |
| Aladin Lite | LGPL-3.0-or-later | LGPL-3.0-or-later, 159 estrellas, última versión **v3.8.1 (5 mar 2026)**; exige mantener logo y enlace | Correcto |
| WWT WebGL | MIT | MIT, 26 estrellas, 2.569 commits | Correcto |
| Stellarium Web Engine | AGPL-3.0 | Contiene `LICENSE-AGPL-3.0.txt`; la API de GitHub devuelve licencia `null`. Último push **20 oct 2026**, 654 estrellas, no archivado | Correcto; la licencia hay que leerla en los ficheros |
| KStars | GPL | GPL, versión sin especificar; GitHub es un espejo de KDE | Correcto |
| Nebulosa | MIT | MIT, Bun + React + Tailwind, 0 estrellas | Correcto, pero proyecto casi sin tracción |
| Astrometry.net | GPL-3+ | Código mixto BSD/GPL; el conjunto se distribuye bajo **GPL v3+**. Rechaza PRs generadas con LLM | Correcto |
| OpenSpace | MIT | MIT, ~1,3 k estrellas | Correcto |
| Spacekit | MIT | MIT, 584 estrellas | Correcto |

## 2. Correcciones

1. **HARP**: el informe afirma «MIT/BSD además de GPL». No lo he podido confirmar. Hasta verlo en el `LICENSE` del repo, tratarlo como no verificado.
2. **Astro Viewing Conditions**: es AGPL-3.0, no «revisar». Solo sirve como referencia de producto (cómo convertir nubes por capas, humedad y visibilidad en una puntuación).
3. **Cifras de popularidad ausentes**: varios proyectos recomendados (NightCrate, SkyFrame, AstroPlanner, Nebulosa, AstroSky) tienen entre 0 y 2 estrellas y pocos meses de vida. Son buenas **ideas de producto**, pero no una base de la que depender ni cuyo mantenimiento esperar. El informe los presenta al mismo nivel que Aladin o Astroplan.

## 3. Matices importantes

- **AGPL y «app privada»**: el informe dice «no copiar código en la app privada sin aceptar obligaciones». Con AGPL el riesgo no depende de que la app sea privada: al servirla por red a usuarios se activa la obligación de ofrecer el código fuente. La regla segura es la que ya se propone: usar SkyFrame, Stellarium y Astro Viewing Conditions solo como referencia y reescribir desde cero.
- **CC BY-SA en AstroSky**: si se reutilizara su catálogo derivado de OpenNGC, la obra derivada hereda CC BY-SA 4.0. Conviene comprobar que el OpenNGC que ya usa Cosmos Atlas (`ngc.bin`) tiene su atribución y licencia documentadas (OpenNGC es CC BY-SA 4.0).

## 4. Verificación de lo dicho sobre Cosmos Atlas

| Afirmación del informe | Resultado en el código |
|---|---|
| Versión 3.6.0, Next 16, React 19, Three, astronomy-engine, satellite.js | Confirmado (`next ^16.2.10`, `react 19.2.3`, `three ^0.183.1`) |
| Texturas planetarias procedurales de 512×256 | Confirmado: `Planets.tsx:24` (`W = 512, H = 256`) |
| Anillos de Saturno con división de Cassini | Confirmado: `Planets.tsx:208` y `:236` |
| Sin rotación física ni orientación de polo por planeta | No hallé `pole`, `rotationPeriod` ni `sidereal` en `Planets.tsx`; coherente con el informe |
| Vía Láctea: panorámica única de ~6,3 MB | Confirmado: `milkyway.jpg` = 6.308.841 bytes |
| Arte de constelaciones en 3 PNG | Confirmado: `leo.png`, `orion.png`, `perseus.png`. El informe dice «13 figuras vectoriales» más 3 PNG; **no verifiqué el recuento de 13** |
| Sin límites IAU | Sin hallazgos de capa de límites; solo coincide una mención en `time.ts` |
| Catálogos binarios | `hipparcos.bin` y `ngc.bin` presentes |

La sección sobre la bóveda es la parte mejor anclada al código y la más útil.

## 5. Lagunas del informe

1. **Meteorología sin proveedor concreto.** Dos repos revisados (AstroPlanner y Astro Viewing Conditions) coinciden en **Open-Meteo**, que ofrece capas de nubosidad baja/media/alta y visibilidad. Es el candidato obvio; hay que revisar sus condiciones de uso comercial y límites de peticiones antes de comprometerse.
2. **Fuentes de datos con licencia propia sin inventariar**: el atlas de contaminación lumínica de Lorenz aparece en dos proyectos y no tiene licencia de reutilización explícita. Cosmos Atlas usa Bortle manual/estimado; no conviene incorporarlo sin permiso.
3. **Coste de las texturas planetarias reales** (prioridad 1 de la bóveda): faltan fuentes con licencia permisiva concretas (NASA/USGS suelen ser de dominio público, pero cada imagen tiene sus créditos). Debe anotarse en el inventario de licencias que el propio informe pide.
4. **Esfuerzos de la tabla** (2–3 semanas, etc.) son estimaciones sin base de medida; tratarlas como orden de magnitud.
5. **Sin criterio de éxito medible** para el Planificador (p. ej. tiempo hasta la primera recomendación, uso semanal). Sin eso, la prioridad P0 es una hipótesis.
6. **Plan B ante Aladin Lite**: el informe pide probar dos contextos WebGL, pero no define qué hacer si falla en móviles gama baja (alternativa: mostrar las imágenes HiPS como tesela 2D sin Aladin).

## 6. Recomendación final

Se mantiene el orden del informe con un ajuste:

1. **Planificador de Noche + curva de visibilidad** (cálculo propio con `astronomy-engine`, usando Astroplan y NightCrate como referencia de fórmulas y desglose).
2. **Meteorología con Open-Meteo**, cacheada, separada de la puntuación geométrica.
3. **Texturas reales de Marte, Júpiter, Saturno y Luna** con rotación por fecha. Es el cambio más visible y barato; yo lo subiría a la altura de la fase 2.
4. Perfil de equipo y horizonte `.hrz` (formato compatible con N.I.N.A. y HARP).
5. Prototipo de Aladin Lite bajo demanda.
6. Alpaca y plate solving, solo si hay demanda real.

Regla de licencias: copiar código solo de MIT/BSD (Astroplan, NightCrate, WWT, Nebulosa, OpenSpace, Spacekit). Para AGPL/GPL y repos sin licencia (SkyFrame, Astro Viewing Conditions, Stellarium, KStars, AstroPlanner), tomar ideas y reescribir.

## Fuentes consultadas

- https://github.com/astropy/astroplan
- https://github.com/kkotysz/astroplanner
- https://github.com/fbaptiste/nightcrate
- https://github.com/sparrowjack63/SkyFrame
- https://github.com/szaghi/harp (solo vía resultados de búsqueda)
- https://github.com/gdombiak/AstroViewingConditions
- https://github.com/standon99/astro-sky
- https://github.com/cds-astro/aladin-lite
- https://github.com/WorldWideTelescope/wwt-webgl-engine
- https://github.com/Stellarium/stellarium-web-engine
- https://github.com/KDE/kstars
- https://github.com/tiagohm/nebulosa.app
- https://github.com/dstndstn/astrometry.net
- https://github.com/OpenSpace/OpenSpace
- https://github.com/typpo/spacekit
