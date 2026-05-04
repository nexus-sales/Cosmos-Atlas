'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import AtmosphericSky from '@/components/sky-map/AtmosphericSky';
import Stars from '@/components/sky-map/Stars';
import DeepSkyObjects from '@/components/sky-map/DeepSkyObjects';
import Constellations from '@/components/sky-map/Constellations';
import ConstellationLabels from '@/components/sky-map/ConstellationLabels';
import Planets from '@/components/sky-map/Planets';
import MilkyWaySkyDome from '@/components/sky-map/MilkyWaySkyDome';
import CelestialGrid from '@/components/sky-map/CelestialGrid';
import Ecliptic from '@/components/sky-map/Ecliptic';
import Horizon from '@/components/sky-map/Horizon';
import BackgroundStars from '@/components/sky-map/BackgroundStars';
import TargetPointer from '@/components/sky-map/TargetPointer';
import FOVOverlay from '@/components/sky-map/FOVOverlay';
import Compass from '@/components/panels/Compass';
import Satellites from '@/components/sky-map/Satellites';
import SimbadOverlay from '@/components/sky-map/SimbadOverlay';
import TelescopeEffect from '@/components/sky-map/TelescopeEffect';
import CameraNavigator from '@/components/sky-map/CameraNavigator';
import CameraBackground from '@/components/sky-map/CameraBackground';
import HipparcosStars from '@/components/sky-map/HipparcosStars';
import CinematicTour from '@/components/sky-map/CinematicTour';
import ConstellationArt from '@/components/sky-map/ConstellationArt';
import { AdaptiveSoundscape } from '@/components/audio/AdaptiveSoundscape';
import ErrorBoundary from '@/components/ErrorBoundary';
import NGCObjects from '@/components/sky-map/NGCObjects';
import Meteors from '@/components/sky-map/Meteors';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { computeMagneticDeclination } from '@/lib/astronomy/magneticDeclination';
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
    setIsMultitouch
}: {
    trackingRef: React.MutableRefObject<boolean>;
    manualFovRef: React.MutableRefObject<number | null>;
    manualFovHoldRef: React.MutableRefObject<number>;
    setIsMultitouch: (v: boolean) => void;
}) {
    const { camera, gl } = useThree();
    const fovRef = useRef(60);
    const camFov = useAppStore((state) => state.camFov);
    const setCamFov = useAppStore((state) => state.setCamFov);

    // Inercia del pinch: velocidad acumulada que se decae con fricción
    const pinchVelocityRef = useRef(0);
    const pinchActiveRef = useRef(false);

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
        const next = THREE.MathUtils.clamp(fovRef.current + vel, 5, 120);
        if (next !== fovRef.current) {
            fovRef.current = next;
            cam.fov = next;
            cam.updateProjectionMatrix();
            setCamFov(next);
        }
        // Fricción dinámica: decaimiento más natural
        // A mayor velocidad, mayor resistencia inicial (sensación de masa)
        const friction = Math.abs(vel) > 1.0 ? 0.92 : 0.85;
        pinchVelocityRef.current *= friction;
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
                const next = THREE.MathUtils.clamp(current + delta, 5, 120);
                manualFovRef.current = next;
                manualFovHoldRef.current = 1.0;
                cam.fov = next;
                cam.updateProjectionMatrix();
                setCamFov(next);
                return;
            }
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 5, 120);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        // ── Pinch táctil con pointer events ────────────────────────────────
        const ptrs = new Map<number, { x: number; y: number }>();
        let lastDist = 0;

        const onPointerDown = (e: PointerEvent) => {
            canvas.setPointerCapture(e.pointerId);
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ptrs.size >= 2) {
                pinchVelocityRef.current = 0;
                pinchActiveRef.current = true;
                setIsMultitouch(true);
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

            const delta = (lastDist - dist) * 0.15;
            lastDist = dist;
            pinchVelocityRef.current = pinchVelocityRef.current * 0.6 + delta * 0.4;

            if (trackingRef.current) {
                const current = manualFovRef.current ?? cam.fov;
                const next = THREE.MathUtils.clamp(current + delta, 5, 120);
                manualFovRef.current = next;
                manualFovHoldRef.current = 1.0;
                cam.fov = next;
                cam.updateProjectionMatrix();
                setCamFov(next);
                return;
            }
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 5, 120);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        const onPointerUp = (e: PointerEvent) => {
            canvas.releasePointerCapture(e.pointerId);
            ptrs.delete(e.pointerId);
            if (ptrs.size < 2) {
                lastDist = 0;
                pinchActiveRef.current = false;
                setIsMultitouch(false);
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
    }, [camera, gl, setCamFov]); // trackingRef/manualFovRef/manualFovHoldRef son refs — estables por diseño

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

