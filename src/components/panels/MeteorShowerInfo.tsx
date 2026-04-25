'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getActiveShowers, getShowerActivity, getBestShower, isShowerActive } from '@/data/meteorShowers';
import { useCatalog } from '@/stores/useCatalogStore';
import { CloudRain, TrendingUp, Clock3, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MeteorShowerInfo() {
    const time = useAppStore((state) => state.timeMinute);
    const meteorShowers = useCatalog(s => s.meteorShowers);

    const { activeShowers, bestShower } = useMemo(() => {
        const date = new Date(time);
        return {
            activeShowers: meteorShowers.filter(s => isShowerActive(s, date)),
            bestShower: getBestShower(date),
        };
    }, [time, meteorShowers]);

    const date = new Date(time);
    const upcomingShowers = meteorShowers
        .filter((shower) => {
            const peakDate = new Date(shower.peakDate);
            return peakDate > date && !activeShowers.includes(shower);
        })
        .sort((a, b) => new Date(a.peakDate).getTime() - new Date(b.peakDate).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-4">
            <div className="atlas-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                            <CloudRain className="h-3.5 w-3.5 text-blue-300/70" />
                            Vigilancia de Meteoros
                        </div>
                        <div className="mt-1 text-[15px] font-semibold text-white">
                            {bestShower ? bestShower.name : 'Sin lluvia intensa hoy'}
                        </div>
                        <div className="mt-1 text-[11px] leading-5 text-white/58">
                            Resumen de lluvias activas, máximo previsto e intensidad esperada.
                        </div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/64">
                        {activeShowers.length} activas
                    </div>
                </div>

                {bestShower ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <Metric
                            label="THZ"
                            value={`${Math.round(bestShower.thz * getShowerActivity(bestShower, date))}`}
                            hint="est."
                        />
                        <Metric label="Veloc." value={`${bestShower.speed}`} hint="km/s" />
                        <Metric
                            label="Máximo"
                            value={
                                Math.abs(new Date(bestShower.peakDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24) < 2
                                    ? 'Pronto'
                                    : new Date(bestShower.peakDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                            }
                            hint="ventana"
                        />
                    </div>
                ) : (
                    <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-5 text-white/54">
                        La actividad está tranquila ahora mismo. Vigila los próximos máximos.
                    </div>
                )}
            </div>

            {bestShower && (
                <div className="atlas-card rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                        <Sparkles className="h-3.5 w-3.5 text-blue-300/70" />
                        Lluvia Principal
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[13px] font-semibold text-white">{bestShower.shortName}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/54">
                                <Eye className="h-3 w-3 text-blue-200/70" />
                                Mejor con cielos oscuros y, si es posible, después de la puesta de la Luna.
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/54">
                                <Clock3 className="h-3 w-3 text-blue-200/70" />
                                Máximo: {new Date(bestShower.peakDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                            </div>
                        </div>
                        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-right">
                            <div className="text-[9px] uppercase tracking-[0.16em] text-blue-200/60">Actividad</div>
                            <div className="mt-1 text-[15px] font-semibold text-blue-100">
                                {Math.round(getShowerActivity(bestShower, date) * 100)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeShowers.length > 1 && (
                <section className="space-y-2">
                    <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-300/70" />
                        Otras Lluvias Activas
                    </div>
                    <div className="space-y-2">
                        {activeShowers
                            .filter((shower) => shower.id !== bestShower?.id)
                            .slice(0, 3)
                            .map((shower) => {
                                const activity = getShowerActivity(shower, date);
                                return (
                                    <ShowerRow
                                        key={shower.id}
                                        accentColor={shower.color}
                                        label={shower.shortName}
                                        meta={`THZ ${Math.round(shower.thz * activity)}`}
                                        badge={activity > 0.8 ? 'Máximo' : activity > 0.3 ? 'Activa' : 'Leve'}
                                        badgeTone={activity > 0.8 ? 'good' : activity > 0.3 ? 'warning' : 'neutral'}
                                    />
                                );
                            })}
                    </div>
                </section>
            )}

            <section className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                    <Clock3 className="h-3.5 w-3.5 text-blue-300/70" />
                    Próximos Máximos
                </div>
                <div className="space-y-2">
                    {upcomingShowers.map((shower) => {
                        const daysToPeak = Math.round(
                            (new Date(shower.peakDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                            <ShowerRow
                                key={shower.id}
                                accentColor={shower.color}
                                label={shower.shortName}
                                meta={new Date(shower.peakDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                badge={`${daysToPeak}d`}
                                badgeTone="neutral"
                            />
                        );
                    })}
                </div>
            </section>
        </div>
    );
}

function ShowerRow({
    accentColor,
    label,
    meta,
    badge,
    badgeTone,
}: {
    accentColor: string;
    label: string;
    meta: string;
    badge: string;
    badgeTone: 'good' | 'warning' | 'neutral';
}) {
    return (
        <div className="atlas-card flex items-center justify-between gap-3 rounded-2xl px-3 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: accentColor, background: accentColor }} />
                <div className="min-w-0">
                    <div className="truncate text-[12px] font-semibold text-white">{label}</div>
                    <div className="text-[11px] text-white/50">{meta}</div>
                </div>
            </div>
            <div
                className={cn(
                    'rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em]',
                    badgeTone === 'good'
                        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200'
                        : badgeTone === 'warning'
                          ? 'border-amber-400/25 bg-amber-500/10 text-amber-200'
                          : 'border-white/10 bg-white/[0.04] text-white/58'
                )}
            >
                {badge}
            </div>
        </div>
    );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</div>
            <div className="mt-1 text-[14px] font-semibold text-white">{value}</div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-white/32">{hint}</div>
        </div>
    );
}
