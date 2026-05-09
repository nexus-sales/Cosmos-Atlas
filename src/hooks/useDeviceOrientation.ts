'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type OrientationPermission = 'idle' | 'granted' | 'denied' | 'unavailable';

/**
 * Module-level ref — updated at sensor rate (60 Hz) without React re-renders.
 * Read this directly inside useFrame to avoid subscription overhead.
 *
 * heading   = alpha corregido por orientación de pantalla (0 = Norte real)
 * elevation = ángulo sobre el horizonte (0° = horizonte, 90° = cénit)
 *             Incorpora gamma para modo landscape y compensa screen.orientation.angle
 */
export const deviceOrientationRef = {
    alpha: 0,     // Raw compass heading 0–360°
    beta: 0,      // Raw front-back tilt
    gamma: 0,     // Raw left-right tilt
    heading: 0,   // Heading corregido por orientación de pantalla
    elevation: 0, // Elevación real sobre el horizonte (landscape-safe)
    headingJitter: 0, // Jitter estimado del heading (grados)
    magneticQuality: 'unknown' as 'unknown' | 'good' | 'unstable',
    needsCalibration: false,
    active: false,
};

/**
 * Filtro complementario EMA sobre deviceorientation.
 *
 * El navegador ya entrega alpha/beta/gamma fusionados internamente (giroscopio
 * + acelerómetro + magnetómetro). Aplicar Madgwick encima introduce inestabilidad
 * porque solo tenemos ángulos, no velocidades angulares en rad/s.
 *
 * Este filtro EMA elimina el ruido residual de alta frecuencia sin reintroducir
 * drift. FILTER_ALPHA = 0.85 a 60 Hz: respuesta ágil con jitter mínimo.
 */
const FILTER_ALPHA = 0.65; // 0 = sin suavizado, 1 = sin respuesta. τ = 1/(60×0.35) ≈ 48ms — equilibrio entre jitter y latencia AR

type CompassCapableEvent = DeviceOrientationEvent & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
};

function applyComplementaryFilter(prev: number, raw: number, alpha: number): number {
    // Manejo del wraparound en alpha (0–360 → problema al cruzar 0/360)
    return alpha * prev + (1 - alpha) * raw;
}

function applyAlphaFilter(prev: number, raw: number, alpha: number): number {
    // El heading puede saltar de 359→1. Resolver wraparound antes de filtrar.
    let diff = raw - prev;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const filtered = prev + diff * (1 - alpha);
    return ((filtered % 360) + 360) % 360;
}

export function computeRearCameraHeading(alpha: number, beta: number, gamma: number): number {
    const degToRad = Math.PI / 180;
    const x = beta * degToRad;
    const y = gamma * degToRad;
    const z = alpha * degToRad;

    const cY = Math.cos(y);
    const cZ = Math.cos(z);
    const sX = Math.sin(x);
    const sY = Math.sin(y);
    const sZ = Math.sin(z);

    const vx = -cZ * sY - sZ * sX * cY;
    const vy = -sZ * sY + cZ * sX * cY;

    // vx/vy are the horizontal projection of the rear-camera optical axis in
    // the browser orientation frame. Use it directly so 0 deg remains North;
    // flipping it here makes AR point to the opposite horizon.
    return (Math.atan2(vx, vy) * (180 / Math.PI) + 360) % 360;
}

