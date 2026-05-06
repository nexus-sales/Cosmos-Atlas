'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SPEEDS = [
    { label: '1h/s', daysPerSec: 1 / 24 },
    { label: '1d/s', daysPerSec: 1 },
    { label: '1sem/s', daysPerSec: 7 },
    { label: '1m/s', daysPerSec: 30 },
];

const PRESET_JUMPS = [
    { label: '-10a', days: -3650 },
    { label: '-1a', days: -365 },
    { label: '-1m', days: -30 },
    { label: '-1sem', days: -7 },
    { label: '-1d', days: -1 },
];

export default function TimeTravelControls() {
    const setTime = useAppStore((s) => s.setTime);
    const isLive = useAppStore((s) => s.isLive);
    const setIsLive = useAppStore((s) => s.setIsLive);
    const storeTime = useAppStore((s) => s.time);

    const [expanded, setExpanded] = useState(false);
    const [offsetDays, setOffsetDays] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speedIdx, setSpeedIdx] = useState(1);
    // refMs mirrors refMsRef for use during render (refs cannot be read in render)
    const [refMs, setRefMs] = useState(0);

    // Refs for use inside intervals (avoid stale closures)
    // Initialized to 0; always assigned via storeTime.getTime() before use
    const refMsRef = useRef(0);
    const offsetDaysRef = useRef(0);
    const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const updateOffset = (days: number) => {
        offsetDaysRef.current = days;
        setOffsetDays(days);
    };

    // Capture current live time as reference and switch to time travel
    const enterTimeTravel = () => {
        if (isLive) {
            const now = storeTime.getTime();
            refMsRef.current = now;
            setRefMs(now);
            setIsLive(false);
        }
    };

    const applyOffset = (days: number) => {
        setTime(new Date(refMsRef.current + days * 86_400_000));
    };

    const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        const days = Number(e.target.value);
        enterTimeTravel();
        updateOffset(days);
        applyOffset(days);
    };

    const handlePreset = (deltaDays: number) => {
        enterTimeTravel();
        const newOffset = offsetDaysRef.current + deltaDays;
        updateOffset(newOffset);
        applyOffset(newOffset);
    };

    const togglePlay = () => {
        enterTimeTravel();
        setPlaying((p) => !p);
    };

    const goLive = () => {
        setPlaying(false);
        updateOffset(0);
        setIsLive(true);
    };

    // Playback animation
    useEffect(() => {
        if (playing) {
            const daysPerTick = SPEEDS[speedIdx].daysPerSec * (50 / 1000);
            playIntervalRef.current = setInterval(() => {
                const newOffset = offsetDaysRef.current + daysPerTick;
                offsetDaysRef.current = newOffset;
                setOffsetDays(newOffset);
                setTime(new Date(refMsRef.current + newOffset * 86_400_000));
            }, 50);
        }
        return () => {
            if (playIntervalRef.current) clearInterval(playIntervalRef.current);
        };
    }, [playing, speedIdx, setTime]);

    // Display date: when live, use the store time (updated by the live interval)
    const displayMs = isLive ? storeTime.getTime() : refMs + offsetDays * 86_400_000;
    const displayDate = new Date(displayMs);

    const formatOffset = () => {
        if (Math.abs(offsetDays) < 0.042) return '±0';
        const sign = offsetDays > 0 ? '+' : '−';
        const abs = Math.abs(offsetDays);
        if (abs >= 365) return `${sign}${(abs / 365).toFixed(1)}a`;
        if (abs >= 30) return `${sign}${Math.round(abs / 30)}m`;
        if (abs >= 1) return `${sign}${Math.round(abs)}d`;
        return `${sign}${Math.round(abs * 24)}h`;
    };

    const sliderValue = isLive ? 0 : Math.max(-3650, Math.min(3650, offsetDays));

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 select-none pointer-events-auto">
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="bg-black/90 glass-blur-heavy border border-white/10 rounded-2xl px-5 py-4 w-[520px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
                    >
                        {/* Date / time header */}
                        <div className="flex items-start justify-between mb-3.5">
                            <div className="font-mono">
                                <div className="text-[15px] font-bold text-blue-300 tracking-wide">
                                    {displayDate.toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </div>
                                <div className="text-[11px] text-white/40 mt-0.5 tabular-nums">
                                    {displayDate.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </div>
                            </div>
                            {isLive ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono font-bold tracking-widest mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    LIVE
                                </div>
                            ) : (
                                <span className="text-[13px] text-amber-400 font-mono font-bold mt-0.5">
                                    {formatOffset()}
                                </span>
                            )}
                        </div>

                        {/* Timeline slider */}
                        <input
                            type="range"
                            min={-3650}
                            max={3650}
                            step={0.1}
                            value={sliderValue}
                            onChange={handleSlider}
                            aria-label="Línea de tiempo: desplazarse entre −10 y +10 años"
                            title="Línea de tiempo"
                            className="w-full cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-[8px] text-white/20 font-mono mt-0.5">
                            <span>−10 años</span>
                            <span>HOY</span>
                            <span>+10 años</span>
                        </div>

                        {/* Preset jumps + play button */}
                        <div className="flex items-center justify-center gap-1.5 mt-3.5" role="group" aria-label="Saltos temporales">
                            {PRESET_JUMPS.map((p) => (
                                <button
                                    key={p.label}
                                    onClick={() => handlePreset(p.days)}
                                    aria-label={`Retroceder ${p.label.slice(1)}`}
                                    className="text-[9px] font-mono text-white/35 hover:text-blue-400 transition-all px-2 py-1 rounded-lg border border-white/8 hover:border-blue-500/40 hover:bg-blue-500/5"
                                >
                                    {p.label}
                                </button>
                            ))}

                            <button
                                onClick={togglePlay}
                                aria-label={playing ? 'Pausar viaje temporal' : 'Reproducir viaje temporal'}
                                className={cn(
                                    'mx-1 w-9 h-9 rounded-full flex items-center justify-center border transition-all',
                                    playing
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)]'
                                        : 'bg-blue-500/10 border-blue-500/40 text-blue-400 hover:bg-blue-500/20'
                                )}
                            >
                                {playing
                                    ? <Pause className="w-3.5 h-3.5" />
                                    : <Play className="w-3.5 h-3.5 ml-0.5" />
                                }
                            </button>

                            {[...PRESET_JUMPS].reverse().map((p) => (
                                <button
                                    key={`fwd-${p.label}`}
                                    onClick={() => handlePreset(-p.days)}
                                    aria-label={`Avanzar ${p.label.slice(1)}`}
                                    className="text-[9px] font-mono text-white/35 hover:text-blue-400 transition-all px-2 py-1 rounded-lg border border-white/8 hover:border-blue-500/40 hover:bg-blue-500/5"
                                >
                                    +{p.label.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Selector de velocidad + botón de tiempo real */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                            <div className="flex items-center gap-1" role="group" aria-label="Velocidad de reproducción">
                                <span className="text-[8px] text-white/20 font-mono tracking-widest uppercase mr-1.5" aria-hidden="true">
                                    VEL:
                                </span>
                                {SPEEDS.map((s, i) => {
                                    const isPressed = speedIdx === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSpeedIdx(i)}
                                            aria-label={`Velocidad ${s.label}`}
                                            {...(speedIdx === i ? { 'aria-pressed': true } : { 'aria-pressed': false })}
                                            className={cn(
                                                'text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all',
                                                isPressed
                                                    ? 'text-blue-400 border-blue-500/50 bg-blue-500/10'
                                                    : 'text-white/25 border-white/8 hover:text-white/50 hover:border-white/20'
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={goLive}
                                className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all"
                            >
                                <RotateCcw className="w-2.5 h-2.5" />
                                AHORA
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle pill */}
            <button
                onClick={() => setExpanded((e) => !e)}
                {...(expanded ? { 'aria-expanded': true } : { 'aria-expanded': false })}
                aria-label={expanded ? 'Cerrar controles de tiempo' : 'Abrir controles de viaje temporal'}
                className={cn(
                    'flex items-center gap-2.5 px-4 py-2 rounded-full border glass-blur transition-all shadow-lg',
                    !isLive
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                        : expanded
                            ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                            : 'bg-black/60 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                )}
            >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                    {isLive ? 'Tiempo Real' : `Viaje Temporal  ${formatOffset()}`}
                </span>
                {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
            </button>
        </div>
    );
}
