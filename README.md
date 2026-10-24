# Cosmos Atlas

## Version 3.6.0 - 2026-07-23

Ronda de auditoria completa modulo a modulo (senalizador -> fontanero -> auditor) sobre todo el repositorio, mas una pasada de consistencia visual en los paneles. El objetivo era simple: verificar que lo que la app promete es lo que de verdad hace, sin forzar hallazgos donde no los habia.

**Seguridad**
- La CSP se desactivaba en produccion real de Vercel por un uso incorrecto de `VERCEL_ENV` (la variable existe en tiempo de ejecucion, no solo durante el build) -- corregido y verificado simulando las variables reales de Vercel.
- Tras reactivar la CSP, salio a la luz un choque con el nonce en la pagina estatica (`/`): se fuerza renderizado dinamico para que el nonce coincida en cada visita. Verificado con Playwright contra un navegador real, no solo con curl a las cabeceras.
- `/api/astronomer`: filtro `.or()` con string interpolado sustituido por `.eq()` encadenado (evita que caracteres de sintaxis de PostgREST alteren la busqueda).

**Catalogos y datos**
- `stars_cos` en Supabase le faltaban 3 estrellas de Geminis (Theta/Kappa/Iota Gem) frente al catalogo local -- rompian en silencio 4 segmentos de la figura de la constelacion.
- 12 claves de imagen truncadas (`N7293` en vez de `NGC7293`) en `dsoImages.ts`: 5 nebulosas reales (Helice, Roseta, Creciente, Velo Este, Carina) nunca mostraban su imagen real de Hubble/ESO.
- El logro "Maraton Messier" usaba `/110` como denominador en dos sitios distintos (Pasaporte y narracion de la IA), pero el catalogo local solo tiene 108 Messier reales (excluye M40 y M73, que no son objetos de cielo profundo). Corregido en ambos.

**Astronomia y UX**
- La latitud del observador se mostraba siempre como "N" en la cabecera, sin importar el hemisferio real -- cualquier usuario en el hemisferio sur veia coordenadas incorrectas.
- Telemetria inventada (`Math.random()`) en el crosshair de objetivo, sustituida por magnitud y coordenadas reales del objeto.
- La narracion por voz de la IA Astronoma mutilaba la preposicion espanola "al" ("cercano al Sol" sonaba como "cercano anos luz Sol") al confundirla con la abreviatura de anos-luz.
- 3 de 4 satelites (Hubble, Tiangong, NOAA-18) nunca refrescaban su TLE, solo la ISS. El FOV manual durante el seguimiento expiraba a 1 s. "AHORA" esperaba al siguiente tick en vez de sincronizar al instante.

**Codigo muerto e higiene**
- 176 lineas de codigo muerto eliminadas en `GuideTab.tsx`: un bloque de JSX completo se construia y se descartaba con `void sectionContent` sin renderizarse nunca.
- Dos clases CSS referenciadas pero nunca definidas (`glass-card`, `atlas-section-title`) dejaban varias tarjetas sin fondo de cristal real desde hace tiempo.
- Sistema visual de paneles unificado: 13 componentes que reinventaban su propio fondo (`bg-black/40` a `/90`) y hasta 8 opacidades de borde distintas pasan a usar las clases compartidas `atlas-panel`/`atlas-card` y `border-white/10` como estandar, preservando los acentos de color intencionales (IA en cian, logros en dorado, etc.).

**Nueva funcion**
- Deseleccionar el objeto activo desde el cielo vacio (clic fuera de cualquier objeto), o con un boton dedicado en las pestanas Objeto y Guia.

## Version 3.5.1 - 2026-05-10

Esta version corrige la experiencia movil y la orientacion astronomica de la boveda. El objetivo es que Cosmos Atlas deje respirar el cielo: menos botones flotando sobre el mapa y mas confianza en que lo que ves corresponde al hemisferio y a la latitud reales.

- **Header movil simplificado** - El nombre/logo grande sale de la barra superior y los controles principales quedan reunidos en una tira compacta: brujula, busqueda, reloj, AR, GPS, IA astronomica y panel.
- **Menos controles encima del cielo** - En movil se ocultan los widgets flotantes de boveda/camara, foto, tiempo real, brujula grande, IA y FAB del panel; en escritorio siguen disponibles.
- **Brujula compacta con calibracion** - La brujula del header abre acciones para mirar al cenit, mirar al norte, calibrar con Polaris y borrar el offset manual.
- **Correccion Alt/Az del SkyCanvas** - La boveda celeste usa ahora la rotacion `XYZ` correcta para alinear RA/Dec con Alt/Az local. Polaris queda sobre el norte en Canarias/Galway y bajo el horizonte en Argentina.
- **Navegacion asistida corregida** - `CameraNavigator` usa el mismo signo de latitud al iniciar el vuelo hacia objetos y al hacer seguimiento.
- **Tests de hemisferio** - `transforms.test.ts` cubre Canarias, Galway y Argentina, comparando la posicion 3D con el calculo astronomico Alt/Az.
- **Verificacion** - Validado con `npm run test -- transforms useDeviceOrientation` y `npm run build`.

## Version 3.5.0 - 2026-04-29

Esta version consolida en `main` la rama provisional `feature/milkyway-skydome` y deja Cosmos Atlas como una experiencia mas completa, limpia y preparada para produccion.

- **Via Lactea fotografica en la boveda** - Nuevo `MilkyWaySkyDome` con textura panoramica real en `public/textures/milkyway.jpg`, orientada con base galactica RA/Dec completa para alinearse con estrellas, constelaciones y objetos de cielo profundo.
- **Visibilidad por hemisferios** - La Via Lactea conserva continuidad en el hemisferio opuesto/sur de la boveda con atenuacion bajo horizonte, evitando que desaparezca de forma brusca.
- **Simulacion Bortle reforzada** - La contaminacion luminica afecta de forma mas clara al cielo, estrellas Hipparcos, estrellas principales, objetos de cielo profundo y contraste de la Via Lactea.
- **Constelaciones legibles de dia** - Las lineas de constelaciones aumentan grosor, opacidad y halo cuando el cielo esta azul o en crepusculo, manteniendo lectura visual sin cambiar de capa.
- **IA Astronoma enriquecida** - `/api/astronomer` puede consultar detalles de Supabase del objeto seleccionado y combinar contexto local, visibilidad, Bortle, descripcion, mitologia, consejos y curiosidades.
- **Modo Kids en cabecera del panel** - El modo para chicos de 8 a 14 anos pasa a la cabecera de navegacion del panel (`Kids`), en lugar de estar escondido entre capas del cielo.
- **Modo infantil real** - La IA cambia preguntas rapidas, tono y explicaciones cuando `Kids` esta activo: analogias sencillas, retos cortos y explicaciones claras sin infantilizar.
- **CSP y Supabase mas robustos** - Se anade endpoint `/api/csp-report`, `report-uri`, permisos CSP para Supabase y cliente Supabase opcional si faltan variables de entorno.
- **Limpieza de release** - La carpeta prototipo `via lactea/` no queda en `main`; solo se conserva el asset final usado por la aplicacion.
- **Verificacion** - `main` validada con `npm run lint`, `npm run test` y `npm run build`.

## Auditoria extrema 2026-04-21

Esta ronda deja Cosmos Atlas mas cerca de una app de astronomia seria, no una demo: IA astronomica real opcional, modo local sin coste, privacidad de ubicacion, endpoints protegidos, calculos de visibilidad y verificacion completa.

