import * as THREE from 'three';
import type { DSO, Planet, Star } from '@/types/celestial';

export const SKY_FOV_MIN = 1.5;
export const SKY_FOV_MAX = 90;

export function clampSkyFov(fov: number): number {
    return Math.min(SKY_FOV_MAX, Math.max(SKY_FOV_MIN, fov));
}

export function wheelZoomFov(fov: number, delta: number, mode = 0): number {
    const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 800 : 1);
    return clampSkyFov(fov * Math.exp(Math.max(-0.25, Math.min(0.25, pixels * 0.002))));
}

export function targetSkyFov(target: Star | DSO | Planet): number {
    if ('symbol' in target && target.symbol === '\u2726') {
        return clampSkyFov('angularSize' in target && typeof target.angularSize === 'number' ? target.angularSize : 45);
    }
    if ('sizeArcmin' in target && typeof target.sizeArcmin === 'number' && target.sizeArcmin > 0) {
        return clampSkyFov(Math.min(30, 4 * target.sizeArcmin / 60));
    }
    return 'type' in target || target.kind === 'planet' ? 22 : 36;
}

export function lodForFov(fov: number, quality: 'high' | 'medium' | 'low') {
    const cap = quality === 'low' ? 700 : quality === 'medium' ? 1400 : 6000;
    if (fov >= 18) return null;
    if (fov >= 8) return { mag: 10.5, limit: Math.min(cap, 650), radius: Math.min(8, fov * 0.58), level: 1 };
    if (fov >= 3) return { mag: 13, limit: Math.min(cap, 1400), radius: Math.max(0.8, fov * 0.62), level: 2 };
    return { mag: 17, limit: cap, radius: Math.max(0.3, fov * 0.68), level: 3 };
}

/** Keep a celestial point under the gesture, including the camera's roll. */
export function zoomCameraAt(camera: THREE.PerspectiveCamera, fov: number, anchorNdc: THREE.Vector2, destinationNdc = anchorNdc): void {
    camera.updateMatrixWorld();
    const directionAt = (ndc: THREE.Vector2) => new THREE.Vector3(ndc.x, ndc.y, 0.5)
        .unproject(camera).sub(camera.position).normalize();
    const ray = new THREE.Ray(camera.position.clone(), directionAt(anchorNdc));
    const anchor = ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 94), new THREE.Vector3())!;
    camera.fov = clampSkyFov(fov);
    camera.updateProjectionMatrix();
    const rotation = new THREE.Quaternion();
    // The second pass corrects the small displacement of the camera inside the dome.
    for (let pass = 0; pass < 2; pass++) {
        const desired = anchor.clone().sub(camera.position).normalize();
        rotation.setFromUnitVectors(directionAt(destinationNdc), desired);
        camera.position.applyQuaternion(rotation);
        camera.up.applyQuaternion(rotation).normalize();
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
    }
}

export function orbitRotationSpeed(fov: number): number {
    return -0.4 * Math.tan(THREE.MathUtils.degToRad(clampSkyFov(fov) / 2)) / Math.tan(Math.PI / 6);
}
