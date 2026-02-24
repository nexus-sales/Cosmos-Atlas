# Cosmos Atlas

Planetario interactivo en tiempo real renderizado en 3D en el navegador.
Muestra una bóveda celeste precisa a tu posición geográfica y hora actual,
con estrellas, constelaciones, planetas, objetos de cielo profundo, Vía Láctea y satélites.
Totalmente responsive e instalable como PWA.

---

- **Bóveda Celeste 3D Pro** — Esfera celestial completa renderizada con React Three Fiber y motor de partículas optimizado.
- **Precisión Científica Real** — Corrección por **Precesión de los Equinoccios** (J2000 a Época Actual) y **Refracción Atmosférica** dinámica.
- **Motor Octree para 40k+ Estrellas de Fondo** — Particionamiento espacial para renderizado eficiente con *frustum culling*.
- **Vía Láctea "National Geographic"** — Shader GLSL fractal (FBM) combinado con nubes de partículas estilo Gaia (espiral logarítmica).
- **Seguimiento de Satélites (TLE)** — Órbitas en tiempo real de la **ISS**, **Hubble** y mega-constelaciones como **Starlink** (vía satellite.js). Posiciones calculadas en coordenadas Alt/Az reales para el observador.
- **Buscador Universal SIMBAD** — Resolución remota de objetos profesionales a través de los servidores **CDS Sesame** de Estrasburgo.
- **Simulador de Campo de Visión (FOV)** — Herramienta para astrofotografía; ajusta distancia focal y tamaño del sensor (Full Frame, APS-C).
- **Escala de Bortle Automática** — Simulación de contaminación lumínica real que filtra la visibilidad estelar de 1 a 9.
- **Modo Nocturno (Red Mode)** — Interfaz y shaders adaptados en rojo puro para preservar la visión nocturna del observador.
- **Estilo Sky Map & Realismo Crítico** — Jerarquía logarítmica de magnitudes, constelaciones siempre visibles y Bloom calibrado. Objetos representados con su **tamaño angular real** (arcsec/arcmin).
- **Planetas y Luna con Fases Reales** — Efemérides de alta precisión; Mercurio, Venus y la Luna muestran fases; Júpiter incluye sus lunas Galileanas.
- **Objetos de Cielo Profundo (DSOs)** — Galaxias, nebulosas y cúmulos representados con texturas procedimentales únicas y dimensiones físicas auténticas.
- **PWA Instalable** — Manifest, iconos auto-generados y metadatos; instalable en iOS, Android y escritorio.

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework principal (App Router) |
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

Abre <http://localhost:3000> en el navegador.

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
│   ├── effects/
│   │   ├── CosmicParticles.tsx  # Partículas de fondo
│   │   └── Meteors.tsx          # Efecto de meteoros
│   │
│   ├── panels/
│   │   ├── Header.tsx           # Barra superior responsive (hora, ubicación)
│   │   ├── SidePanel.tsx        # Panel lateral colapsable + overlay móvil
│   │   ├── GuideTab.tsx         # Guía interactiva (estrellas, planetas, Luna, DSOs, constelaciones)
│   │   ├── ObjectInfoTab.tsx    # Detalle del objeto seleccionado
│   │   ├── ChallengeTab.tsx     # Retos de observación
│   │   ├── TimeTravelControls.tsx # Slider de viaje temporal
│   │   └── Compass.tsx          # Brújula interactiva (clic: cenit, doble clic: norte)
│   │
│   └── sky-map/
│       ├── SkyCanvas.tsx        # Canvas 3D principal + CameraNavigator
│       ├── CelestialSphere.tsx  # Esfera base (fondo negro)
│       ├── CelestialGrid.tsx    # Cuadrícula ecuatorial
│       ├── Stars.tsx            # Estrellas (Shader Pogson + Twinkle doble frecuencia)
│       ├── Constellations.tsx   # Líneas de constelaciones (depthTest:false, estilo Sky Map)
│       ├── ConstellationLabels.tsx # Etiquetas de nombre en la bóveda (glow sutil)
│       ├── Planets.tsx          # Planetas (Fases reales + Lunas Galileanas + Anillos dinámicos)
│       ├── DeepSkyObjects.tsx   # DSOs (Tamaño angular real + Texturas únicas)
│       ├── MilkyWay.tsx         # Vía Láctea (Shader FBM + Partículas Gaia)
│       ├── BackgroundStars.tsx  # Campo estelar de fondo 40k estrellas con Octree
│       ├── Satellites.tsx       # Seguimiento TLE en Alt/Az real (ISS, Hubble, Starlink)
│       ├── Ecliptic.tsx         # Línea de la eclíptica
│       ├── Horizon.tsx          # Atmósfera, horizonte y puntos cardinales
│       ├── FOVOverlay.tsx       # Retículo de campo de visión para astrofotografía
│       └── TargetPointer.tsx    # Crosshair animado sobre el objeto objetivo
│
├── data/
│   ├── stars.ts                 # Catálogo de 340+ estrellas nombradas (88 constelaciones IAU)
│   ├── constellations.ts        # Definición de líneas de 85 constelaciones (de las 88 IAU)
│   └── dsos.ts                  # 42 objetos de cielo profundo
│
├── hooks/
│   ├── useGeolocation.ts        # Geolocalización del navegador
│   └── useCelestialVisibility.ts
│
├── lib/
│   ├── utils.ts
│   └── astronomy/
│       ├── time.ts              # LST, Julian Date, conversiones de tiempo
│       ├── transforms.ts        # Precesión, Refracción y Coordenadas 3D
│       └── Octree.ts            # Implementación de Octree para culling estelar
│
├── stores/
│   └── useAppStore.ts           # Estado global Zustand (time, isLive, observer, settings...)
│
└── types/
    └── celestial.ts             # Tipos: Star, DSO, Planet, Observer, etc.
```

---

## Catálogo de datos

### Estrellas (`stars.ts`)

340+ estrellas con nombre propio ordenadas por magnitud, cubriendo las 88 constelaciones oficiales de la IAU. Cada estrella incluye:

- Coordenadas J2000 (RA en grados, Dec en grados)
- Magnitud aparente, color espectral, radio de renderizado
- Constelación y descripción

### Constelaciones (`constellations.ts`)

85 de las 88 constelaciones oficiales de la IAU, definidas como secuencias de pares de estrellas (líneas).
Incluye todas las constelaciones clásicas (Orion, Ursa Major, Scorpius, etc.) más las constelaciones australes
(Crux, Carina, Centaurus, Phoenix, Tucana, Hydrus, etc.) y las modernas (Canes Venatici, Coma Berenices, etc.).

### Objetos de cielo profundo (`dsos.ts`)

42 objetos clasificados en 3 tipos:

| Tipo | Ejemplos |
|---|---|
| **Galaxias** | M31 Andromeda, M33 Triángulo, M81 Bode, M82 Cigarro, M87 Virgo A, LMC, SMC... |
| **Nebulosas** | M42 Orion, M57 Anillo, M1 Cangrejo, M27 Dumbbell, NGC 7293 Hélice... |
| **Cúmulos** | M45 Pléyades, M44 Pesebre, M13 Hércules, M3, M4, M5, M11... |

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

`Planets.tsx` incluye un componente `MoonMesh` separado que:

- Calcula la posición con `Astronomy.Equator(Body.Moon, ...)` y la fase con `Astronomy.MoonPhase()`
- Genera una textura `THREE.CanvasTexture` dibujando geométricamente el lado iluminado
- La fase se redondea a 3° para evitar regenerar la textura cada frame

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
