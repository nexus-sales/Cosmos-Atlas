# Cosmos Atlas

Planetario interactivo en tiempo real renderizado en 3D en el navegador.
Muestra una boveda celeste precisa a tu posicion geografica y hora actual,
con estrellas, constelaciones, planetas, objetos de cielo profundo y la Via Lactea.
Totalmente responsive e instalable como PWA.

---

- **Bóveda Celeste 3D Pro** - Esfera celestial completa renderizada con React Three Fiber y motor de partículas optimizado.
- **Precisión Científica Real** - Corrección por **Precesión de los Equinoccios** (J2000 a Época Actual) y **Refracción Atmosférica** dinámica.
- **Motor Octree para 100k+ Estrellas** - Particionamiento espacial para renderizado eficiente del catálogo completo de Hipparcos con *frustum culling*.
- **Vía Láctea "National Geographic"** - Shader GLSL fractal (FBM) combinado con nubes de partículas estilo Gaia (espiral logarítmica).
- **Seguimiento de Satélites (TLE)** - Órbitas en tiempo real de la **ISS**, **Hubble** y mega-constelaciones como **Starlink** (vía satellite.js).
- **Buscador Universal SIMBAD** - Resolución remota de objetos profesionales a través de los servidores **CDS Sesame** de Estrasburgo.
- **Simulador de Campo de Visión (FOV)** - Herramienta para astrofotografía; ajusta distancia focal y tamaño del sensor (Full Frame, APS-C).
- **Escala de Bortle Automática** - Simulación de contaminación lumínica real que filtra la visibilidad estelar de 1 a 9.
- **Modo Nocturno (Red Mode)** - Interfaz y shaders adaptados en rojo puro para preservar la visión nocturna del observador.
- **Twinkling Físico** - Centelleo estelar modulado por la **Masa de Aire** (Airmass); las estrellas parpadean más cerca del horizonte.
- **Planetas y Luna Realista** - Efemérides de alta precisión con fases lunares calculadas geométricamente.
- **PWA Instalable** - Manifest, iconos auto-generados y metadatos; instalable en iOS, Android y escritorio.

---

## Tecnologias

| Tecnologia | Version | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework principal (App Router) |
| React | 19.2.3 | UI |
| TypeScript | - | Tipado estatico |
| React Three Fiber | ^9.5.0 | Renderizado 3D en canvas |
| Three.js | ^0.183.1 | Motor 3D |
| @react-three/drei | ^10.7.7 | Helpers 3D (Html, OrbitControls, etc.) |
| astronomy-engine | ^2.1.19 | Efemérides planetarias y lunares reales |
| satellite.js | ^6.0.2 | Propagación de órbitas de satélites TLE |
| Zustand | ^5.0.11 | Estado global |
| Tailwind CSS | ^4 | Estilos |
| Framer Motion | ^12 | Animaciones UI |
| shadcn/ui | - | Componentes base |
| lucide-react | ^0.575 | Iconos |

---

## Inicio rapido

