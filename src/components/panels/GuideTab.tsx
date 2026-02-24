'use client';

import { STARS } from '@/data/stars';
import { DSOS } from '@/data/dsos';
import { CONSTELLATIONS } from '@/data/constellations';
import { useAppStore } from '@/stores/useAppStore';
import { Search, Star as StarIcon, Orbit, CloudFog, Sparkles, X, Globe2, Share2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Star, DSO, Planet } from '@/types/celestial';
import { equToHor, equatorialTo3D } from '@/lib/astronomy/transforms';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';

type Filter = 'all' | 'stars' | 'planets' | 'galaxies' | 'nebulae' | 'clusters' | 'constellations';

const FILTERS: { id: Filter; label: string; activeClass: string }[] = [
    { id: 'all',            label: 'TODOS',     activeClass: 'bg-white/15 text-white border-white/30' },
    { id: 'stars',          label: 'ESTRELLAS', activeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50' },
    { id: 'planets',        label: 'PLANETAS',  activeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/50' },
    { id: 'galaxies',       label: 'GALAXIAS',  activeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50' },
    { id: 'nebulae',        label: 'NEBULOSAS', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50' },
    { id: 'clusters',       label: 'C\u00DAMULOS',  activeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/50' },
    { id: 'constellations', label: 'CONSTEL.',  activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50' },
];

// ── Planet ephemeris helpers ─────────────────────────────────────────────────

interface PlanetCfg {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    desc: (mag: number) => string;
}

function getMoonPhaseName(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return 'Luna nueva';
    if (p < 67.5)  return 'Creciente c\u00f3ncava';
    if (p < 112.5) return 'Cuarto creciente';
    if (p < 157.5) return 'Gibosa creciente';
    if (p < 202.5) return 'Luna llena';
    if (p < 247.5) return 'Gibosa menguante';
    if (p < 292.5) return 'Cuarto menguante';
    return 'Creciente menguante';
}

const PLANET_GUIDE_CONFIGS: PlanetCfg[] = [
    { body: Astronomy.Body.Moon,    name: 'Luna',     symbol: '\u263d', color: '#d8d6c0', desc: (m) => `Sat\u00e9lite natural de la Tierra. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Venus,   name: 'Venus',    symbol: '\u2640', color: '#fff8d4', desc: (m) => `Planeta m\u00e1s brillante del cielo. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Jupiter, name: 'J\u00fapiter', symbol: '\u2643', color: '#ffe4b0', desc: (m) => `El gigante gaseoso del sistema solar. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Mars,    name: 'Marte',    symbol: '\u2642', color: '#ff7744', desc: (m) => `El Planeta Rojo. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Saturn,  name: 'Saturno',  symbol: '\u2644', color: '#f5d97a', desc: (m) => `Anillos visibles en telescopio. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Mercury, name: 'Mercurio', symbol: '\u263f', color: '#b8c8d8', desc: (m) => `El planeta m\u00e1s escurridizo. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Uranus,  name: 'Urano',    symbol: '\u26e2', color: '#a8dff0', desc: (m) => `Gigante de hielo. Mag ${m.toFixed(1)}.` },
    { body: Astronomy.Body.Neptune, name: 'Neptuno',  symbol: '\u2646', color: '#4060ff', desc: (m) => `El gigante azul. Mag ${m.toFixed(1)}.` },
];

function buildPlanet(cfg: PlanetCfg, date: Date, lat: number, lon: number): (Planet & { alt: number }) | null {
    try {
        const obs   = new Astronomy.Observer(lat, lon, 0);
        const eq    = Astronomy.Equator(cfg.body, date, obs, true, true);
        const illum = Astronomy.Illumination(cfg.body, date);
        const ra    = eq.ra * 15;
        const dec   = eq.dec;
        const { alt } = equToHor(ra, dec, lat, lon, date);

        // For the Moon, enrich description with phase info
        let desc = cfg.desc(illum.mag);
        if (cfg.body === Astronomy.Body.Moon) {
            const moonPhase = Astronomy.MoonPhase(date);
            const pct = (illum.phase_fraction * 100).toFixed(0);
            desc = `${getMoonPhaseName(moonPhase)} \u2014 ${pct}% iluminada. ${desc}`;
        }

        return { name: cfg.name, symbol: cfg.symbol, ra, dec, mag: illum.mag, color: cfg.color, desc, kind: 'planet', alt };
    } catch {
        return null;
    }
}

// ── Constellation centroid helpers ───────────────────────────────────────────

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));

/** Inverse of equatorialTo3D(ra, dec, 1) */
function vec3ToRaDec(x: number, y: number, z: number): { ra: number; dec: number } {
    const dec = 90 - Math.acos(Math.max(-1, Math.min(1, y))) * 180 / Math.PI;
    const ra  = ((Math.atan2(z, x) * 180 / Math.PI + 180) % 360 + 360) % 360;
    return { ra, dec };
}

/** Pre-compute constellation centroid positions as Planet-shaped objects */
function buildConstellationTargets(): Planet[] {
    return Object.keys(CONSTELLATIONS).map((name) => {
        const pairs = CONSTELLATIONS[name];
        const starNames = new Set<string>();
        pairs.forEach(([a, b]) => { starNames.add(a); starNames.add(b); });

        const sum = new THREE.Vector3();
        let count = 0;
        starNames.forEach((sn) => {
            const s = STAR_MAP.get(sn);
            if (!s) return;
            const [x, y, z] = equatorialTo3D(s.ra, s.dec, 1);
            sum.add(new THREE.Vector3(x, y, z));
            count++;
        });
        if (count === 0) return null;

        const unit = sum.divideScalar(count).normalize();
        const { ra, dec } = vec3ToRaDec(unit.x, unit.y, unit.z);
        return {
            name,
            ra,
            dec,
            mag: 0,
            desc: `Constelaci\u00f3n de ${name} \u2014 ${count} estrellas en el cat\u00e1logo`,
            color: '#b4d2ff',
            symbol: '\u2736',   // ✶ marker to identify constellation targets
            kind: 'planet' as const,
        };
    }).filter(Boolean) as Planet[];
}

const CONSTELLATION_TARGETS = buildConstellationTargets();

// ── Icon / style helpers ─────────────────────────────────────────────────────

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

function skyObjectKey(obj: { name: string; ra: number; dec: number }, prefix: string) {
    return `${prefix}:${obj.name}:${obj.ra.toFixed(6)}:${obj.dec.toFixed(6)}`;
}

function InfoCard({ obj }: { obj: Star | DSO | Planet }) {
    const isDSO           = 'id' in obj;
    const isPlanet        = !isDSO && 'kind' in obj && (obj as Planet).kind === 'planet';
    const isConstellation = isPlanet && (obj as Planet).symbol === '\u2736';
    return (
        <div className="mx-1 mb-2 mt-0.5 p-3 rounded-md border border-white/12 space-y-1.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {isDSO ? (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    {(obj as DSO).type} &middot; mag {(obj as DSO).mag}
                </p>
            ) : isConstellation ? (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    &#10038; Constelaci&oacute;n
                </p>
            ) : isPlanet ? (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    {(obj as Planet).symbol} Planeta &middot; mag {(obj as Planet).mag.toFixed(1)}
                </p>
            ) : (
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                    {(obj as Star).constellation}
                </p>
            )}
            <p className="text-[11px] text-white/80 leading-relaxed">{obj.desc}</p>
            <p className="text-[10px] text-white/40 font-mono">
                RA {obj.ra.toFixed(2)}&deg; &middot; Dec {obj.dec.toFixed(2)}&deg;
            </p>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function GuideTab() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');

    const targetedObject    = useAppStore((s) => s.targetedObject);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);
    const observer          = useAppStore((s) => s.observer);
    const time              = useAppStore((s) => s.time);

    const q = search.toLowerCase();

    const { starList, dsoList, planetList, constellationList } = useMemo(() => {
        const matchStar = (s: Star) =>
            s.name.toLowerCase().includes(q) || s.constellation.toLowerCase().includes(q);
        const matchDSO = (d: DSO) =>
            d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
        const matchName = (n: string) => n.toLowerCase().includes(q);

        const stars = (filter === 'all' || filter === 'stars')
            ? [...STARS].sort((a, b) => a.mag - b.mag).filter(matchStar).map(s => ({
                ...s,
                alt: equToHor(s.ra, s.dec, observer.lat, observer.lon, time).alt,
              }))
            : [];

        const dsos = (filter === 'all' || filter === 'galaxies' || filter === 'nebulae' || filter === 'clusters')
            ? DSOS.filter((d) => {
                if (!matchDSO(d)) return false;
                if (filter === 'galaxies') return d.type === 'galaxy';
                if (filter === 'nebulae')  return d.type === 'nebula';
                if (filter === 'clusters') return d.type === 'cluster';
                return true;
              }).map(d => ({
                ...d,
                alt: equToHor(d.ra, d.dec, observer.lat, observer.lon, time).alt,
              }))
            : [];

        const planets = (filter === 'all' || filter === 'planets')
            ? PLANET_GUIDE_CONFIGS
                .map(cfg => buildPlanet(cfg, time, observer.lat, observer.lon))
                .filter((p): p is Planet & { alt: number } => p !== null && matchName(p.name))
            : [];

        const constellations = (filter === 'all' || filter === 'constellations')
            ? CONSTELLATION_TARGETS
                .filter(c => matchName(c.name))
                .map(c => ({
                    ...c,
                    alt: equToHor(c.ra, c.dec, observer.lat, observer.lon, time).alt,
                }))
            : [];

        return { starList: stars, dsoList: dsos, planetList: planets, constellationList: constellations };
    }, [q, filter, observer, time]);

    const isTargeted = (obj: Star | DSO | Planet) => targetedObject?.name === obj.name;

    const handleSelect = (obj: Star | DSO | Planet) => {
        setTargetedObject(isTargeted(obj) ? null : obj);
    };

    return (
        <div className="space-y-3">

            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Buscar objeto o constelaci\u00f3n..."
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

            {/* Filtros */}
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

            {/* Objetivo activo */}
            {targetedObject && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-blue-400/35"
                    style={{ background: 'rgba(59,130,246,0.12)' }}>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <span className="text-[12px] text-blue-300 font-bold font-mono truncate flex-1">
                        &#9678; {targetedObject.name}
                    </span>
                    <button title="Quitar puntero" onClick={() => setTargetedObject(null)}
                        className="text-white/35 hover:text-white/70 transition-colors shrink-0">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* PLANETAS */}
            {planetList.length > 0 && (
                <section>
                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-white/60 tracking-[0.18em] uppercase mb-2 pb-1.5 border-b border-white/10">
                        <Globe2 className="w-3.5 h-3.5 text-orange-400/70" />
                        Planetas <span className="text-white/35 text-[10px] font-normal">({planetList.length})</span>
                    </h4>
                    <div className="space-y-0.5">
                        {planetList.map((planet) => {
                            const active = isTargeted(planet);
                            return (
                                <div key={skyObjectKey(planet, 'planet')}>
                                    <button
                                        onClick={() => handleSelect(planet)}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all border',
                                            active
                                                ? 'border-orange-400/40 bg-orange-500/10 text-orange-200'
                                                : 'border-transparent hover:border-white/12 hover:bg-white/4 text-white/75 hover:text-white'
                                        )}
                                    >
                                        <span className="text-[14px] shrink-0 leading-none" style={{ color: planet.color }}>
                                            {planet.symbol}
                                        </span>
                                        <span className="text-[13px] font-semibold flex-1 truncate">{planet.name}</span>
                                        <span className="text-[10px] text-white/40 shrink-0 font-mono">{planet.mag.toFixed(1)}</span>
                                        <div
                                            title={planet.alt > 0 ? `Visible \u00b7 Alt ${planet.alt.toFixed(0)}\u00b0` : 'Bajo el horizonte'}
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full shrink-0 ml-0.5',
                                                planet.alt > 0 ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]' : 'bg-white/15'
                                            )}
                                        />
                                    </button>
                                    {active && <InfoCard obj={planet} />}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ESTRELLAS */}
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
                                <div key={skyObjectKey(star, 'star')}>
                                    <button
                                        onClick={() => handleSelect(star)}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all border',
                                            active
                                                ? 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200'
                                                : 'border-transparent hover:border-white/12 hover:bg-white/4 text-white/75 hover:text-white'
                                        )}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ background: star.color, boxShadow: active ? `0 0 6px ${star.color}` : 'none' }} />
                                        <span className="text-[13px] font-semibold flex-1 truncate">{star.name}</span>
                                        <span className="text-[10px] text-white/40 shrink-0 font-mono">{star.mag.toFixed(1)}</span>
                                        <span className="text-[10px] text-white/35 shrink-0 italic hidden sm:block truncate max-w-[64px]">
                                            {star.constellation}
                                        </span>
                                        <div
                                            title={star.alt > 0 ? `Visible \u00b7 Alt ${star.alt.toFixed(0)}\u00b0` : 'Bajo el horizonte'}
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full shrink-0 ml-0.5',
                                                star.alt > 0 ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]' : 'bg-white/15'
                                            )}
                                        />
                                    </button>
                                    {active && <InfoCard obj={star} />}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* GALAXIAS */}
            {dsoList.filter(d => d.type === 'galaxy').length > 0 && (
                <DSOSection title="Galaxias" items={dsoList.filter(d => d.type === 'galaxy')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {/* NEBULOSAS */}
            {dsoList.filter(d => d.type === 'nebula').length > 0 && (
                <DSOSection title="Nebulosas" items={dsoList.filter(d => d.type === 'nebula')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {/* C\u00DAMULOS */}
            {dsoList.filter(d => d.type === 'cluster').length > 0 && (
                <DSOSection title="C\u00famulos" items={dsoList.filter(d => d.type === 'cluster')}
                    isTargeted={isTargeted} onSelect={handleSelect} />
            )}

            {/* CONSTELACIONES */}
            {constellationList.length > 0 && (
                <section>
                    <h4 className="flex items-center gap-2 text-[11px] font-bold text-white/60 tracking-[0.18em] uppercase mb-2 pb-1.5 border-b border-white/10">
                        <Share2 className="w-3.5 h-3.5 text-indigo-400/70" />
                        Constelaciones <span className="text-white/35 text-[10px] font-normal">({constellationList.length})</span>
                    </h4>
                    <div className="space-y-0.5">
                        {constellationList.map((c) => {
                            const active = isTargeted(c);
                            return (
                                <div key={skyObjectKey(c, 'constellation')}>
                                    <button
                                        onClick={() => handleSelect(c)}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all border',
                                            active
                                                ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-200'
                                                : 'border-transparent hover:border-white/12 hover:bg-white/4 text-white/75 hover:text-white'
                                        )}
                                    >
                                        <span className="text-[11px] text-indigo-400/60 shrink-0">&#10038;</span>
                                        <span className="text-[13px] font-semibold flex-1 truncate">{c.name}</span>
                                        <div
                                            title={c.alt > 0 ? `Visible \u00b7 Alt ${c.alt.toFixed(0)}\u00b0` : 'Bajo el horizonte'}
                                            className={cn(
                                                'w-1.5 h-1.5 rounded-full shrink-0 ml-0.5',
                                                c.alt > 0 ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]' : 'bg-white/15'
                                            )}
                                        />
                                    </button>
                                    {active && <InfoCard obj={c} />}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {starList.length === 0 && dsoList.length === 0 && planetList.length === 0 && constellationList.length === 0 && (
                <p className="text-center text-[12px] text-white/35 italic py-10">
                    Sin resultados para &laquo;{search}&raquo;
                </p>
            )}
        </div>
    );
}

function DSOSection({ title, items, isTargeted, onSelect }: {
    title: string;
    items: (DSO & { alt: number })[];
    isTargeted: (o: Star | DSO | Planet) => boolean;
    onSelect: (o: Star | DSO | Planet) => void;
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
                                <div
                                    title={dso.alt > 0 ? `Visible \u00b7 Alt ${dso.alt.toFixed(0)}\u00b0` : 'Bajo el horizonte'}
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full shrink-0 ml-0.5',
                                        dso.alt > 0 ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]' : 'bg-white/15'
                                    )}
                                />
                            </button>
                            {active && <InfoCard obj={dso} />}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
