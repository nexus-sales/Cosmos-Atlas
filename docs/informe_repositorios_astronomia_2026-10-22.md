# Informe de oportunidades open source para Cosmos Atlas

**Fecha:** 22 de octubre de 2026  
**Base analizada:** Cosmos Atlas 3.6.0, repositorio local y proyectos públicos activos de astronomía.

## Resumen ejecutivo

Cosmos Atlas ya cubre con bastante profundidad el terreno de un planetario web: mapa 3D, Hipparcos, OpenNGC, constelaciones IAU, sistema solar, Luna, cometas, meteoros, satélites, búsqueda SIMBAD, viaje temporal, orientación móvil, diario, gamificación, PWA e IA astrónoma. Reemplazar este motor por Stellarium Web, Aladin Lite o WorldWide Telescope supondría duplicar capacidades, introducir dos cámaras y dos modelos de estado y diluir la identidad visual de la aplicación.

La oportunidad principal está en una capa que los mejores proyectos de observación incorporan y Cosmos Atlas todavía no reúne de forma completa: **planificar una sesión real**. La aplicación debería pasar de responder «¿qué estoy mirando?» a responder también «¿qué merece la pena observar esta noche, a qué hora, desde este lugar y con este equipo?».

Recomendación de producto:

1. Construir un **Planificador de Noche** nativo sobre los cálculos que ya existen.
2. Añadir **condiciones meteorológicas astronómicas** y explicar su impacto.
3. Incorporar **curvas de visibilidad**, separación lunar y puntuación transparente por objeto.
4. Añadir un **perfil de equipo y campo de visión** real.
5. Integrar **imágenes científicas HiPS/FITS** como vista secundaria, no como sustitución del cielo 3D.
6. Dejar el control de telescopios y el plate solving para una fase posterior.

## Qué tiene ya Cosmos Atlas

La revisión del repositorio confirma estas bases reutilizables:

- Next.js 16, React 19, TypeScript, React Three Fiber y Three.js.
- Catálogo Hipparcos binario de unas 15.000 estrellas y OpenNGC completo.
- Efemérides mediante `astronomy-engine` y satélites mediante `satellite.js` y TLE.
- Transformaciones RA/Dec a Alt/Az, eventos de salida, tránsito y puesta, separación temporal y viaje en el tiempo.
- Bortle, atmósfera, extinción, Vía Láctea, constelaciones, DSOs, cometas y meteoros.
- SIMBAD/Sesame, búsqueda, favoritos, pasaporte, retos y diario de observación.
- Ubicación manual/GPS, orientación del dispositivo, modo nocturno y PWA/offline parcial.
- IA astrónoma con modo local y remoto.

Esto hace posible que las primeras mejoras se construyan con código propio, sin incorporar otro planetario completo.

## Auditoría específica de la bóveda celeste

Sí existe margen importante de mejora dentro del propio planetario. La bóveda actual es sólida en posición, interacción y atmósfera, pero todavía está por debajo de los motores de referencia en **detalle planetario, densidad estelar escalable, definición cultural de las constelaciones, paisaje terrestre y fenómenos de ocultación**.

### Planetas: el salto visual más evidente

El código actual crea las superficies de todos los planetas y la Luna en canvas de **512 × 256 píxeles**. Son texturas procedurales atractivas, pero no cartografía planetaria real. Júpiter usa bandas planas y una elipse fija como Gran Mancha Roja; Marte usa manchas aleatorias; Mercurio usa cráteres aleatorios; Urano y Neptuno son gradientes. Además, salvo la animación del Sol, no hay rotación física por planeta ni orientación del polo dependiente de fecha. Los anillos de Saturno tienen bandas y división de Cassini, pero su inclinación es fija y no reciben/proyectan sombra del planeta.

Mejoras recomendadas, por orden:

