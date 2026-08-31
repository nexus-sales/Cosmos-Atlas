'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
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
import Meteors from '@/components/sky-map/Meteors';
import Comets from '@/components/sky-map/Comets';
import SimbadOverlay from '@/components/sky-map/SimbadOverlay';
import TelescopeEffect from '@/components/sky-map/TelescopeEffect';
import CameraNavigator from '@/components/sky-map/CameraNavigator';
import CameraBackground from '@/components/sky-map/CameraBackground';
import HipparcosStars from '@/components/sky-map/HipparcosStars';
import NGCObjects from '@/components/sky-map/NGCObjects';
import CinematicTour from '@/components/sky-map/CinematicTour';
import ConstellationArt from '@/components/sky-map/ConstellationArt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import ISSPassPredictor from '@/components/sky-map/ISSPassPredictor';
import { cn } from '@/lib/utils';
import { cameraHeadingRef, cameraRef, sunHorRef } from '@/lib/skyRefs';
import * as Astronomy from 'astronomy-engine';

// Observador reutilizable — evita allocations en useFrame
const _sunObserver = new Astronomy.Observer(0, 0, 0);
let _lastSunUpdateMs = 0;

/**
 * Calcula la posición horizontal del Sol máximo 1x/segundo,
 * actualiza sunHorRef y posiciona el directionalLight en world-space.
 * Priority=-1 garantiza que corre antes que cualquier consumidor de sunHorRef.
 */
function SunLight() {
    const lightRef = useRef<THREE.DirectionalLight>(null);

    useFrame(() => {
        const now = Date.now();
        if (now - _lastSunUpdateMs >= 1000) {
            const { time, observer } = useAppStore.getState();
            try {
                _sunObserver.latitude  = observer.lat;
                _sunObserver.longitude = observer.lon;
                const eq  = Astronomy.Equator(Astronomy.Body.Sun, time, _sunObserver, true, true);
                const hor = Astronomy.Horizon(time, _sunObserver, eq.ra, eq.dec, 'normal');
                sunHorRef.alt = hor.altitude;
                sunHorRef.az  = hor.azimuth;
                _lastSunUpdateMs = now;
            } catch (err) {
                console.warn('[SkyCanvas] fallo calculando posicion del Sol:', err);
            }
        }

        if (lightRef.current) {
            const el = THREE.MathUtils.degToRad(sunHorRef.alt);
            const az = THREE.MathUtils.degToRad(sunHorRef.az);
            lightRef.current.position.set(
                Math.sin(az) * Math.cos(el) * 100,
                Math.sin(el) * 100,
                -Math.cos(az) * Math.cos(el) * 100
            );
        }
    }, -1); // priority -1 → corre antes que todos los demás useFrame

    return <directionalLight ref={lightRef} intensity={3.5} color="#ffffff" position={[100, 0, 0]} />;
}

function SubHorizonAlert() {
    const alert = useAppStore(s => s.subHorizonAlert);
    if (!alert) return null;
    return (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-50
                        rounded-xl border border-amber-400/30 bg-amber-950/80 px-4 py-2.5
                        text-[13px] font-semibold font-mono text-amber-200 backdrop-blur-sm
                        animate-fade-in shadow-lg">
            ⚠ {alert}
        </div>
    );
}

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
}: {
    trackingRef: React.MutableRefObject<boolean>;
    manualFovRef: React.MutableRefObject<number | null>;
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
    }, [camera, gl, setCamFov]); // trackingRef/manualFovRef son refs — estables por diseño

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
 * horizontal local del observador.
 *
 * Euler orden 'XYZ': aplica Ry(-LST) y después Rx(lat-90), que deja
 * el norte celeste a azimut 0° y altura igual a la latitud del observador.
 */
function CelestialGroup({ children }: { children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        const group = groupRef.current;
        if (!group) return;
        if (group.rotation.order !== 'XYZ') group.rotation.order = 'XYZ';
        const { time, observer } = useAppStore.getState();
        const lst = getLST(time, observer.lon);
        group.rotation.x = THREE.MathUtils.degToRad(observer.lat - 90);
        group.rotation.y = THREE.MathUtils.degToRad(-lst);
    });

    return <group ref={groupRef}>{children}</group>;
}

