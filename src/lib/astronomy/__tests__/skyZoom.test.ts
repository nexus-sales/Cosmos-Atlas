import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { describe, expect, it } from 'vitest';
import { SKY_FOV_MIN, clampSkyFov, lodForFov, targetSkyFov, wheelZoomFov, zoomCameraAt, orbitRotationSpeed } from '../skyZoom';
import { DSOS } from '@/data/dsos';

describe('deep sky zoom', () => {
    it('reaches the deepest Gaia level with every quality tier', () => {
        for (const quality of ['low', 'medium', 'high'] as const) {
            expect(lodForFov(SKY_FOV_MIN, quality)?.level).toBe(3);
        }
        expect(lodForFov(SKY_FOV_MIN, 'high')?.mag).toBe(17);
        expect(lodForFov(60, 'high')).toBeNull();
    });
    it('scales wheel gestures and respects the common bounds', () => {
        expect(wheelZoomFov(30, -1)).toBeGreaterThan(wheelZoomFov(30, -100));
        expect(wheelZoomFov(30, 1)).toBeGreaterThan(30);
        expect(wheelZoomFov(30, 1, 1)).toBe(wheelZoomFov(30, 16));
        expect(clampSkyFov(0)).toBe(SKY_FOV_MIN);
        expect(clampSkyFov(100)).toBe(90);
    });
    it('frames extended objects by their angular size', () => {
        const m31 = DSOS.find(obj => obj.id === 'M31')!;
        const m13 = DSOS.find(obj => obj.id === 'M13')!;
        expect(targetSkyFov(m31)).toBeCloseTo(4 * m31.sizeArcmin! / 60);
        expect(targetSkyFov(m13)).toBe(SKY_FOV_MIN);
    });
});

describe('screen anchor under repeated deep zoom', () => {
    it.each([0.45, 1.7])('keeps an off-centre point through zoom and orbit updates, aspect %s', (aspect) => {
        const camera = new THREE.PerspectiveCamera(60, aspect, 0.001, 200);
        camera.position.set(-0.006, -0.007, 0.004);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const controls = new OrbitControls(camera);
        controls.enableDamping = false;
        const anchor = new THREE.Vector2(0.45, 0.3);
        const ray = new THREE.Ray(camera.position.clone(), new THREE.Vector3(anchor.x, anchor.y, 0.5).unproject(camera).sub(camera.position).normalize());
        const point = ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 94), new THREE.Vector3())!;
        for (let i = 0; i < 18; i++) {
            zoomCameraAt(camera, camera.fov * 0.78, anchor);
            controls.update();
            camera.updateMatrixWorld();
            const screen = point.clone().project(camera);
            expect(screen.x).toBeCloseTo(anchor.x, 5);
            expect(screen.y).toBeCloseTo(anchor.y, 5);
        }
        expect(camera.fov).toBe(SKY_FOV_MIN);
        controls.dispose();
    });
    it('moves the same point with the midpoint of a two-finger gesture', () => {
        const camera = new THREE.PerspectiveCamera(35, 0.45, 0.001, 200);
        camera.position.set(0, -0.007, 0.007);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const start = new THREE.Vector2(-0.2, 0.2);
        const end = new THREE.Vector2(0.1, -0.05);
        const ray = new THREE.Ray(camera.position.clone(), new THREE.Vector3(start.x, start.y, 0.5).unproject(camera).sub(camera.position).normalize());
        const point = ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), 94), new THREE.Vector3())!;
        zoomCameraAt(camera, 8, start, end);
        const screen = point.project(camera);
        expect(screen.x).toBeCloseTo(end.x, 5);
        expect(screen.y).toBeCloseTo(end.y, 5);
    });
    it('reduces drag sensitivity as the field narrows', () => {
        expect(orbitRotationSpeed(60)).toBeCloseTo(-0.4);
        expect(Math.abs(orbitRotationSpeed(1.5))).toBeLessThan(0.01);
    });
});
