'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import CelestialSphere from '@/components/sky-map/CelestialSphere';
import Stars from '@/components/sky-map/Stars';
import DeepSkyObjects from '@/components/sky-map/DeepSkyObjects';
import Constellations from '@/components/sky-map/Constellations';
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

export default function SkyCanvas() {
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);

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
                        <Planets />
                        {showGrid && <CelestialGrid />}
                        {showEcliptic && <Ecliptic />}
                        <TargetPointer />
                    </CelestialGroup>

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
