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
import { useAppStore } from '@/stores/useAppStore';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { getLST } from '@/lib/astronomy/time';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

/** Zoom por FOV — único modo que tiene sentido dentro de una esfera celeste */
function FovZoom() {
    const { camera, gl } = useThree();
    const fovRef = useRef(60);

    useEffect(() => {
        const canvas = gl.domElement;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 3 : -3;
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            (camera as THREE.PerspectiveCamera).fov = fovRef.current;
            (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        };
        canvas.addEventListener('wheel', onWheel, { passive: false });
        return () => canvas.removeEventListener('wheel', onWheel);
    }, [camera, gl]);

    return null;
}

/**
 * Habilita el clipping local del renderer para que el horizonte
 * funcione correctamente con planos de corte por material.
 */
function SetupRenderer() {
    const { gl } = useThree();
    useEffect(() => {
        gl.localClippingEnabled = true;
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
    const observer = useAppStore((state) => state.observer);
    const time = useAppStore((state) => state.time);

    useFrame(() => {
        if (!groupRef.current) return;
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
    const observer       = useAppStore((s) => s.observer);
    const time           = useAppStore((s) => s.time);

    const isFlying   = useRef(false);
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
        const currentPos   = camera.position.clone();

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

export default function SkyCanvas() {
    const showGrid         = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay     = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic     = useAppStore((state) => state.settings.showEcliptic);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);

    return (
        <div className="w-full h-full bg-[#02050a] relative">
            <Canvas
                gl={{ antialias: true, stencil: false, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, 0.01], fov: 60, near: 0.001, far: 200 }}
            >
                <Suspense fallback={null}>
                    <SetupRenderer />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        rotateSpeed={-0.4}
                        target={[0, 0, 0]}
                    />
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
                    </CelestialGroup>
                    <CameraNavigator />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}
                    <Horizon />

                    <EffectComposer>
                        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.5} radius={0.4} />
                        <Noise opacity={0.025} />
                        <Vignette eskil={false} offset={0.1} darkness={1.2} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}