function WebGLContextMonitor({ onLost, onRestored }: { onLost: () => void; onRestored: () => void }) {
    const { gl } = useThree();

    useEffect(() => {
        const canvas = gl.domElement;
        const handleLost = (event: Event) => {
            event.preventDefault();
            onLost();
        };
        const handleRestored = () => onRestored();

        canvas.addEventListener('webglcontextlost', handleLost);
        canvas.addEventListener('webglcontextrestored', handleRestored);

        return () => {
            canvas.removeEventListener('webglcontextlost', handleLost);
            canvas.removeEventListener('webglcontextrestored', handleRestored);
        };
    }, [gl, onLost, onRestored]);

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
        groupRef.current.rotation.x = THREE.MathUtils.degToRad(observer.lat - 90);
        groupRef.current.rotation.y = THREE.MathUtils.degToRad(-lst);
    });

    return <group ref={groupRef}>{children}</group>;
}

function OrientationDriver() {
    const { camera } = useThree();
    const followOrientation = useAppStore((s) => s.followOrientation);
    const compassCalibrationOffset = useAppStore((s) => s.compassCalibrationOffset);
    const azRef   = useRef(0);
    const elRef   = useRef(45);
    const declRef        = useRef(0);
    const lastObsRef     = useRef({ lat: NaN, lon: NaN, year: NaN });

    useFrame(() => {
        if (!followOrientation) return;

        const { observer, time } = useAppStore.getState();
        const year = time.getFullYear() + time.getMonth() / 12;
        const last = lastObsRef.current;
        if (Math.abs(observer.lat - last.lat) > 0.5
            || Math.abs(observer.lon - last.lon) > 0.5
            || Math.abs(year - last.year) > 0.5) {
            declRef.current    = computeMagneticDeclination(observer.lat, observer.lon, time);
            lastObsRef.current = { lat: observer.lat, lon: observer.lon, year };
        }

        const rawHeading = deviceOrientationRef.heading;
        const trueHeading = ((rawHeading + declRef.current + compassCalibrationOffset) % 360 + 360) % 360;
        const elevation   = deviceOrientationRef.elevation;

        // Factor 0.9 → cierre del 90% del error en 1 frame (~16ms).
        // El EMA del hook (τ≈48ms) ya filtra el jitter del sensor.
        // Un segundo lerp lento añadiría 300ms de lag inaceptable en AR.
        const dAz = ((trueHeading - azRef.current) % 360 + 540) % 360 - 180;
        if (Math.abs(dAz) > 0.05) {
            azRef.current = (azRef.current + dAz * 0.9 + 360) % 360;
        }
        const dEl = elevation - elRef.current;
        if (Math.abs(dEl) > 0.05) {
            elRef.current += dEl * 0.9;
        }

        const elRad = THREE.MathUtils.degToRad(elRef.current);
        const azRad = THREE.MathUtils.degToRad(azRef.current);

        camera.position.set(
            -Math.sin(azRad) * Math.cos(elRad) * 0.01,
            -Math.sin(elRad) * 0.01,
            Math.cos(azRad) * Math.cos(elRad) * 0.01,
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
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    // Create a ref for OrbitControls to sync it
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const trackingRef = useRef(false);
    const manualFovRef = useRef<number | null>(null);
    const manualFovHoldRef = useRef(0);
    const [isMultitouch, setIsMultitouch] = useState(false);
    const [webglLost, setWebglLost] = useState(false);
    const [canvasKey, setCanvasKey] = useState(0);

    return (
        <div className={cn(
            "w-full h-full relative overflow-hidden transition-colors duration-1000",
            viewMode === 'camera' ? "bg-transparent" : "bg-black"
        )}>
            {/* Fondo de Cámara para AR */}
            <CameraBackground />

            <Canvas
                key={canvasKey}
                dpr={[1, 1.5]}
                gl={{
                    antialias: false,
                    stencil: false,
                    powerPreference: 'high-performance',
                    alpha: true,
                    preserveDrawingBuffer: true
                }}
                camera={{ position: [0, 0, 0.01], fov: 60, near: 0.001, far: 200 }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                }}
            >
                <Suspense fallback={null}>
                    <SetupRenderer />
                    <WebGLContextMonitor
                        onLost={() => setWebglLost(true)}
                        onRestored={() => setWebglLost(false)}
                    />
                    <AdaptiveSoundscape />

                    {/* Iluminación para planetas y Luna (meshStandardMaterial) */}
                    {/* Luz ambiental suave para el lado oscuro */}
                    <ambientLight intensity={0.15} />
                    {/* Luz direccional que simula el Sol */}
                    <directionalLight
                        position={[100, 0, 0]}
                        intensity={3.5}
                        color="#ffffff"
                    />

                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={!followOrientation && !isMultitouch}
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
                        setIsMultitouch={setIsMultitouch}
                    />

                    {/* Esfera Atmosférica Pro */}
                    <AtmosphericSky />

                    {/* Grupo rotado al sistema horizontal del observador */}
                    <CelestialGroup>
                        <ErrorBoundary label="BackgroundStars"><BackgroundStars /></ErrorBoundary>
                        {showMilkyWay && <ErrorBoundary label="MilkyWaySkyDome"><MilkyWaySkyDome /></ErrorBoundary>}
                        {/* Catálogo Hipparcos — 14.984 estrellas hasta mag 7, carga asíncrona */}
                        <ErrorBoundary label="HipparcosStars"><HipparcosStars /></ErrorBoundary>
                        {/* Estrellas nombradas (355) con hitboxes e interacción — encima del catálogo */}
                        <ErrorBoundary label="Stars"><Stars /></ErrorBoundary>
                        <ErrorBoundary label="DeepSkyObjects"><DeepSkyObjects /></ErrorBoundary>
                        <ErrorBoundary label="Constellations"><Constellations /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationArt"><ConstellationArt /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationLabels"><ConstellationLabels /></ErrorBoundary>
                        <ErrorBoundary label="NGCObjects"><NGCObjects /></ErrorBoundary>
                        <ErrorBoundary label="Meteors"><Meteors /></ErrorBoundary>
                        <ErrorBoundary label="Planets"><Planets /></ErrorBoundary>
                        {showGrid && <ErrorBoundary label="CelestialGrid"><CelestialGrid /></ErrorBoundary>}
                        {showEcliptic && <ErrorBoundary label="Ecliptic"><Ecliptic /></ErrorBoundary>}
                        <ErrorBoundary label="TargetPointer"><TargetPointer /></ErrorBoundary>
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

                    <CinematicTour />
                    <SeeingJitter />
                    <TelescopeEffect />

                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    {/* Brújula con reset de orientación */}
                    <Compass />
                </Suspense>
            </Canvas>
            {webglLost && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6 text-center backdrop-blur-sm">
                    <div className="max-w-sm rounded-lg border border-white/10 bg-black/85 p-5 shadow-2xl">
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">
                            Render 3D pausado
                        </div>
                        <p className="mb-4 text-sm leading-relaxed text-white/70">
                            El navegador ha perdido el contexto WebGL. Puedes reiniciar el lienzo sin recargar toda la app.
                        </p>
                        <button
                            className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-white/15"
                            onClick={() => {
                                setWebglLost(false);
                                setCanvasKey((value) => value + 1);
                            }}
                        >
                            Reiniciar cielo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