- **IA Astronoma profesional** - `AIAstronoma` genera briefings con altitud, acimut, magnitud, Bortle, contexto fisico, consejos de observacion y ventana aproximada de salida/transito/puesta.
- **Doble modo de asistente** - Selector `IA real` / `Local`. OpenAI se usa solo desde el servidor; el modo local permite seguir usando la app si hay limite, cortes o se quiere ahorrar credito.
- **Endpoint `/api/astronomer`** - Ruta server-side con `OPENAI_API_KEY`, `OPENAI_MODEL`, `store:false`, timeout, fallback local, `Cache-Control: no-store`, sanitizacion de contexto, limite de payload y rate limit en memoria.
- **Eventos de visibilidad** - Nuevo modulo `visibilityEvents.ts` para estimar salida, transito y puesta de objetos con RA/Dec, cubierto con tests unitarios.
- **Privacidad GPS** - La app ya no pide ubicacion precisa automaticamente si el permiso no estaba concedido. Arranca con ubicacion manual/fallback y deja activar GPS desde la cabecera.
- **Alertas de sistema refinadas** - Se distinguen ubicacion manual, fallback por error, GPS bloqueado, GPS impreciso y estado AR.
- **Historial SIMBAD endurecido** - El historial en `localStorage` valida forma, RA/Dec, color, tamano, duplicados y limite de bytes antes de rehidratar objetos.
- **Seguridad HTTP** - Headers reforzados: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Permissions-Policy`, HSTS en produccion y CSP en modo `Report-Only`.
- **Dependencias y auditoria** - Next.js actualizado a `16.2.4`; la auditoria de produccion debe revisarse en CI porque puede variar con avisos publicados despues de la release.
- **Verificacion** - Ultima tanda validada con `npm run lint`, `npm run test`, `npm run build` y `npm audit --omit=dev --json`.

- **Catálogo NGC Completo (7,840 objetos)** — Integración total del catálogo OpenNGC mediante un motor de renderizado binario de alto rendimiento.
- **Líneas de Constelaciones IAU (88/88)** — Cobertura total de todas las constelaciones oficiales con fidelidad científica y estrellas de anclaje inyectadas.
- **Minimalismo UI (Pure Text Labels)** — Erradicación del escalado 3D en etiquetas de texto; ahora todas las constelaciones, objetos de cielo profundo, lunas y planetas usan una tipografía limpia y minimalista libre de cajas o fondos invasivos, con text-shadow calibrado.
- **Atmósfera Realista y Meteoros** — Implementación de un Horizon Glow físico (*Rayleigh scattering*) y un sistema de estrellas fugaces (Meteors) optimizado con *InstancedMesh* direccionales.
- **Modo Astrofotografía (Polaroid)** — Integración de captura real en el Canvas (`preserveDrawingBuffer`) que permite tomar fotografías instantáneas del cielo con metadatos superpuestos (AR/Dec, LST, Lat/Lon) listas para guardar.
- **Máquina del Tiempo (Time Travel)** — Despliegue visual e interactivo de los controles de tiempo temporales, permitiendo navegar hacia el pasado o futuro a velocidades aceleradas (x1h/s, x1d/s, etc.).

---

### Registro de mejoras (auditoría técnica 2026-04)

#### Interacción y Guía Galáctica
- **IA Astrónoma Humanizada** — Reescritura del motor de voz para una narración fluida y natural. Se eliminó el lenguaje robótico sustituyendo siglas técnicas por frases completas (ej: "Mag -8.1" → "magnitud de menos ocho punto uno").
- **Detección de Repeticiones** — Implementado `lastMessageRef` para evitar que la IA repita el mismo dato varias veces seguidas ante actualizaciones de estado rápidas.
- **Interactividad Total en el Mapa** — Ahora el Sol, la Luna y todos los planetas son objetos clicables. Al pulsar sobre ellos, la IA reacciona inmediatamente con datos científicos específicos.
- **Etiquetas de Constelaciones Activas** — Las etiquetas de texto ahora actúan como disparadores: al pulsarlas, se selecciona la constelación y la IA narra su mitología.
- **GuideTab con Acceso Rápido y Favoritos** — El panel lateral incorpora accesos directos a secciones, acciones globales para expandir o contraer bloques visibles, pines persistentes en `localStorage` y reordenación automática para subir las secciones favoritas al inicio.

#### Datos Científicos en Tiempo Real
- **Cálculo de Distancias Dinámicas** — Integración con `astronomy-engine` para reportar la distancia actual entre el usuario y cada planeta (en millones de km o UA) y la Luna (en km detallados).
- **Normalización de Unidades** — Conversión automática de porcentajes de iluminación y fases lunares a lenguaje hablado fluido ("16% iluminada" → "dieciséis por ciento de iluminación").
- **Conocimiento Profundo (Guía)** — Sustitución de datos simples por descripciones astrofísicas de alta calidad en todo el catálogo de planetas y satélites.

#### Visuales y Navegación
- **Cuadrícula Celeste de Alta Visibilidad** — Rediseño total de la cuadrícula ecuatorial: líneas cada 15 grados, mayor contraste visual y resaltado del ecuador. Adaptación dinámica de color según el modo (azul tecnológico / rojo nocturno).
- **Corrección de Hemisferio y Zenit** — Refinado el `CameraNavigator` para corregir la inversión de coordenadas en la navegación asistida, asegurando que la cámara apunte exactamente al objeto seleccionado sin importar la latitud.
- **SimbadOverlay 2.0** — Proyección directa de objetos remotos mediante transformación ecuatorial pura, eliminando el desplazamiento errático al cambiar la hora del sistema.

#### Rendimiento y Código
- **Tipado Estricto (Celestial V2)** — Actualizadas las interfaces de TypeScript para soportar las nuevas métricas (distancias, símbolos) eliminando errores de compilación y asegurando la integridad de los datos.
- **Optimización de Re-renders** — El componente `AIAstronoma` ahora escucha de forma inteligente tanto `selectedObject` como `targetedObject` y `focusedConstellation`, reaccionando solo cuando hay cambios significativos de contexto.

### Rendimiento y re-renders (Continuación)
- **[PERFORMANCE 120 FPS] Octree de Alto Rendimiento** — Motor de culling espacial optimizado en `HipparcosStars`. Solo se renderiza lo que el usuario está mirando, permitiendo escalar hasta 20.000 estrellas sin penalización.
- **Sistema de tiempo dual** — `timeMinute` en Zustand: los cálculos astronómicos pesados bajan drásticamente su frecuencia de actualización mientras la UI permanece fluida.
- **Eliminación del Re-render Bomb** — El reloj central ha sido aislado en un componente local; el bucle de React ya no se dispara globalmente cada segundo, eliminando el stuttering visual.
- **GMST cacheado** — `Satellites.tsx` recalcula Greenwich Sidereal Time de forma inteligente.

### Catálogo estelar
- **Catálogo Hipparcos** — 14 984 estrellas (mag −1,44 → 6,97), 234 KB en binario Float32Array. Generado con `scripts/generate-hipparcos.mjs` desde VizieR CDS. Shader idéntico al de `Stars.tsx` (twinkle, airmass, color espectral B-V).
- **Stars.tsx reescrito** — eliminados 200+ `StarHitbox` invisibles; raycasting nativo sobre `BufferGeometry Points` con `e.index`. Umbral adaptativo al FOV: `mapLinear(fov, 80°→4.0, 10°→0.8)`.
- **DSO texture cache** — mapa global `Map<"tipo:color", CanvasTexture>`: máximo ~5 texturas distintas para los 32 DSOs en lugar de 32 canvas separados con `Math.random()`.

### Fiabilidad
- **Error Boundaries** — `ErrorBoundary.tsx` envuelve cada componente 3D crítico en `SkyCanvas.tsx`. Un crash en `Planets` o `Satellites` ya no provoca pantalla en blanco.
- **SIMBAD robusto** — `sesame.ts`: AbortController 8 s + cache en `Map` (misma query → 0 peticiones extra). Los errores de red no se cachean (el usuario puede reintentar).
- **TLE fetch robusto** — `Satellites.tsx`: timeout 8 s + 2 reintentos con backoff exponencial + fallback inmediato a TLEs hardcodeados.

### Calidad del código
- **Lint reducido de 70 → 54 problemas** (42 → 27 errores reales):
  - `SidePanel.tsx` — hook `useAppStore` movido fuera de JSX condicional (rules-of-hooks)
  - `BackgroundStars.tsx` — `useMemo` reordenados antes de `useFrame`; `materialRef` eliminado
  - `DeepSkyObjects.tsx` — `fallbackRef.current` en render sustituido por llamada al cache global
  - `MeteorShower.tsx` + `Comets.tsx` — `Math.random()` en `useMemo` reemplazado por LCG sembrado
- **MeteorShower / CometTail** — `Math.random()` dentro de `useMemo` reemplazado por LCG determinista; resultados reproducibles por minuto.

### Efectos visuales
- **Safe-Area e Inmersión Total** — Soporte para iPhone Notch y Dynamic Island. El canvas es edge-to-edge mientras la UI se desplaza a zonas seguras.
- **Física de Cometas** — Colas con orientación física real: siempre apuntan en dirección opuesta al Sol (viento solar).
- **Inercia Zoom "Líquida"** — Refinado el momentum del zoom táctil para una experiencia de navegación fluida.
- **Bloom Calibrado** — `threshold 0.7`, `intensity 0.4` (puntos de luz puros y precisos).
- **Giroscopio Premium** — Filtro complementario EMA α=0.85 con compensación de deriva.
- **Modo Nocturno Pro** — Rojo astronómico profundo calibrado para proteger la visión nocturna en observación de campo.

---

- **IA Astrónoma (Voice-Over)** — Asistente virtual con síntesis de voz real (Web Speech API) que narra secretos, mitología y reacciona a tus logros.
- **Pasaporte Estelar (Gamificación)** — Sistema de recompensas y trofeos que registra tus hitos: "Cazador de Planetas", "Maratón Messier" y favoritos personales. Persistencia total vía LocalStorage.
- **Inmersión Planetaria 3D (V3.0)** — Transición fluida de sprites 2D a modelos 3D detallados mediante **Cinematic Zoom** (FOV dinámico). 
- **Sol Procedural de Alta Fidelidad** — Shader de superficie solar con efecto de ebullición, cromoesfera y corona pulsante.
- **Atmospheric/Sun Suppression (Space Mode)** — Supresión dinámica de la atmósfera y el resplandor solar al hacer zoom en DSOs o planetas, proporcionando claridad de "Telescopio Espacial" inclusdo de día.
- **Renderizado de DSOs de Próxima Generación** — Galaxias procedimentales con bulbos, discos y bandas de polvo; nebulosas gaseosas con filamentos realistas.
- **Sistema Galileano Completo** — Simulación de Ío, Europa, Ganímedes y Calisto con órbitas precisas y calibración visual para planetas a escala exagerada.
- **Atmospheric Scattering** — Simulación realista de la dispersión de Rayleigh en el horizonte; el "glow" atmosférico oculta la línea de tierra y reacciona a la luz ambiente.
- **Constelaciones Dinámicas con Glow** — Las figuras estelares ahora emiten un aura de neón al ser enfocadas, mejorando la legibilidad y la estética "Premium".
- **Busqueda Universal SIMBAD** — Resolución remota de objetos profesionales a través de los servidores **CDS Sesame** de Estrasburgo; encuentra millones de objetos no catalogados localmente.
- **Extinción Atmosférica Física** — Las estrellas se atenúan y enrojecen al acercarse al horizonte según la masa de aire (airmass), simulando la dispersión real de la atmósfera.
- **Pronóstico de Lluvias de Meteoros** — Calendario dinámico de actividad (Cuadrántidas, Perseidas, etc.) con cálculo de tasa horaria (THZ) y visibilidad en tiempo real.
- **Vía Láctea Fase 2** — Variación espectral, regiones H-Alpha (naceiros estelares) y líneas de polvo interestelar para un realismo fotográfico.
- **Octree de Alto Rendimiento** — Motor de culling espacial optimizado con búsqueda por cubetas y caché AABB para un rendimiento fluido con miles de objetos.
- **PWA Instalable** — Manifest, iconos auto-generados y metadatos; compatible con iOS, Android y escritorio.

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2.4 | Framework principal (App Router) |
| React | 19.2.3 | UI |
| TypeScript | — | Tipado estático |
| React Three Fiber | ^9.5.0 | Renderizado 3D en canvas |
| Three.js | ^0.183.1 | Motor 3D |
| @react-three/drei | ^10.7.7 | Helpers 3D (Html, OrbitControls, Line, etc.) |
| @react-three/postprocessing | — | Bloom, Noise, Vignette |
| astronomy-engine | ^2.1.19 | Efemérides planetarias y lunares reales |
| satellite.js | ^6.0.2 | Propagación de órbitas de satélites TLE |
| Zustand | ^5.0.11 | Estado global |
| Tailwind CSS | ^4 | Estilos |
| Framer Motion | ^12 | Animaciones UI |
| shadcn/ui | — | Componentes base |
| lucide-react | ^0.575 | Iconos |

---

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre <http://localhost:5174> en el navegador.

Si quieres poblar Supabase con el catalogo actual de Cosmos Atlas:

```bash
npx tsx --env-file=.env.local scripts/seed-supabase.ts
```

Variables recomendadas para produccion:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-luna
```

