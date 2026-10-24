'use client';

import { useMemo } from 'react';
import { Clock3, Moon, Play, Telescope } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { buildNightPlan, type PlannedTarget } from '@/lib/astronomy/tonightPlanner';
import type { DSO, Star } from '@/types/celestial';
import { cn } from '@/lib/utils';

function formatTime(date: Date | null) {
    return date?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) ?? '—';
}

function VisibilityCurve({ target }: { target: PlannedTarget }) {
    const points = target.curve.map((sample, index) => {
        const x = (index / Math.max(1, target.curve.length - 1)) * 220;
        const y = 48 - Math.max(0, Math.min(90, sample.altitude)) / 90 * 44;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return (
        <svg viewBox="0 0 220 52" className="h-12 w-full" role="img" aria-label={`Curva de altitud de ${target.name}`}>
            <rect x="0" y="0" width="220" height="52" rx="6" fill="rgba(255,255,255,.025)" />
            <line x1="0" y1="35.8" x2="220" y2="35.8" stroke="rgba(255,255,255,.12)" strokeDasharray="3 3" />
            <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

const ratingTone: Record<PlannedTarget['rating'], string> = {
    excelente: 'text-emerald-300 border-emerald-400/25 bg-emerald-500/10',
    bueno: 'text-blue-300 border-blue-400/25 bg-blue-500/10',
    difícil: 'text-amber-300 border-amber-400/25 bg-amber-500/10',
    'no visible': 'text-white/35 border-white/10 bg-white/5',
};

export default function TonightPlanner() {
    const observer = useAppStore((state) => state.observer);
    const time = useAppStore((state) => state.timeMinute);
    const bortle = useAppStore((state) => state.settings.bortleScale);
    const favorites = useAppStore((state) => state.favorites);
    const setTime = useAppStore((state) => state.setTime);
    const setIsLive = useAppStore((state) => state.setIsLive);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const stars = useCatalog((state) => state.stars);
    const dsos = useCatalog((state) => state.dsos);

    const { plan, objects } = useMemo(() => {
        const favoriteSet = new Set(favorites.map((id) => id.toLowerCase()));
        const candidates: Array<Star | DSO> = [
            ...dsos.filter((object) => object.mag <= 10).sort((a, b) => a.mag - b.mag).slice(0, 55),
            ...stars.filter((star) => star.mag <= 1.5).sort((a, b) => a.mag - b.mag).slice(0, 20),
        ].sort((a, b) => {
            const favA = favoriteSet.has(('id' in a ? a.id : a.name).toLowerCase()) || favoriteSet.has(a.name.toLowerCase());
            const favB = favoriteSet.has(('id' in b ? b.id : b.name).toLowerCase()) || favoriteSet.has(b.name.toLowerCase());
            return Number(favB) - Number(favA);
        });
        const map = new Map<string, Star | DSO>();
        const inputs = candidates.map((object) => {
            const id = 'id' in object ? object.id : object.name;
            map.set(id, object);
            return { id, name: object.name, ra: object.ra, dec: object.dec, mag: object.mag, kind: ('id' in object ? 'dso' : 'star') as 'dso' | 'star', type: 'type' in object ? object.type : undefined };
        });
        return { plan: buildNightPlan(time, observer, bortle, inputs), objects: map };
    }, [bortle, dsos, favorites, observer, stars, time]);

    const recommended = plan.targets.filter((target) => target.observableMinutes > 0).slice(0, 6);
    const jumpTo = (target: PlannedTarget) => {
        const object = objects.get(target.id);
        if (!object) return;
        setIsLive(false);
        setTime(target.bestTime);
        setTargetedObject(object);
    };

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.06] p-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-300">Noche astronómica</span>
                    <span className="text-[10px] font-mono text-white/60">{formatTime(plan.astronomicalStart)}–{formatTime(plan.astronomicalEnd)}</span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-white/40">Ranking geométrico para la fecha, ubicación y Bortle actuales. Meteorología aún no incluida.</p>
            </div>

            {recommended.length === 0 ? (
                <div className="rounded-lg border border-white/10 p-4 text-center text-[10px] text-white/40">No hay objetivos del catálogo sobre 25° durante la oscuridad astronómica.</div>
            ) : recommended.map((target) => (
                <article key={target.id} className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
                    <div className="flex items-start gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-sm font-bold text-blue-300">{target.score}</div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="truncate text-xs font-semibold text-white/85">{target.name}</h4>
                                <span className={cn('rounded border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider', ratingTone[target.rating])}>{target.rating}</span>
                            </div>
                            <p className="mt-1 text-[9px] leading-relaxed text-white/45">{target.reason}</p>
                        </div>
                    </div>
                    <VisibilityCurve target={target} />
                    <div className="grid grid-cols-3 gap-1 text-center font-mono text-[8px] text-white/45">
                        <span><Clock3 className="mr-1 inline h-3 w-3" />{formatTime(target.windowStart)}–{formatTime(target.windowEnd)}</span>
                        <span><Telescope className="mr-1 inline h-3 w-3" />{Math.round(target.maxAltitude)}° máx.</span>
                        <span><Moon className="mr-1 inline h-3 w-3" />{Math.round(target.moonSeparation)}°</span>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1" title="Duración · altitud · Luna · Bortle · objeto">
                        {Object.entries(target.breakdown).map(([key, value]) => (
                            <div key={key} className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-blue-400/65" style={{ width: `${Math.min(100, value / ({ duration: 35, altitude: 25, moon: 20, darkness: 10, target: 10 }[key as keyof typeof target.breakdown]) * 100)}%` }} /></div>
                        ))}
                    </div>
                    <button onClick={() => jumpTo(target)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-500/10 py-2 text-[9px] font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-500/20">
                        <Play className="h-3 w-3" /> Ver a la mejor hora
                    </button>
                </article>
            ))}
        </div>
    );
}
