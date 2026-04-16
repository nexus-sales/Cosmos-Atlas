'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceOrientation, deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { computeMagneticDeclination } from '@/lib/astronomy/magneticDeclination';

function cardinalFromAz(az: number): string {
    if (az >= 337.5 || az < 22.5) return 'N';
    if (az < 67.5) return 'NE';
    if (az < 112.5) return 'E';
    if (az < 157.5) return 'SE';
    if (az < 202.5) return 'S';
    if (az < 247.5) return 'SO';
    if (az < 292.5) return 'O';
    return 'NO';
}

export default function Compass() {
    const { camera } = useThree();
    const lastClickRef = useRef(0);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const needleGroupRef = useRef<SVGGElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    const followOrientation = useAppStore((s) => s.followOrientation);
    const setFollowOrientation = useAppStore((s) => s.setFollowOrientation);
    const compassCalibrationOffset = useAppStore((s) => s.compassCalibrationOffset);
    const setCompassCalibrationOffset = useAppStore((s) => s.setCompassCalibrationOffset);
    const zeroCompassCalibrationOffset = useAppStore((s) => s.zeroCompassCalibrationOffset);
    const { isSupported, permission, requestAndStart, stop } = useDeviceOrientation();
    const declinationRef = useRef(0);
    const lastObsRef = useRef({ lat: NaN, lon: NaN, year: NaN });

    const followOrientationRef = useRef(followOrientation);
    useEffect(() => {
        followOrientationRef.current = followOrientation;
    }, [followOrientation]);

    useFrame(() => {
        let az: number;

        if (followOrientationRef.current && deviceOrientationRef.active) {
            const { observer, time } = useAppStore.getState();
            const year = time.getFullYear() + time.getMonth() / 12;
            const last = lastObsRef.current;

            if (
                Math.abs(observer.lat - last.lat) > 0.5 ||
                Math.abs(observer.lon - last.lon) > 0.5 ||
                Math.abs(year - last.year) > 0.5
            ) {
                declinationRef.current = computeMagneticDeclination(observer.lat, observer.lon, time);
                lastObsRef.current = { lat: observer.lat, lon: observer.lon, year };
            }

            az = ((deviceOrientationRef.heading + declinationRef.current + compassCalibrationOffset) % 360 + 360) % 360;
        } else {
            const lookDir = camera.position.clone().negate().normalize();
            az = (Math.atan2(lookDir.x, -lookDir.z) * (180 / Math.PI) + 360) % 360;
        }

        if (needleGroupRef.current) {
            needleGroupRef.current.setAttribute('transform', `rotate(${-az}, 50, 50)`);
        }
        if (labelRef.current) {
            labelRef.current.textContent = `${cardinalFromAz(az)} ${Math.round(az)}°`;
        }
    });

    const handleCompassClick = useCallback(() => {
        if (followOrientationRef.current) return;

        const now = Date.now();
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (now - lastClickRef.current < 300) {
            camera.position.set(0, 0, 0.01);
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                camera.position.set(0, -0.01, 0.0001);
            }, 300);
        }
        lastClickRef.current = now;
    }, [camera]);

    const handleARToggle = useCallback(async () => {
        if (followOrientationRef.current) {
            stop();
            setFollowOrientation(false);
            return;
        }

        const granted = await requestAndStart();
        if (!granted) {
            setFollowOrientation(false);
            return;
        }
        if (deviceOrientationRef.active) {
            setFollowOrientation(true);
            return;
        }
        setTimeout(() => setFollowOrientation(!!deviceOrientationRef.active), 100);
    }, [requestAndStart, setFollowOrientation, stop]);

    const handleCalibrateNorth = useCallback(() => {
        if (!deviceOrientationRef.active) return;

        const { observer, time } = useAppStore.getState();
        const declination = computeMagneticDeclination(observer.lat, observer.lon, time);
        const currentTrueHeading = ((deviceOrientationRef.heading + declination + compassCalibrationOffset) % 360 + 360) % 360;
        setCompassCalibrationOffset(compassCalibrationOffset - currentTrueHeading);
    }, [compassCalibrationOffset, setCompassCalibrationOffset]);

    return (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div
                className="absolute bottom-28 left-4 z-30 pointer-events-auto flex flex-col items-center gap-2 md:bottom-6 md:left-4"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)' }}
            >
                <button
                    onClick={handleCompassClick}
                    className={followOrientation
                        ? 'relative w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-[#44aaff66] hover:border-blue-400/50 shadow-[0_0_12px_rgba(68,170,255,0.25)] transition-all duration-200 flex items-center justify-center'
                        : 'relative w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:border-blue-400/50 shadow-lg shadow-black/50 transition-all duration-200 flex items-center justify-center'
                    }
                    title={followOrientation ? 'Orientacion AR activa' : 'Clic: Cenit | Doble clic: Norte'}
                >
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                            <line
                                key={deg}
                                x1="50"
                                y1="6"
                                x2="50"
                                y2={deg % 90 === 0 ? 12 : 9}
                                stroke={deg % 90 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}
                                strokeWidth={deg % 90 === 0 ? 1.5 : 1}
                                transform={`rotate(${deg}, 50, 50)`}
                            />
                        ))}
                        <text x="50" y="20" textAnchor="middle" fill={followOrientation ? '#44aaff' : '#ff5555'} fontSize="11" fontWeight="bold" fontFamily="monospace">N</text>
                        <text x="84" y="54" textAnchor="middle" fill="#99bbff" fontSize="9" fontFamily="monospace">E</text>
                        <text x="50" y="88" textAnchor="middle" fill="#8888ff" fontSize="9" fontFamily="monospace">S</text>
                        <text x="16" y="54" textAnchor="middle" fill="#99bbff" fontSize="9" fontFamily="monospace">O</text>
                        <g ref={needleGroupRef} transform="rotate(0, 50, 50)">
                            <polygon points="50,24 46,50 50,44 54,50" fill={followOrientation ? '#44aaff' : '#ff5555'} />
                            <polygon points="50,76 46,50 50,56 54,50" fill="#666666" />
                        </g>
                        <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.3)" />
                        <circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.6)" />
                    </svg>

                    <div
                        ref={labelRef}
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/60 tracking-wider whitespace-nowrap"
                    >
                        N 0°
                    </div>
                </button>

                {isSupported && (
                    <>
                        <button
                            onClick={handleARToggle}
                            title={followOrientation ? 'Desactivar orientacion' : 'Activar orientacion del dispositivo'}
                            className={`mt-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider
                                        border backdrop-blur-md shadow-lg transition-all duration-200
                                        ${followOrientation
                                    ? 'bg-blue-500/30 border-blue-400/60 text-blue-300'
                                    : 'bg-black/60 border-white/15 text-white/40 hover:border-white/30 hover:text-white/60'
                                }`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <ellipse cx="12" cy="12" rx="10" ry="4" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                            </svg>
                            {followOrientation ? 'AR ON' : 'AR'}
                            {followOrientation && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                        </button>

                        {followOrientation && (
                            <div className="mt-1 flex flex-col items-center gap-1">
                                <button
                                    onClick={handleCalibrateNorth}
                                    title="Apunta a Polaris y pulsa para alinear el norte real"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wider border border-amber-400/45 bg-amber-500/20 text-amber-100 backdrop-blur-md shadow-lg transition-all duration-200 hover:bg-amber-500/30"
                                >
                                    Polaris
                                </button>
                                <div className="max-w-[120px] text-center text-[9px] leading-tight text-white/55">
                                    Apunta a Polaris y pulsa para fijar el norte real.
                                </div>
                                {Math.abs(compassCalibrationOffset) > 0.1 && (
                                    <button
                                        onClick={zeroCompassCalibrationOffset}
                                        title="Borrar calibracion manual de brujula"
                                        className="text-[9px] font-mono text-white/55 hover:text-white/80 transition-colors"
                                    >
                                        Borrar calibracion {Math.round(compassCalibrationOffset)}°
                                    </button>
                                )}
                            </div>
                        )}
                    </>
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
