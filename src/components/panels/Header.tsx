'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bot, BookOpen, Compass as CompassIcon, LocateFixed, MapPin, Play, Search, Shield, Square } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceOrientation, deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { computeMagneticDeclination } from '@/lib/astronomy/magneticDeclination';
import { cameraHeadingRef, cameraRef } from '@/lib/skyRefs';
import CelestialSearch from './CelestialSearch';
import { cn } from '@/lib/utils';

const SolarSystemMap = dynamic(() => import('@/components/sky-map/SolarSystemMap'), { ssr: false });

interface HeaderProps {
    onRequestLocation?: () => void;
}

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

function MiniCompass() {
    const [open, setOpen] = useState(false);
    const needleRef = useRef<SVGSVGElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const followOrientation = useAppStore((s) => s.followOrientation);
    const compassCalibrationOffset = useAppStore((s) => s.compassCalibrationOffset);
    const setCompassCalibrationOffset = useAppStore((s) => s.setCompassCalibrationOffset);
    const zeroCompassCalibrationOffset = useAppStore((s) => s.zeroCompassCalibrationOffset);
    const followOrientationRef = useRef(followOrientation);

    useEffect(() => {
        followOrientationRef.current = followOrientation;
    }, [followOrientation]);

    useEffect(() => {
        let rafId: number;

        const tick = () => {
            const az = followOrientationRef.current && deviceOrientationRef.active
                ? ((deviceOrientationRef.heading % 360) + 360) % 360
                : cameraHeadingRef.value;

            needleRef.current?.style.setProperty('--heading', `${-az}deg`);
            if (labelRef.current) labelRef.current.textContent = `${cardinalFromAz(az)} ${Math.round(az)}°`;
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
                aria-expanded={open}
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white/[0.04] text-white/65 transition-colors md:h-11 md:w-11',
                    'hover:border-blue-400/40 hover:text-blue-100',
                    followOrientation ? 'border-blue-400/45 shadow-[0_0_18px_rgba(96,165,250,0.18)]' : 'border-white/10'
                )}
            >
                <span className="relative flex h-8 w-8 items-center justify-center">
                    <svg
                        ref={needleRef}
                        viewBox="0 0 32 32"
                        className="h-8 w-8 [transform:rotate(var(--heading,0deg))] transition-transform duration-100"
                        aria-hidden="true"
                    >
                        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeOpacity="0.22" />
                        <path d="M16 4l3 12-3-2-3 2 3-12Z" fill={followOrientation ? '#60a5fa' : '#f87171'} />
                        <path d="M16 28l-3-12 3 2 3-2-3 12Z" fill="currentColor" opacity="0.35" />
                        <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6" />
                    </svg>
                    <span ref={labelRef} className="sr-only">N 0°</span>
                </span>
            </button>

            {open && (
                <div
                    className="absolute left-0 top-[calc(100%+0.65rem)] z-[95] w-48 rounded-2xl border border-white/10 bg-black/88 p-2 shadow-2xl backdrop-blur-xl"
                >
                    <button onClick={pointZenith} className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-white/65 hover:bg-white/8 hover:text-white">
                        Mirar cenit
                    </button>
                    <button onClick={pointNorth} className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-white/65 hover:bg-white/8 hover:text-white">
                        Mirar norte
                    </button>
                    <button
                        onClick={calibrateNorth}
                        disabled={!deviceOrientationRef.active}
                        className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-amber-200/80 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:text-white/25"
                    >
                        Calibrar Polaris
                    </button>
                    {Math.abs(compassCalibrationOffset) > 0.1 && (
                        <button
                            onClick={() => {
                                zeroCompassCalibrationOffset();
                                setOpen(false);
                            }}
                            className="w-full rounded-xl px-3 py-2 text-left text-[10px] font-mono text-white/45 hover:bg-white/8 hover:text-white/75"
                        >
                            Borrar calibracion {Math.round(compassCalibrationOffset)}°
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Header({ onRequestLocation }: HeaderProps) {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const geolocation = useAppStore((state) => state.geolocation);
    const isTourActive = useAppStore((state) => state.isTourActive);
    const setIsTourActive = useAppStore((state) => state.setIsTourActive);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setFollowOrientation = useAppStore((state) => state.setFollowOrientation);
    const viewMode = useAppStore((state) => state.viewMode);
    const setViewMode = useAppStore((state) => state.setViewMode);
    const isLive = useAppStore((state) => state.isLive);
    const setIsLive = useAppStore((state) => state.setIsLive);
    const aiAstronomer = useAppStore((state) => state.settings.aiAstronomer ?? true);
    const toggleSetting = useAppStore((state) => state.toggleSetting);
    const [mounted, setMounted] = useState(false);
    const [showSolar, setShowSolar] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { isSupported, requestAndStart, stop } = useDeviceOrientation();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    const handleARToggle = useCallback(async () => {
        if (followOrientation || viewMode === 'camera') {
            stop();
            setFollowOrientation(false);
            setViewMode('vault');
            return;
        }

        setViewMode('camera');
        if (!isSupported) return;
        const granted = await requestAndStart();
        setFollowOrientation(granted && !!deviceOrientationRef.active);
    }, [followOrientation, isSupported, requestAndStart, setFollowOrientation, setViewMode, stop, viewMode]);

    const toggleAstronomer = useCallback(() => {
        const nextEnabled = !aiAstronomer;
        toggleSetting('aiAstronomer');
        if (nextEnabled) window.dispatchEvent(new CustomEvent('cosmos:open-ai-astronomer'));
        else window.dispatchEvent(new CustomEvent('cosmos:close-ai-astronomer'));
    }, [aiAstronomer, toggleSetting]);

    const gpsLabel = geolocation.source === 'gps' && geolocation.accuracyM != null
        ? `±${Math.round(geolocation.accuracyM)}m`
        : 'GPS';

    const arActive = followOrientation || viewMode === 'camera';

    return (
        <>
            <header className="h-14 md:h-16 border-b border-white/10 bg-black/68 backdrop-blur-xl flex items-center gap-2 px-2.5 md:px-6 z-20 overflow-visible shrink-0">
                <MiniCompass />

                <div className="hidden min-w-0 flex-1 sm:block md:max-w-sm">
                    <CelestialSearch />
                </div>

                <button
                    onClick={() => setSearchOpen(true)}
                    title="Buscar objeto"
                    aria-label="Buscar objeto"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-blue-400/40 hover:text-blue-100 sm:hidden"
                >
                    <Search className="h-5 w-5" />
                </button>

                <div className="ml-auto flex min-w-0 items-center gap-1.5 md:gap-3 font-mono">
                    <button
                        onClick={() => setIsTourActive(!isTourActive)}
                        aria-label={isTourActive ? 'Detener tour del cielo' : 'Iniciar tour del cielo'}
                        aria-pressed={isTourActive ? 'true' : 'false'}
                        title={isTourActive ? 'Detener tour' : 'Tour del cielo'}
                        className={cn(
                            'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer',
                            isTourActive
                                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                                : 'border-white/10 text-white/35 hover:text-white/65 hover:border-white/20'
                        )}
                    >
                        {isTourActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {isTourActive ? 'Stop' : 'Tour'}
                    </button>

                    <button
                        onClick={() => setShowSolar(true)}
                        title="Sistema Solar"
                        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer border-white/10 text-white/35 hover:text-white/65 hover:border-white/20"
                    >
                        <CompassIcon className="w-3 h-3" />
                        Sistema
                    </button>

                    <div className="hidden lg:flex flex-col items-end text-right">
                        <div className="flex items-center gap-2 text-[10px] text-white/40 tracking-[0.2em] uppercase mb-0.5">
                            <MapPin className="w-3 h-3" />
                            Ubicacion
                        </div>
                        <div className="text-sm text-blue-200/70">
                            {observer.lat.toFixed(2)}°N {Math.abs(observer.lon).toFixed(2)}°{observer.lon < 0 ? 'O' : 'E'}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsLive(true)}
                        title={isLive ? 'Tiempo real activo' : 'Volver a tiempo real'}
                        aria-label={isLive ? 'Tiempo real activo' : 'Volver a tiempo real'}
                        className={cn(
                            'flex w-[72px] shrink-0 flex-col items-center rounded-xl px-1 py-1 text-center transition-colors md:w-[92px]',
                            isLive ? 'text-blue-400' : 'border border-amber-400/35 bg-amber-500/12 text-amber-200'
                        )}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        <div className="text-[17px] md:text-[18px] text-blue-400 tabular-nums leading-none font-bold glow-text">
                            {mounted ? formatTime(time) : '--:--:--'}
                        </div>
                        <div className="hidden md:block text-[10px] text-white/30 uppercase mt-1 tracking-wider">
                            {isLive ? (mounted ? formatDate(time) : '...') : 'Tiempo real'}
                        </div>
                        {!isLive && <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-200 md:hidden">Real</span>}
                    </button>

                    <button
                        onClick={handleARToggle}
                        title={arActive ? 'Desactivar AR' : 'Activar AR'}
                        aria-label={arActive ? 'Desactivar AR' : 'Activar AR'}
                        aria-pressed={arActive ? 'true' : 'false'}
                        className={cn(
                            'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-full border text-[10px] font-bold leading-none transition-colors md:h-11 md:w-11',
                            arActive
                                ? 'border-cyan-400/50 bg-cyan-500/16 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                                : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-cyan-400/35 hover:text-cyan-100'
                        )}
                    >
                        <Shield className="mb-0.5 h-3.5 w-3.5" />
                        AR
                    </button>

                    <button
                        onClick={onRequestLocation}
                        title="Activar GPS"
                        aria-label="Activar GPS"
                        className={cn(
                            'hidden h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-[9px] font-bold uppercase leading-none transition-colors min-[380px]:flex md:h-11',
                            geolocation.source === 'gps'
                                ? 'border-emerald-400/45 bg-emerald-500/12 text-emerald-200'
                                : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-emerald-400/35 hover:text-emerald-100'
                        )}
                    >
                        <LocateFixed className="h-3.5 w-3.5" />
                        <span className="max-w-[34px] truncate">{gpsLabel}</span>
                    </button>

                    <button
                        onClick={toggleAstronomer}
                        title={aiAstronomer ? 'Desactivar IA astronomica' : 'Activar IA astronomica'}
                        aria-label={aiAstronomer ? 'Desactivar IA astronomica' : 'Activar IA astronomica'}
                        aria-pressed={aiAstronomer ? 'true' : 'false'}
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors md:h-11 md:w-11',
                            aiAstronomer
                                ? 'border-cyan-400/45 bg-cyan-500/12 text-cyan-100'
                                : 'border-white/10 bg-white/[0.04] text-white/35 hover:border-cyan-400/40 hover:text-cyan-100'
                        )}
                    >
                        <Bot className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        title={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
                        aria-label={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
                        aria-pressed={sidebarOpen ? 'true' : 'false'}
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors md:h-11 md:w-11',
                            sidebarOpen
                                ? 'border-blue-400/45 bg-blue-500/12 text-blue-100'
                                : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-blue-400/40 hover:text-blue-100'
                        )}
                    >
                        <BookOpen className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {searchOpen && (
                <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[90] rounded-2xl border border-white/10 bg-black/88 p-3 shadow-2xl backdrop-blur-xl sm:hidden">
                    <CelestialSearch />
                    <button
                        onClick={() => setSearchOpen(false)}
                        className="mt-2 w-full rounded-xl border border-white/10 py-2 text-[10px] font-bold uppercase tracking-widest text-white/50"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {showSolar && <SolarSystemMap onClose={() => setShowSolar(false)} />}
        </>
    );
}