/**
 * OrientationDriver — Mapea los sensores del dispositivo a la cámara celeste.
 *
 * FÓRMULA UNIFICADA (todos los modos de sujeción):
 *   beta=0   (plano, pantalla arriba) → el=90  (cénit)    ← tablet como atlas
 *   beta=45  (inclinado desde plano)  → el=45
 *   beta=90  (vertical)               → el=0   (horizonte)
 *   beta=135 (levantado hacia el cielo) → el=45            ← AR apuntando arriba
 *   beta=180 (boca abajo, cámara arriba) → el=90 (cénit)
 *   => targetEl = |beta - 90|
 *
 * Usa position + lookAt (compatible con Html/OrbitControls de drei).
 * El gimbal lock al cénit se resuelve ajustando camera.up según el azimut.
 */
function OrientationDriver() {
    const { camera } = useThree();
    const followOrientation = useAppStore((s) => s.followOrientation);

    const azRef = useRef(0);
    const elRef = useRef(0);

    useFrame(() => {
        if (!followOrientation) return;

        // Usar heading y elevation ya corregidos y suavizados del sensor
        const { heading, elevation } = deviceOrientationRef;

        const targetEl = THREE.MathUtils.clamp(elevation, 0, 90);

        // Azimut wrap-around seguro
        const dAz = ((heading - azRef.current) % 360 + 540) % 360 - 180;
        azRef.current = (azRef.current + dAz * 0.12 + 360) % 360;
        elRef.current += (targetEl - elRef.current) * 0.12;

        const el  = elRef.current;
        const az  = azRef.current;
        const elR = THREE.MathUtils.degToRad(el);
        const azR = THREE.MathUtils.degToRad(az);

        // La cámara está dentro de la esfera y mira al origen.
        // lookDir apunta hacia donde miramos; position es su inversa.
        const lx =  Math.cos(elR) * Math.sin(azR);
        const ly =  Math.sin(elR);
        const lz = -Math.cos(elR) * Math.cos(azR);
        camera.position.set(-lx * 0.01, -ly * 0.01, -lz * 0.01);

        // Evitar gimbal lock al apuntar al cénit (el > 75°):
        // usamos Norte proyectado como vector "arriba" de la cámara.
        if (el > 75) {
            camera.up.set(-Math.sin(azR), 0, Math.cos(azR));
        } else {
            camera.up.set(0, 1, 0);
        }

        camera.lookAt(0, 0, 0);
    });

    return null;
}

/**
 * Actualiza cameraRef y cameraHeadingRef en cada frame para que
 * componentes fuera del Canvas (Compass) puedan acceder a la cámara.
 */
function CameraSync() {
    const { camera } = useThree();
    useEffect(() => { cameraRef.current = camera; }, [camera]);
    useFrame(() => {
        const lookDir = camera.position.clone().negate().normalize();
        cameraHeadingRef.value = (Math.atan2(lookDir.x, -lookDir.z) * (180 / Math.PI) + 360) % 360;
    });
    return null;
}

function SeeingJitter() {
    const { camera } = useThree();
    const camFov = useAppStore((s) => s.camFov);
    const telescopeMode = useAppStore((s) => s.settings.telescopeMode);
    // Track last applied jitter to compute delta each frame (avoids cumulative drift)
    const lastJitter = useRef({ x: 0, y: 0 });

    useFrame((state) => {
        const active = telescopeMode && camFov <= 25;

        if (!active) {
            // Undo any residual jitter on deactivation so camera returns to clean position
            if (lastJitter.current.x !== 0 || lastJitter.current.y !== 0) {
                camera.translateX(-lastJitter.current.x);
                camera.translateY(-lastJitter.current.y);
                lastJitter.current = { x: 0, y: 0 };
            }
            return;
        }

        const time = state.clock.getElapsedTime();
        const zoomFactor = 1.0 - (camFov / 25.0);
        const intensity = 0.00004 * (1.0 + zoomFactor * 3.0);
        const jx = Math.sin(time * 15.0) * intensity;
        const jy = Math.cos(time * 18.0) * intensity;

        // Apply only the delta from last frame: net offset = jx, jy (no accumulation)
        camera.translateX(jx - lastJitter.current.x);
        camera.translateY(jy - lastJitter.current.y);
        lastJitter.current = { x: jx, y: jy };
    });
    return null;
}