export function computeRearCameraElevation(beta: number, gamma: number): number {
    // Modo Diablo: Detección de orientación de pantalla para compensar beta/gamma.
    // En Landscape, el eje de elevación se intercambia entre beta y gamma.
    // Usamos la proyección del vector Z del dispositivo en el mundo.
    
    // Obtenemos el ángulo de rotación de la pantalla (0, 90, -90, 180)
    const screenAngle = typeof window !== 'undefined' ? (window.screen.orientation?.angle || 0) : 0;
    
    // Vector que apunta "hacia afuera" de la pantalla (Eje Z del móvil)
    // En Portrait: elevación depende mayormente de beta.
    // En Landscape: elevación depende mayormente de gamma.
    let elevation = 0;

    if (screenAngle === 0) {
        // Vertical estándar: beta manda.
        // Modo Diablo: En el hemisferio sur, si beta=90 (móvil vertical), 
        // la elevación debe ser 0. Si el móvil se inclina hacia atrás para mirar el cénit,
        // la elevación debe subir a 90.
        elevation = -beta; 
    } else if (screenAngle === 90) {
        // Horizontal (botón a la derecha): gamma manda
        elevation = -gamma;
    } else if (screenAngle === -90 || screenAngle === 270) {
        // Horizontal (botón a la izquierda): gamma invertido manda
        elevation = gamma;
    } else {
        // Invertido: beta invertido
        elevation = beta;
    }

    // Normalizar: 0 en el horizonte, +90 en el cénit.
    // La mayoría de sensores devuelven el móvil plano (mesa) como beta=0.
    // Si lo levantas vertical hacia el horizonte, beta sube a 90.
    // Queremos que "mirar al frente" sea 0 y "mirar arriba" sea 90.
    return elevation + 90;
}

function extractMagneticHeading(e: CompassCapableEvent, alpha: number, beta: number, gamma: number): number {
    if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) {
        // Safari already reports the camera-facing compass direction for this
        // AR pose; adding 180 deg points the overlay at the opposite horizon.
        return e.webkitCompassHeading;
    }

    return computeRearCameraHeading(alpha, beta, gamma);
}

/**
 * Returns whether the current device is likely to have a gyroscope.
 * Conservative check: only mobile/tablet user agents.
 */
function detectGyroscopeSupport(): boolean {
    if (typeof window === 'undefined') return false;
    if (!('DeviceOrientationEvent' in window)) return false;
    // On desktop Chrome/Firefox DeviceOrientationEvent exists but always fires zeros.
    // Use the user-agent as a heuristic to hide the button on desktop.
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile|tablet/.test(ua);
    // Also allow if the platform reports as "MacIntel" with touch support (iPad with desktop UA)
    const isIPadDesktopUA =
        navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return isMobile || isIPadDesktopUA;
}

