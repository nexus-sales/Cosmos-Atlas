# Code Audit Report: Cosmos Atlas

## 1. Stars (`src/components/sky-map/Stars.tsx`)
- **Status:** **Implemented**
- **Details:** 
  - Custom shaders are present (`starVertexShader`, `starFragmentShader`).
  - Diffraction spikes and "Diamond" effect are explicitly implemented in the fragment shader section labeled `// --- EFECTO ESTRELLA DIAMANTE (Star Walk 2 Style) ---`. It generates a core, halo, and diffraction spikes based on star brightness.

## 2. Constellations (`src/components/sky-map/Constellations.tsx`)
- **Status:** **Partially Implemented**
- **Details:**
  - **Implemented:** Glow effects on selection are present. The code renders a secondary wider line with lower opacity (`lineWidth * 6`) for the focused constellation.
  - **Missing:** Mythological art overlays are not implemented. The component only renders `Line` segments from `@react-three/drei` and does not include any image loading or texture mapping for constellation art.

## 3. Milky Way (`src/components/sky-map/MilkyWay.tsx`)
- **Status:** **Implemented**
- **Details:**
  - The component uses advanced volumetric/noise shaders.
  - It includes Simplex Noise (`snoise`) and Fractal Brownian Motion (`fbm`) in the fragment shader to generate dust lanes and structural details.
  - It also includes a particle system (`MilkyWayParticles`) with ~22,000 points arranged in spiral arms with specific color gradients for H-Alpha regions and dust.

## 4. Planets & Cinematic Flight (`src/components/sky-map/Planets.tsx`, `src/stores/useAppStore.ts`)
- **Status:** **Partially Implemented**
- **Details:**
  - **Implemented:** The visual transition (cross-fade) between a billboard sprite and a 3D model based on camera FOV is implemented in `PlanetMesh` (e.g., `spriteOpacity` calculation).
  - **Missing:** The actual "Cinematic Flight" (camera animation/tweening) logic is **not** found in these files. While `useAppStore` handles the `selectedObject` state, the code that physically moves or zooms the camera to the target is missing from the inspected files (it likely resides in a camera controller component not listed here).

## 5. Astronomy Engine (`src/lib/astronomy/`)
- **Status:** **Implemented**
- **Details:**
  - The project is using `astronomy-engine` (imported as `* as Astronomy` in `Planets.tsx` and `AIAstronoma.tsx`).
  - This library calculates high-precision positions (vsop87-like accuracy) for planets and moons, as seen in `computePlanetPosition` and `computeMoon`.

## 6. Atmospheric Sky (`src/components/sky-map/AtmosphericSky.tsx`)
- **Status:** **Implemented**
- **Details:**
  - Rayleigh and Mie scattering are implemented in the `SKY_FRAGMENT_SHADER`.
  - It includes logic for dynamic horizon gradients (`horizonGlow`) and sunset colors based on sun altitude (`sunAltitude`).
  - It also features a "Space Mode" suppression uniform (`uSuppression`) to fade out the atmosphere when zooming in/out.

## 7. Adaptive Soundscape (`src/components/audio/AdaptiveSoundscape.tsx`)
- **Status:** **Partially Implemented**
- **Details:**
  - **Implemented:** The audio changes based on the `targetedObject` (specifically for the Sun) by modulating a low-pass filter and gain on a noise node.
  - **Partially Implemented:** While there is code to detect "Horizon/Wind" based on look direction (`lookDir.y`), the comment `// de momento el master Space reacciona sutilmente` suggests this is a basic implementation. The "Adaptive" aspect is limited to Sun proximity and horizon look-angle.

## 8. AI Astronomer (`src/components/panels/AIAstronoma.tsx`)
- **Status:** **Implemented**
- **Details:**
  - Narration capabilities are implemented using the browser's `SpeechSynthesis` API (`window.speechSynthesis`).
  - Content is present: It has a list of `TOUR_STOPS` with intro text and `MYTH_DATA` for specific objects like Sirius and Betelgeuse.
  - It includes logic for a "Smart Suggestion" tour finding visible objects based on altitude.

## 9. Device Orientation (`src/hooks/useDeviceOrientation.ts`)
- **Status:** **Missing / Basic**
- **Details:**
  - **Missing:** There are **no Kalman filters or sensor fusion algorithms** implemented.
  - The implementation is a raw listener for `deviceorientation` events (`deviceOrientationRef.alpha = e.alpha`). It does not smooth or fuse data with accelerometers/magnetometers to reduce drift, which is standard for "advanced sensor fusion".