```bash
# Build de producción
npm run build
npm start
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raíz + metadatos PWA + viewport
│   ├── manifest.ts              # Manifiesto PWA (nombre, colores, iconos)
│   ├── icon.tsx                 # Icono 192x192 generado con ImageResponse
│   ├── apple-icon.tsx           # Icono Apple 180x180
│   └── page.tsx                 # Página principal + tick de tiempo real + FAB móvil
│
├── components/
│   ├── ErrorBoundary.tsx        # Error Boundary genérico — envuelve componentes 3D críticos
│   │
│   ├── effects/
│   │   ├── MeteorShower.tsx     # Lluvia de meteoros (partículas GPU, lluvias reales por fecha)
│   │   └── ...
│   │
│   ├── panels/
│   │   ├── Header.tsx           # Barra superior responsive (hora, ubicación)
│   │   ├── SidePanel.tsx        # Panel lateral colapsable + overlay móvil
│   │   ├── GuideTab.tsx         # Guía interactiva (estrellas, planetas, Luna, DSOs, constelaciones)
│   │   ├── ObjectInfoTab.tsx    # Detalle del objeto seleccionado
│   │   ├── ChallengeTab.tsx     # Retos de observación
│   │   ├── TimeTravelControls.tsx # Slider de viaje temporal
│   │   ├── Compass.tsx          # Brújula interactiva (clic: cenit, doble clic: norte)
│   │   └── AIAstronoma.tsx      # Narración por voz del guía estelar
│   │
│   └── sky-map/
│       ├── SkyCanvas.tsx        # Canvas 3D principal + Error Boundaries por componente
│       ├── CelestialSphere.tsx  # Esfera base (fondo negro)
│       ├── CelestialGrid.tsx    # Cuadrícula ecuatorial
│       ├── Stars.tsx            # 355 estrellas nombradas — raycasting nativo (sin hitboxes)
│       ├── HipparcosStars.tsx   # Catálogo Hipparcos: 14 984 estrellas hasta mag 7 (carga async)
│       ├── BackgroundStars.tsx  # Campo estelar sintético ~20k partículas con Octree
│       ├── Constellations.tsx   # Líneas de constelaciones (depthTest:false, estilo Sky Map)
│       ├── ConstellationLabels.tsx # Etiquetas de nombre en la bóveda (glow sutil)
│       ├── Planets.tsx          # Planetas con lunas galileanas reales (JupiterMoons)
│       ├── DeepSkyObjects.tsx   # DSOs con cache global de texturas procedurales
│       ├── MilkyWay.tsx         # Vía Láctea (Shader FBM + Partículas Gaia)
│       ├── Satellites.tsx       # Seguimiento TLE (GMST cacheado, fetch con retry+timeout)
│       ├── Ecliptic.tsx         # Línea de la eclíptica
│       ├── Horizon.tsx          # Atmósfera, horizonte y puntos cardinales
│       ├── FOVOverlay.tsx       # Retículo de campo de visión para astrofotografía
│       └── TargetPointer.tsx    # Crosshair animado sobre el objeto objetivo
│
├── data/
│   ├── stars.ts                 # 355 estrellas Yale BSC5 nombradas (88 constelaciones IAU)
│   ├── constellations.ts        # Definición de líneas de 88 constelaciones IAU
│   └── dsos.ts                  # 32 objetos Messier/NGC de cielo profundo
│
├── hooks/
│   ├── useGeolocation.ts        # Geolocalización del navegador
│   └── useDeviceOrientation.ts  # Giroscopio con filtro complementario EMA (α=0.85)
│
├── lib/
│   ├── utils.ts
│   └── astronomy/
│       ├── time.ts              # LST, Julian Date, conversiones de tiempo
│       ├── transforms.ts        # Precesión, Refracción y Coordenadas 3D
│       ├── hipparcos.ts         # Loader async /hipparcos.bin + conversión B-V→color
│       ├── sesame.ts            # Resolver SIMBAD/NED (cache + timeout 8 s)
│       └── Octree.ts            # Implementación de Octree para culling estelar
│
├── public/
│   └── hipparcos.bin            # 14 984 estrellas Hipparcos, 234 KB (Float32Array binario)
│
├── scripts/
│   └── generate-hipparcos.mjs   # Descarga VizieR CDS y genera hipparcos.bin
│
├── stores/
│   └── useAppStore.ts           # Estado Zustand: time (1×/seg) + timeMinute (1×/min)
│
└── types/
    └── celestial.ts             # Tipos: Star, DSO, Planet, Observer, etc.
```