export default function SkyCanvas() {
    const viewMode = useAppStore((state) => state.viewMode);
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showComets = useAppStore((state) => state.settings.showComets ?? true);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const deviceQuality = useAppStore((state) => state.deviceQuality);

    // Cap DPR by quality tier to avoid rendering at 3× on flagship Android phones
    const maxDpr = deviceQuality === 'low' ? 1.0 : deviceQuality === 'medium' ? 1.5 : 2.0;

    // Create a ref for OrbitControls to sync it
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const trackingRef = useRef(false);
    const manualFovRef = useRef<number | null>(null);

    return (
        <div className={cn(
            "w-full h-full relative overflow-hidden transition-colors duration-1000",
            viewMode === 'camera' ? "bg-transparent" : "bg-black"
        )}>
            {/* Fondo de Cámara para AR */}
            <CameraBackground />

            <Canvas
                dpr={[1, maxDpr]}
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

                    {/* Iluminación para planetas y Luna */}
                    <ambientLight intensity={0.15} />
                    {/* SunLight: directional light que sigue la posición real del Sol */}
                    <SunLight />

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
                    />

                    {/* Esfera atmosférica con scattering Rayleigh/Mie y posición real del Sol */}
                    <AtmosphericSky />

                    {/* Grupo rotado al sistema horizontal del observador */}
                    <CelestialGroup>
                        <ErrorBoundary label="BackgroundStars"><BackgroundStars /></ErrorBoundary>
                        {showMilkyWay && <ErrorBoundary label="MilkyWay"><MilkyWaySkyDome /></ErrorBoundary>}
                        {/* Catálogo Hipparcos — 14.984 estrellas hasta mag 7, carga asíncrona */}
                        <ErrorBoundary label="HipparcosStars"><HipparcosStars /></ErrorBoundary>
                        {/* Estrellas nombradas (355) con hitboxes e interacción — encima del catálogo */}
                        <ErrorBoundary label="Stars"><Stars /></ErrorBoundary>
                        {/* Catálogo NGC/IC — 10.000 objetos, puntos difusos, renderOrder=0 (debajo de DSOs nombrados) */}
                        <ErrorBoundary label="NGCObjects"><NGCObjects /></ErrorBoundary>
                        <ErrorBoundary label="DeepSkyObjects"><DeepSkyObjects /></ErrorBoundary>
                        <ErrorBoundary label="Constellations"><Constellations /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationArt"><ConstellationArt /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationLabels"><ConstellationLabels /></ErrorBoundary>
                        <ErrorBoundary label="Planets"><Planets /></ErrorBoundary>
                        {showGrid && <ErrorBoundary label="CelestialGrid"><CelestialGrid /></ErrorBoundary>}
                        {showEcliptic && <ErrorBoundary label="Ecliptic"><Ecliptic /></ErrorBoundary>}
                        <ErrorBoundary label="TargetPointer"><TargetPointer /></ErrorBoundary>
                        {/* Cometas con colas dinámicas (usan coordenadas ecuatoriales) */}
                        {showComets && <ErrorBoundary label="Comets"><Comets /></ErrorBoundary>}
                        <ErrorBoundary label="SimbadOverlay"><SimbadOverlay /></ErrorBoundary>
                    </CelestialGroup>

                    {/* Satélites en espacio mundo horizontal (Alt/Az), NO dentro del CelestialGroup */}
                    <ErrorBoundary label="Satellites"><Satellites /></ErrorBoundary>
                    {/* ISS: predicción de paso + arco de trayectoria */}
                    <ErrorBoundary label="ISSPassPredictor"><ISSPassPredictor /></ErrorBoundary>

                    <CameraNavigator
                        controlsRef={controlsRef}
                        trackingRef={trackingRef}
                        manualFovRef={manualFovRef}
                    />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}
                    <ErrorBoundary label="Horizon"><Horizon /></ErrorBoundary>

                    {/* Lluvia de meteoros real: solo con radiante real activo y cielo oscuro, sin simulacion */}
                    <ErrorBoundary label="Meteors"><Meteors /></ErrorBoundary>

                    <CinematicTour />
                    <SeeingJitter />
                    <TelescopeEffect />

                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    <CameraSync />
                </Suspense>
            </Canvas>

            {/* Brújula y botón AR — fuera del Canvas para evitar transforms de drei/Html */}
            <Compass />

            {/* Alerta objeto bajo el horizonte */}
            <SubHorizonAlert />
        </div>
    );
}
