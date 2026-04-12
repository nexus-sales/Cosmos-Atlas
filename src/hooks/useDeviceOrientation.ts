'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type OrientationPermission = 'idle' | 'granted' | 'denied' | 'unavailable';

/**
 * Module-level ref — updated at sensor rate (60 Hz) without React re-renders.
 * Read this directly inside useFrame to avoid subscription overhead.
 *
 * Los valores aquí son YA FILTRADOS por el filtro complementario.
 * No usar los valores crudos del evento deviceorientation directamente.
 */
export const deviceOrientationRef = {
    alpha: 0, // Compass heading 0–360°, 0 = North  (filtrado)
    beta: 0,  // Front-back tilt −180–180°, 0 = flat/face-up  (filtrado)
    gamma: 0, // Left-right tilt −90–90°  (filtrado)
    active: false,
};

/**
 * Filtro complementario para fusión giroscopio + acelerómetro.
 * Elimina el temblor de alta frecuencia del acelerómetro y el drift
 * de baja frecuencia del giroscopio. Alpha = 0.92 es el balance óptimo
 * para 60 Hz: respuesta rápida sin jitter visible.
 *
 * Fórmula: filtered = α * (filtered + gyro_delta) + (1-α) * accel_reading
 * Para deviceorientation el navegador ya hace la fusión internamente,
 * así que aplicamos el filtro como suavizado exponencial (EMA) directamente
 * sobre alpha/beta/gamma para eliminar el ruido residual del magnetómetro.
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

    const startListening = useCallback(() => {
        if (listenerRef.current) return; // already listening

        filterInitialized.current = false;

        const handler = (e: DeviceOrientationEvent) => {
            const rawAlpha = e.alpha ?? 0;
            const rawBeta  = e.beta  ?? 0;
            const rawGamma = e.gamma ?? 0;

            if (!filterInitialized.current) {
                // Primera lectura: inicializar sin filtrar para no empezar en (0,0,0)
                deviceOrientationRef.alpha = rawAlpha;
                deviceOrientationRef.beta  = rawBeta;
                deviceOrientationRef.gamma = rawGamma;
                filterInitialized.current  = true;
                return;
            }

            // Filtro complementario — elimina jitter del magnetómetro y acelerómetro
            deviceOrientationRef.alpha = applyAlphaFilter(deviceOrientationRef.alpha, rawAlpha, FILTER_ALPHA);
            deviceOrientationRef.beta  = applyComplementaryFilter(deviceOrientationRef.beta,  rawBeta,  FILTER_ALPHA);
            deviceOrientationRef.gamma = applyComplementaryFilter(deviceOrientationRef.gamma, rawGamma, FILTER_ALPHA);
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

    const requestAndStart = useCallback(async () => {
        if (!isSupported) {
            setPermission('unavailable');
            return;
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
                } else {
                    setPermission('denied');
                }
            } catch {
                setPermission('denied');
            }
        } else {
            // Android / non-iOS browsers: no permission needed
            setPermission('granted');
            startListening();
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
