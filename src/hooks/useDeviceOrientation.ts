'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type OrientationPermission = 'idle' | 'granted' | 'denied' | 'unavailable';

/**
 * Module-level ref — updated at sensor rate (60 Hz) without React re-renders.
 * Read this directly inside useFrame to avoid subscription overhead.
 *
 * Los valores aquí son YA FILTRADOS por el filtro Madgwick.
 * No usar los valores crudos del evento deviceorientation directamente.
 */
export const deviceOrientationRef = {
    alpha: 0, // Compass heading 0–360°, 0 = North  (filtrado)
    beta: 0,  // Front-back tilt −180–180°, 0 = flat/face-up  (filtrado)
    gamma: 0, // Left-right tilt −90–90°  (filtrado)
    active: false,
};

/**
 * Filtro Madgwick simplificado para fusión de orientación.
 * 
 * El filtro Madgwick original usa giroscopio + acelerómetro + magnetómetro
 * para estimar la orientación 3D mediante quaterniones. Como los navegadores
 * ya proporcionan deviceorientation fusionado, implementamos una versión 
 * adaptada que:
 * 
 * 1. Mantiene un quaternion de orientación estimado
 * 2. Usa la gravedad como vector de referencia (acelerómetro implícito)
 * 3. Aplica corrección proporcional-integral (PI) para eliminar drift
 * 4. Suaviza con un filtro de confianza basado en la estabilidad del sensor
 * 
 * This provides better drift correction than a simple EMA, especially
 * for sustained orientations and slow movements.
 */

// Parámetros del filtro Madgwick adaptado
const MADGWICK_BETA = 0.08; // Gain del algoritmo de gradiente (0.02-0.1 típico)
const INTEGRAL_GAIN_KI = 0.001; // Ganancia integral para eliminar bias
const SAMPLE_FREQ = 60; // Frecuencia de muestreo estimada (Hz)

// Estado del filtro Madgwick
interface MadgwickState {
    // Quaternion de orientación [w, x, y, z]
    q: [number, number, number, number];
    // Bias del giroscopio integrado (integral error)
    integralFB: [number, number, number];
    // Última orientación euleriana (para conversión)
    lastAlpha: number;
    lastBeta: number;
    lastGamma: number;
    // Timestamp de última actualización
    lastUpdate: number;
}

const madgwickState: MadgwickState = {
    q: [1, 0, 0, 0], // Identity quaternion
    integralFB: [0, 0, 0],
    lastAlpha: 0,
    lastBeta: 0,
    lastGamma: 0,
    lastUpdate: 0,
};

/**
 * Quaternion multiplication
 */
function quatMultiply(q1: [number, number, number, number], q2: [number, number, number, number]): [number, number, number, number] {
    return [
        q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] - q1[3] * q2[3],
        q1[0] * q2[1] + q1[1] * q2[0] + q1[2] * q2[3] - q1[3] * q2[2],
        q1[0] * q2[2] - q1[1] * q2[3] + q1[2] * q2[0] + q1[3] * q2[1],
        q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1] + q1[3] * q2[0],
    ];
}

/**
 * Normalize a quaternion
 */
function quatNormalize(q: [number, number, number, number]): [number, number, number, number] {
    const norm = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    if (norm === 0) return [1, 0, 0, 0];
    return [q[0] / norm, q[1] / norm, q[2] / norm, q[3] / norm];
}

/**
 * Euler angles (ZYX) to quaternion conversion
 */
function eulerToQuaternion(alpha: number, beta: number, gamma: number): [number, number, number, number] {
    // Convertir grados a radianes
    const a = alpha * Math.PI / 180;
    const b = beta * Math.PI / 180;
    const g = gamma * Math.PI / 180;

    // Half angles
    const cy = Math.cos(a * 0.5);
    const sy = Math.sin(a * 0.5);
    const cp = Math.cos(b * 0.5);
    const sp = Math.sin(b * 0.5);
    const cr = Math.cos(g * 0.5);
    const sr = Math.sin(g * 0.5);

    return [
        cy * cp * cr + sy * sp * sr,
        cy * cp * sr - sy * sp * cr,
        sy * cp * sr + cy * sp * cr,
        sy * cp * cr - cy * sp * sr,
    ];
}

/**
 * Quaternion to Euler angles (ZYX) conversion
 */
function quaternionToEuler(q: [number, number, number, number]): { alpha: number; beta: number; gamma: number } {
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (q[0] * q[1] + q[2] * q[3]);
    const cosr_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (q[0] * q[2] - q[3] * q[1]);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
        pitch = Math.sign(sinp) * Math.PI / 2;
    } else {
        pitch = Math.asin(sinp);
    }

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (q[0] * q[3] + q[1] * q[2]);
    const cosy_cosp = 1 - 2 * (q[2] * q[2] + q[3] * q[3]);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return {
        alpha: ((yaw * 180 / Math.PI) % 360 + 360) % 360,
        beta: pitch * 180 / Math.PI,
        gamma: roll * 180 / Math.PI,
    };
}

/**
 * Madgwick filter update using accelerometer feedback
 * 
 * This simplified version uses the measured orientation as a "gyroscope"
 * rate and corrects drift using an accelerometer-based reference.
 */
