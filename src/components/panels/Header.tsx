'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Stars, MapPin, Play, Square, ShieldCheck } from 'lucide-react';
import CelestialSearch from './CelestialSearch';
import { cn } from '@/lib/utils';
import { getArHealthSummary, getArToneClasses } from '@/lib/arHealth';

function Clock() {
    const [time, setTime] = useState<Date | null>(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
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

    return (
        <div className="flex flex-col items-end text-right" aria-live="polite" aria-atomic="true" aria-label="Hora actual del observatorio">
            <div className="text-base md:text-[18px] text-blue-400 tabular-nums leading-none font-bold glow-text">
                {time ? formatTime(time) : '--:--:--'}
            </div>
            <div className="hidden md:block text-[10px] text-white/30 uppercase mt-1 tracking-wider" aria-hidden="true">
                {time ? formatDate(time) : ''}
            </div>
        </div>
    );
}

export default function Header() {
    const observer = useAppStore((state) => state.observer);
    const geolocation = useAppStore((state) => state.geolocation);
    const arHealthHistory = useAppStore((state) => state.arHealthHistory);
    const isTourActive = useAppStore((state) => state.isTourActive);
    const setIsTourActive = useAppStore((state) => state.setIsTourActive);

    const latHemisphere = observer.lat >= 0 ? 'N' : 'S';
    const lonHemisphere = observer.lon < 0 ? 'O' : 'E';
    const hasPreciseLocation = geolocation.source === 'gps' && geolocation.accuracyM !== null && geolocation.accuracyM <= 1000;
    const mobileLocationLabel = hasPreciseLocation
        ? `GPS +/-${Math.round(geolocation.accuracyM ?? 0)}m`
        : geolocation.status === 'denied'
          ? 'GPS bloqueado'
          : 'Ubicacion aprox.';

    const arSummary = getArHealthSummary(arHealthHistory);
    const arBadgeClass = getArToneClasses(arSummary.tone);

    return (
        <header className="atlas-panel h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-3 md:px-6 z-20 overflow-hidden shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 border border-blue-500/30 rounded-full bg-blue-500/5 group">
                    <Stars className="w-4 h-4 md:w-6 md:h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full -z-10 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-base md:text-xl font-bold tracking-[0.25em] md:tracking-[0.3em] text-blue-400 glow-text uppercase leading-none">
                        Cosmos <span className="text-white/30">·</span> Atlas
                    </h1>
                    <p className="hidden md:block text-[10px] text-white/40 tracking-[0.2em] font-mono mt-1">
                        OBSERVATORIO VIRTUAL 3D
                    </p>
                </div>
            </div>

            <div className="flex-1 max-w-sm px-4 hidden sm:block">
                <CelestialSearch />
            </div>

            <div className="flex items-center gap-3 md:gap-6 font-mono">
                <button
                    onClick={() => setIsTourActive(!isTourActive)}
                    aria-label={isTourActive ? 'Detener tour del cielo' : 'Iniciar tour cinematografico del cielo'}
                    aria-pressed={isTourActive ? 'true' : 'false'}
                    title={isTourActive ? 'Detener tour' : 'Tour del cielo'}
                    className={cn(
                        'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer',
                        isTourActive
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
                            : 'border-white/10 text-white/25 hover:text-white/60 hover:border-white/20'
                    )}
                >
                    {isTourActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isTourActive ? 'Stop' : 'Tour'}
                </button>

                <div className="hidden lg:flex flex-col items-end text-right">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 tracking-[0.2em] uppercase mb-0.5">
                        <MapPin className="w-3 h-3" />
                        Ubicacion
                    </div>
                    <div className="text-sm text-blue-200/70">
                        {Math.abs(observer.lat).toFixed(2)}deg{latHemisphere} {Math.abs(observer.lon).toFixed(2)}deg{lonHemisphere}
                    </div>
                    <div
                        className={cn(
                            'text-[9px] mt-0.5 font-mono uppercase tracking-wider',
                            hasPreciseLocation ? 'text-emerald-300/70' : 'text-amber-300/70'
                        )}
                    >
                        {hasPreciseLocation
                            ? `GPS +/-${Math.round(geolocation.accuracyM ?? 0)}m`
                            : 'Ubicacion aproximada'}
                    </div>
                </div>

                <div
                    className={cn(
                        'hidden md:flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.18em] uppercase',
                        arBadgeClass
                    )}
                >
                    <ShieldCheck className="w-3 h-3" />
                    AR {arSummary.score == null ? 'N/A' : `${arSummary.score}/100`}
                </div>

                <Clock />

                <div
                    className={cn(
                        'lg:hidden text-[9px] uppercase tracking-wider font-mono rounded px-1.5 py-0.5 border',
                        hasPreciseLocation
                            ? 'text-emerald-300/80 border-emerald-400/30 bg-emerald-500/10'
                            : 'text-amber-300/80 border-amber-400/30 bg-amber-500/10'
                    )}
                >
                    {mobileLocationLabel}
                </div>

                <div
                    className={cn(
                        'md:hidden flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono rounded-full px-1.5 py-0.5 border',
                        arBadgeClass
                    )}
                >
                    <ShieldCheck className="w-3 h-3" />
                    {arSummary.score == null ? 'AR N/A' : `AR ${arSummary.score}`}
                </div>
            </div>
        </header>
    );
}
