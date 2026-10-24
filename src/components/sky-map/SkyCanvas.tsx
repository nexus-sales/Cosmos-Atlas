'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import GaiaStars from '@/components/sky-map/GaiaStars';
import NGCObjects from '@/components/sky-map/NGCObjects';
import CinematicTour from '@/components/sky-map/CinematicTour';
import ConstellationArt from '@/components/sky-map/ConstellationArt';
import ConstellationBoundaries from '@/components/sky-map/ConstellationBoundaries';
import Asterisms from '@/components/sky-map/Asterisms';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import ISSPassPredictor from '@/components/sky-map/ISSPassPredictor';
import { cn } from '@/lib/utils';
import { Crosshair, Minus, Plus, RotateCcw } from 'lucide-react';
import { cameraHeadingRef, cameraRef, moonHorRef, sunHorRef } from '@/lib/skyRefs';
import { ocularExposureTarget } from '@/lib/astronomy/skyBrightness';
import { computeMagneticDeclination } from '@/lib/astronomy/magneticDeclination';
import { calibrateArToTarget } from '@/lib/astronomy/arCalibration';
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

    // Aplica la inercia del pinch en cada frame tras levantar los dedos.
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
            if (e.pointerType !== 'touch') return;
            e.preventDefault();
            canvas.setPointerCapture(e.pointerId);
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ptrs.size === 2) {
                const [a, b] = [...ptrs.values()];
                lastDist = Math.hypot(a.x - b.x, a.y - b.y);
                pinchVelocityRef.current = 0; // reiniciar inercia al iniciar nuevo pinch
                pinchActiveRef.current = true;
            }
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!ptrs.has(e.pointerId)) return;
            e.preventDefault();
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
            if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
            if (ptrs.size < 2) {
                lastDist = 0;
                pinchActiveRef.current = false;
                // La velocidad acumulada seguirá aplicándose en useFrame (inercia)
            }
        };

        // Captura antes que OrbitControls: aunque su zoom esté desactivado,
        // algunos navegadores entregan primero allí la rueda y el gesto parece muerto.
        canvas.addEventListener('wheel', onWheel, { passive: false, capture: true });
        canvas.addEventListener('pointerdown', onPointerDown, { passive: false, capture: true });
        canvas.addEventListener('pointermove', onPointerMove, { passive: false, capture: true });
        canvas.addEventListener('pointerup', onPointerUp, { capture: true });
        canvas.addEventListener('pointercancel', onPointerUp, { capture: true });

        return () => {
            canvas.removeEventListener('wheel', onWheel, { capture: true });
            canvas.removeEventListener('pointerdown', onPointerDown, { capture: true });
            canvas.removeEventListener('pointermove', onPointerMove, { capture: true });
            canvas.removeEventListener('pointerup', onPointerUp, { capture: true });
            canvas.removeEventListener('pointercancel', onPointerUp, { capture: true });
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
    const declinationRef = useRef(0);
    const lastObserverRef = useRef({ lat: Number.NaN, lon: Number.NaN, year: Number.NaN });

    useFrame(() => {
        if (!followOrientation) return;

        // Usar heading y elevation ya corregidos y suavizados del sensor
        const { heading, elevation } = deviceOrientationRef;
        const { observer, time, compassCalibrationOffset, arElevationCalibrationOffset } = useAppStore.getState();
        const year = time.getFullYear() + time.getMonth() / 12;
        const lastObserver = lastObserverRef.current;
        if (
            !Number.isFinite(lastObserver.lat)
            || Math.abs(observer.lat - lastObserver.lat) > 0.5
            || Math.abs(observer.lon - lastObserver.lon) > 0.5
            || Math.abs(year - lastObserver.year) > 0.5
        ) {
            declinationRef.current = computeMagneticDeclination(observer.lat, observer.lon, time);
            lastObserverRef.current = { lat: observer.lat, lon: observer.lon, year };
        }
        const trueHeading = heading
            + declinationRef.current
            + compassCalibrationOffset;

        const targetEl = THREE.MathUtils.clamp(elevation + arElevationCalibrationOffset, -20, 90);

        // Azimut wrap-around seguro
        const dAz = ((trueHeading - azRef.current) % 360 + 540) % 360 - 180;
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

function OcularAdaptation() {
    const { gl } = useThree();
    const exposureRef = useRef(1);

    useFrame((_, delta) => {
        const { settings, viewMode } = useAppStore.getState();
        const target = viewMode === 'camera'
            ? 1
            : ocularExposureTarget(
                sunHorRef.alt,
                moonHorRef.alt,
                moonHorRef.illuminatedFraction,
                settings.bortleScale,
            );
        // El ojo se contrae rápido ante luz y se adapta más despacio a oscuridad.
        const responseSeconds = target < exposureRef.current ? 1.8 : 11;
        exposureRef.current = THREE.MathUtils.damp(exposureRef.current, target, 1 / responseSeconds, delta);
        // eslint-disable-next-line react-hooks/immutability -- Three renderer exposure is an imperative frame property.
        gl.toneMappingExposure = exposureRef.current;
    });

    useEffect(() => () => {
        gl.toneMappingExposure = 1;
    }, [gl]);
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
    const camFov = useAppStore((state) => state.camFov);
    const setCamFov = useAppStore((state) => state.setCamFov);
    const compassCalibrationOffset = useAppStore((state) => state.compassCalibrationOffset);
    const arElevationCalibrationOffset = useAppStore((state) => state.arElevationCalibrationOffset);
    const setCompassCalibrationOffset = useAppStore((state) => state.setCompassCalibrationOffset);
    const setArElevationCalibrationOffset = useAppStore((state) => state.setArElevationCalibrationOffset);
    const setArCalibrationUpdatedAt = useAppStore((state) => state.setArCalibrationUpdatedAt);
    const observer = useAppStore((state) => state.observer);
    const time = useAppStore((state) => state.time);
    const [isArAligning, setIsArAligning] = useState(false);
    const [arAlignmentMessage, setArAlignmentMessage] = useState<string | null>(null);
    const arOverlayReady = (viewMode !== 'camera' || followOrientation) && !isArAligning;

    // Cap DPR by quality tier to avoid rendering at 3× on flagship Android phones
    const maxDpr = deviceQuality === 'low' ? 1.0 : deviceQuality === 'medium' ? 1.5 : 2.0;

    // Create a ref for OrbitControls to sync it
    const controlsRef = useRef<OrbitControlsImpl | null>(null);
    const trackingRef = useRef(false);
    const manualFovRef = useRef<number | null>(null);

    const changeZoom = (delta: number) => {
        const next = THREE.MathUtils.clamp(camFov + delta, 10, 90);
        manualFovRef.current = next;
        setCamFov(next);
    };

    const alignCameraToMoon = useCallback(() => {
        if (!deviceOrientationRef.active) {
            setArAlignmentMessage('El sensor de orientación no está activo.');
            return;
        }
        if (moonHorRef.alt <= 0) {
            setArAlignmentMessage('La Luna está bajo el horizonte y no puede usarse para alinear.');
            return;
        }

        const result = calibrateArToTarget({
            sensorHeading: deviceOrientationRef.heading,
            sensorElevation: deviceOrientationRef.elevation,
            magneticDeclination: computeMagneticDeclination(observer.lat, observer.lon, time),
            currentHeadingOffset: compassCalibrationOffset,
            currentElevationOffset: arElevationCalibrationOffset,
            targetAzimuth: moonHorRef.az,
            targetAltitude: moonHorRef.alt,
        });

        setCompassCalibrationOffset(result.headingOffset);
        setArElevationCalibrationOffset(result.elevationOffset);
        setArCalibrationUpdatedAt(Date.now());
        setIsArAligning(false);
        setArAlignmentMessage('Alineación con la Luna aplicada.');
        window.setTimeout(() => setArAlignmentMessage(null), 3500);
    }, [
        arElevationCalibrationOffset,
        compassCalibrationOffset,
        observer.lat,
        observer.lon,
        setArCalibrationUpdatedAt,
        setArElevationCalibrationOffset,
        setCompassCalibrationOffset,
        time,
    ]);

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
                    {arOverlayReady && <CelestialGroup>
                        <ErrorBoundary label="BackgroundStars"><BackgroundStars /></ErrorBoundary>
                        {showMilkyWay && <ErrorBoundary label="MilkyWay"><MilkyWaySkyDome /></ErrorBoundary>}
                        {/* Catálogo Hipparcos — 14.984 estrellas hasta mag 7, carga asíncrona */}
                        <ErrorBoundary label="HipparcosStars"><HipparcosStars /></ErrorBoundary>
                        {/* Gaia DR3 real, bajo demanda y solo al ampliar el campo. */}
                        <ErrorBoundary label="GaiaStars"><GaiaStars /></ErrorBoundary>
                        {/* Estrellas nombradas (355) con hitboxes e interacción — encima del catálogo */}
                        <ErrorBoundary label="Stars"><Stars /></ErrorBoundary>
                        {/* Catálogo NGC/IC — 10.000 objetos, puntos difusos, renderOrder=0 (debajo de DSOs nombrados) */}
                        <ErrorBoundary label="NGCObjects"><NGCObjects /></ErrorBoundary>
                        <ErrorBoundary label="DeepSkyObjects"><DeepSkyObjects /></ErrorBoundary>
                        <ErrorBoundary label="Constellations"><Constellations /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationBoundaries"><ConstellationBoundaries /></ErrorBoundary>
                        <ErrorBoundary label="Asterisms"><Asterisms /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationArt"><ConstellationArt /></ErrorBoundary>
                        <ErrorBoundary label="ConstellationLabels"><ConstellationLabels /></ErrorBoundary>
                        <ErrorBoundary label="Planets"><Planets /></ErrorBoundary>
                        {showGrid && <ErrorBoundary label="CelestialGrid"><CelestialGrid /></ErrorBoundary>}
                        {showEcliptic && <ErrorBoundary label="Ecliptic"><Ecliptic /></ErrorBoundary>}
                        <ErrorBoundary label="TargetPointer"><TargetPointer /></ErrorBoundary>
                        {/* Cometas con colas dinámicas (usan coordenadas ecuatoriales) */}
                        {showComets && <ErrorBoundary label="Comets"><Comets /></ErrorBoundary>}
                        <ErrorBoundary label="SimbadOverlay"><SimbadOverlay /></ErrorBoundary>
                    </CelestialGroup>}

                    {/* Satélites en espacio mundo horizontal (Alt/Az), NO dentro del CelestialGroup */}
                    {arOverlayReady && <ErrorBoundary label="Satellites"><Satellites /></ErrorBoundary>}
                    {/* ISS: predicción de paso + arco de trayectoria */}
                    {arOverlayReady && <ErrorBoundary label="ISSPassPredictor"><ISSPassPredictor /></ErrorBoundary>}

                    <CameraNavigator
                        controlsRef={controlsRef}
                        trackingRef={trackingRef}
                        manualFovRef={manualFovRef}
                    />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}
                    <ErrorBoundary label="Horizon"><Horizon /></ErrorBoundary>

                    {/* Lluvia de meteoros real: solo con radiante real activo y cielo oscuro, sin simulacion */}
                    {arOverlayReady && <ErrorBoundary label="Meteors"><Meteors /></ErrorBoundary>}

                    <CinematicTour />
                    <OcularAdaptation />
                    <TelescopeEffect />

                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    <CameraSync />
                </Suspense>
            </Canvas>

            {viewMode === 'camera' && followOrientation && !isArAligning && (
                <button
                    type="button"
                    onClick={() => {
                        setArAlignmentMessage(null);
                        setIsArAligning(true);
                    }}
                    className="absolute left-1/2 top-4 z-[75] flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-300/45 bg-[#06101d]/90 px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-cyan-100 shadow-xl backdrop-blur-md"
                >
                    <Crosshair className="h-4 w-4" />
                    ALINEAR LUNA
                </button>
            )}

            {viewMode === 'camera' && followOrientation && isArAligning && (
                <div className="absolute inset-0 z-[80]">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.65)]">
                        <span className="absolute left-1/2 top-1/2 h-px w-28 -translate-x-1/2 bg-cyan-100/80" />
                        <span className="absolute left-1/2 top-1/2 h-28 w-px -translate-y-1/2 bg-cyan-100/80" />
                    </div>
                    <div className="absolute bottom-28 left-1/2 flex w-[min(92vw,360px)] -translate-x-1/2 flex-col gap-3 rounded-2xl border border-cyan-300/35 bg-[#050b16]/94 p-4 text-center shadow-2xl backdrop-blur-md">
                        <p className="text-sm font-bold text-white">Centra la Luna real en la retícula</p>
                        <p className="text-[11px] leading-relaxed text-white/65">No centres el marcador del mapa. Apunta la cámara directamente a la Luna que ves en el cielo.</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setIsArAligning(false)} className="rounded-lg border border-white/15 px-3 py-2 text-[11px] font-semibold text-white/70">CANCELAR</button>
                            <button type="button" onClick={alignCameraToMoon} className="rounded-lg border border-cyan-300/45 bg-cyan-400/20 px-3 py-2 text-[11px] font-bold text-cyan-50">LUNA CENTRADA</button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'camera' && arAlignmentMessage && (
                <div className="pointer-events-none absolute left-1/2 top-16 z-[85] -translate-x-1/2 rounded-xl border border-cyan-300/35 bg-[#050b16]/92 px-4 py-2 text-center text-[11px] font-semibold text-cyan-50 shadow-xl backdrop-blur-md">
                    {arAlignmentMessage}
                </div>
            )}

            {viewMode === 'camera' && !followOrientation && (
                <div className="pointer-events-none absolute inset-0 z-[45] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-cyan-300/25 bg-[#050b16]/82 px-5 py-4 text-center shadow-2xl backdrop-blur-md">
                        <div className="h-12 w-12 rounded-full border border-cyan-300/55 before:absolute" aria-hidden="true" />
                        <p className="max-w-[250px] text-[11px] font-semibold leading-relaxed tracking-wide text-cyan-50/90">
                            Activa y calibra el seguimiento AR para alinear Luna, planetas y estrellas con la cámara.
                        </p>
                    </div>
                </div>
            )}

            <div
                className="absolute right-3 top-1/2 z-[70] flex -translate-y-1/2 flex-col items-center overflow-hidden rounded-xl border border-white/10 bg-[#050a16]/90 text-white/70 shadow-lg backdrop-blur-md md:right-4"
                aria-label="Controles de zoom"
                data-fov={camFov.toFixed(2)}
            >
                <button type="button" onClick={() => changeZoom(5)} title="Alejar" aria-label="Alejar" className="flex h-9 w-9 items-center justify-center hover:bg-white/10 hover:text-white"><Minus className="h-4 w-4" /></button>
                <button type="button" onClick={() => { manualFovRef.current = 60; setCamFov(60); }} title="Restablecer zoom" aria-label="Restablecer zoom" className="flex h-9 w-9 items-center justify-center border-y border-white/10 hover:bg-white/10 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => changeZoom(-5)} title="Acercar" aria-label="Acercar" className="flex h-9 w-9 items-center justify-center hover:bg-white/10 hover:text-white"><Plus className="h-4 w-4" /></button>
            </div>

            {/* Brújula y botón AR — fuera del Canvas para evitar transforms de drei/Html */}
            <Compass />

            {/* Alerta objeto bajo el horizonte */}
            <SubHorizonAlert />
        </div>
    );
}
