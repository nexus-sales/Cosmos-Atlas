# ðŸŒŒ Cosmos Atlas

Planetario interactivo en tiempo real renderizado en 3D en el navegador. Muestra una bÃ³veda celeste precisa a tu posiciÃ³n geogrÃ¡fica y hora actual, con estrellas, constelaciones, planetas, objetos de cielo profundo y la VÃ­a LÃ¡ctea.

---

## âœ¨ CaracterÃ­sticas

- **BÃ³veda celeste 3D** â€” Esfera celestial completa renderizada con React Three Fiber
- **PosiciÃ³n en tiempo real** â€” Obtiene la geolocalizaciÃ³n del usuario y calcula el cielo exacto para ese lugar y momento
- **290+ estrellas nombradas** â€” CatÃ¡logo con coordenadas J2000, magnitud, color espectral y descripciÃ³n
- **30+ constelaciones** â€” LÃ­neas de constelaciÃ³n trazadas sobre la esfera celeste
- **42 objetos de cielo profundo (DSOs)** â€” Galaxias, nebulosas y cÃºmulos con datos reales
- **Planetas del Sistema Solar** â€” Posiciones calculadas con `astronomy-engine` (efemÃ©rides reales)
- **VÃ­a LÃ¡ctea** â€” Renderizada con shader GLSL basado en coordenadas galÃ¡cticas reales
- **Viaje temporal** â€” Slider flotante para explorar el cielo en cualquier fecha (Â±10 aÃ±os), con reproducciÃ³n animada a velocidad variable y regreso instantÃ¡neo al tiempo real
- **EclÃ­ptica** â€” LÃ­nea del camino aparente del Sol (oblicuidad 23.44Â°), activable como capa
- **Puntos cardinales** â€” N, NE, E, SE, S, SO, O, NO marcados en el horizonte con color
- **Horizonte fÃ­sico** â€” Disco opaco que oculta estrellas bajo el suelo; franja de niebla y lÃ­nea de horizonte
- **GuÃ­a interactiva** â€” Panel de bÃºsqueda y filtrado; cada objeto muestra un indicador verde/gris de visibilidad en tiempo real calculado por `equToHor()`
- **Puntero de objetivo** â€” Al seleccionar un objeto en la guÃ­a, aparece un crosshair animado apuntando a Ã©l en la bÃ³veda
- **Estrellas variables** â€” Algol, Mira y Betelgeuse animadas con sus perÃ­odos y amplitudes reales; responden al viaje temporal
- **Viaje temporal** â€” Slider flotante para explorar el cielo en cualquier fecha (Â±10 aÃ±os), con reproducciÃ³n animada y regreso al tiempo real
- **Bloom y postprocesado** â€” Efecto bloom selectivo en objetos brillantes, viÃ±eta y ruido de grano
- **Efectos visuales** â€” PartÃ­culas cÃ³smicas, meteoros, atmÃ³sfera de horizonte

---

## ðŸ›  TecnologÃ­as

| TecnologÃ­a | VersiÃ³n | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework principal (App Router) |
| React | 19.2.3 | UI |
| TypeScript | â€” | Tipado estÃ¡tico |
| React Three Fiber | ^9.5.0 | Renderizado 3D en canvas |
| Three.js | ^0.183.1 | Motor 3D |
| @react-three/drei | ^10.7.7 | Helpers 3D (Html, etc.) |
| astronomy-engine | ^2.1.19 | EfemÃ©rides planetarias reales |
| Zustand | ^5.0.11 | Estado global |
| Tailwind CSS | ^4 | Estilos |
| Framer Motion | ^12 | Animaciones UI |
| shadcn/ui | â€” | Componentes base |
| lucide-react | ^0.575 | Iconos |

---

## ðŸš€ Inicio rÃ¡pido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

```bash
# Build de producciÃ³n
npm run build
npm start
```

---

## ðŸ“ Estructura del proyecto