1. Sustituir el albedo procedural por texturas científicas optimizadas y con licencia documentada, usando niveles 1K móvil / 2K escritorio.
2. Aplicar eje de rotación, orientación del polo y periodo sideral propios de cada planeta.
3. Situar el meridiano central de Júpiter/Marte según fecha para que la Gran Mancha Roja y los accidentes visibles no estén siempre en el mismo lugar.
4. Añadir mapas normal/roughness suaves para Luna, Mercurio y Marte en zoom cercano.
5. Corregir Saturno con apertura real de anillos, textura de reflectancia/opacidad y sombras planeta–anillos. Celestia implementa precisamente sombras sobre anillos y texturas separadas de reflectancia/opacidad.
6. Añadir sombras de eclipses y tránsitos cuando sean visibles: lunas galileanas sobre Júpiter, sombra terrestre en eclipses lunares y tránsitos de Mercurio/Venus.
7. Mantener el modo actual como «artístico/offline» y ofrecer «detalle científico» solo al hacer zoom, evitando cargar todos los mapas al arrancar.

Esta es la mejora visual prioritaria: se percibiría inmediatamente y no exige reemplazar el motor.

### Estrellas: de catálogo fijo a nivel de detalle

Hipparcos aporta unas 15.000 estrellas y el límite por Bortle está bien resuelto para visión a simple vista. El límite aparece al hacer zoom: la densidad no aumenta como en Stellarium Web, que transmite Gaia por niveles y declara acceso a más de mil millones de fuentes.

No recomiendo descargar Gaia completo. Sí recomiendo una pirámide propia:

- nivel 0: Hipparcos actual para campo amplio;
- nivel 1: Gaia/Tycho hasta una magnitud intermedia, troceado por HEALPix;
- nivel 2: teselas más profundas solo alrededor del campo visible y con FOV estrecho;
- presupuesto fijo de puntos por móvil/escritorio y caché LRU/IndexedDB;
- movimiento propio para estrellas cercanas cuando se viaja décadas o siglos;
- PSF visual dependiente de magnitud y seeing, con difracción opcional solo en modo telescopio.

El binario actual solo guarda RA, Dec, magnitud y B−V. Para movimiento propio harían falta al menos `pmRA`, `pmDec` y época; paralaje y velocidad radial serían opcionales. Es una evolución natural del formato existente.

### Constelaciones: cobertura gráfica y significado cultural

Las líneas cubren las 88 constelaciones, pero el arte vectorial propio cubre **13 figuras**, no las 88. Tampoco se renderizan los límites oficiales IAU. Stellarium ofrece dos ideas valiosas:

- límites IAU definidos en época B1875 y precesados correctamente a la fecha de vista;
- «culturas del cielo»: líneas, nombres, ilustraciones, asterismos y relatos distintos según tradición.

Propuesta:

1. Añadir capa opcional de límites IAU con selección por región, no solo por etiqueta o línea.
2. Completar primero las figuras más reconocibles y visibles desde Canarias, manteniendo el estilo vectorial propio; no mezclar las tres imágenes PNG existentes con el sistema vectorial sin decidir un único lenguaje visual.
3. Crear un formato de datos interno para culturas, inspirado en el esquema de Stellarium pero escrito desde cero: `names`, `lines`, `art`, `stories`, `region`, `sources` y `license`.
4. Incorporar tradición canaria/amazigh y navegación atlántica como rasgo editorial propio, además de la grecorromana; requiere investigación y fuentes, no solo traducción.
5. Añadir asterismos como el Triángulo de Verano, Gran Carro o Hexágono de Invierno, especialmente útiles para aprender a orientarse.

No se debe copiar el paquete de culturas de Stellarium sin revisar su licencia por archivo. El formato y la idea son aprovechables; el contenido necesita trazabilidad propia.

### Vía Láctea y cielo profundo: más resolución solo donde se mira

La Vía Láctea actual usa una panorámica única de unos 6,3 MB y se desvanece al cerrar el FOV para ocultar la pixelación. Es una decisión correcta, pero también explica por qué desaparece detalle justo cuando el usuario explora una región.

La mejora adecuada es un sistema de teselas HiPS o una pirámide multirresolución:

- panorama actual como nivel global/offline;
- teselas de mayor resolución solicitadas solo para el campo visible;
- capas óptica, infrarroja y H-alpha con control de mezcla;
- transición continua entre la Vía Láctea global y una imagen científica de DSO;
- crédito y longitud de onda siempre visibles.

Aladin Lite y WorldWide Telescope demuestran este patrón. Se puede prototipar con Aladin en una vista secundaria y, si funciona bien, implementar después una capa HiPS nativa en Three.js para conservar una sola cámara.

### Atmósfera, horizonte y paisaje

La app ya tiene scattering Rayleigh/Mie, refracción de Bennett y horizonte. Lo que falta respecto a Stellarium es un **paisaje real del observador** y una adaptación ocular más física:

- panorama 360° o silueta de montaña alineada con el acimut;
- máscara de horizonte que también oculte objetos, no solo los penalice en planificación;
- exposición/adaptación nocturna gradual al pasar de Sol/Luna/cielo urbano a cielo oscuro;
- extinción ligada a transparencia/humedad cuando exista meteorología;
- halo lunar y brillo de cielo dependientes de fase, altura y separación angular;
- modo sin atmósfera para comparar la bóveda física con la observada.

Para Cosmos Atlas, un paisaje de Canarias —Teide o cumbre de Gran Canaria— tendría mucho más carácter que un horizonte genérico.

### Cámara y navegación espacial

La bóveda funciona desde la superficie terrestre. Celestia, OpenSpace y Spacekit destacan cuando la cámara abandona la Tierra. No conviene mezclar ambos modelos en la vista principal, pero sí mejorar el `SolarSystemMap` como modo separado:

- órbitas elípticas y posiciones a escala seleccionable;
- viaje fluido Tierra → planeta → sistema de lunas;
- escala física / escala educativa claramente conmutables;
- ejes, planos orbitales y terminador;
- trayectorias de cometas y asteroides con incertidumbre/época.

Spacekit, bajo MIT, puede servir como referencia o prototipo para órbitas y partículas keplerianas; aun así, el código actual ya dispone de Three.js y `astronomy-engine`, por lo que integrar otro motor entero no parece necesario.

### Priorización exclusiva de la bóveda

| Prioridad | Mejora | Impacto visual/científico | Esfuerzo orientativo |
|---|---|---:|---:|
| 1 | Texturas planetarias reales + rotación/polos | Muy alto | 2–3 semanas |
| 2 | Límites IAU + selección de constelación por área | Alto | 1–2 semanas |
| 3 | Saturno físico, sombras y eclipses lunares/galileanos | Muy alto | 2–4 semanas |
| 4 | Catálogo estelar por LOD/HEALPix | Alto al hacer zoom | 3–6 semanas |
| 5 | Vía Láctea multirresolución / HiPS | Muy alto | 3–5 semanas |
| 6 | Paisaje 360° y horizonte que ocluye | Alto e inmersivo | 1–3 semanas |
| 7 | Completar arte y culturas del cielo | Alto educativo | Continuo, dependiente de contenido |
| 8 | Sistema Solar navegable fuera de la Tierra | Alto, pero otro modo de producto | 4–8 semanas |

La primera vertical que implementaría en la bóveda sería: **Marte, Júpiter, Saturno y Luna con mapas reales; rotación/orientación por fecha; anillos físicamente orientados; carga progresiva y fallback procedural**. Es acotada, visible y medible en móvil.

## Repositorios estudiados y aprendizaje útil

