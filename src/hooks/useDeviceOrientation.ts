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
const FILTER_ALPHA = 0.85; // 0 = sin suavizado, 1 = sin respuesta

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

        const handler = (e: DeviceOrientationEvent) => {
            const rawAlpha = e.alpha ?? 0;
            const rawBeta = e.beta ?? 0;
            const rawGamma = e.gamma ?? 0;

            if (!filterInitialized.current) {
                deviceOrientationRef.alpha = rawAlpha;
                deviceOrientationRef.beta = rawBeta;
                deviceOrientationRef.gamma = rawGamma;
                filterInitialized.current = true;
                return;
            }

            // Filtro EMA sobre los valores raw
            deviceOrientationRef.alpha = applyAlphaFilter(deviceOrientationRef.alpha, rawAlpha, FILTER_ALPHA);
            deviceOrientationRef.beta  = applyComplementaryFilter(deviceOrientationRef.beta,  rawBeta,  FILTER_ALPHA);
            deviceOrientationRef.gamma = applyComplementaryFilter(deviceOrientationRef.gamma, rawGamma, FILTER_ALPHA);

            // ── Compensación de orientación de pantalla ──────────────────────
            // DeviceOrientationEvent da los ángulos relativos al dispositivo físico,
            // pero la orientación de pantalla cambia los ejes de referencia del usuario.
            // screen.orientation.angle: 0=portrait, 90=landscape-left, 270=landscape-right
            const screenAngle: number =
                (typeof screen !== 'undefined' && screen.orientation?.angle != null)
                    ? screen.orientation.angle
                    : 0;

            // Rotar (beta, gamma) por el ángulo de pantalla para obtener
            // la inclinación real del dispositivo en el marco del usuario.
            const screenRad = (screenAngle * Math.PI) / 180;
            const cosOrient = Math.cos(screenRad);
            const sinOrient = Math.sin(screenRad);
            const adjustedBeta = deviceOrientationRef.beta * cosOrient
                                - deviceOrientationRef.gamma * sinOrient;

            // Heading: el norte magnético se ajusta por la rotación de pantalla
            const correctedHeading = ((deviceOrientationRef.alpha - screenAngle) % 360 + 360) % 360;
            deviceOrientationRef.heading = correctedHeading;
            // Elevación: 90° − beta_ajustado. Clampeada a [-90, 90]
            deviceOrientationRef.elevation = Math.max(-90, Math.min(90, 90 - adjustedBeta));

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
        window.addEventListener('deviceorientation', handler, true);
        deviceOrientationRef.active = true;
    }, []);

    const stop = useCallback(() => {
        if (listenerRef.current) {
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
                window.removeEventListener('deviceorientation', listenerRef.current, true);
                listenerRef.current = null;
            }
        };
    }, []);

    return { isSupported, permission, requestAndStart, stop };
}
