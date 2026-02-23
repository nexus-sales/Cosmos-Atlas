# 🌌 Cosmos Atlas

Planetario interactivo en tiempo real renderizado en 3D en el navegador. Muestra una bóveda celeste precisa a tu posición geográfica y hora actual, con estrellas, constelaciones, planetas, objetos de cielo profundo y la Vía Láctea.

---

## ✨ Características

- **Bóveda celeste 3D** — Esfera celestial completa renderizada con React Three Fiber
- **Posición en tiempo real** — Obtiene la geolocalización del usuario y calcula el cielo exacto para ese lugar y momento
- **290+ estrellas nombradas** — Catálogo con coordenadas J2000, magnitud, color espectral y descripción
- **30+ constelaciones** — Líneas de constelación trazadas sobre la esfera celeste
- **42 objetos de cielo profundo (DSOs)** — Galaxias, nebulosas y cúmulos con datos reales
- **Planetas del Sistema Solar** — Posiciones calculadas con `astronomy-engine` (efemérides reales)
- **Vía Láctea** — Renderizada con shader GLSL basado en coordenadas galácticas reales
- **Guía interactiva** — Panel de búsqueda y filtrado con puntero celestial animado
- **Puntero de objetivo** — Al seleccionar un objeto en la guía, aparece un crosshair animado apuntando a él en la bóveda
- **Efectos visuales** — Partículas cósmicas, meteoros, atmósfera de horizonte

---

## 🛠 Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework principal (App Router) |
| React | 19.2.3 | UI |
| TypeScript | — | Tipado estático |
| React Three Fiber | ^9.5.0 | Renderizado 3D en canvas |
| Three.js | ^0.183.1 | Motor 3D |
| @react-three/drei | ^10.7.7 | Helpers 3D (Html, etc.) |
| astronomy-engine | ^2.1.19 | Efemérides planetarias reales |
| Zustand | ^5.0.11 | Estado global |
| Tailwind CSS | ^4 | Estilos |
| Framer Motion | ^12 | Animaciones UI |
| shadcn/ui | — | Componentes base |
| lucide-react | ^0.575 | Iconos |

---

## 🚀 Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

```bash
# Build de producción
npm run build
npm start
```

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Página principal
│
├── components/
│   ├── effects/
│   │   ├── CosmicParticles.tsx   # Partículas de fondo
│   │   └── Meteors.tsx           # Efecto de meteoros
│   │
│   ├── panels/
│   │   ├── Header.tsx            # Barra superior (hora, ubicación, ajustes)
│   │   ├── SidePanel.tsx         # Panel lateral (tabs)
│   │   ├── GuideTab.tsx          # Guía interactiva de objetos celestes
│   │   ├── ObjectInfoTab.tsx     # Detalle del objeto seleccionado
│   │   └── ChallengeTab.tsx      # Retos de observación
│   │
│   └── sky-map/
│       ├── SkyCanvas.tsx         # Canvas 3D principal (orquestador)
│       ├── CelestialSphere.tsx   # Esfera base
│       ├── CelestialGrid.tsx     # Cuadrícula ecuatorial
│       ├── Stars.tsx             # Renderizado de estrellas
│       ├── Constellations.tsx    # Líneas de constelaciones
│       ├── Planets.tsx           # Planetas (posiciones reales)
│       ├── DeepSkyObjects.tsx    # Galaxias, nebulosas, cúmulos
│       ├── MilkyWay.tsx          # Shader GLSL de la Vía Láctea
│       ├── BackgroundStars.tsx   # Estrellas de fondo (campo aleatorio)
│       ├── Horizon.tsx           # Atmósfera y horizonte
│       └── TargetPointer.tsx     # Crosshair animado sobre el objeto objetivo
│
├── data/
│   ├── stars.ts           # Catálogo de 290+ estrellas nombradas
│   ├── constellations.ts  # Definición de líneas de 30+ constelaciones
│   └── dsos.ts            # 42 objetos de cielo profundo
│
├── hooks/
│   ├── useGeolocation.ts           # Geolocalización del navegador
│   └── useCelestialVisibility.ts   # Visibilidad de objetos según ubicación/hora
│
├── lib/
│   ├── utils.ts           # cn() y utilidades
│   └── astronomy/
│       ├── time.ts        # LST, Julian Date, conversiones de tiempo
│       └── transforms.ts  # equatorialTo3D(), coordenadas ecuatoriales → XYZ
│
├── stores/
│   └── useAppStore.ts     # Estado global Zustand
│
└── types/
    └── celestial.ts       # Tipos: Star, DSO, Planet, Observer, etc.
```

---

## 🌠 Catálogo de datos

### Estrellas (`stars.ts`)
290+ estrellas con nombre propio ordenadas por magnitud. Cada estrella incluye:
- Coordenadas J2000 (RA en grados, Dec en grados)
- Magnitud aparente, color espectral, radio de renderizado
- Constelación y descripción

### Constelaciones (`constellations.ts`)
30+ constelaciones definidas como secuencias de pares de estrellas (líneas).  
Incluye: Orión, Casiopea, Osa Mayor, Osa Menor, Cygnus, Lyra, Aquila, Serpens, Hércules, Perseo, Auriga, Géminis, Cepheus, Corvus, Crux, Centaurus y más.

### Objetos de cielo profundo (`dsos.ts`)
42 objetos clasificados en 3 tipos:

| Tipo | Ejemplos |
|---|---|
| **Galaxias** | M31 Andrómeda, M33 Triángulo, M81 Bode, M82 Cigarro, M87 Virgo A, LMC, SMC, Centaurus A... |
| **Nebulosas** | M42 Orión, M57 Anillo, M1 Cangrejo, M27 Dumbbell, NGC 7293 Hélice, NGC 7000 América del Norte, Eta Carinae... |
| **Cúmulos** | M45 Pléyades, M44 Pesebre, M13 Hércules, M3, M4, M5, M11, NGC 869 Doble de Perseo... |

---

## ⚙️ Sistema de coordenadas

La bóveda celeste usa un sistema de referencia ecuatorial transformado a 3D:

```
equatorialTo3D(ra_deg, dec_deg, radius) → [x, y, z]
```

El componente `CelestialGroup` aplica cada frame la rotación:
- `rotation.x = 90° - latitud`  
- `rotation.y = -LST` (tiempo sidéreo local)

Esto mantiene todos los objetos celestes alineados correctamente con el horizonte local del observador en tiempo real.

---

## 🎯 Puntero de objetivo

Al hacer clic en cualquier objeto en la **Guía**, el store global actualiza `targetedObject`. El componente `TargetPointer` lee este estado, calcula la posición 3D del objeto y renderiza:
- 3 anillos pulsantes animados (desfasados 120° en fase)
- Crosshair de 4 líneas a 0°/90°/180°/270°
- Etiqueta HTML flotante con el nombre del objeto

Clic de nuevo en el mismo objeto lo deselecciona.

---

## 📜 Licencia

Uso privado. Todos los derechos reservados.