```text
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ globals.css        # Estilos globales
â”‚   â”œâ”€â”€ layout.tsx         # Layout raÃ­z
â”‚   â””â”€â”€ page.tsx           # PÃ¡gina principal
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ effects/
â”‚   â”‚   â”œâ”€â”€ CosmicParticles.tsx   # PartÃ­culas de fondo
â”‚   â”‚   â””â”€â”€ Meteors.tsx           # Efecto de meteoros
â”‚   â”‚
â”‚   â”œâ”€â”€ panels/
â”‚   â”‚   â”œâ”€â”€ Header.tsx            # Barra superior (hora, ubicaciÃ³n, ajustes)
â”‚   â”‚   â”œâ”€â”€ SidePanel.tsx         # Panel lateral (tabs)
â”‚   â”‚   â”œâ”€â”€ GuideTab.tsx          # GuÃ­a interactiva de objetos celestes
â”‚   â”‚   â”œâ”€â”€ ObjectInfoTab.tsx     # Detalle del objeto seleccionado
â”‚   â”‚   â”œâ”€â”€ ChallengeTab.tsx      # Retos de observaciÃ³n
â”‚   â”‚   â””â”€â”€ TimeTravelControls.tsx # Slider de viaje temporal
â”‚   â”‚
â”‚   â””â”€â”€ sky-map/
â”‚       â”œâ”€â”€ SkyCanvas.tsx         # Canvas 3D principal (orquestador)
â”‚       â”œâ”€â”€ CelestialSphere.tsx   # Esfera base
â”‚       â”œâ”€â”€ CelestialGrid.tsx     # CuadrÃ­cula ecuatorial
â”‚       â”œâ”€â”€ Stars.tsx             # Renderizado de estrellas
â”‚       â”œâ”€â”€ Constellations.tsx    # LÃ­neas de constelaciones
â”‚       â”œâ”€â”€ Planets.tsx           # Planetas (posiciones reales)
â”‚       â”œâ”€â”€ DeepSkyObjects.tsx    # Galaxias, nebulosas, cÃºmulos
â”‚       â”œâ”€â”€ MilkyWay.tsx          # Shader GLSL de la VÃ­a LÃ¡ctea
â”‚       â”œâ”€â”€ BackgroundStars.tsx   # Estrellas de fondo (campo aleatorio)
        â”œâ”€â”€ Ecliptic.tsx          # LÃ­nea de la eclÃ­ptica (coordenadas ecuatoriales)
        â”œâ”€â”€ Horizon.tsx           # AtmÃ³sfera, horizonte y puntos cardinales
â”‚       â””â”€â”€ TargetPointer.tsx     # Crosshair animado sobre el objeto objetivo
â”‚
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ stars.ts           # CatÃ¡logo de 290+ estrellas nombradas
â”‚   â”œâ”€â”€ constellations.ts  # DefiniciÃ³n de lÃ­neas de 30+ constelaciones
â”‚   â””â”€â”€ dsos.ts            # 42 objetos de cielo profundo
â”‚
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useGeolocation.ts           # GeolocalizaciÃ³n del navegador
â”‚   â””â”€â”€ useCelestialVisibility.ts   # Visibilidad de objetos segÃºn ubicaciÃ³n/hora
â”‚
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ utils.ts           # cn() y utilidades
â”‚   â””â”€â”€ astronomy/
â”‚       â”œâ”€â”€ time.ts        # LST, Julian Date, conversiones de tiempo
â”‚       â””â”€â”€ transforms.ts  # equatorialTo3D(), coordenadas ecuatoriales â†’ XYZ
â”‚
â”œâ”€â”€ stores/
â”‚   â””â”€â”€ useAppStore.ts     # Estado global Zustand
â”‚
â””â”€â”€ types/
    â””â”€â”€ celestial.ts       # Tipos: Star, DSO, Planet, Observer, etc.
```

---

## ðŸŒ  CatÃ¡logo de datos

### Estrellas (`stars.ts`)

290+ estrellas con nombre propio ordenadas por magnitud. Cada estrella incluye:

- Coordenadas J2000 (RA en grados, Dec en grados)
- Magnitud aparente, color espectral, radio de renderizado
- ConstelaciÃ³n y descripciÃ³n

### Constelaciones (`constellations.ts`)

30+ constelaciones definidas como secuencias de pares de estrellas (lÃ­neas).
Incluye: OriÃ³n, Casiopea, Osa Mayor, Osa Menor, Cygnus, Lyra, Aquila, Serpens, HÃ©rcules, Perseo, Auriga, GÃ©minis, Cepheus, Corvus, Crux, Centaurus y mÃ¡s.

### Objetos de cielo profundo (`dsos.ts`)

42 objetos clasificados en 3 tipos:

| Tipo | Ejemplos |
|---|---|
| **Galaxias** | M31 AndrÃ³meda, M33 TriÃ¡ngulo, M81 Bode, M82 Cigarro, M87 Virgo A, LMC, SMC, Centaurus A... |
| **Nebulosas** | M42 OriÃ³n, M57 Anillo, M1 Cangrejo, M27 Dumbbell, NGC 7293 HÃ©lice, NGC 7000 AmÃ©rica del Norte, Eta Carinae... |
| **CÃºmulos** | M45 PlÃ©yades, M44 Pesebre, M13 HÃ©rcules, M3, M4, M5, M11, NGC 869 Doble de Perseo... |

