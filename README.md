# Cosmos Atlas

Planetario interactivo en tiempo real renderizado en 3D en el navegador.
Muestra una boveda celeste precisa a tu posicion geografica y hora actual,
con estrellas, constelaciones, planetas, objetos de cielo profundo y la Via Lactea.

---

## Caracteristicas

- **Boveda celeste 3D** - Esfera celestial completa renderizada con React Three Fiber
- **Posicion en tiempo real** - Obtiene la geolocalizacion del usuario y calcula el cielo exacto para ese lugar y momento
- **290+ estrellas nombradas** - Catalogo con coordenadas J2000, magnitud, color espectral y descripcion
- **30+ constelaciones** - Lineas de constelacion trazadas sobre la esfera celeste con etiquetas de nombre en la boveda
- **42 objetos de cielo profundo (DSOs)** - Galaxias, nebulosas y cumulos con datos reales
- **Planetas del Sistema Solar** - Posiciones calculadas con `astronomy-engine` (efemerides reales)
- **Luna con fases realistas** - Disco lunar con textura generada en canvas mostrando la iluminacion exacta segun la fase real; nombre de fase en etiqueta flotante
- **Via Lactea** - Renderizada con shader GLSL basado en coordenadas galacticas reales
- **Viaje temporal** - Slider flotante para explorar el cielo en cualquier fecha (+-10 anos), con reproduccion animada a velocidad variable y regreso instantaneo al tiempo real
- **Navegacion de camara** - Al seleccionar un objeto en la Guia, la camara vuela suavemente hacia el
- **Ecliptica** - Linea del camino aparente del Sol (oblicuidad 23.44 deg), activable como capa
- **Puntos cardinales** - N, NE, E, SE, S, SO, O, NO marcados en el horizonte
- **Horizonte fisico** - Disco opaco que oculta estrellas bajo el suelo; franja de niebla y linea de horizonte
- **Guia interactiva** - Panel de busqueda y filtrado con indicador verde/gris de visibilidad en tiempo real
- **Puntero de objetivo** - Crosshair animado (3 anillos pulsantes + cruz) sobre el objeto seleccionado
- **Estrellas variables** - Algol, Mira y Betelgeuse animadas con sus periodos y amplitudes reales
- **Bloom y postprocesado** - Efecto bloom selectivo, vineta y ruido de grano
- **Efectos visuales** - Particulas cosmicas, meteoros, atmosfera de horizonte

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
| astronomy-engine | ^2.1.19 | Efemerides planetarias reales |
| Zustand | ^5.0.11 | Estado global |
| Tailwind CSS | ^4 | Estilos |
| Framer Motion | ^12 | Animaciones UI |
| shadcn/ui | - | Componentes base |
| lucide-react | ^0.575 | Iconos |

---

## Inicio rapido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

```bash
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
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Pagina principal + tick de tiempo real
│
├── components/
│   ├── effects/
│   │   ├── CosmicParticles.tsx  # Particulas de fondo
│   │   └── Meteors.tsx          # Efecto de meteoros
│   │
│   ├── panels/
│   │   ├── Header.tsx           # Barra superior (hora, ubicacion)
│   │   ├── SidePanel.tsx        # Panel lateral con tabs y controles de capas
│   │   ├── GuideTab.tsx         # Guia interactiva de objetos celestes
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
│       ├── Planets.tsx          # Planetas (posiciones reales)
│       ├── DeepSkyObjects.tsx   # Galaxias, nebulosas, cumulos
│       ├── MilkyWay.tsx         # Shader GLSL de la Via Lactea
│       ├── BackgroundStars.tsx  # Estrellas de fondo (campo aleatorio)
│       ├── Ecliptic.tsx         # Linea de la eclitica
│       ├── Horizon.tsx          # Atmosfera, horizonte y puntos cardinales
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
│       └── transforms.ts        # equatorialTo3D(), equToHor()
│
├── stores/
│   └── useAppStore.ts           # Estado global Zustand (time, isLive, observer, settings...)
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

```
equatorialTo3D(ra_deg, dec_deg, radius) -> [x, y, z]
```

`CelestialGroup` aplica cada frame la rotacion:

- `rotation.x = 90 - lat`  (inclina el polo norte celeste)
- `rotation.y = -LST`       (tiempo sidereo local)

Esto mantiene todos los objetos alineados con el horizonte local del observador en tiempo real.

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

---

## Puntero de objetivo

Al seleccionar un objeto, el store actualiza `targetedObject`. `TargetPointer` renderiza:

- 3 anillos pulsantes animados (desfasados 120 deg en fase)
- Crosshair de 4 lineas a 0/90/180/270 deg
- Etiqueta HTML flotante con el nombre del objeto

Clic de nuevo en el mismo objeto lo deselecciona.

---

## Etiquetas de constelaciones

`ConstellationLabels` calcula el centroide de cada constelacion promediando vectores
3D unitarios (evita el problema del wraparound en RA 0/360 deg) y renderiza etiquetas
HTML sutiles en la boveda. Se activan/desactivan con el toggle **CONSTEL.** del panel lateral.

---

## Luna con fases realistas

`Planets.tsx` incluye un componente `MoonMesh` separado que:

- Calcula la posicion de la Luna con `Astronomy.Equator(Body.Moon, ...)` y la fase con `Astronomy.MoonPhase()`
- Genera una textura `THREE.CanvasTexture` (`createMoonTexture(phase)`) dibujando geometricamente el lado iluminado:
  - Mitad iluminada como semicirculo
  - Terminador como elipse cuya anchura depende del coseno de la fase (creciente vs gibosa)
  - Degradado radial de oscurecimiento limbico
- La fase se redondea a 3 grados para evitar regenerar la textura cada frame
- El billboard se orienta hacia la camara cada frame (`quaternion.copy(camera.quaternion)`)
- La etiqueta flotante muestra el nombre de la fase en castellano (Luna nueva, Cuarto creciente, Luna llena, etc.) y el porcentaje de iluminacion

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

## Autor

**Salvador Muñoz Portillo**  
📧 [salvador.munoz@masvoip.com](mailto:salvador.munoz@masvoip.com)  
🐙 [github.com/salva1962-ai](https://github.com/salva1962-ai)

---

## Licencia

Uso privado. Todos los derechos reservados.
