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
import SimbadOverlay from '@/components/sky-map/SimbadOverlay';
import TelescopeEffect from '@/components/sky-map/TelescopeEffect';
import CameraNavigator from '@/components/sky-map/CameraNavigator';
import CameraBackground from '@/components/sky-map/CameraBackground';
import HipparcosStars from '@/components/sky-map/HipparcosStars';
import CinematicTour from '@/components/sky-map/CinematicTour';
import ConstellationArt from '@/components/sky-map/ConstellationArt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { cn } from '@/lib/utils';

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
function FovZoom({
    trackingRef,
    manualFovRef,
    manualFovHoldRef,
}: {
    trackingRef: React.MutableRefObject<boolean>;
    manualFovRef: React.MutableRefObject<number | null>;
    manualFovHoldRef: React.MutableRefObject<number>;
}) {
    const { camera, gl } = useThree();
    const fovRef = useRef(60);
    const camFov = useAppStore((state) => state.camFov);
    const setCamFov = useAppStore((state) => state.setCamFov);

    // Inercia del pinch: velocidad acumulada que se decae con fricción
    const pinchVelocityRef = useRef(0);
    const pinchActiveRef   = useRef(false);

    useEffect(() => {
        const cam = camera as THREE.PerspectiveCamera;
        fovRef.current = camFov;
        cam.fov = camFov;
        cam.updateProjectionMatrix();
    }, [camera, camFov]);

    // Aplica la inercia del pinch en cada frame tras levantar los dedos
    useFrame(() => {
        const vel = pinchVelocityRef.current;
        if (pinchActiveRef.current || Math.abs(vel) < 0.02) {
            pinchVelocityRef.current = 0;
            return;
        }
        const cam = camera as THREE.PerspectiveCamera;
        const next = THREE.MathUtils.clamp(fovRef.current + vel, 10, 90);
        if (next !== fovRef.current) {
            fovRef.current = next;
            cam.fov = next;
            cam.updateProjectionMatrix();
            setCamFov(next);
        }
        // Fricción: decae ~60% en ~10 frames (≈0.17 s a 60 fps)
        pinchVelocityRef.current *= 0.88;
    });

    useEffect(() => {
        const canvas = gl.domElement;
        const cam = camera as THREE.PerspectiveCamera;

        // ── Rueda de ratón ──────────────────────────────────────────────────
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 3 : -3;
            if (trackingRef.current) {
                const current = manualFovRef.current ?? cam.fov;
                const next = THREE.MathUtils.clamp(current + delta, 10, 90);
                manualFovRef.current = next;
                manualFovHoldRef.current = 1.0;
                cam.fov = next;
                cam.updateProjectionMatrix();
                setCamFov(next);
                return;
            }
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        // ── Pinch táctil con pointer events ────────────────────────────────
        const ptrs = new Map<number, { x: number; y: number }>();
        let lastDist = 0;

        const onPointerDown = (e: PointerEvent) => {
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ptrs.size >= 2) {
                pinchVelocityRef.current = 0; // reiniciar inercia al iniciar nuevo pinch
                pinchActiveRef.current = true;
            }
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

            // Acumular velocidad (promedio suavizado con el delta actual)
            pinchVelocityRef.current = pinchVelocityRef.current * 0.6 + delta * 0.4;

            if (trackingRef.current) {
                const current = manualFovRef.current ?? cam.fov;
                const next = THREE.MathUtils.clamp(current + delta, 10, 90);
                manualFovRef.current = next;
                manualFovHoldRef.current = 1.0;
                cam.fov = next;
                cam.updateProjectionMatrix();
                setCamFov(next);
                return;
            }
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        const onPointerUp = (e: PointerEvent) => {
            ptrs.delete(e.pointerId);
            if (ptrs.size < 2) {
                lastDist = 0;
                pinchActiveRef.current = false;
                // La velocidad acumulada seguirá aplicándose en useFrame (inercia)
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, gl, setCamFov]); // trackingRef/manualFovRef/manualFovHoldRef are refs — stable by design

    return null;
}

/**
 * Habilita el clipping local del renderer para que el horizonte
 * funcione correctamente con planos de corte por material.
 */
function SetupRenderer() {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const { gl } = useThree();
    const viewMode = useAppStore(s => s.viewMode);

    useEffect(() => {
        glRef.current = gl;
        // eslint-disable-next-line react-hooks/immutability
        gl.localClippingEnabled = true;
        
        // Transparencia total en modo cámara, negro en modo bóveda
        if (viewMode === 'camera') {
            gl.setClearColor(0x000000, 0);
        } else {
            gl.setClearColor(0x000000, 1);
        }
        
        return () => {
            if (glRef.current) {
                glRef.current.localClippingEnabled = false;
            }
        };
    }, [gl, viewMode]);

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

function OrientationDriver() {
    const { camera } = useThree();
    const followOrientation = useAppStore((s) => s.followOrientation);
    const azRef = useRef(0);
    const elRef = useRef(45);

    useFrame(() => {
        if (!followOrientation) return;

        const { alpha, beta } = deviceOrientationRef;

        const targetEl = Math.max(-10, Math.min(90, 90 - beta));

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

function SeeingJitter() {
    const { camera } = useThree();
    const camFov = useAppStore((s) => s.camFov);
    const telescopeMode = useAppStore((s) => s.settings.telescopeMode);

    useFrame((state) => {
        if (!telescopeMode || camFov > 25) return;
        const time = state.clock.getElapsedTime();
        const zoomFactor = 1.0 - (camFov / 25.0);
        const intensity = 0.00004 * (1.0 + zoomFactor * 3.0);
        const jitterX = Math.sin(time * 15.0) * intensity;
        const jitterY = Math.cos(time * 18.0) * intensity;
        camera.translateX(jitterX);
        camera.translateY(jitterY);
    });
    return null;
}



export default function SkyCanvas() {
    const viewMode = useAppStore((state) => state.viewMode);
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    // Create a ref for OrbitControls to sync it
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const trackingRef = useRef(false);
    const manualFovRef = useRef<number | null>(null);
    const manualFovHoldRef = useRef(0);

    return (
        <div className={cn(
            "w-full h-full relative overflow-hidden transition-colors duration-1000",
            viewMode === 'camera' ? "bg-transparent" : "bg-black"
        )}>
            {/* Fondo de Cámara para AR */}
            <CameraBackground />

            <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                gl={{ 
                    antialias: true, 
                    stencil: false, 
                    powerPreference: 'high-performance',
                    alpha: true // Permitir fondo transparente para ver la cámara
                }}
                camera={{ position: [0, 0, 0.01], fov: 60, near: 0.001, far: 200 }}
                onCreated={({ gl }) => {
                    // Asegurar que el fondo del canvas sea transparente
                    gl.setClearColor(0x000000, 0);
                }}
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

                    {/* OrbitControls ya no usa key para evitar re-mounting que corta el drag */}
                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={!followOrientation}
                        rotateSpeed={-0.4}
                        target={[0, 0, 0]}
                        onStart={() => {
                            trackingRef.current = false;
                            setTargetedObject(null);
                        }}
                    />
                    <OrientationDriver />
                    <FovZoom
                        trackingRef={trackingRef}
                        manualFovRef={manualFovRef}
                        manualFovHoldRef={manualFovHoldRef}
                    />

                    {/* Esfera Atmosférica Pro — reemplaza a CelestialSphere */}
                    <CelestialSphere />

                    {/* Grupo rotado al sistema horizontal del observador */}
                    <CelestialGroup>
                        <ErrorBoundary label="BackgroundStars"><BackgroundStars /></ErrorBoundary>
                        {showMilkyWay && <ErrorBoundary label="MilkyWay"><MilkyWay /></ErrorBoundary>}
                        {/* Catálogo Hipparcos — 14.984 estrellas hasta mag 7, carga asíncrona */}
                        <ErrorBoundary label="HipparcosStars"><HipparcosStars /></ErrorBoundary>
                        {/* Estrellas nombradas (355) con hitboxes e interacción — encima del catálogo */}
                        <ErrorBoundary label="Stars"><Stars /></ErrorBoundary>
                        <ErrorBoundary label="DeepSkyObjects"><DeepSkyObjects /></ErrorBoundary>
                        <ErrorBoundary label="Constellations"><Constellations /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationArt"><ConstellationArt /></ErrorBoundary>
                        {showConstellations && <ErrorBoundary label="ConstellationLabels"><ConstellationLabels /></ErrorBoundary>}
                        <ErrorBoundary label="Planets"><Planets /></ErrorBoundary>
                        {showGrid && <ErrorBoundary label="CelestialGrid"><CelestialGrid /></ErrorBoundary>}
                        {showEcliptic && <ErrorBoundary label="Ecliptic"><Ecliptic /></ErrorBoundary>}
                        <ErrorBoundary label="TargetPointer"><TargetPointer /></ErrorBoundary>
                        {/* Cometas con colas dinámicas (usan coordenadas ecuatoriales) */}
                        <ErrorBoundary label="Comets"><Comets /></ErrorBoundary>
                        <ErrorBoundary label="SimbadOverlay"><SimbadOverlay /></ErrorBoundary>
                    </CelestialGroup>

                    {/* Satélites en espacio mundo horizontal (Alt/Az), NO dentro del CelestialGroup */}
                    <ErrorBoundary label="Satellites"><Satellites /></ErrorBoundary>

                    <CameraNavigator
                        controlsRef={controlsRef}
                        trackingRef={trackingRef}
                        manualFovRef={manualFovRef}
                        manualFovHoldRef={manualFovHoldRef}
                    />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}
                    <ErrorBoundary label="Horizon"><Horizon /></ErrorBoundary>

                    {/* Lluvia de meteoros real */}
                    <ErrorBoundary label="MeteorShower"><MeteorShower /></ErrorBoundary>

                    <CinematicTour />
                    <SeeingJitter />
                    <TelescopeEffect />

                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    {/* Brújula con reset de orientación */}
                    <Compass />
                </Suspense>
            </Canvas>
        </div>
    );
}