---

## Catálogo de datos

### Estrellas (`stars.ts`)

900+ estrellas con nombre propio y puntos de anclaje, cubriendo las 88 constelaciones oficiales de la IAU. El catálogo base Yale BSC5 ha sido suplementado con estrellas de anclaje para garantizar la integridad de las figuras. Cada estrella incluye:

- Coordenadas J2000 (RA en grados, Dec en grados)
- Magnitud aparente, color espectral, radio de renderizado
- Constelación y descripción

### Constelaciones (`constellations.ts`)

85 de las 88 constelaciones oficiales de la IAU, definidas como secuencias de pares de estrellas (líneas).
Incluye todas las constelaciones clásicas (Orion, Ursa Major, Scorpius, etc.) más las constelaciones australes
(Crux, Carina, Centaurus, Phoenix, Tucana, Hydrus, etc.) y las modernas (Canes Venatici, Coma Berenices, etc.).

### Objetos de cielo profundo (`dsos.ts`)

Catálogo profesional masivo con **7.840 objetos** (OpenNGC), renderizados mediante shaders de alto rendimiento:

| Tipo | Cantidad | Ejemplos |
|---|---|---|
| **Galaxias** | ~5.000 | M31 Andromeda, M33 Triángulo, M51, M81... |
| **Nebulosas** | ~1.500 | M42 Orion, NGC 7293 Hélice, M8 Laguna... |
| **Cúmulos** | ~1.300 | M45 Pléyades, M44 Pesebre, M13 Hércules... |

---

## Sistema de coordenadas

La bóveda celeste usa coordenadas ecuatoriales transformadas a 3D:

```text
equatorialTo3D(ra_deg, dec_deg, radius) -> [x, y, z]
```

`CelestialGroup` aplica cada frame la rotación:

- `rotation.x = 90 - lat`  (inclina el polo norte celeste)
- `rotation.y = -LST`       (tiempo sidéreo local)

Esto mantiene todos los objetos celestes (estrellas, planetas, constelaciones) alineados
con el horizonte local del observador en tiempo real.
Funciona para cualquier latitud: desde Canarias (~28 N) hasta Islandia (~65 N) o cualquier punto del globo.

Los **satélites** (`Satellites.tsx`) operan fuera de `CelestialGroup` ya que sus posiciones
se calculan directamente en coordenadas horizontales locales (Alt/Az) vía `satellite.js`.

---

## Precisión Científica

Cosmos Atlas implementa rigor científico en cada capa de renderizado:

- **Precesión de los Equinoccios**: Corrección de coordenadas J2000 a la Época Actual mediante matriz de rotación dinámica.
- **Refracción Atmosférica**: Cálculo del aumento de altitud aparente cerca del horizonte.
- **Masa de Aire (Airmass)**: Módulo del parpadeo estelar según $X = 1/\sin(alt)$.
- **Efemérides Planetarias**: Integración con `astronomy-engine` para planetas y fases lunares.

---

## Seguimiento de Satélites e Integración TLE

El motor de satélites rastrea objetos artificiales en tiempo real:

- **Propagación Orbital**: Algoritmos SGP4/SDP4 vía `satellite.js`.
- **Datos Dinámicos**: Integración con **CelesTrak** para TLEs actualizados de la ISS y Starlink.
- **Sistema de Coordenadas Correcto**: Las posiciones se calculan en **Altitud/Acimut** real para el observador (usando `ecfToLookAngles`) y se convierten al espacio 3D horizontal:
  ```
  X = cos(el) × sin(az) × R   → Este
  Y = sin(el) × R              → Cénit
  Z = −cos(el) × cos(az) × R  → Norte
  ```
- **Espacio Mundo**: `Satellites` se renderiza **fuera** de `CelestialGroup` para evitar la doble rotación ecuatorial.
- **Visibilidad Local**: Solo se muestran satélites por encima del horizonte (elevación > 0°).
- **Starlink**: Hasta 2.000 satélites bajo demanda (toggle en el panel lateral).

---

## Jerarquía Visual Estilo Sky Map

### Capas de Renderizado (`renderOrder`)

