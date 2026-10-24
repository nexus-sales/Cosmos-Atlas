import * as THREE from 'three';
import type { HorizonPoint } from '@/lib/astronomy/horizonProfile';

// Shared refs between Canvas internals and outside-Canvas components.
// Updated every frame by CameraSync inside SkyCanvas.
export const cameraHeadingRef = { value: 0 };
export const cameraRef: { current: THREE.Camera | null } = { current: null };

// Posición horizontal del Sol — actualizada 1x/seg por SunLight en SkyCanvas.
// Compartido con CelestialSphere, Planets, Horizon y cualquier futuro consumidor.
export const sunHorRef = { alt: -90, az: 0 };

// Posición horizontal e iluminación de la Luna, actualizada por AtmosphericSky.
export const moonHorRef = { alt: -90, az: 0, illuminatedFraction: 0 };

// Perfil DEM compartido por la máscara visual y el culling de objetos.
export const terrainHorizonRef: { current: HorizonPoint[] } = { current: [] };