---

## âš™ï¸ Sistema de coordenadas

La bÃ³veda celeste usa un sistema de referencia ecuatorial transformado a 3D:

```text
equatorialTo3D(ra_deg, dec_deg, radius) â†’ [x, y, z]
```

El componente `CelestialGroup` aplica cada frame la rotaciÃ³n:

- `rotation.x = 90Â° - latitud`
- `rotation.y = -LST` (tiempo sidÃ©reo local)

Esto mantiene todos los objetos celestes alineados correctamente con el horizonte local del observador en tiempo real.

---

## â±ï¸ Viaje temporal

El control `TimeTravelControls` flota en la parte inferior central del canvas. Al activarlo, el tick de tiempo real se pausa y se toma el instante actual como referencia:

| Control | FunciÃ³n |
|---|---|
| Slider (âˆ’10a / +10a) | Salta a cualquier fecha arrastrando |
| Presets `âˆ’10a âˆ’1a âˆ’1m âˆ’1s âˆ’1d` | Saltos rÃ¡pidos hacia atrÃ¡s/adelante |
| â–¶ / â¸ | Reproduce el tiempo hacia adelante |
| `VEL: 1h/s 1d/s 1s/s 1m/s` | Velocidad de reproducciÃ³n |
| `AHORA` | Vuelve al tiempo real |

La pÃ­ldora del botÃ³n se vuelve Ã¡mbar cuando hay un offset activo y muestra el desfase en formato legible (`+3.2a`, `âˆ’45d`, `+12h`â€¦).

---

## ðŸŽ¯ Puntero de objetivo

Al hacer clic en cualquier objeto en la **GuÃ­a**, el store global actualiza `targetedObject`. El componente `TargetPointer` lee este estado, calcula la posiciÃ³n 3D del objeto y renderiza:

- 3 anillos pulsantes animados (desfasados 120Â° en fase)
- Crosshair de 4 lÃ­neas a 0Â°/90Â°/180Â°/270Â°
- Etiqueta HTML flotante con el nombre del objeto

Clic de nuevo en el mismo objeto lo deselecciona.

---

## ï¿½ Visibilidad en la GuÃ­a

Cada estrella y DSO en el panel **GuÃ­a** calcula su altitud en tiempo real mediante `equToHor(ra, dec, lat, lon, time)` y muestra un indicador:

- ðŸŸ¢ Verde brillante â€” objeto sobre el horizonte (con tooltip de altitud exacta)
- âš« Gris â€” objeto bajo el horizonte

El indicador se actualiza automÃ¡ticamente al mover el slider de tiempo o cambiar la ubicaciÃ³n.

---

## â­ Estrellas variables

Tres estrellas del catÃ¡logo tienen variabilidad animada con parÃ¡metros reales:

| Estrella | Tipo | PerÃ­odo | Amplitud | Rango mag |
|---|---|---|---|---|
| **Algol** (Î² Per) | Binaria eclipsante | 2.87 dÃ­as | 48 % | 2.1 â€“ 3.4 |
| **Mira** (Î¿ Cet) | Variable de largo perÃ­odo | 332 dÃ­as | 82 % | 2.0 â€“ 10.1 |
| **Betelgeuse** (Î± Ori) | Semirregular | ~420 dÃ­as | 22 % | 0.0 â€“ 1.3 |

El shader usa el atributo `uTimeSec` alimentado desde el store; al activar el **Viaje Temporal** y reproducir a alta velocidad las estrellas pulsan visiblemente segÃºn su perÃ­odo real.

---

## ðŸŒ… EclÃ­ptica

El componente `Ecliptic.tsx` traza el camino aparente del Sol en la esfera celeste. Se calcula convirtiendo longitud eclÃ­ptica Î» a coordenadas ecuatoriales con la oblicuidad actual (23.44Â°):

```
RA = atan2(sin(Î»)Â·cos(Îµ), cos(Î»))   Dec = asin(sin(Îµ)Â·sin(Î»))
```

Activable desde el panel de **Capas** (botÃ³n ECLÃPTICA). Referencia visual fundamental para entender por quÃ© los planetas siempre aparecen cerca de esta lÃ­nea.

---

## 📜 Licencia

Uso privado. Todos los derechos reservados.