| Capa | `renderOrder` | Descripción |
|---|---|---|
| Vía Láctea (shader) | 0 | Nebulosa FBM de fondo |
| `BackgroundStars` | `0` | Polvo estelar tenue (~40k partículas) |
| `Stars` (catálogo) | `1` | Estrellas nombradas sobre el fondo |
| `Constellations` | `3` + `depthTest: false` | Siempre visibles encima de las estrellas |
| Labels | `zIndexRange [200,100]` | Texto HTML siempre en primer plano |

### Escala Logarítmica de Magnitud (Pogson Real)

El tamaño de cada estrella sigue la escala de Pogson pura:

```ts
// Cada magnitud es 2.512× más oscura que la anterior
const brightness = Math.pow(2.512, refMag - star.mag);
const size = 0.15 + Math.pow(brightness, 0.55) * 5.85;
```

| Magnitud | Tamaño visual | Ejemplo |
|---|---|---|
| −1.5 (Sirius) | ~6 px | La estrella más brillante del cielo |
| 1–2 | ~3–4 px | Orion, Vega, Arcturus |
| 3–4 | ~1–1.5 px | Estrellas medias de constelaciones |
| 5–6 | ~0.3–0.5 px | Límite de visión a ojo desnudo |
| >6 | ~0.15 px | Fondo apenas perceptible |

### Constelaciones (estilo Sky Map)

- Color **cian `#4bcffa`** con opacidad 0.65 (en modo noche: rojo oscuro `#882222`)
- `depthTest: false` → las líneas siempre se ven sobre las estrellas
- Líneas **sólidas** para máxima legibilidad

### Bloom Calibrado por Luminancia

```tsx
<Bloom luminanceThreshold={0.35} intensity={1.0} radius={0.3} />
```

- **Umbral alto (0.35)**: solo las estrellas genuinamente brillantes (mag < ~2) reciben corona de bloom
- Las estrellas tenues quedan como puntos limpios y precisos
- Idéntico al comportamiento visual de **Sky Map** (Google)

### BackgroundStars — Campo Estelar de Fondo

- **40.000 partículas** sintéticas (antes 60.000) distribuidas con concentración galáctica ×25
- Magnitudes **desplazadas a 6.5–9** para no competir con el catálogo Stars (que cubre hasta mag 8)
- Tamaños comprimidos a **0.08–0.55 px** → leen como "polvo estelar" de fondo
- `renderOrder=0` → siempre debajo del catálogo de estrellas

---

## Experiencia Visual "National Geographic"

- **Estructura Galáctica**: Banda nebulosa procedimental (GLSL+FBM) + 14.000 partículas en espiral logarítmica.
- **Cromatismo H-Alpha**: Color en regiones clave (Cygnus, Carina) para resaltar nebulosidades.
- **Buscador SIMBAD**: Acceso a la BD profesional del CDS de Estrasburgo.

---

## Viaje Temporal

`TimeTravelControls` flota en la parte inferior central del canvas.

| Control | Función |
|---|---|
| Slider (−10a / +10a) | Salta a cualquier fecha arrastrando |
| Presets −10a −1a −1m −1s −1d | Saltos rápidos hacia atrás/adelante |
| Play / Pause | Reproduce el tiempo hacia adelante |
| VEL: 1h/s 1d/s 1s/s 1m/s | Velocidad de reproducción |
| AHORA | Vuelve al tiempo real |

La píldora del botón se vuelve ámbar cuando hay un offset activo.

---

## Navegación de Cámara

Al hacer clic en cualquier objeto en la **Guía**, `CameraNavigator` calcula la posición
mundial del objeto aplicando la misma rotación ecuatorial que `CelestialGroup`,
y mueve suavemente la cámara para apuntarle mediante lerp con ease-out.
Cuando llega al destino, OrbitControls recupera el control.

Funciona para estrellas, DSOs, planetas, Luna y centroides de constelaciones.

---

## Guía Interactiva

La Guía tiene 7 filtros y muestra todos los objetos con indicador de visibilidad en tiempo real:

| Filtro | Contenido |
|---|---|
| TODOS | Todos los objetos visibles según la búsqueda |
| ESTRELLAS | 340+ estrellas ordenadas por magnitud |
| PLANETAS | 8 cuerpos: Luna + 7 planetas con efemérides reales |
| GALAXIAS | DSOs tipo galaxia |
| NEBULOSAS | DSOs tipo nebulosa |
| CÚMULOS | DSOs tipo cúmulo |
| CONSTEL. | 85 constelaciones (IAU) con centroide calculado |

Clic en cualquier entrada → la cámara vuela hacia el objeto y aparece el crosshair de objetivo.

Mejoras recientes de navegación en el panel:

- Las secciones pueden mantenerse colapsadas para reducir scroll cuando hay muchos bloques abiertos.
- La banda de `Acceso rápido` permite saltar directamente a categorías y secciones frecuentes.
- Cada cabecera admite fijado con pin; las favoritas se guardan en `localStorage`.
- Las secciones fijadas suben al principio del panel para quedar accesibles sin atravesar todo el contenido.
- Hay acciones globales para expandir o contraer las secciones visibles de una vez.
- Luna y planetas ya usan el mismo catalogo solar compartido en Guia, busqueda y ficha detallada.

El detalle del objeto seleccionado (`ObjectInfoTab`) puede mostrar ahora, para Sistema Solar:

- descripci?n breve consistente entre vistas
- contexto ampliado
- consejos de observaci?n
- curiosidades y mitolog?a
- metadatos como tipo, lunas, anillos u orbita cuando existen en catalogo

---

## Puntero de Objetivo

Al seleccionar un objeto, el store actualiza `targetedObject`. `TargetPointer` renderiza:

- 3 anillos pulsantes animados (desfasados 120° en fase)
- Crosshair de 4 líneas a 0/90/180/270°
- Etiqueta HTML flotante con el nombre del objeto