| Proyecto | Qué aporta | Encaje en Cosmos Atlas | Licencia / cautela |
|---|---|---|---|
| [Astroplan](https://github.com/astropy/astroplan) | Restricciones de altitud, masa de aire, noche y separación lunar; ventanas de observación | Modelo de referencia para el planificador y sus tests | BSD-3-Clause; es Python, conviene portar conceptos y fórmulas, no añadirlo al cliente |
| [AstroPlanner](https://github.com/kkotysz/astroplanner) | Ranking de objetivos, gráficos de altitud/airmass, meteorología, exportación ICS/CSV y telescopio Seestar | Excelente referencia funcional para agrupar la experiencia completa | Revisar su licencia antes de reutilizar código; usarlo principalmente como referencia de producto |
| [NightCrate](https://github.com/fbaptiste/nightcrate) | Puntuación explicable por observabilidad, meridiano, Luna y ajuste al sensor; horizonte real | El mejor patrón para recomendaciones personalizadas y no opacas | MIT según su repositorio; validar archivos concretos antes de copiar |
| [SkyFrame](https://github.com/sparrowjack63/SkyFrame) | Línea temporal nocturna, perfil de equipo, horizonte este/oeste, ranking y deduplicación de objetos | Ideas muy aplicables a una primera versión web | AGPL-3.0; no copiar código en la app privada sin aceptar sus obligaciones |
| [HARP](https://github.com/szaghi/harp) | Planificación consciente del horizonte, mosaicos y exportación a N.I.N.A. | Referencia para horizonte local y astrofotografía avanzada | Ofrece MIT/BSD además de GPL; conservar atribución y verificar el archivo reutilizado |
| [Astro Viewing Conditions](https://github.com/gdombiak/AstroViewingConditions) | Nubes por capas, humedad, viento, visibilidad, transparencia, seeing y calidad de observación | Buen modelo para convertir previsión meteorológica en decisiones astronómicas | Revisar licencia y fuentes de datos antes de reutilizar implementación |
| [AstroSky](https://github.com/standon99/astro-sky) | Mapa de brillo del cielo, terreno 3D, más de 12.000 objetivos y ventanas continuas | Inspiración para selector de lugares oscuros y comparación de ubicaciones | Los datos tienen licencias separadas; en especial, no asumir que un atlas lumínico puede redistribuirse |
| [Aladin Lite](https://github.com/cds-astro/aladin-lite) | HiPS, FITS, WCS, VOTable, catálogos y movimientos propios en WebGL2 | Vista científica contextual para DSOs y objetos SIMBAD | LGPL-3.0-or-later; mantener logo/enlace, fijar versión y revisar cumplimiento de distribución |
| [WWT WebGL Engine](https://github.com/WorldWideTelescope/wwt-webgl-engine) | Imágenes multibanda, HiPS, relatos/tours y motor TypeScript embebible | Fuente de ideas para capas por longitud de onda y recorridos educativos | MIT; integrarlo entero duplicaría gran parte del motor actual |
| [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine) | Gaia a gran escala, HiPS, paisajes, texturas planetarias y capas | Referencia de precisión, escalado y catálogo; no es el mejor núcleo para esta app | AGPL-3.0; alto impacto legal y arquitectónico si se integra o modifica |
| [KStars](https://github.com/KDE/kstars) | Planificador, calendario celeste, editor FOV y suite Ekos/INDI | Referencia madura para la evolución hacia instrumentación | GPL; arquitectura de escritorio C++, no trasladable directamente |
| [Nebulosa](https://github.com/tiagohm/nebulosa.app) | React/TypeScript, INDI/Alpaca, plate solving, captura, enfoque y utilidades ópticas | Referencia técnica más cercana para una futura capa de telescopio | MIT; integrar hardware exige un servicio local, no solo navegador |
| [Astrometry.net](https://github.com/dstndstn/astrometry.net) | Identifica una foto del cielo, obtiene WCS y objetos contenidos | Función premium: subir una foto y reconocer el campo observado | El conjunto completo queda bajo GPL-3+ por dependencias; API externa implica privacidad, cola y disponibilidad |
| [OpenSpace](https://github.com/OpenSpace/OpenSpace) | Narrativa científica, navegación espacial 3D y visualización de misiones/datasets | Ideas para tours con escalas y misiones, no para sustituir el mapa terrestre | MIT; motor C++ de gran tamaño y finalidad distinta |

## Mejoras propuestas, priorizadas

### P0 — Planificador de Noche

**Valor:** muy alto. **Esfuerzo estimado:** 2–3 semanas para una primera versión sólida.

Crear una nueva sección «Esta noche» que calcule, para la ubicación y fecha elegidas:

- inicio y fin de noche astronómica;
- curva de altitud de cada objeto durante la noche;
- mejor ventana continua por encima de una altitud configurable;
- máxima altitud y hora de tránsito;
- separación angular de la Luna e iluminación lunar;
- tiempo observable total;
- estado: excelente, bueno, difícil o no visible;
- razón legible: «alto durante 2 h 40 min, Luna a 72°, tránsito a las 23:18».

Una puntuación inicial transparente puede ser:

- 35 % duración útil;
- 25 % altitud máxima/masa de aire;
- 20 % separación e iluminación lunar;
- 10 % oscuridad del cielo según Bortle;
- 10 % ajuste al equipo, cuando haya perfil óptico.

No se debe presentar solo un número: cada tarjeta debe mostrar el desglose. Los cálculos existentes de Alt/Az, visibilidad, Luna y catálogos permiten hacerlo sin servicio Python.

### P0 — Meteorología para observar, no meteorología genérica

**Valor:** muy alto. **Esfuerzo:** 1–2 semanas.

Añadir una banda horaria con:

- nubosidad baja, media y alta;
- humedad y riesgo de rocío;
- viento y rachas;
- visibilidad atmosférica;
- precipitación;
- una aproximación prudente de transparencia y seeing, claramente etiquetada como estimación.

La puntuación meteorológica debe mantenerse separada de la puntuación geométrica del objetivo. Así el usuario entiende si una mala noche se debe a nubes o a que el objeto está bajo. Conviene cachear la previsión en servidor, declarar proveedor y hora de actualización, y conservar la planificación astronómica offline cuando la red falle.

### P0 — Gráfico de visibilidad y línea temporal

**Valor:** alto. **Esfuerzo:** 4–7 días junto al planificador.

Un gráfico táctil de altitud frente a hora debería incluir:

- crepúsculo civil, náutico y astronómico como fondos;
- trayectoria del objetivo;
- trayectoria o interferencia de la Luna;
- meridiano/tránsito;
- umbral de horizonte;
- ventana recomendada resaltada;
- cursor sincronizado con la Máquina del Tiempo del mapa 3D.

La sincronización con el cielo es la ventaja diferencial de Cosmos Atlas frente a planificadores que solo muestran tablas.

### P1 — Perfil de equipo y FOV real

**Valor:** alto para aficionados. **Esfuerzo:** 1–2 semanas.

Guardar localmente perfiles de:

- observación visual: telescopio, apertura y ocular;
- astrofotografía: focal, sensor, tamaño de píxel y rotación;
- binoculares: aumento y campo aparente.

Calcular campo horizontal/vertical, escala de imagen y adecuación del objeto. El `FOVOverlay` actual puede evolucionar de una superposición genérica a un rectángulo/círculo exacto, rotatorio y reutilizable en planificación. Después se pueden añadir mosaicos y exportación a N.I.N.A.

### P1 — Horizonte local real

**Valor:** alto para uso desde balcones, patios y observatorios. **Esfuerzo:** 1–2 semanas.

Permitir dibujar una máscara altura–acimut, importar formatos comunes como `.hrz` y asignarla a una ubicación guardada. El planificador debe usar esa máscara en lugar de asumir un horizonte plano. Una primera versión puede ofrecer puntos cada 10° de acimut y edición visual; una versión posterior podría capturarlo con cámara/sensores.

### P1 — Vista científica HiPS/FITS

**Valor:** alto educativo y científico. **Esfuerzo:** 1–2 semanas para un prototipo.

Al seleccionar un DSO o resultado SIMBAD, ofrecer «Ver imagen científica» con Aladin Lite fijado a una versión concreta. Capas iniciales:

- DSS2 óptico;
- Pan-STARRS cuando haya cobertura;
- 2MASS infrarrojo;
- una capa de rayos X o radio para demostrar el universo multibanda.

La vista debería abrirse bajo demanda para no penalizar el arranque ni WebGL móvil. Debe mostrar crédito/procedencia de cada survey y conservar la marca requerida por Aladin. Antes de adoptar la dependencia, hacer una prueba técnica de convivencia de dos contextos WebGL, memoria móvil, CSP y modo offline.

### P1 — Sesiones y diario conectados

**Valor:** medio-alto. **Esfuerzo:** 1 semana.

Convertir el diario actual en el final natural del planificador:

- añadir objetos a una sesión;
- marcar observado, omitido o pendiente;
- registrar hora, condiciones, equipo y valoración;
- comparar plan frente a resultado;
- exportar/importar JSON y CSV;
- generar un evento ICS para la ventana recomendada;
- compartir una sesión mediante enlace, siempre con consentimiento explícito para ubicación.

### P2 — Plate solving de fotografías

**Valor:** alto y diferenciador. **Esfuerzo:** 3–6 semanas más infraestructura.

Flujo propuesto: el usuario sube una fotografía, el backend la envía a un solver aislado, recibe WCS, dibuja constelaciones y objetos detectados y permite guardar la observación. Debe evaluarse primero como servicio opcional por el coste de CPU, tamaño de índices, colas, privacidad y licencia GPL del conjunto Astrometry.net.

### P2 — Control de telescopio mediante ASCOM Alpaca

**Valor:** alto para usuarios avanzados, bajo para público general. **Esfuerzo:** 4–8 semanas y pruebas con hardware.

Un navegador publicado por HTTPS no debería descubrir ni controlar equipos locales sin una arquitectura explícita. La opción segura es un pequeño agente local que:

- descubra dispositivos Alpaca;
- exponga estado y capacidades;
- exija confirmación antes de un GoTo;
- limite orígenes y opere solo en red local;
- muestre posición real del telescopio sobre Cosmos Atlas.

Empezar solo con «conectar, leer coordenadas y GoTo del objetivo» antes de cámaras, enfocadores o secuencias.

### P2 — Capas dinámicas de ciencia y eventos

**Valor:** medio. **Esfuerzo:** variable.

Posibles capas posteriores:

- estrellas variables y curvas de luz;
- supernovas/transitorios recientes;
- asteroides próximos y ocultaciones;
- imágenes solares actuales;
- movimientos propios de estrellas cercanas;
- exoplanetas conocidos en torno a estrellas visibles.

Estas capas necesitan fuente, timestamp, caducidad, incertidumbre y atribución visibles. No conviene mezclarlas en el catálogo base ni prometer «tiempo real» si la actualización es diaria.

## Lo que no recomiendo ahora

### Sustituir el motor por Stellarium Web

Ofrece Gaia e HiPS, pero introduciría AGPL, WASM/Emscripten y un modelo de render distinto. Cosmos Atlas perdería gran parte del trabajo propio de UX, shaders, estado e interacción. Sí conviene usar Stellarium como patrón de contraste científico y de rendimiento.

### Integrar simultáneamente Aladin, WWT y Stellarium

Los tres resuelven parte del mismo problema. Para imágenes científicas, Aladin Lite es la prueba más pequeña y directa. WWT sería interesante si el producto gira en el futuro hacia narrativas multibanda o grandes datasets; no hace falta incorporar ambos ahora.

### Descargar Gaia completo al cliente

El salto desde unas 15.000 estrellas a cientos de millones o más requiere teselado por nivel de detalle, streaming, caché y presupuestos estrictos de GPU/memoria. Para el uso visual actual aporta menos valor que el planificador. Primero se puede crear un catálogo intermedio por magnitud y streaming espacial.

### Copiar algoritmos sin inventario de licencias

En este sector conviven MIT/BSD, LGPL, GPL/AGPL y datasets con licencias independientes. La licencia del repositorio no garantiza la de catálogos, texturas, surveys o APIs. Toda integración debe registrar: código, datos, proveedor, versión, atribución, redistribución y política de caché.

## Arquitectura recomendada

Mantener el motor 3D actual y añadir módulos desacoplados:

```text
Catálogos + astronomy-engine + ubicación + fecha
                    |
             Motor de observabilidad
       (altitud, Luna, noche, horizonte, FOV)
                    |
        Ranking explicable + ventanas horarias
          /             |              \
 Planificador      Mapa 3D actual      Diario/sesión
          \             |              /
          Meteorología cacheada y opcional

Vista científica bajo demanda: Aladin Lite / HiPS
Hardware futuro: agente local ASCOM Alpaca
```

Entidades nuevas sugeridas:

- `ObservingSite`: ubicación, zona horaria, Bortle y perfil de horizonte.
- `EquipmentProfile`: tipo, óptica, sensor/ocular y FOV calculado.
- `ObservationPlan`: fecha, sitio, equipo, objetivos y restricciones.
- `ObservabilitySample`: instante, altitud, acimut, masa de aire y Luna.
- `ObservationWindow`: inicio, fin, tránsito, puntuación y razones.
- `WeatherSnapshot`: proveedor, emisión, horas, variables y calidad.
- `ObservationSession`: plan, resultados y entradas del diario.

Los cálculos deterministas deberían vivir en `src/lib/astronomy/` con tests de latitudes norte/sur, cruces de medianoche, objetos circumpolares, Sol de medianoche, cambio horario y Luna cercana.

## Hoja de ruta propuesta

### Fase 1 — «Qué ver esta noche» (3–4 semanas)

- Motor de puntuación explicable.
- Ventanas de observación y gráfico de altitud.
- Lista recomendada por ubicación/fecha.
- Integración con favoritos y Máquina del Tiempo.
- Tests científicos y rendimiento en móvil.

**Resultado:** mejora útil incluso offline y sin nuevas cuentas ni hardware.

### Fase 2 — «¿Habrá buen cielo?» (2–3 semanas)

- Meteorología astronómica cacheada.
- Separación clara entre calidad geométrica y meteorológica.
- Alertas configurables y exportación ICS.
- Ubicaciones guardadas y comparación de noches.

**Resultado:** la aplicación ayuda a decidir si salir y cuándo.

### Fase 3 — «Con mi equipo» (2–3 semanas)

- Perfiles ópticos.
- FOV real y adecuación por tamaño/brillo superficial.
- Horizonte local editable/importable.
- Sesiones conectadas al diario.

**Resultado:** recomendaciones personalizadas y repetibles.

### Fase 4 — «Universo científico» (2 semanas de prototipo)

- Prueba Aladin Lite con dos o tres surveys.
- FITS/WCS en vista secundaria.
- Atribuciones, CSP, carga diferida y pruebas móviles.

**Resultado:** salto educativo notable sin rehacer el mapa 3D.

### Fase 5 — «Observatorio conectado» (investigación)

- Prototipo de agente local Alpaca.
- Lectura de montura y GoTo seguro.
- Estudio de plate solving y costes.

**Resultado:** camino hacia usuarios avanzados sin comprometer la app principal.

## Criterios para decidir cada integración

Antes de incorporar un repositorio o servicio:

1. ¿Añade una capacidad nueva o duplica el motor existente?
2. ¿Funciona en móvil y con memoria limitada?
3. ¿Mantiene utilidad offline o tiene fallback honesto?
4. ¿La licencia es compatible con el uso privado/comercial previsto?
5. ¿Código y datos tienen licencias independientes documentadas?
6. ¿La fuente muestra actualización, incertidumbre y atribución?
7. ¿Se puede fijar versión y probar con datos reproducibles?
8. ¿La función mejora una tarea real del usuario?

## Conclusión

La mejor evolución de Cosmos Atlas no es ser otro Stellarium. Su ventaja puede estar en unir una presentación inmersiva y accesible con decisiones prácticas de observación. El bloque con mejor relación valor/esfuerzo es **Planificador de Noche + meteorología astronómica + FOV/equipo**. Aladin Lite sería después la incorporación externa más visible; ASCOM Alpaca y Astrometry.net deben quedar como apuestas avanzadas tras validar interés real.

La primera implementación recomendada es una vertical completa pequeña: elegir «esta noche», obtener cinco objetivos razonados, abrir la curva de uno, saltar el mapa a su mejor hora y añadirlo a una sesión. Esa secuencia aprovecha casi todo lo que Cosmos Atlas ya sabe hacer y crea una utilidad nueva y tangible.
