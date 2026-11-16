'use client';

import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import * as Astronomy from 'astronomy-engine';
import { Globe, Heart, Moon as MoonIcon, MousePointer2, Navigation, Rocket, Star as StarIcon, Zap, Eye, EyeOff, BookOpen, X } from 'lucide-react';

import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import { getKidFact } from '@/data/kidFacts';
import { getSolarSystemBodyByName } from '@/data/solarSystemCatalog';
import { getMoonPhaseIcon, getMoonPhaseName } from '@/lib/astronomy/moon';
import type { DSO, Planet, Star } from '@/types/celestial';

export default function ObjectInfoTab({ onGoToGuide }: { onGoToGuide?: () => void }) {
    const selected = useAppStore((state) => state.selectedObject) as Star | DSO | Planet | null;
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const targetedObject = useAppStore((state) => state.targetedObject);
    const favorites = useAppStore((state) => state.favorites);
    const toggleFavorite = useAppStore((state) => state.toggleFavorite);
    const markAsVisited = useAppStore((state) => state.markAsVisited);
    const kidsMode = useAppStore((state) => state.settings.kidsMode);
    const time = useAppStore((state) => state.timeMinute);
    const solarSystemBodies = useCatalog((state) => state.solarSystemBodies);
    const coords = useCelestialVisibility(selected?.ra || 0, selected?.dec || 0);

    const id = selected ? ('id' in selected ? selected.id : selected.name) : '';
    const isFavorite = favorites.includes(id);

    useEffect(() => {
        if (!id) return;
        markAsVisited(id);

        const planetIds = ['Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno'];
        const visitedPlanets = planetIds.filter((planet) => useAppStore.getState().visited.includes(planet));
        if (visitedPlanets.length === planetIds.length) {
            useAppStore.getState().updateAchievement('planetHunter', true);
        }

        const messierVisited = useAppStore.getState().visited.filter((value) => value.startsWith('M'));
        useAppStore.getState().updateAchievement('messierMarathon', messierVisited.length);
    }, [id, markAsVisited]);

    const isTargeted = targetedObject?.name === selected?.name;
    const isStar = selected ? 'constellation' in selected : false;
    const isConstellation = selected ? 'symbol' in selected && selected.symbol === '✦' : false;
    const isPlanet = selected ? !isConstellation && 'kind' in selected && (selected as Planet).kind === 'planet' : false;
    const isMoon = selected?.name === 'Luna';
    const solarSystemInfo = selected && (isPlanet || isMoon)
        ? getSolarSystemBodyByName(selected.name, solarSystemBodies)
        : undefined;

    const typeLabel = isConstellation ? 'CONSTELACIÓN' : isStar ? 'ESTRELLA' : isMoon ? 'SATÉLITE' : isPlanet ? 'PLANETA' : ((selected as DSO)?.type?.toUpperCase?.() ?? 'OBJETO');
    const accentColor = isConstellation ? '#a78bfa' : isStar ? '#60a5fa' : (isPlanet || isMoon) ? '#00f2ff' : '#a78bfa';
    const isVisible = coords.alt > 0;
    const solarSystemDate = time.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
    const primaryDescription = solarSystemInfo?.shortDesc || selected?.desc || '';

    const moonPhaseAngle = isMoon ? Astronomy.MoonPhase(time) : 0;
    const moonPhaseName = isMoon ? getMoonPhaseName(moonPhaseAngle) : '';
    const moonPhaseIconStr = isMoon ? getMoonPhaseIcon(moonPhaseAngle) : '';
    const moonIllum = isMoon ? Astronomy.Illumination(Astronomy.Body.Moon, time).phase_fraction * 100 : 0;

    const accentVars = {
        '--accent-color': accentColor,
        '--accent-soft': `${accentColor}0a`,
        '--accent-border': `${accentColor}22`,
        '--accent-glow': `${accentColor}60`,
        '--accent-chip': `${accentColor}18`,
        '--accent-orb': `${accentColor}10`,
        '--accent-btn-bg': `${accentColor}20`,
        '--accent-90': `${accentColor}90`,
    } as CSSProperties;

    if (!selected) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-inner">
                    <MousePointer2 className="h-6 w-6 text-white/30" />
                </div>
                <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-white/40">Sin selección</div>
                    <div className="text-[11px] font-mono text-white/25 leading-relaxed">
                        Haz clic en cualquier estrella, planeta<br />u objeto en el mapa del cielo
                    </div>
                </div>
                {onGoToGuide && (
                    <button
                        onClick={onGoToGuide}
                        className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer shadow-sm"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span>Explorar en la Guía</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="animate-in space-y-4 fade-in duration-300" style={accentVars}>
            <div className="object-card relative overflow-hidden rounded-xl border bg-white/[0.03] p-5">
                <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                    <button
                        onClick={() => toggleFavorite(id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                            isFavorite ? 'border-red-500/50 bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                        <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white/40'}`} />
                    </button>

                    <button
                        onClick={() => setTargetedObject(isTargeted ? null : selected)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-500 ${
                            isTargeted ? 'border-[#00f2ff] bg-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        title={isTargeted ? 'Dejar de seguir' : 'Seguir con telescopio'}
                    >
                        <Navigation className={`h-3.5 w-3.5 ${isTargeted ? 'fill-black text-black' : 'text-white/40'}`} />
                    </button>

                    <button
                        onClick={() => {
                            setSelectedObject(null);
                            setTargetedObject(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 cursor-pointer"
                        title="Desmarcar / Volver al inicio"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="object-orb absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full blur-3xl" />

                <div className="mb-3 flex items-start justify-between">
                    <span className="object-chip rounded-sm px-2 py-1 text-[11px] font-bold tracking-[0.25em]">
                        {typeLabel}
                        {isPlanet ? ` ${(selected as Planet).symbol}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono ${isVisible ? 'text-green-400' : 'text-red-400'}`}>
                            {isVisible ? '▲ VISIBLE' : '▽ OCULTO'}
                        </span>
                        <button
                            onClick={() => {
                                setSelectedObject(null);
                                setTargetedObject(null);
                            }}
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                            title="Desmarcar objeto"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>

                <h3 className="object-title font-display mb-1 text-2xl font-bold tracking-wide text-white">
                    {selected.name}
                </h3>

                {isStar && (
                    <div className="mb-3 flex items-center gap-2">
                        <StarIcon className="object-accent h-2.5 w-2.5" />
                        <span className="object-accent-90 text-[11px] font-mono tracking-wider">
                            {(selected as Star).constellation}
                        </span>
                    </div>
                )}

                {isPlanet && (
                    <div className="mb-3 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Globe className="object-accent h-2.5 w-2.5" />
                            <span className="object-accent-90 text-[11px] font-mono tracking-wider">
                                Sistema Solar · {solarSystemDate}
                            </span>
                        </div>
                    </div>
                )}

                <p className="text-[11px] leading-relaxed text-white/55 min-h-[40px]">
                    {primaryDescription}
                </p>
            </div>

            {!kidsMode && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        {isMoon ? (
                            <MetricCard
                                label="Fase Lunar"
                                value={moonPhaseName}
                                sub={`${moonIllum.toFixed(0)}% iluminada ${moonPhaseIconStr}`}
                                color={accentColor}
                                icon={<MoonIcon className="h-3 w-3" />}
                            />
                        ) : (
                            <MetricCard
                                label={'magnitudeBand' in selected && selected.magnitudeBand === 'G' ? 'Magnitud G' : 'Magnitud'}
                                value={selected.mag?.toFixed(2) ?? '?'}
                                sub={selected.mag === undefined ? 'N/A' : (selected.mag < 0 ? 'Superbrill.' : selected.mag < 2 ? 'Muy brillante' : 'Brillante')}
                                color={accentColor}
                                icon={<Zap className="h-3 w-3" />}
                            />
                        )}
                        <MetricCard
                            label="Posición"
                            value={`${((selected.ra || 0) / 15).toFixed(1)}h`}
                            sub={`Dec ${selected.dec > 0 ? '+' : ''}${(selected.dec || 0).toFixed(1)}°`}
                            color={accentColor}
                            icon={<Navigation className="h-3 w-3" />}
                        />
                    </div>

                    <div className="atlas-card rounded-xl p-4">
                        <div className="mb-3 flex items-center gap-2">
                            {isVisible
                                ? <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                : <EyeOff className="h-3.5 w-3.5 text-red-400" />}
                            <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${isVisible ? 'text-green-400' : 'text-red-400'}`}>
                                {isVisible ? 'Visible ahora' : 'Bajo el horizonte'}
                            </span>
                        </div>

                        <div className="mb-3 grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/20">Altitud</div>
                                <div className={`text-base font-bold font-mono ${isVisible ? 'text-green-400' : 'text-white/40'}`}>
                                    {coords.alt.toFixed(1)}°
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 text-[11px] uppercase tracking-wider text-white/20">Azimut</div>
                                <div className="text-base font-bold font-mono text-white/70">
                                    {coords.az.toFixed(1)}°
                                </div>
                            </div>
                        </div>
                    </div>

                    {solarSystemInfo && (
                        <>
                            {(solarSystemInfo.longDesc || solarSystemInfo.observationTips) && (
                                <div className="atlas-card rounded-xl p-4 space-y-3">
                                    {solarSystemInfo.longDesc && (
                                        <InfoBlock title="Contexto" text={solarSystemInfo.longDesc} />
                                    )}
                                    {solarSystemInfo.observationTips && (
                                        <InfoBlock title="Observación" text={solarSystemInfo.observationTips} />
                                    )}
                                </div>
                            )}

                            {(solarSystemInfo.funFact || solarSystemInfo.mythology || solarSystemInfo.planetType || solarSystemInfo.moonsCount !== undefined || solarSystemInfo.hasRings !== undefined || solarSystemInfo.orbitalPeriodDays !== undefined) && (
                                <div className="atlas-card rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {solarSystemInfo.planetType && <DataPoint label="Tipo" value={solarSystemInfo.planetType} />}
                                        {solarSystemInfo.moonsCount !== undefined && <DataPoint label="Lunas" value={String(solarSystemInfo.moonsCount)} />}
                                        {solarSystemInfo.hasRings !== undefined && <DataPoint label="Anillos" value={solarSystemInfo.hasRings ? 'Sí' : 'No'} />}
                                        {solarSystemInfo.orbitalPeriodDays !== undefined && <DataPoint label="Órbita" value={`${solarSystemInfo.orbitalPeriodDays.toFixed(1)} d`} />}
                                    </div>
                                    {solarSystemInfo.funFact && <InfoBlock title="Curiosidad" text={solarSystemInfo.funFact} />}
                                    {solarSystemInfo.mythology && <InfoBlock title="Mitología" text={solarSystemInfo.mythology} />}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {kidsMode && selected && (
                <div className="animate-in rounded-xl border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-400/20 to-orange-500/10 p-5 shadow-[0_0_20px_rgba(250,204,21,0.15)] bounce-in duration-500">
                    <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-yellow-500/30 bg-black/20 px-3 py-1.5">
                        <Rocket className="h-4 w-4 animate-bounce text-yellow-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">¡Dato Espacial!</span>
                    </div>
                    <p className="text-[14px] font-semibold leading-relaxed text-white/90 drop-shadow-md">
                        {getKidFact(selected.name, isStar, isPlanet)}
                    </p>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, sub, color, icon }: {
    label: string;
    value: string;
    sub: string;
    color: string;
    icon: ReactNode;
}) {
    const metricVars = { '--metric-color': `${color}60` } as CSSProperties;
    return (
        <div className="atlas-card rounded-xl p-3.5">
            <div className="metric-label mb-2 flex items-center gap-1.5" style={metricVars}>
                {icon}
                <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-lg font-bold font-mono text-white/90">{value}</div>
            <div className="text-[11px] font-mono text-white/30">{sub}</div>
        </div>
    );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/20">{title}</div>
            <p className="text-[11px] leading-relaxed text-white/65 min-h-[30px]">
                {text}
            </p>
        </div>
    );
}

function DataPoint({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/20">{label}</div>
            <div className="text-[11px] font-mono text-white/70">{value}</div>
        </div>
    );
}