| Tipo | Color |
|---|---|
| Estrella | Azul (#60a5fa) |
| Galaxia | Ámbar (#f59e0b) |
| Nebulosa | Verde (#34d399) |
| Planeta / Luna | Color propio del planeta |
| Constelación | Índigo (#818cf8) |

Clic de nuevo en el mismo objeto lo deselecciona.

---

## Luna con Fases Realistas

`Planets.tsx` incluye un componente `MoonMesh` separado con renderizado físico mediante shader GLSL:

- Calcula la posición con `Astronomy.Equator(Body.Moon, ...)` y la fase con `Astronomy.MoonPhase()`
- Renderiza una esfera 3D (`SphereGeometry`) con `ShaderMaterial` personalizado
- **Textura real**: Fotografía de Luna llena de Wikimedia Commons (`FullMoon2010.jpg`)
- **Iluminación física en GPU**: el `uPhase` uniform orienta el vector de luz (`vec3 lightDir`) según el ángulo de fase real; `step()` divide la esfera en lado iluminado / lado oscuro
- **Earthshine**: luz ambiente mínima (0.01) en el lado oscuro, simulando la luz reflejada por la Tierra
- **Corrección gamma**: leve `mix(tex, tex*tex, 0.2)` para aumentar el contraste de la superficie
- **Fallback**: `DataTexture` gris (1×1 px) si la carga de la foto falla, sin crash

| Fase (grados) | Nombre |
|---|---|
| 0 | Luna nueva |
| 45 | Creciente cóncava |
| 90 | Cuarto creciente |
| 135 | Gibosa creciente |
| 180 | Luna llena |
| 225 | Gibosa menguante |
| 270 | Cuarto menguante |
| 315 | Creciente menguante |

---

## Diseño Responsive y PWA

### Responsive

- **Móvil**: sidebar se convierte en overlay deslizante desde la derecha; backdrop semitransparente; botón FAB para reabrir
- **Escritorio**: sidebar colapsable a tira de 52px con iconos de tabs; animación spring con Framer Motion
- **Header**: se compacta en pantallas pequeñas (subtítulo y fecha ocultos)

### PWA

- `app/manifest.ts` genera `/manifest.webmanifest` con nombre, colores y declaración de iconos
- `app/icon.tsx` y `app/apple-icon.tsx` generan los PNG automáticamente vía Next.js `ImageResponse`
- Metadatos `apple-mobile-web-app-capable` para instalación en iOS
- En Chrome/Edge/Safari aparece el prompt de instalación al visitar la URL

---

## Auditoría de Autenticidad Científica

| Característica | Estado | Base Física |
| :--- | :--- | :--- |
| **Precesión J2000** | ✅ **REAL** | Matrices de precesión en `transforms.ts`. |
| **Refracción** | ✅ **REAL** | Fórmula de Saemundsson aplicada en tiempo real. |
| **Tamaño Angular** | ✅ **REAL** | Calculado por distancia (AU/Km) en Planetas y DSOs. |
| **Fases Planetarias**| ✅ **REAL** | Calculadas por elongación y ángulo de fase de la luz solar. |
| **Anillos Saturno**  | ✅ **REAL** | Inclinación dinámica (`ring_tilt`) asimétrica según la época. |
| **Lunas Júpiter**    | ✅ **REAL** | Posiciones de Io, Europa, Ganímedes y Calixto (IAU). |

---

## Changelog

### v3.6.0 - 2026-07-23 (Auditoria completa: seguridad, catalogos y consistencia visual)
- **CSP realmente activa en produccion** - Corregido el uso de `VERCEL_ENV` que la desactivaba en Vercel real, y el choque de nonce con la pagina estatica que rompia la ejecucion de scripts tras reactivarla.
- **`/api/astronomer` endurecido** - `.or()` interpolado sustituido por `.eq()` encadenado.
- **Gap de estrellas en Supabase** - Theta/Kappa/Iota Gem anadidas a `stars_cos`; rompian en silencio la figura de Geminis.
- **Imagenes DSO recuperadas** - 12 claves truncadas (`N####` en vez de `NGC####`) corregidas; 5 nebulosas reales vuelven a mostrar su foto de Hubble/ESO.
- **Denominador Messier corregido** - 108 reales (no 110) en Pasaporte y narracion de la IA.
- **Latitud de hemisferio** - La cabecera mostraba siempre "N" sin importar el hemisferio real del observador.
- **Telemetria falsa eliminada** - El crosshair de objetivo mostraba `Math.random()` como si fuera senal/distancia real; ahora usa magnitud y coordenadas reales.
- **Narracion por voz corregida** - La normalizacion de texto mutilaba la preposicion "al" al confundirla con anos-luz.
- **Satelites y viaje temporal** - Hubble/Tiangong/NOAA-18 ya refrescan su TLE; FOV manual no expira a 1s; "AHORA" sincroniza al instante.
- **176 lineas de codigo muerto eliminadas** en `GuideTab.tsx`; dos clases CSS fantasma (`glass-card`, `atlas-section-title`) corregidas.
- **Sistema visual de paneles unificado** - 13 componentes migrados a `atlas-panel`/`atlas-card` y `border-white/10` como estandar compartido.
- **Nueva funcion** - Deseleccionar objeto desde el cielo vacio o con boton dedicado en Objeto/Guia.

### v3.5.1 - 2026-05-10 (UI movil limpia y orientacion Alt/Az corregida)
- **Header como mando principal** - Brujula, busqueda, reloj, AR, GPS, IA astronomica y panel quedan en la barra superior para liberar el cielo en movil.
- **Controles flotantes reducidos** - En movil se retiran brujula grande, boveda/camara, foto, tiempo real, IA flotante y FAB del panel; escritorio conserva esos widgets.
- **Calibracion en brujula compacta** - El menu de brujula permite mirar cenit, mirar norte, calibrar Polaris y borrar offset manual.
- **SkyCanvas alineado con Alt/Az** - La esfera celeste cambia a rotacion `XYZ`, corrigiendo hemisferio, azimut y latitud local.
- **CameraNavigator consistente** - La navegacion asistida usa el mismo signo de latitud al iniciar vuelo y al seguir objetos.
- **Cobertura de hemisferios** - Tests nuevos validan Canarias, Galway y Argentina contra el calculo astronomico.

### v3.5 — 2026-04-29 (Via Lactea fotografica, Bortle real e IA Kids)
- **MilkyWaySkyDome real** — Textura panoramica fotografica de la Via Lactea renderizada sobre la boveda celeste, con orientacion galactica completa y continuidad visual por hemisferios.
- **Bortle aplicado a todo el cielo** — El control de contaminacion luminica ahora afecta al fondo atmosferico, estrellas, Hipparcos, cielo profundo y Via Lactea.
- **Constelaciones visibles en cielo diurno** — Refuerzo automatico de lineas con Sol alto o crepusculo para que sigan siendo legibles sobre el azul atmosferico.
- **IA Astronoma + Supabase** — Las respuestas remotas pueden enriquecer el contexto con tablas Supabase y datos largos de planetas/lunas/objetos.
- **Kids 8-14 en Header** — El modo infantil pasa a ser un control global visible, con tono, preguntas rapidas y narraciones adaptadas.
- **CSP y limpieza de release** — Endpoint de reportes CSP, Supabase permitido en `connect-src`, y retirada de assets prototipo fuera del bundle final.

### v3.4 — 2026-04-23 (Refinamiento Estético de Constelaciones)
#### 🏛️ Minimalismo y Elegancia Clásica
- **Eliminación del Arte Vectorial "Picasso"**: Se ha retirado el renderizado de figuras mitológicas en formato de polilíneas complejas que sobrecargaban visualmente el mapa y causaban confusión.
- **Líneas Estructurales Limpias**: El sistema ahora confía puramente en los clásicos trazos geométricos que conectan las estrellas principales de cada constelación (stick-figures), garantizando un aspecto mucho más profesional, ordenado y fiel a los mapas estelares tradicionales.
- **Cero Consumo de Texturas**: Se ha erradicado la dependencia de texturas premium pesadas para el arte de constelaciones, ahorrando tokens en su generación, liberando valiosa memoria VRAM en móviles y mejorando el rendimiento.
- **Ajuste de Resplandor ("Glow")**: Se ha reducido drásticamente el grosor y la opacidad del aura de neón en la constelación seleccionada. Se corrigió el efecto de "algodón de azúcar", logrando un resalte sutil y nítido.

### v3.3 — 2026-04-22 (Deep Sky & Constellation Fidelity)
#### 🌌 Catálogo NGC Completo
- **OpenNGC Integration**: Incorporación de los 7.840 objetos del catálogo OpenNGC (Galaxias, Nebulosas y Cúmulos).
- **Motor Binario (`ngc.bin`)**: Implementación de un cargador de datos binarios (20 bytes por objeto) para renderizado instantáneo sin sobrecarga de memoria.
- **Shader de Cielo Profundo**: Renderizado basado en puntos con *Level of Detail* (LOD) dinámico según el FOV, optimizando la batería en dispositivos móviles.

#### 🏛️ Fidelidad de Constelaciones (IAU)
- **88 Constelaciones Completas**: Inyección de **523 estrellas de anclaje** adicionales para cerrar todas las figuras oficiales de la IAU.
- **Reconstrucción de Mapas**: Actualización de `constellations.ts` con segmentos de línea estándar profesional.
- **Auditoría Estelar**: Eliminación de más de 195 estrellas duplicadas y resolución de conflictos de posición (z-fighting) para un mapa 100% limpio.

#### 💎 Interfaz Glassmorphism
- **Refinamiento Visual**: Sustitución de etiquetas opacas por un diseño **Glassmorphism** (fondo `bg-white/5` + `backdrop-blur-md`).
- **Gestión de Oclusión**: Algoritmo de desplazamiento vertical dinámico para etiquetas de planetas en conjunción.
- **Ajuste de Perseo**: Reposicionamiento de etiquetas para evitar cubrir el arte mitológico en constelaciones clave.

### v3.0 — 2026-02-26 (Inmersión Planetaria & IA Astrónoma)
#### 🎙️ IA Astrónoma (Voice-Over)
- Implementación del componente de **narración interactiva**.
- Integración con **Web Speech API** para guiado por voz en español.
- Interfaz flotante con animaciones de espectro de audio y glow reactivo.

#### 🔭 Cinematic Landing & 3D Models
- **Cinematic Zoom**: La cámara ahora realiza un acercamiento orbital automatizado con ajuste de FOV al seleccionar astros.
- **Efecto de Cross-fade**: Mezcla suave entre sprites 2D lejanos y modelos 3D detallados al acercarse.
- **Sol "Bestial"**: Nuevo shader de superficie solar con distorsión por calor, corona exterior y luz volumétrica simulada.
- **Texturizado HD**: Venus, Marte, Júpiter y Saturno actualizados con mapas de superficie realistas de alta resolución.

#### 🌅 Atmósfera y Horizonte
- **Atmospheric Scattering**: Implementación de una esfera de Scattering para simular el brillo del cielo cerca del horizonte.
- Mejor ocultación de la esfera celeste bajo el horizonte, creando una transición tierra-cielo natural.

#### ✨ Mejoras en Constelaciones y DSOs
#### \u2728 Mejoras en Constelaciones y DSOs
- **Foco Estelar**: Glow ne\u00f3n din\u00e1mico en las l\u00edneas de la constelaci\u00f3n centrada por el usuario.
- **Correcci\u00f3n Geom\u00e9trica**: Ajuste manual de los patrones de dibujo para Ursa Minor, Taurus, Capricornus y Leo. A\u00f1adida la constelaci\u00f3n de Cancer.
- **DSO Landing**: Los objetos de cielo profundo ahora soportan zoom cinem\u00e1tico, aterrizando en su magnitud de observaci\u00f3n ideal.

---

### v3.1 \u2014 2026-02-26 (Buscador Universal & Realismo Atmosf\u00e9rico)

#### \ud83d\udd0d Buscador Universal SIMBAD (Sesame)
- Integraci\u00f3n del servicio **CDS Sesame** para resolver cualquier objeto astron\u00f3mico por nombre.
- Si un objeto no est\u00e1 en el cat\u00e1logo local, la aplicaci\u00f3n consulta en vivo las bases de datos profesionales (SIMBAD/NED).
- Resultados remotos con coordenadas precisas, tipo de objeto y magnitud.

#### \ud83c\udf04 Extinci\u00f3n Atmosf\u00e9rica & Shaders
- **Atmospheric Extinction**: Nuevo m\u00f3dulo en el shader de estrellas que simula la p\u00e9rdida de luz y el desplazamiento al rojo cerca del horizonte.
- **Twinkle Din\u00e1mico**: El parpadeo de las estrellas aumenta proporcionalmente a su masa de aire (airmass).
- **V\u00eda L\u00e1ctea HD (Fase 2)**: Introducci\u00f3n de variedad espectral en 22,000 part\u00edculas, con regiones H-Alpha rosadas y ocre de polvo interestelar.

#### \ud83d\udcc5 Eventos & Lluvias de Meteoros
- Implementaci\u00f3n de datos reales para lluvias de meteoros (Cuadr\u00e1ntidas, L\u00edridas, Perseidas, etc.).
- C\u00e1lculo de actividad din\u00e1mica (THZ) seg\u00fan la cercan\u00eda al pico de la lluvia.
- Integraci\u00f3n en el panel **DailyEvents** con iconos y estados de visibilidad.

#### \u26a1 Optimizaci\u00f3n de Motor
- **Octree V2**: Refactorizaci\u00f3n del sistema de particionamiento espacial para b\u00fasquedas O(log N) ultra-r\u00e1pidas.
- Eliminaci\u00f3n de asignaciones de memoria temporales en el bucle de renderizado mediante cach\u00e9 AABB.
- Carga de texturas de planetas corregida (eliminados 404s y errores de carga CORS).

#### 🤖 IA Astrónoma Proactiva
- **Smart Suggestions**: La IA ahora analiza el cielo visible y sugiere objetos fascinantes (incluyendo DSOs como Andrómeda u Orión) para observar en ese momento exacto.
- **Memoria de Diálogo**: Historial de mensajes y narrativas enriquecidas con mitología y datos curiosos.
- **Explicit Naming**: La IA ahora anuncia vocalmente el nombre del objeto antes de su descripción (ej: "Destino: Marte...").

---

### v3.2 — 2026-02-26 (Deep Space Overhaul & Stellar Tours)

#### 🌌 Deep Sky Object Overhaul
- **Catálogo Expandido**: Añadidas galaxias M31, M33, M81, M82, M87 y las Nubes de Magallanes (LMC/SMC).
- **Procedural Fidelity**: Nuevas texturas fractales para galaxias (núcleos densos, espirales, carriles de polvo) y nebulosas gaseosas.
- **Space Mode**: Al hacer zoom (FOV < 45), la atmósfera y el SunFlare se atenúan automáticamente para una visibilidad perfecta.

#### 🪐 Júpiter: Sistema de Lunas Completo
- **Efemérides Galileanas**: Simulación orbital precisa de Ío, Europa, Ganímedes y Calisto.
- **Escala Visual Corregida**: Las lunas ahora orbitan fuera del disco planetario visual de Júpiter, compensando la escala exagerada de los modelos 3D.
- **Labels Dinámicos**: Identificación automática de las lunas al alcanzar zoom de observación telescópica.

#### 🛰️ Stellar Tours Express
- **Tour del Sistema Solar y Más Allá**: Viaje narrado que ahora incluye el Sol, planetas, Andrómeda, Orión, las Pléyades, Alpha Centauri y el Centro Galáctico (Sagitario A*).
- **Control de Usuario**: Añadido botón "Siguiente" para saltar entre explicaciones sin esperar el temporizador.
- **Prevención de Conflictos**: La IA ya no interrumpe sus propias narraciones durante el tour al seleccionar objetos manualmente.

---

### v2.5 - 2026-02-24 (Calibración visual y trazabilidad)

#### Via Lactea: correcciones de rendering y exposicion
- Reorden de capas para evitar conflictos visuales (`renderOrder` negativo en Via Lactea).
- Ajustes de profundidad para evitar artefactos:
  - `depthWrite: false`
  - `depthTest: false`
- Mezcla de color mas controlada:
  - `AdditiveBlending` -> `NormalBlending` en shader y particulas.
  - `toneMapped: false` para mantener contraste.
- Recalibracion del shader:
  - Menor bulbo/halo.
  - Mayor peso de carriles oscuros.
  - Alpha maximo reducido para evitar nucleo quemado.
- Particulas de la banda con menor tamano/opacidad para quitar velo blanco.

#### Fondo celeste
- `CelestialSphere` ajustada a `BackSide` sin transparencia para evitar mezcla innecesaria en la cola de transparencias.

#### Escala de Bortle: comportamiento claro en UI y render
- Selector actualizado de `[1,3,5,7,9]` a `[1..9]` (incluye el valor por defecto 4).
- Curvas de visibilidad recalibradas para que el cambio sea perceptible:
  - `Stars.tsx`: limite de magnitud mas agresivo.
  - `BackgroundStars.tsx`: limite de magnitud mas agresivo para campo tenue.

#### Satelites y Starlink: identificables y auditables
- Visibilidad mejorada de puntos:
  - Tamano/opacidad mayores.
  - `renderOrder` alto.
  - `depthTest/depthWrite` ajustados para evitar ocultacion por otras capas.
  - Margen de horizonte ampliado a `-5 deg`.
- Tooltip en cielo:
  - Al pasar el raton sobre un punto se muestra su nombre.
- Panel con telemetria:
  - Leyenda de color (`ISS/Hubble` y `Starlink`).
  - Contadores `visibles/cargados` por grupo.
  - Estado de carga Starlink: `idle | loading | ok | error`.
- Store global ampliado con `satelliteInfo` para exponer esos datos en tiempo real.

#### Nota operativa
- Starlink depende de fetch cliente a CelesTrak.
  Si hay bloqueo de red/CORS, el estado pasa a `error` y los contadores quedan en `0`.

---

### v2.4 — 2026-02-24 (Realidad Científica Total)

#### 🪐 Sistema Solar Completo
- **Tamaños Dinámicos**: Los planetas ya no son esferas de tamaño fijo. Ahora su tamaño visual en el canvas se escala según su **diámetro angular real** (cambia con la distancia a la Tierra).
- **Lunas de Júpiter**: Se han integrado los 4 satélites Galileanos (**Io, Europa, Ganímedes, Calixto**) con sus órbitas en tiempo real.
- **Anillos de Saturno**: Se ha eliminado la inclinación fija "placebo". Ahora usan el ángulo real de la inclinación del polo de Saturno respecto a la Tierra (`ring_tilt`).
- **Fases Planetarias**: Mercurio y Venus ahora muestran fases (creciente, gibosa, etc.) dependiendo de su posición respecto al Sol, tal como se ven por telescopio.

#### 🌌 Objetos de Cielo Profundo (DSOs)
- **Dimensiones Reales**: Todas las galaxias (M31, M33, etc.), nebulosas (M42) y cúmulos (M45) usan su **tamaño angular real en minutos de arco**.
- **Texturas Únicas por Tipo**:
  - **Galaxias**: Textura espiral elíptica inclinada.
  - **Nebulosas**: Nubes amorfas de gas ionizado.
  - **Cúmulos**: Grupos de puntos estelares definidos.
- **Etiquetado Detallado**: Ahora las etiquetas de los DSOs muestran su nombre (Messier/NGC) y su magnitud aparente para ayudar a la planificación de observación.

#### 🛠️ Refactorización y Estabilidad
- **Optimización de Texturas**: Uso de `THREE.CanvasTexture` con limpieza de memoria automática (`dispose`).
- **Eliminación de "Miras Fijas"**: Se han sustituido todos los valores hardcoded por llamadas a `astronomy-engine`.

---

### v2.3 — 2026-02-24 (Brújula de Orientación)

#### 🧭 Nueva Brújula Interactiva
- **Rosa de los vientos** en esquina inferior izquierda
- Aguja roja que siempre apunta al norte visual
- Indicador de dirección cardinal (N, NE, E, SE, S, SO, O, NO) y grados
- **Clic simple**: centra la vista en el cenit (mirando hacia arriba)
- **Doble clic**: centra la vista mirando al norte (horizonte)
- Estilo glass morphism coherente con la UI existente

---

### v2.2 — 2026-02-24 (Constelaciones Completas + Vía Láctea Mejorada)

#### ⭐ Constelaciones IAU Completas
- **85 de 88 constelaciones oficiales** de la IAU ahora definidas con líneas
- **+150 estrellas nuevas** añadidas al catálogo (de 187 a 340+)
- Cobertura completa del hemisferio sur: Carina, Vela, Puppis, Crux, Centaurus, etc.
- Constelaciones modernas: Canes Venatici, Coma Berenices, Leo Minor, etc.
- Constelaciones del zodíaco completas: Pisces, Cancer (parcial), etc.

#### 🌌 Vía Láctea Mejorada
- **Shader alpha aumentado**: multiplicador 0.12 → 0.18 (+50% brillo)
- **Máximo alpha**: 0.32 → 0.48 (+50% opacidad máxima)
- **Partículas estelares**: opacidad 0.35 → 0.45 (+28%)
- Resultado: Vía Láctea significativamente más visible

#### 🔧 Corrección de FOVOverlay
- Reestructurado para evitar error de hooks de R3F fuera del Canvas
- `useThree()` ahora se llama en el contexto correcto antes del portal `Html`

---

### v2.1 — 2026-02-24 (Estilo Sky Map)

#### 🐛 Corrección de Satélites
- **Bug crítico solucionado**: Los satélites se posicionaban incorrectamente porque se usaban coordenadas ECI proyectadas directamente al espacio 3D sin tener en cuenta la latitud/longitud del observador.
- **Solución**: Ahora se usan los ángulos de **Elevación y Acimut** reales (`ecfToLookAngles`) y se convierten al sistema 3D horizontal de la escena.
- **Bug adicional**: `Satellites` estaba dentro de `CelestialGroup`, que le aplicaba una segunda rotación ecuatorial incorrecta. Ahora se renderiza en espacio mundo, junto al `Horizon`.

#### ✨ Mejoras Visuales Estilo Sky Map
- **`Stars.tsx`** — Escala Pogson agresiva con curva `^0.55`: las estrellas brillantes (~mag ≤ 2) dominan visualmente; las tenues son puntos casi invisibles. Se corrigió bug de índices desalineados en los hitboxes (al filtrar por mag ≤ 5.5).
- **`Constellations.tsx`** — Líneas rediseñadas: cian `#4bcffa`, opacidad 0.65, sólidas (sin guiones), `depthTest: false`. En modo nocturno: rojo oscuro. `renderOrder=3` para pintarse siempre encima de las estrellas.
- **`ConstellationLabels.tsx`** — Texto con glow (`textShadow`), color más visible `rgba(130,190,255,0.55)`, soporte de modo nocturno en rojo sutil.
- **`BackgroundStars.tsx`** — Reducido de 60k a 40k partículas. Magnitudes iniciales desplazadas a 6.5–9 (no compiten con el catálogo). Concentración galáctica aumentada (×25 vs ×12). `renderOrder=0`.
- **`SkyCanvas.tsx`** (Bloom) — `luminanceThreshold` subido de 0.15 a **0.35**: solo las estrellas brillantes tienen corona de bloom. Intensidad bajada a 1.0, radio a 0.3.

---

## Autor

**Salvador Munoz Portillo**
Email: <salvador.munoz@masvoip.com>
GitHub: <https://github.com/salva1962-ai>

---

## Licencia

Uso privado. Todos los derechos reservados.
