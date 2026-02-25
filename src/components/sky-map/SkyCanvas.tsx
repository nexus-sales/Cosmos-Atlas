'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import CelestialSphere from '@/components/sky-map/CelestialSphere';
import Stars from '@/components/sky-map/Stars';
import DeepSkyObjects from '@/components/sky-map/DeepSkyObjects';
import Constellations from '@/components/sky-map/Constellations';
import ConstellationLabels from '@/components/sky-map/ConstellationLabels';
import Planets from '@/components/sky-map/Planets';
import MilkyWay from '@/components/sky-map/MilkyWay';
import CelestialGrid from '@/components/sky-map/CelestialGrid';
import Ecliptic from '@/components/sky-map/Ecliptic';
import Horizon from '@/components/sky-map/Horizon';
import BackgroundStars from '@/components/sky-map/BackgroundStars';
import TargetPointer from '@/components/sky-map/TargetPointer';
import FOVOverlay from '@/components/sky-map/FOVOverlay';
import Compass from '@/components/panels/Compass';
import Satellites from '@/components/sky-map/Satellites';
import MeteorShower from '@/components/effects/MeteorShower';
import Comets from '@/components/sky-map/Comets';
import AuroraBorealis from '@/components/sky-map/AuroraBorealis';
import { useAppStore } from '@/stores/useAppStore';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getLST } from '@/lib/astronomy/time';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';

/**
 * Zoom por FOV — rueda de ratón + pinch táctil.
 *
 * Para el pinch se usan pointer events (no touch events) porque R3F establece
 * `touch-action: none` en el canvas y OrbitControls también usa pointer events,
 * lo que hace que los touchmove sean poco fiables. Al usar pointerdown/
 * pointermove en el mismo canvas los dos handlers conviven sin conflicto:
 * OrbitControls ignora el gesto de 2 dedos cuando enableZoom+enablePan=false
 * y nuestro handler calcula el delta de distancia entre ambos punteros.
 */
function FovZoom() {
    const { camera, gl } = useThree();
    const fovRef = useRef(60);
    const setCamFov = useAppStore((state) => state.setCamFov);

    useEffect(() => {
        const canvas = gl.domElement;
        const cam = camera as THREE.PerspectiveCamera;

        // ── Rueda de ratón ──────────────────────────────────────────────────
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 3 : -3;
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        // ── Pinch táctil con pointer events ────────────────────────────────
        // Mapa pointerId → posición actual
        const ptrs = new Map<number, { x: number; y: number }>();
        let lastDist = 0;

        const onPointerDown = (e: PointerEvent) => {
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!ptrs.has(e.pointerId)) return;
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ptrs.size !== 2) return;

            const [a, b] = [...ptrs.values()];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (lastDist === 0) { lastDist = dist; return; }

            // Separar dedos (dist crece) → zoom in (FOV baja)
            const delta = (lastDist - dist) * 0.15;
            lastDist = dist;
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        const onPointerUp = (e: PointerEvent) => {
            ptrs.delete(e.pointerId);
            if (ptrs.size < 2) lastDist = 0;
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
        };
    }, [camera, gl, setCamFov]);

    return null;
}

/**
 * Habilita el clipping local del renderer para que el horizonte
 * funcione correctamente con planos de corte por material.
 */
function SetupRenderer() {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const { gl } = useThree();

    useEffect(() => {
        glRef.current = gl;
        // eslint-disable-next-line react-hooks/immutability
        gl.localClippingEnabled = true;
        return () => {
            if (glRef.current) {
                glRef.current.localClippingEnabled = false;
            }
        };
    }, [gl]);

    return null;
}

/**
 * Rota toda la esfera celeste (coordenadas ecuatoriales) al sistema
 * horizontal local del observador:
 *   - rotation.x = 90 - lat   → inclina el polo norte celeste
 *   - rotation.y = -LST        → gira para la hora sidérea local
 * Con esto las estrellas se mueven correctamente según la ubicación
 * y la hora real, exactamente como en el cielo nocturno.
 */
function CelestialGroup({ children }: { children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!groupRef.current) return;
        const { time, observer } = useAppStore.getState();
        const lst = getLST(time, observer.lon);
        groupRef.current.rotation.x = THREE.MathUtils.degToRad(90 - observer.lat);
        groupRef.current.rotation.y = THREE.MathUtils.degToRad(-lst);
    });

    return <group ref={groupRef}>{children}</group>;
}

/**
 * Smoothly flies the camera to face the targeted object.
 * Runs after OrbitControls (priority 0 > -1) so our position sticks each frame.
 */
