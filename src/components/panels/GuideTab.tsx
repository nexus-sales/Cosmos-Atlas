'use client';

import { STARS } from '@/data/stars';
import { DSOS } from '@/data/dsos';
import { useAppStore } from '@/stores/useAppStore';
import { Search, Star as StarIcon, Orbit, CloudFog, Sparkles, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Star, DSO } from '@/types/celestial';

type Filter = 'all' | 'stars' | 'galaxies' | 'nebulae' | 'clusters';

const FILTERS: { id: Filter; label: string; activeClass: string }[] = [
    { id: 'all',      label: 'TODOS',     activeClass: 'bg-white/15 text-white border-white/30' },
    { id: 'stars',    label: 'ESTRELLAS', activeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50' },
    { id: 'galaxies', label: 'GALAXIAS',  activeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50' },
    { id: 'nebulae',  label: 'NEBULOSAS', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' },
    { id: 'clusters', label: 'CÃšMULOS',   activeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/50' },
];

function DSOTypeIcon({ type }: { type: DSO['type'] }) {
    if (type === 'galaxy') return <Orbit    className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (type === 'nebula') return <CloudFog className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    return                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
}

function dsoActiveClass(type: DSO['type']) {
    if (type === 'galaxy') return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
    if (type === 'nebula') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300';
    return 'border-blue-400/40 bg-blue-500/10 text-blue-300';
}

function InfoCard({ obj }: { obj: Star | DSO }) {
    const isDSO = 'type' in obj && 'id' in obj;
    return (
        <div className="mx-1 mb-2 mt-0.5 p-3 rounded-md border border-white/12 space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {isDSO ? (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    {(obj as DSO).type} Â· mag {(obj as DSO).mag}
                </p>
            ) : (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    {(obj as Star).constellation}
                </p>
            )}
            <p className="text-[11px] text-white/80 leading-relaxed">{obj.desc}</p>
            <p className="text-[10px] text-white/40 font-mono">
                RA {obj.ra.toFixed(2)}Â° Â· Dec {obj.dec.toFixed(2)}Â°
            </p>
        </div>
    );
}

export default function GuideTab() {
    const [search, setSearch]   = useState('');
    const [filter, setFilter]   = useState<Filter>('all');

    const targetedObject    = useAppStore((s) => s.targetedObject);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);

    const q = search.toLowerCase();

    const { starList, dsoList } = useMemo(() => {
        const matchStar = (s: Star) =>
            s.name.toLowerCase().includes(q) || s.constellation.toLowerCase().includes(q);
        const matchDSO = (d: DSO) =>
            d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);

        const stars = (filter === 'all' || filter === 'stars')
            ? [...STARS].sort((a, b) => a.mag - b.mag).filter(matchStar)
            : [];

        const dsos = (filter !== 'stars')
            ? DSOS.filter((d) => {
                if (!matchDSO(d)) return false;
                if (filter === 'galaxies') return d.type === 'galaxy';
                if (filter === 'nebulae')  return d.type === 'nebula';
                if (filter === 'clusters') return d.type === 'cluster';
                return true;
              })
            : [];

        return { starList: stars, dsoList: dsos };
    }, [q, filter]);

    const isTargeted = (obj: Star | DSO) => targetedObject?.name === obj.name;

    const handleSelect = (obj: Star | DSO) => {
        setTargetedObject(isTargeted(obj) ? null : obj);
    };

    return (
        <div className="space-y-3">

            {/* â”€â”€ Buscador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Buscar objeto o constelaciÃ³n..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg py-2.5 pl-10 pr-8 text-[12px] font-mono focus:outline-none transition-colors placeholder:text-white/25"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.85)' }}
                />
                {search && (
                    <button title="Limpiar" onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* â”€â”€ Filtros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex flex-wrap gap-1.5">
                {FILTERS.map(({ id, label, activeClass }) => (
                    <button
                        key={id}
                        onClick={() => setFilter(id)}
                        className={cn(
                            'px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider border transition-all',
                            filter === id
                                ? activeClass
                                : 'text-white/40 border-white/12 hover:text-white/65 hover:border-white/20'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* â”€â”€ Objetivo activo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {targetedObject && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-blue-400/35"
                    style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <span className="text-[12px] text-blue-300 font-bold font-mono truncate flex-1">
                        â—Ž {targetedObject.name}
                    </span>
                    <button title="Quitar puntero" onClick={() => setTargetedObject(null)}
                        className="text-white/35 hover:text-white/70 transition-colors shrink-0">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* â”€â”€ ESTRELLAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {starList.length > 0 && (
                <section>
                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-white/60 tracking-[0.18em] uppercase mb-2 pb-1.5 border-b border-white/10">
                        <StarIcon className="w-3.5 h-3.5 text-yellow-400/70" />
                        Estrellas <span className="text-white/35 text-[10px] font-normal">({starList.length})</span>
                    </h4>
                    <div className="space-y-0.5">
                        {starList.map((star) => {
                            const active = isTargeted(star);
                            return (
                                <div key={star.name}>
                                    <button
                                        onClick={() => handleSelect(star)}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all border',
                                            active
                                                ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200'
                                                : 'border-transparent hover:border-white/12 hover:bg-white/4 text-white/75 hover:text-white'
                                        )}
                                    >
                                        {/* Dot de color estrella */}
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ background: star.color, boxShadow: active ? `0 0 6px ${star.color}` : 'none' }} />
                                        <span className="text-[13px] font-semibold flex-1 truncate">{star.name}</span>
                                        <span className="text-[10px] text-white/40 shrink-0 font-mono">{star.mag.toFixed(1)}</span>
                                        <span className="text-[10px] text-white/35 shrink-0 italic hidden sm:block truncate max-w-[64px]">
                                            {star.constellation}
                                        </span>
                                    </button>
                                    {active && <InfoCard obj={star} />}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* â”€â”€ GALAXIAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {dsoList.filter(d => d.type === 'galaxy').length > 0 && (
                <DSOSection title="Galaxias" items={dsoList.filter(d => d.type === 'galaxy')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {/* â”€â”€ NEBULOSAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {dsoList.filter(d => d.type === 'nebula').length > 0 && (
                <DSOSection title="Nebulosas" items={dsoList.filter(d => d.type === 'nebula')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {/* â”€â”€ CÃšMULOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {dsoList.filter(d => d.type === 'cluster').length > 0 && (
                <DSOSection title="CÃºmulos" items={dsoList.filter(d => d.type === 'cluster')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {starList.length === 0 && dsoList.length === 0 && (
                <p className="text-center text-[12px] text-white/35 italic py-10">
                    Sin resultados para Â«{search}Â»
                </p>
            )}
        </div>
    );
}

function DSOSection({ title, items, isTargeted, onSelect }: {
    title: string;
    items: DSO[];
    isTargeted: (o: Star | DSO) => boolean;
    onSelect: (o: Star | DSO) => void;
}) {
    return (
        <section>
            <h4 className="flex items-center gap-2 text-[11px] font-bold text-white/60 tracking-[0.18em] uppercase mb-2 pb-1.5 border-b border-white/10">
                <DSOTypeIcon type={items[0].type} />
                {title} <span className="text-white/35 text-[10px] font-normal">({items.length})</span>
            </h4>
            <div className="space-y-0.5">
                {items.map((dso) => {
                    const active = isTargeted(dso);
                    return (
                        <div key={dso.id}>
                            <button
                                onClick={() => onSelect(dso)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all border',
                                    active
                                        ? dsoActiveClass(dso.type)
                                        : 'border-transparent hover:border-white/12 hover:bg-white/4 text-white/75 hover:text-white'
                                )}
                            >
                                <DSOTypeIcon type={dso.type} />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-[13px] font-semibold truncate">{dso.name}</span>
                                    <span className="text-[10px] text-white/40 font-mono">{dso.id}</span>
                                </div>
                                <span className="text-[10px] text-white/40 shrink-0 font-mono">{dso.mag.toFixed(1)}</span>
                            </button>
                            {active && <InfoCard obj={dso} />}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
