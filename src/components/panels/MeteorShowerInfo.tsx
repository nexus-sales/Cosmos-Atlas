'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { METEOR_SHOWERS, getActiveShowers, getShowerActivity, getBestShower } from '@/data/meteorShowers';
import { CloudRain, TrendingUp, Clock, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MeteorShowerInfo() {
    const time = useAppStore((state) => state.time);
    const date = new Date(time);

    const { activeShowers, bestShower, dateStr } = useMemo(() => {
        const active = getActiveShowers(date);
        const best = getBestShower(date);
        return {
            activeShowers: active,
            bestShower: best,
            dateStr: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        };
    }, [time]);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase px-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400/70" />
                LLUVIA DE METEOROS
            </div>

            {/* Lluvia activa principal */}
            {bestShower ? (
                <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-blue-300">
                            {bestShower.name}
                        </span>
                        <span className="text-[9px] text-blue-400/70 font-mono">
                            {bestShower.shortName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] text-white/60">
                            THZ: {Math.round(bestShower.thz * getShowerActivity(bestShower, date))}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] text-white/40">
                            <Eye className="w-2.5 h-2.5" />
                            <span>Velocidad: {bestShower.speed} km/s</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-white/40">
                            <Clock className="w-2.5 h-2.5" />
                            <span>
                                {Math.abs(new Date(bestShower.peakDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24) < 2
                                    ? '¡PICO ESTA SEMANA!'
                                    : `Pico: ${new Date(bestShower.peakDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                                }
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-3 rounded-lg border border-white/10 text-center bg-white/[0.03]">
                    <CloudRain className="w-6 h-6 text-white/20 mx-auto mb-2" />
                    <p className="text-[10px] text-white/40">
                        No hay lluvias activas hoy
                    </p>
                </div>
            )}

            {/* Otras lluvias activas */}
            {activeShowers.length > 1 && (
                <div className="space-y-1">
                    <div className="text-[8px] text-white/20 uppercase tracking-wider px-1">
                        Otras lluvias
                    </div>
                    {activeShowers
                        .filter(s => s.id !== bestShower?.id)
                        .slice(0, 3)
                        .map(shower => {
                            const activity = getShowerActivity(shower, date);
                            return (
                                <div
                                    key={shower.id}
                                    className="flex items-center justify-between px-2 py-1.5 rounded border border-white/5 bg-white/[0.02]"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ background: shower.color }}
                                        />
                                        <span className="text-[9px] text-white/60">
                                            {shower.shortName}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-2.5 h-2.5 text-white/30" />
                                            <span className="text-[8px] text-white/40 font-mono">
                                                THZ {Math.round(shower.thz * activity)}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "text-[7px] px-1 rounded",
                                            activity > 0.5
                                                ? "bg-green-500/20 text-green-400"
                                                : activity > 0.2
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-white/10 text-white/30"
                                        )}>
                                            {activity > 0.8 ? 'PICO' : activity > 0.3 ? 'ACTIVA' : 'DÉBIL'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Próximas lluvias */}
            <div className="space-y-1">
                <div className="text-[8px] text-white/20 uppercase tracking-wider px-1">
                    Próximas
                </div>
                {METEOR_SHOWERS
                    .filter(s => {
                        const peakDate = new Date(s.peakDate);
                        return peakDate > date && !getActiveShowers(date).includes(s);
                    })
                    .sort((a, b) => new Date(a.peakDate).getTime() - new Date(b.peakDate).getTime())
                    .slice(0, 3)
                    .map(shower => {
                        const daysToPeak = Math.round(
                            (new Date(shower.peakDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                            <div
                                key={shower.id}
                                className="flex items-center justify-between px-2 py-1.5 rounded border border-white/5 bg-white/[0.02]"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full opacity-50"
                                        style={{ background: shower.color }}
                                    />
                                    <span className="text-[9px] text-white/50">
                                        {shower.shortName}
                                    </span>
                                </div>
                                <div className="text-[8px] text-white/30 font-mono">
                                    {daysToPeak} días
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
