'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { computeMagneticDeclination } from '@/lib/astronomy/magneticDeclination';
import { cameraHeadingRef, cameraRef } from '@/lib/skyRefs';
import { cn } from '@/lib/utils';

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

export default function MiniCompass() {
    const [open, setOpen] = useState(false);
    const roseRef = useRef<SVGSVGElement>(null);
    const degLabelRef = useRef<HTMLSpanElement>(null);
    const followOrientation = useAppStore((s) => s.followOrientation);
    const compassCalibrationOffset = useAppStore((s) => s.compassCalibrationOffset);
    const setCompassCalibrationOffset = useAppStore((s) => s.setCompassCalibrationOffset);
    const zeroCompassCalibrationOffset = useAppStore((s) => s.zeroCompassCalibrationOffset);
    const followOrientationRef = useRef(followOrientation);
    const sensorActiveRef = useRef(false);
    const dotRef = useRef<HTMLSpanElement>(null);
    const compassCalibrationOffsetRef = useRef(compassCalibrationOffset);
    const declinationRef = useRef(0);
    const lastObsRef = useRef({ lat: NaN, lon: NaN, year: NaN });
    const visualHeadingRef = useRef(0);

    useEffect(() => {
        followOrientationRef.current = followOrientation;
    }, [followOrientation]);

    useEffect(() => {
        compassCalibrationOffsetRef.current = compassCalibrationOffset;
    }, [compassCalibrationOffset]);

    useEffect(() => {
        let rafId: number;

        const tick = () => {
            const usingGyro = followOrientationRef.current && deviceOrientationRef.active;
            let az: number;

            if (usingGyro) {
                const { observer, time } = useAppStore.getState();
                const year = time.getFullYear() + time.getMonth() / 12;
                const last = lastObsRef.current;

                if (
                    !Number.isFinite(last.lat) ||
                    Math.abs(observer.lat - last.lat) > 0.5 ||
                    Math.abs(observer.lon - last.lon) > 0.5 ||
                    Math.abs(year - last.year) > 0.5
                ) {
                    declinationRef.current = computeMagneticDeclination(observer.lat, observer.lon, time);
                    lastObsRef.current = { lat: observer.lat, lon: observer.lon, year };
                }

                az = ((deviceOrientationRef.heading + declinationRef.current + compassCalibrationOffsetRef.current) % 360 + 360) % 360;
            } else {
                az = cameraHeadingRef.value;
            }

            const currentWrapped = ((visualHeadingRef.current % 360) + 360) % 360;
            const delta = ((az - currentWrapped) % 360 + 540) % 360 - 180;
            visualHeadingRef.current += delta;

            roseRef.current?.style.setProperty('--heading', `${-visualHeadingRef.current}deg`);

            const card = cardinalFromAz(az);
            if (degLabelRef.current) {
                degLabelRef.current.textContent = `${card} ${Math.round(az)}°`;
            }

            const active = usingGyro;
            if (sensorActiveRef.current !== active) {
                sensorActiveRef.current = active;
                if (dotRef.current) {
                    dotRef.current.style.opacity = active ? '1' : '0';
                }
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, []);

    const pointZenith = () => {
        cameraRef.current?.position.set(0, -0.01, 0.0001);
        setOpen(false);
    };

    const pointNorth = () => {
        cameraRef.current?.position.set(0, 0, 0.01);
        setOpen(false);
    };

    const calibrateNorth = () => {
        if (!deviceOrientationRef.active) return;

        const { observer, time } = useAppStore.getState();
        const declination = computeMagneticDeclination(observer.lat, observer.lon, time);
        const currentTrueHeading = ((deviceOrientationRef.heading + declination + compassCalibrationOffset) % 360 + 360) % 360;
        setCompassCalibrationOffset(compassCalibrationOffset - currentTrueHeading);
        setOpen(false);
    };

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                title="Brujula"
                aria-label="Abrir brujula"
                {...{ 'aria-expanded': open }}
                className={cn(
                    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white/[0.04] transition-colors md:h-11 md:w-11',
                    'hover:border-blue-400/40 hover:bg-white/[0.08]',
                    followOrientation
                        ? 'border-blue-400/45 shadow-[0_0_18px_rgba(96,165,250,0.18)]'
                        : 'border-white/10'
                )}
            >
                <svg
                    ref={roseRef}
                    viewBox="0 0 40 40"
                    className="h-9 w-9 md:h-10 md:w-10"
                    style={{ transform: 'rotate(var(--heading, 0deg))', transition: 'transform 0.12s ease-out' }}
                    aria-hidden="true"
                >
                    <circle cx="20" cy="20" r="19" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="1" />

                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                        const rad = (deg * Math.PI) / 180;
                        const isMajor = deg % 90 === 0;
                        const r1 = isMajor ? 14 : 15.5;
                        const r2 = 18;
                        return (
                            <line
                                key={deg}
                                x1={20 + r1 * Math.sin(rad)}
                                y1={20 - r1 * Math.cos(rad)}
                                x2={20 + r2 * Math.sin(rad)}
                                y2={20 - r2 * Math.cos(rad)}
                                stroke="white"
                                strokeOpacity={isMajor ? 0.5 : 0.22}
                                strokeWidth={isMajor ? 1.4 : 0.8}
                                strokeLinecap="round"
                            />
                        );
                    })}

                    <text x="20" y="8.5" textAnchor="middle" dominantBaseline="middle"
                        fontSize="6" fontWeight="900" fill="#f87171" fontFamily="system-ui,sans-serif"
                        letterSpacing="-0.5">N</text>
                    <text x="20" y="33" textAnchor="middle" dominantBaseline="middle"
                        fontSize="4.5" fontWeight="700" fill="white" fillOpacity="0.35" fontFamily="system-ui,sans-serif">S</text>
                    <text x="33" y="20.5" textAnchor="middle" dominantBaseline="middle"
                        fontSize="4.5" fontWeight="700" fill="white" fillOpacity="0.35" fontFamily="system-ui,sans-serif">E</text>
                    <text x="7" y="20.5" textAnchor="middle" dominantBaseline="middle"
                        fontSize="4.5" fontWeight="700" fill="white" fillOpacity="0.35" fontFamily="system-ui,sans-serif">O</text>

                    <path d="M20 3.5 L21.8 17.5 L20 15.8 L18.2 17.5 Z" fill="#f87171" />
                    <path d="M20 36.5 L18.2 22.5 L20 24.2 L21.8 22.5 Z" fill="white" opacity="0.22" />

                    <circle cx="20" cy="20" r="2.6" fill="#1e1e2e" stroke="white" strokeOpacity="0.25" strokeWidth="0.8" />
                    <circle cx="20" cy="20" r="1.3" fill="#f87171" opacity="0.85" />
                </svg>

                <span
                    ref={dotRef}
                    style={{ opacity: 0, transition: 'opacity 0.3s' }}
                    className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.9)] animate-pulse"
                />
            </button>

            <span
                ref={degLabelRef}
                className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap select-none
                           text-[11px] font-mono font-bold tabular-nums text-white/55"
                aria-live="off"
            >
                N 0°
            </span>

            {open && (
                <div
                    className="atlas-panel absolute left-0 top-[calc(100%+1.25rem)] z-[95] w-52 rounded-2xl p-2"
                >
                    <button onClick={pointZenith} className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white">
                        Mirar cenit
                    </button>
                    <button onClick={pointNorth} className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white">
                        Mirar norte
                    </button>
                    <button
                        onClick={calibrateNorth}
                        disabled={!deviceOrientationRef.active}
                        className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-amber-200/90 hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:text-white/35"
                    >
                        Calibrar Polaris
                    </button>
                    {Math.abs(compassCalibrationOffset) > 0.1 && (
                        <button
                            onClick={() => {
                                zeroCompassCalibrationOffset();
                                setOpen(false);
                            }}
                            className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-mono text-white/60 hover:bg-white/10 hover:text-white"
                        >
                            Borrar calibracion {Math.round(compassCalibrationOffset)}°
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