```text
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre <http://localhost:3000> en el navegador.

```text
# Build de produccion
npm run build
npm start
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout raiz + metadatos PWA + viewport
│   ├── manifest.ts              # Manifiesto PWA (nombre, colores, iconos)
│   ├── icon.tsx                 # Icono 192x192 generado con ImageResponse
│   ├── apple-icon.tsx           # Icono Apple 180x180
│   └── page.tsx                 # Pagina principal + tick de tiempo real + FAB movil
│
├── components/
│   ├── effects/
│   │   ├── CosmicParticles.tsx  # Particulas de fondo
│   │   └── Meteors.tsx          # Efecto de meteoros
│   │
│   ├── panels/
│   │   ├── Header.tsx           # Barra superior responsive (hora, ubicacion)
│   │   ├── SidePanel.tsx        # Panel lateral colapsable + overlay movil
│   │   ├── GuideTab.tsx         # Guia interactiva (estrellas, planetas, Luna, DSOs, constelaciones)
│   │   ├── ObjectInfoTab.tsx    # Detalle del objeto seleccionado
│   │   ├── ChallengeTab.tsx     # Retos de observacion
│   │   └── TimeTravelControls.tsx # Slider de viaje temporal
│   │
│   └── sky-map/
│       ├── SkyCanvas.tsx        # Canvas 3D principal + CameraNavigator
│       ├── CelestialSphere.tsx  # Esfera base
│       ├── CelestialGrid.tsx    # Cuadricula ecuatorial
│       ├── Stars.tsx            # Renderizado de estrellas (instanced + variables)
│       ├── Constellations.tsx   # Lineas de constelaciones
│       ├── ConstellationLabels.tsx # Etiquetas de nombre en la boveda
│       ├── Planets.tsx          # Planetas + Luna con fase (posiciones reales)
│       ├── DeepSkyObjects.tsx   # Galaxias, nebulosas, cumulos
│       ├── MilkyWay.tsx         # Vía Láctea (Shader FBM + Gaia Particles)
│       ├── BackgroundStars.tsx  # Generador de 100k+ estrellas con Octree
│       ├── Satellites.tsx       # Seguimiento TLE (ISS, Starlink...)
│       ├── Ecliptic.tsx         # Línea de la eclíptica
│       ├── Horizon.tsx          # Atmósfera, horizonte y puntos cardinales
│       ├── FOVOverlay.tsx       # Retículo de campo de visión para astrofotografía
│       └── TargetPointer.tsx    # Crosshair animado sobre el objeto objetivo
│
├── data/
│   ├── stars.ts                 # Catalogo de 290+ estrellas nombradas
│   ├── constellations.ts        # Definicion de lineas de 30+ constelaciones
│   └── dsos.ts                  # 42 objetos de cielo profundo
│
├── hooks/
│   ├── useGeolocation.ts        # Geolocalizacion del navegador
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
│   └── useAppStore.ts           # Estado global Zustand (time, isLive, observer, sidebarOpen, settings...)
│
└── types/
    └── celestial.ts             # Tipos: Star, DSO, Planet, Observer, etc.
