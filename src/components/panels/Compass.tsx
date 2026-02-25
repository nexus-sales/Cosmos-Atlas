'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceOrientation, deviceOrientationRef } from '@/hooks/useDeviceOrientation';

/**
 * Brújula interactiva que muestra la dirección cardinal hacia donde mira la cámara.
 * - Clic simple: centra la vista en el cenit (mirando hacia arriba)
 * - Doble clic: centra la vista mirando al norte (horizonte)
 *
 * En dispositivos con giroscopio aparece un botón AR:
 * - Activa el modo orientación: mover el dispositivo mueve la bóveda celeste.
 * - La aguja pasa a mostrar el heading real del sensor en lugar del heading de cámara.
 */
export default function Compass() {
    const { camera } = useThree();
    const [azimuth, setAzimuth] = useState(0);
    const lastClickRef = useRef(0);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const followOrientation = useAppStore((s) => s.followOrientation);
    const setFollowOrientation = useAppStore((s) => s.setFollowOrientation);
    const { isSupported, permission, requestAndStart, stop } = useDeviceOrientation();

    // Calcular acimut cada frame
    useFrame(() => {
        if (followOrientation && deviceOrientationRef.active) {
            // Show real device heading when in AR mode
            setAzimuth(deviceOrientationRef.alpha);
        } else {
            // Dirección de vista = -camera.position normalizado
            const lookDir = camera.position.clone().negate().normalize();
            // Norte=-Z, Este=+X → azimuth 0=N, 90=E
            const az = Math.atan2(lookDir.x, -lookDir.z) * (180 / Math.PI);
            setAzimuth((az + 360) % 360);
        }
    });

    const handleCompassClick = useCallback(() => {
        if (followOrientation) return; // Don't jump while in AR mode

        const now = Date.now();
        const timeSinceLastClick = now - lastClickRef.current;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (timeSinceLastClick < 300) {
            // Doble clic → Mirar al Norte (horizonte)
            camera.position.set(0, 0, 0.01);
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                // Clic simple → Mirar al Cenit (arriba)
                camera.position.set(0, -0.01, 0.0001);
            }, 300);
        }

        lastClickRef.current = now;
    }, [camera, followOrientation]);

    const handleARToggle = useCallback(async () => {
        if (followOrientation) {
            stop();
            setFollowOrientation(false);
        } else {
            await requestAndStart();
            // Wait briefly for the listener to attach and deviceOrientationRef.active to become true
            setTimeout(() => {
                if (deviceOrientationRef.active) {
                    setFollowOrientation(true);
                }
            }, 250);
        }
    }, [followOrientation, requestAndStart, stop, setFollowOrientation]);

    const getCardinalDirection = () => {
        if (azimuth >= 337.5 || azimuth < 22.5) return 'N';
        if (azimuth >= 22.5 && azimuth < 67.5) return 'NE';
        if (azimuth >= 67.5 && azimuth < 112.5) return 'E';
        if (azimuth >= 112.5 && azimuth < 157.5) return 'SE';
        if (azimuth >= 157.5 && azimuth < 202.5) return 'S';
        if (azimuth >= 202.5 && azimuth < 247.5) return 'SO';
        if (azimuth >= 247.5 && azimuth < 292.5) return 'O';
        return 'NO';
    };

    const needleColor = followOrientation ? '#44aaff' : '#ff5555';

    return (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div className="absolute bottom-6 left-6 z-30 pointer-events-auto flex flex-col items-center gap-2">

                {/* Brújula principal */}
                <button
                    onClick={handleCompassClick}
                    className="relative w-16 h-16 rounded-full bg-black/60 backdrop-blur-md
                               border border-white/20 hover:border-blue-400/50
                               shadow-lg shadow-black/50 transition-all duration-200
                               flex items-center justify-center group"
                    title={followOrientation ? 'Orientación AR activa' : 'Clic: Cenit | Doble clic: Norte'}
                    style={followOrientation ? { borderColor: 'rgba(68,170,255,0.4)', boxShadow: '0 0 12px rgba(68,170,255,0.25)' } : undefined}
                >
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                            <line
                                key={deg}
                                x1="50" y1="6" x2="50" y2={deg % 90 === 0 ? 12 : 9}
                                stroke={deg % 90 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}
                                strokeWidth={deg % 90 === 0 ? 1.5 : 1}
                                transform={`rotate(${deg}, 50, 50)`}
                            />
                        ))}

                        <text x="50" y="20" textAnchor="middle" fill={needleColor} fontSize="11" fontWeight="bold" fontFamily="monospace">N</text>
                        <text x="84" y="54" textAnchor="middle" fill="#99bbff" fontSize="9" fontFamily="monospace">E</text>
                        <text x="50" y="88" textAnchor="middle" fill="#8888ff" fontSize="9" fontFamily="monospace">S</text>
                        <text x="16" y="54" textAnchor="middle" fill="#99bbff" fontSize="9" fontFamily="monospace">O</text>

                        <g transform={`rotate(${-azimuth}, 50, 50)`}>
                            <polygon points="50,24 46,50 50,44 54,50" fill={needleColor} />
                            <polygon points="50,76 46,50 50,56 54,50" fill="#666666" />
                        </g>

                        <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.3)" />
                        <circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.6)" />
                    </svg>

                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/60 tracking-wider whitespace-nowrap">
                        {getCardinalDirection()} {Math.round(azimuth)}°
                    </div>
                </button>

                {/* Botón AR — solo en dispositivos con giroscopio */}
                {isSupported && (
                    <button
                        onClick={handleARToggle}
                        title={followOrientation ? 'Desactivar orientación' : 'Activar orientación del dispositivo'}
                        className={`mt-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider
                                    border backdrop-blur-md shadow-lg transition-all duration-200
                                    ${followOrientation
                                ? 'bg-blue-500/30 border-blue-400/60 text-blue-300'
                                : 'bg-black/60 border-white/15 text-white/40 hover:border-white/30 hover:text-white/60'
                            }`}
                    >
                        {/* Gyroscope icon */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <ellipse cx="12" cy="12" rx="10" ry="4" />
                            <line x1="12" y1="2" x2="12" y2="22" />
                        </svg>
                        {followOrientation ? 'AR ON' : 'AR'}
                        {followOrientation && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        )}
                    </button>
                )}

                {permission === 'denied' && (
                    <div className="text-[9px] text-red-400/70 text-center max-w-[70px] leading-tight">
                        Permiso denegado
                    </div>
                )}
            </div>
        </Html>
    );
}
