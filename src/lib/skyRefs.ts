import * as THREE from 'three';

// Shared refs between Canvas internals and outside-Canvas components.
// Updated every frame by CameraSync inside SkyCanvas.
export const cameraHeadingRef = { value: 0 };
export const cameraRef: { current: THREE.Camera | null } = { current: null };