```

---

## Catalogo de datos

### Estrellas (`stars.ts`)

290+ estrellas con nombre propio ordenadas por magnitud. Cada estrella incluye:

- Coordenadas J2000 (RA en grados, Dec en grados)
- Magnitud aparente, color espectral, radio de renderizado
- Constelacion y descripcion

### Constelaciones (`constellations.ts`)

30+ constelaciones definidas como secuencias de pares de estrellas (lineas).
Incluye: Orion, Cassiopeia, Ursa Major, Ursa Minor, Cygnus, Lyra, Aquila,
Serpens, Hercules, Perseus, Auriga, Gemini, Cepheus, Corvus, Crux, Centaurus y mas.

### Objetos de cielo profundo (`dsos.ts`)

42 objetos clasificados en 3 tipos:

| Tipo | Ejemplos |
|---|---|
| **Galaxias** | M31 Andromeda, M33 Triangulo, M81 Bode, M82 Cigarro, M87 Virgo A, LMC, SMC... |
| **Nebulosas** | M42 Orion, M57 Anillo, M1 Cangrejo, M27 Dumbbell, NGC 7293 Helice... |
| **Cumulos** | M45 Pleyades, M44 Pesebre, M13 Hercules, M3, M4, M5, M11... |

---

## Sistema de coordenadas

La boveda celeste usa coordenadas ecuatoriales transformadas a 3D:

```text
equatorialTo3D(ra_deg, dec_deg, radius) -> [x, y, z]
```

`CelestialGroup` aplica cada frame la rotacion:

- `rotation.x = 90 - lat`  (inclina el polo norte celeste)
- `rotation.y = -LST`       (tiempo sidereo local)

Esto mantiene todos los objetos alineados con el horizonte local del observador en tiempo real.
Funciona para cualquier latitud: desde Canarias (~28 N) hasta Islandia (~65 N) o cualquier punto del globo.

---

## Precisión Científica (V2.0)

Cosmos Atlas implementa rigor científico en cada capa de renderizado:

- **Precesión de los Equinoccios**: Corrección de coordenadas J2000 a la Época Actual mediante matriz de rotación dinámica. Garantiza que las estrellas estén donde realmente se ven hoy.
- **Refracción Atmosférica**: Cálculo del "Aumento de Altitud" aparente cerca del horizonte debido a la atmósfera terrestre.
- **Masa de Aire (Airmass)**: Cálculo dinámico de la cantidad de atmósfera que atraviesa la luz ($X = 1/\sin(alt)$) para modular la intensidad del parpadeo estelar.
- **Efemerides Planetarias**: Integración con `astronomy-engine` para posiciones planetarias y fases lunares con precisión de minutos de arco.

---

## Seguimiento de Satélites e Integración TLE

El motor de satélites permite rastrear objetos artificiales en tiempo real:

- **Propagación Orbital**: Uso de los algoritmos SGP4/SDP4 via `satellite.js`.
- **Datos Dinámicos**: Integración con **CelesTrak** para descargar TLEs actualizados de la ISS y Starlink.
- **Visibilidad Local**: Solo se renderizan los satélites que están por encima del horizonte local del observador y bajo condiciones de iluminación adecuadas.
- **Remapeo ECI a Mundo**: Conversión directa de vectores de inercia inercial (ECI) al sistema de coordenadas de la aplicación para máximo rendimiento.

---

## Experiencia Visual "National Geographic"

La Vía Láctea y el fondo estelar han sido rediseñados para una fidelidad técnica superior:

- **Estructura Galáctica**: Combinación de una banda nebulosa procedimental (GLSL con FBM para nubes de polvo) y un cúmulo de 12,000 partículas distribuidas en **espiral logarítmica**.
- **Motor Octree**: Gestión de un campo estelar de fondo de 100,000 unidades con un sistema de particionamiento espacial que optimiza el rendimiento en dispositivos móviles.
- **Cromatismo H-Alpha**: Inyección manual de color en regiones clave como el Cisne (Cygnus) y Carina para resaltar nebulosidades de emisión.
- **Buscador SIMBAD**: Acceso a la base de datos profesional del CDS de Estrasburgo, permitiendo buscar cualquier objeto del cielo profundo fuera de nuestro catálogo local.

---

## Viaje temporal

`TimeTravelControls` flota en la parte inferior central del canvas.
Al activarlo, el tick de tiempo real se pausa y se toma el instante actual como referencia:

| Control | Funcion |
|---|---|
| Slider (-10a / +10a) | Salta a cualquier fecha arrastrando |
| Presets -10a -1a -1m -1s -1d | Saltos rapidos hacia atras/adelante |
| Play / Pause | Reproduce el tiempo hacia adelante |
| VEL: 1h/s 1d/s 1s/s 1m/s | Velocidad de reproduccion |
| AHORA | Vuelve al tiempo real |

La pildora del boton se vuelve ambar cuando hay un offset activo.

---

## Navegacion de camara

Al hacer clic en cualquier objeto en la **Guia**, `CameraNavigator` (componente
interno de `SkyCanvas`) calcula la posicion mundial del objeto aplicando la misma
rotacion ecuatorial que `CelestialGroup`, y mueve suavemente la camara para apuntarle
mediante lerp con ease-out. Cuando llega al destino, OrbitControls recupera el control.

Funciona para estrellas, DSOs, planetas, Luna y centroides de constelaciones.

---

## Guia interactiva ampliada

La Guia tiene 7 filtros y muestra todos los objetos con indicador de visibilidad en tiempo real:

| Filtro | Contenido |
|---|---|
| TODOS | Todos los objetos visibles segun la busqueda |
| ESTRELLAS | 290+ estrellas ordenadas por magnitud |
| PLANETAS | 8 cuerpos: Luna + 7 planetas con efemerides reales |
| GALAXIAS | DSOs tipo galaxia |
| NEBULOSAS | DSOs tipo nebulosa |
| CUMULOS | DSOs tipo cumulo |
| CONSTEL. | 30+ constelaciones con centroide calculado |

Clic en cualquier entrada -> la camara vuela hacia el objeto y aparece el crosshair de objetivo.

---

## Puntero de objetivo

Al seleccionar un objeto, el store actualiza `targetedObject`. `TargetPointer` renderiza:

- 3 anillos pulsantes animados (desfasados 120 deg en fase)
- Crosshair de 4 lineas a 0/90/180/270 deg
- Etiqueta HTML flotante con el nombre del objeto

El color del crosshair varia segun el tipo de objeto:

| Tipo | Color |
|---|---|
| Estrella | Azul (#60a5fa) |
| Galaxia | Ambar (#f59e0b) |
| Nebulosa | Verde (#34d399) |
| Planeta / Luna | Color propio del planeta |
| Constelacion | Indigo (#818cf8) |

Clic de nuevo en el mismo objeto lo deselecciona.

---

## Luna con fases realistas

`Planets.tsx` incluye un componente `MoonMesh` separado que:

- Calcula la posicion con `Astronomy.Equator(Body.Moon, ...)` y la fase con `Astronomy.MoonPhase()`
- Genera una textura `THREE.CanvasTexture` dibujando geometricamente el lado iluminado:
  - Mitad iluminada como semicirculo
  - Terminador como elipse cuya anchura depende del coseno de la fase
  - Degradado radial de oscurecimiento limbico
- La fase se redondea a 3 grados para evitar regenerar la textura cada frame
- El billboard se orienta hacia la camara cada frame (`quaternion.copy(camera.quaternion)`)
- La Guia muestra el nombre de la fase y el porcentaje de iluminacion en tiempo real

| Fase (grados) | Nombre |
|---|---|
| 0 | Luna nueva |
| 45 | Creciente concava |
| 90 | Cuarto creciente |
| 135 | Gibosa creciente |
| 180 | Luna llena |
| 225 | Gibosa menguante |
| 270 | Cuarto menguante |
| 315 | Creciente menguante |

---

## Etiquetas de constelaciones

`ConstellationLabels` calcula el centroide de cada constelacion promediando vectores
3D unitarios (evita el problema del wraparound en RA 0/360 deg) y renderiza etiquetas
HTML sutiles en la boveda. Se activan/desactivan con el toggle **CONSTEL.** del panel lateral.

---

## Diseno responsive y PWA

### Responsive

- **Movil**: sidebar se convierte en overlay deslizante desde la derecha; backdrop semitransparente; boton FAB para reabrir cuando esta cerrado
- **Escritorio**: sidebar colapsable a tira de 52px con iconos de tabs; animacion spring con Framer Motion
- **Header**: se compacta en pantallas pequenas (subtitulo y fecha ocultos)

### PWA

- `app/manifest.ts` genera `/manifest.webmanifest` con nombre, colores y declaracion de iconos
- `app/icon.tsx` y `app/apple-icon.tsx` generan los PNG automaticamente via Next.js `ImageResponse`
- Viewport configurado para movil (`user-scalable: no`)
- Metadatos `apple-mobile-web-app-capable` para instalacion en iOS
- En Chrome/Edge/Safari aparece el prompt de instalacion al visitar la URL

---

## Autor

**Salvador Munoz Portillo**
Email: <salvador.munoz@masvoip.com>
GitHub: <https://github.com/salva1962-ai>

---

## Licencia

Uso privado. Todos los derechos reservados.