export function useDeviceOrientation() {
    const [isSupported] = useState<boolean>(() => detectGyroscopeSupport());
    const [permission, setPermission] = useState<OrientationPermission>('idle');
    const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
    // Estado interno del filtro — se inicializa en el primer evento
    const filterInitialized = useRef(false);
    const prevHeadingRef = useRef<number | null>(null);
    const jitterEmaRef = useRef(0);
    const unstableCounterRef = useRef(0);

    const startListening = useCallback(() => {
        if (listenerRef.current) return; // already listening

        filterInitialized.current = false;
        prevHeadingRef.current = null;
        jitterEmaRef.current = 0;
        unstableCounterRef.current = 0;
        deviceOrientationRef.headingJitter = 0;
        deviceOrientationRef.magneticQuality = 'unknown';
        deviceOrientationRef.needsCalibration = false;

        // Track whether absolute events are available (Chrome Android 66+).
        // Absolute events have e.absolute=true and give North-relative alpha.
        // If both event types fire, we ignore the non-absolute ones to avoid
        // processing the same physical motion twice with different reliability.
        let absoluteAvailable = false;

        const handler = (e: DeviceOrientationEvent) => {
            if (e.absolute) absoluteAvailable = true;
            // Skip non-absolute events once absolute ones are flowing
            if (absoluteAvailable && !e.absolute) return;
            const rawAlpha = e.alpha ?? 0;
            const rawBeta = e.beta ?? 0;
            const rawGamma = e.gamma ?? 0;

            // Almacenamos raw para diagnóstico y uso futuro
            deviceOrientationRef.alpha = rawAlpha;
            deviceOrientationRef.beta = rawBeta;
            deviceOrientationRef.gamma = rawGamma;

            // Norte magnético del eje -Z (cámara trasera)
            const magneticHeading = extractMagneticHeading(
                e as CompassCapableEvent,
                rawAlpha,
                rawBeta,
                rawGamma,
            );
            
            // La cámara siempre apunta a lo largo del eje físico -Z del dispositivo.
            // Al rotar la pantalla a landscape, el navegador rota el Canvas, pero
            // el eje -Z sigue apuntando a la misma estrella física. 
            // NO debemos sumar screenAngle al heading en modo AR.
            const correctedHeading = magneticHeading;

            // Inclinación real del eje -Z del dispositivo sobre el horizonte.
            const rawElevation = computeRearCameraElevation(rawBeta, rawGamma);

            if (!filterInitialized.current) {
                deviceOrientationRef.heading = correctedHeading;
                deviceOrientationRef.elevation = rawElevation;
                filterInitialized.current = true;
                prevHeadingRef.current = correctedHeading;
                return;
            }

            // EMA Smoothing AL FINAL de la computación
            deviceOrientationRef.heading = applyAlphaFilter(deviceOrientationRef.heading, correctedHeading, FILTER_ALPHA);
            deviceOrientationRef.elevation = applyComplementaryFilter(deviceOrientationRef.elevation, rawElevation, FILTER_ALPHA);

            // Diagnóstico de estabilidad magnética:
            // si hay saltos grandes de heading sin movimiento relevante del teléfono,
            // consideramos señal inestable y sugerimos recalibración.
            const prevHeading = prevHeadingRef.current;
            if (prevHeading != null) {
                let dHeading = correctedHeading - prevHeading;
                if (dHeading > 180) dHeading -= 360;
                if (dHeading < -180) dHeading += 360;
                const absHeadingJump = Math.abs(dHeading);

                jitterEmaRef.current = jitterEmaRef.current * 0.88 + absHeadingJump * 0.12;
                deviceOrientationRef.headingJitter = jitterEmaRef.current;

                const motionAmount = Math.abs(rawBeta) + Math.abs(rawGamma);
                const suspiciousJump = motionAmount < 18 && absHeadingJump > 9;

                if (suspiciousJump) {
                    unstableCounterRef.current = Math.min(24, unstableCounterRef.current + 1);
                } else {
                    unstableCounterRef.current = Math.max(0, unstableCounterRef.current - 1);
                }

                deviceOrientationRef.needsCalibration = unstableCounterRef.current >= 7;
                deviceOrientationRef.magneticQuality =
                    unstableCounterRef.current >= 4 ? 'unstable' : 'good';
            }
            prevHeadingRef.current = correctedHeading;
        };
        listenerRef.current = handler;
        // Chrome Android 66+: absolute events give North-relative heading
        window.addEventListener('deviceorientationabsolute', handler, true);
        // iOS (webkitCompassHeading) and fallback for other browsers
        window.addEventListener('deviceorientation', handler, true);
        deviceOrientationRef.active = true;
    }, []);

    const stop = useCallback(() => {
        if (listenerRef.current) {
            window.removeEventListener('deviceorientationabsolute', listenerRef.current, true);
            window.removeEventListener('deviceorientation', listenerRef.current, true);
            listenerRef.current = null;
        }
        deviceOrientationRef.active = false;
        setPermission('idle');
    }, []);

    const requestAndStart = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setPermission('unavailable');
            return false;
        }

        // iOS 13+ requires explicit user-gesture permission
        const needsPermission =
            typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
                .requestPermission === 'function';

        if (needsPermission) {
            try {
                const result = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
                    .requestPermission();
                if (result === 'granted') {
                    setPermission('granted');
                    startListening();
                    return true;
                } else {
                    setPermission('denied');
                    return false;
                }
            } catch {
                setPermission('denied');
                return false;
            }
        } else {
            // Android / non-iOS browsers: no permission needed
            setPermission('granted');
            startListening();
            return true;
        }
    }, [isSupported, startListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (listenerRef.current) {
                window.removeEventListener('deviceorientationabsolute', listenerRef.current, true);
                window.removeEventListener('deviceorientation', listenerRef.current, true);
                listenerRef.current = null;
            }
        };
    }, []);

    return { isSupported, permission, requestAndStart, stop };
}