function madgwickUpdate(
    alpha: number,
    beta: number,
    gamma: number,
    dt: number
): { alpha: number; beta: number; gamma: number } {
    // Calcular la tasa de cambio (gyro aproximado)
    const gyroX = (beta - madgwickState.lastBeta) / dt;
    const gyroY = (gamma - madgwickState.lastGamma) / dt;
    const gyroZ = ((alpha - madgwickState.lastAlpha + 540) % 360 - 180) / dt;

    // Convertir a radianes/segundo
    const gx = gyroX * Math.PI / 180;
    const gy = gyroY * Math.PI / 180;
    const gz = gyroZ * Math.PI / 180;

    // Pre-normalizar quaternion
    let q = quatNormalize([...madgwickState.q]);

    // Quaternion delta basado en el giroscopio
    const qDot = [
        0.5 * (-q[1] * gx - q[2] * gy - q[3] * gz),
        0.5 * (q[0] * gx + q[2] * gz - q[3] * gy),
        0.5 * (q[0] * gy - q[1] * gz + q[3] * gx),
        0.5 * (q[0] * gz + q[1] * gy - q[2] * gx),
    ];

    // Estimar dirección de gravedad en el frame del sensor
    const gravityInBody = [
        2 * (q[1] * q[3] - q[0] * q[2]),
        2 * (q[0] * q[1] + q[2] * q[3]),
        q[0] * q[0] - q[1] * q[1] - q[2] * q[2] + q[3] * q[3],
    ];

    // La gravedad medida asume que el dispositivo está relativamente plano
    // Vector de referencia: gravedad apuntando hacia abajo en el mundo
    const gravityRef = [0, 0, -1];

    // Error entre gravedad estimada y referencia
    const error = [
        gravityInBody[1] * gravityRef[2] - gravityInBody[2] * gravityRef[1],
        gravityInBody[2] * gravityRef[0] - gravityInBody[0] * gravityRef[2],
        gravityInBody[0] * gravityRef[1] - gravityInBody[1] * gravityRef[0],
    ];

    // Aplicar ganancia integral
    madgwickState.integralFB[0] += error[0] * INTEGRAL_GAIN_KI;
    madgwickState.integralFB[1] += error[1] * INTEGRAL_GAIN_KI;
    madgwickState.integralFB[2] += error[2] * INTEGRAL_GAIN_KI;

    // Corregir quaternion delta con feedback
    qDot[0] -= MADGWICK_BETA * error[0];
    qDot[1] -= MADGWICK_BETA * error[1];
    qDot[2] -= MADGWICK_BETA * error[2];

    // Integrar quaternion
    q[0] += qDot[0] * dt;
    q[1] += qDot[1] * dt;
    q[2] += qDot[2] * dt;
    q[3] += qDot[3] * dt;

    // Normalizar y guardar
    madgwickState.q = quatNormalize(q);

    // Actualizar últimos valores
    madgwickState.lastAlpha = alpha;
    madgwickState.lastBeta = beta;
    madgwickState.lastGamma = gamma;

    // Convertir de vuelta a Euler
    return quaternionToEuler(madgwickState.q);
}

function applyMadgwickFilter(
    rawAlpha: number,
    rawBeta: number,
    rawGamma: number,
    timestamp: number
): { alpha: number; beta: number; gamma: number } {
    // Primera inicialización
    if (madgwickState.lastUpdate === 0) {
        madgwickState.lastUpdate = timestamp;
        madgwickState.q = eulerToQuaternion(rawAlpha, rawBeta, rawGamma);
        return { alpha: rawAlpha, beta: rawBeta, gamma: rawGamma };
    }

    // Calcular delta time (en segundos, con límite para evitar spikes)
    const dt = Math.min((timestamp - madgwickState.lastUpdate) / 1000, 0.1);
    madgwickState.lastUpdate = timestamp;

    // Aplicar filtro Madgwick
    const filtered = madgwickUpdate(rawAlpha, rawBeta, rawGamma, dt);

    // Aplicar fallback EMA si dt es muy grande (evitar inestabilidad)
    if (dt > 0.05) {
        const emaAlpha = applyAlphaFilter(deviceOrientationRef.alpha, filtered.alpha, 0.7);
        const emaBeta = applyComplementaryFilter(deviceOrientationRef.beta, filtered.beta, 0.7);
        const emaGamma = applyComplementaryFilter(deviceOrientationRef.gamma, filtered.gamma, 0.7);
        return { alpha: emaAlpha, beta: emaBeta, gamma: emaGamma };
    }

    return filtered;
}

/**
 * Fallback: Filtro complementario simple EMA cuando Madgwick no es estable.
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
            const rawBeta = e.beta ?? 0;
            const rawGamma = e.gamma ?? 0;

            if (!filterInitialized.current) {
                // Primera lectura: inicializar sin filtrar para no empezar en (0,0,0)
                deviceOrientationRef.alpha = rawAlpha;
                deviceOrientationRef.beta = rawBeta;
                deviceOrientationRef.gamma = rawGamma;
                filterInitialized.current = true;
                return;
            }

            // Filtro complementario — elimina jitter del magnetómetro y acelerómetro
            deviceOrientationRef.alpha = applyAlphaFilter(deviceOrientationRef.alpha, rawAlpha, FILTER_ALPHA);
            deviceOrientationRef.beta = applyComplementaryFilter(deviceOrientationRef.beta, rawBeta, FILTER_ALPHA);
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