function CameraNavigator() {
    const { camera } = useThree();
    const targetedObject = useAppStore((s) => s.targetedObject);

    const isFlying = useRef(false);
    const prevTarget = useRef<typeof targetedObject>(null);

    useEffect(() => {
        if (targetedObject && targetedObject !== prevTarget.current) {
            isFlying.current = true;
        }
        prevTarget.current = targetedObject;
    }, [targetedObject]);

    useFrame(() => {
        if (!isFlying.current || !targetedObject) return;

        // World-space direction: apply CelestialGroup's rotation to equatorial position
        const { time, observer } = useAppStore.getState();
        const lst = getLST(time, observer.lon);
        const euler = new THREE.Euler(
            THREE.MathUtils.degToRad(90 - observer.lat),
            THREE.MathUtils.degToRad(-lst),
            0,
            'XYZ',
        );
        const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
        const [ex, ey, ez] = equatorialTo3D(targetedObject.ra, targetedObject.dec, 1);
        const targetWorldDir = new THREE.Vector3(ex, ey, ez).applyMatrix4(rotMatrix).normalize();

        // Camera must be positioned OPPOSITE to the star to look at it
        const targetCamPos = targetWorldDir.clone().negate().multiplyScalar(0.01);
        const currentPos = camera.position.clone();

        // Check arrival (dot product close to 1 = same direction)
        const dot = currentPos.normalize().dot(targetCamPos.clone().normalize());
        if (dot > 0.9998) {
            isFlying.current = false;
            return;
        }

        // Lerp + normalize to stay on unit sphere × 0.01 (ease-out feel)
        const speed = THREE.MathUtils.clamp(0.05 + (1 - dot) * 0.05, 0.04, 0.12);
        const newPos = camera.position.clone().lerp(targetCamPos, speed).normalize().multiplyScalar(0.01);
        camera.position.copy(newPos);
    });

    return null;
}

/**
 * When followOrientation is active, reads the module-level deviceOrientationRef
 * (written by the DeviceOrientation event listener) and applies the device heading
 * and elevation to the camera position each frame.
 *
 * Mapping (Three.js scene: North=-Z, East=+X, Zenith=+Y):
 *   elevation = clamp(90 - beta, -10, 90)
 *   azimuth   = alpha (0=North, clockwise)
 *   cam_pos   = (-cos(el)*sin(az), -sin(el), cos(el)*cos(az)) * 0.01
 *
 * A lerp smoothing factor of 0.12 removes gyroscope jitter.
 */
function OrientationDriver() {
    const { camera } = useThree();
    const followOrientation = useAppStore((s) => s.followOrientation);
    const azRef = useRef(0);
    const elRef = useRef(45);

    useFrame(() => {
        if (!followOrientation) return;

        const { alpha, beta } = deviceOrientationRef;

        // elevation: 90° when phone flat face-up → looking at zenith
        //            0° when phone vertical      → looking at horizon
        const targetEl = Math.max(-10, Math.min(90, 90 - beta));

        // Smooth angle lerp — handle 359→1 wrap-around for azimuth
        const dAz = ((alpha - azRef.current) % 360 + 540) % 360 - 180;
        azRef.current = (azRef.current + dAz * 0.12 + 360) % 360;
        elRef.current += (targetEl - elRef.current) * 0.12;

        const elRad = THREE.MathUtils.degToRad(elRef.current);
        const azRad = THREE.MathUtils.degToRad(azRef.current);

        camera.position.set(
            -Math.cos(elRad) * Math.sin(azRad) * 0.01,
            -Math.sin(elRad) * 0.01,
            Math.cos(elRad) * Math.cos(azRad) * 0.01,
        );
    });

    return null;
}

export default function SkyCanvas() {
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const followOrientation = useAppStore((state) => state.followOrientation);

    return (
        <div className="w-full h-full bg-[#02050a] relative">
            <Canvas
                gl={{ antialias: true, stencil: false, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, 0.01], fov: 60, near: 0.001, far: 200 }}
            >
                <Suspense fallback={null}>
                    <SetupRenderer />

                    {/* Iluminación para planetas y Luna (meshStandardMaterial) */}
                    {/* Luz ambiental suave para el lado oscuro */}
                    <ambientLight intensity={0.15} />
                    {/* Luz direccional que simula el Sol - viene desde +X (Este) */}
                    <directionalLight
                        position={[100, 0, 0]}
                        intensity={3.5}
                        color="#ffffff"
                    />

                    {/* In AR/orientation mode, disable drag rotation so OrientationDriver owns the camera */}
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={!followOrientation}
                        rotateSpeed={-0.4}
                        target={[0, 0, 0]}
                    />
                    <OrientationDriver />
                    <FovZoom />

                    {/* Esfera de fondo — no rotar, siempre envuelve la escena */}
                    <CelestialSphere />

                    {/* Grupo rotado al sistema horizontal del observador */}
                    <CelestialGroup>
                        <BackgroundStars />
                        {showMilkyWay && <MilkyWay />}
                        <Stars />
                        <DeepSkyObjects />
                        <Constellations />
                        {showConstellations && <ConstellationLabels />}
                        <Planets />
                        {showGrid && <CelestialGrid />}
                        {showEcliptic && <Ecliptic />}
                        <TargetPointer />
                        {/* Cometas con colas dinámicas (usan coordenadas ecuatoriales) */}
                        <Comets />
                    </CelestialGroup>

                    {/* Satélites en espacio mundo horizontal (Alt/Az), NO dentro del CelestialGroup */}
                    <Satellites />
                    <CameraNavigator />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}
                    <Horizon />

                    {/* Aurora Boreal/Austral */}
                    <AuroraBorealis />

                    {/* Lluvia de meteoros real */}
                    <MeteorShower />

                    <EffectComposer>
                        {/* Bloom: umbral alto → solo estrellas brillantes (mag<2) tienen corona.
                            Las tenues quedan como puntos limpios. Estilo Sky Map. */}
                        <Bloom luminanceThreshold={0.35} mipmapBlur intensity={1.0} radius={0.3} />
                        <Noise opacity={0.02} />
                        <Vignette eskil={false} offset={0.08} darkness={1.35} />
                    </EffectComposer>
                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    {/* Brújula con reset de orientación */}
                    <Compass />
                </Suspense>
            </Canvas>
        </div>
    );
}
