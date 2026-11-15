'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Heart, Navigation, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { getSolarSystemBodyByName } from '@/data/solarSystemCatalog';
import { cn } from '@/lib/utils';
import type { DSO, Planet, Star } from '@/types/celestial';

type CelestialObject = Star | DSO | Planet;
type DetailItem = { label: string; value: string };
type StoryItem = { title: string; text: string };

function objectId(obj: CelestialObject) {
    return 'id' in obj ? obj.id : obj.name;
}

function objectKindLabel(obj: CelestialObject) {
    if (isConstellationTarget(obj)) return 'Mapa de la boveda';
    if ('constellation' in obj) return getConstellationDisplayName(obj.constellation);
    if ('type' in obj) {
        if (obj.type === 'galaxy') return 'Galaxia';
        if (obj.type === 'nebula') return 'Nebulosa';
        return 'Cumulo estelar';
    }
    return obj.name === 'Luna' ? 'Satelite natural' : 'Sistema Solar';
}

function objectTypeLabel(obj: CelestialObject) {
    if (isConstellationTarget(obj)) return 'Constelacion';
    if ('constellation' in obj) return 'Estrella';
    if ('type' in obj) return obj.type === 'galaxy' ? 'Galaxia' : obj.type === 'nebula' ? 'Nebulosa' : 'Cumulo';
    return obj.name === 'Luna' ? 'Luna' : 'Planeta';
}

function isConstellationTarget(obj: CelestialObject) {
    return 'kind' in obj && obj.kind === 'planet' && obj.symbol === '\u2736';
}

function formatNumber(value: number, digits = 1) {
    return new Intl.NumberFormat('es-ES', {
        maximumFractionDigits: digits,
    }).format(value);
}

function formatDistanceAu(au?: number) {
    if (!au || au <= 0) return undefined;
    if (au < 0.01) return `${formatNumber(au * 149_597_870, 0)} km`;
    return `${formatNumber(au, 2)} ua`;
}

function formatOrbitalPeriod(days?: number) {
    if (!days) return undefined;
    if (days >= 365) return `${formatNumber(days / 365.25, 1)} anos`;
    return `${formatNumber(days, 0)} dias`;
}

function extractLightYears(desc?: string) {
    if (!desc) return undefined;
    const match = desc.match(/(\d+(?:[.,]\d+)?)\s*(?:al\.?|anos luz|a(?:ñ|n)os luz)/i);
    if (!match) return undefined;
    return `${match[1].replace('.', ',')} anos luz`;
}

function magnitudeMeaning(mag?: number) {
    if (mag === undefined || Number.isNaN(mag)) return 'Sin dato fiable';
    if (mag <= 0) return 'Brillo excepcional';
    if (mag <= 2) return 'Muy brillante';
    if (mag <= 5.8) return 'Visible a simple vista';
    if (mag <= 9) return 'Mejor con prismaticos';
    return 'Necesita telescopio';
}

function altitudeMeaning(alt: number) {
    if (alt >= 45) return 'Muy bien colocado';
    if (alt >= 20) return 'Observable con comodidad';
    if (alt > 0) return 'Bajo: busca horizonte limpio';
    return 'Bajo el horizonte';
}

function directionLabel(az: number) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return directions[Math.round((((az % 360) + 360) % 360) / 45) % directions.length];
}

function starColorMeaning(color: string) {
    const value = color.toLowerCase();
    if (value.includes('ff66') || value.includes('9966') || value.includes('aa55')) return 'Tono calido: estrella fria o evolucionada';
    if (value.includes('cc88') || value.includes('f0cc') || value.includes('f4e8')) return 'Tono dorado: temperatura intermedia';
    if (value.includes('90') || value.includes('b0') || value.includes('c8')) return 'Tono blanco-azul: estrella caliente';
    return 'El color aparente da pistas de temperatura';
}

function dsoTypeMeaning(obj: DSO) {
    if (obj.type === 'galaxy') return 'Isla de estrellas fuera de la Via Lactea';
    if (obj.type === 'nebula') return 'Nube de gas y polvo iluminada o activa';
    return 'Familia de estrellas nacidas o agrupadas juntas';
}

function buildDetails(
    selected: CelestialObject,
    coords: ReturnType<typeof useCelestialVisibility>,
    solarSystemInfo?: ReturnType<typeof getSolarSystemBodyByName>
) {
    const details: DetailItem[] = [
        { label: 'Magnitud', value: selected.mag?.toFixed(2) ?? '?' },
        { label: 'Brillo', value: magnitudeMeaning(selected.mag) },
        { label: 'AR/Dec', value: `${(selected.ra / 15).toFixed(2)}h ${selected.dec >= 0 ? '+' : ''}${selected.dec.toFixed(1)} deg` },
        { label: 'Ac/Alt', value: `${directionLabel(coords.az)} ${coords.az.toFixed(0)} deg / ${coords.alt >= 0 ? '+' : ''}${coords.alt.toFixed(0)} deg` },
        { label: 'Ahora', value: altitudeMeaning(coords.alt) },
    ];

    if ('constellation' in selected) {
        const distance = extractLightYears(selected.desc);
        details.splice(1, 0, { label: 'Constelacion', value: getConstellationDisplayName(selected.constellation) });
        if (distance) details.splice(2, 0, { label: 'Distancia', value: distance });
        details.push({ label: 'Color', value: starColorMeaning(selected.color) });
        return details;
    }

    if ('type' in selected) {
        if (selected.sizeArcmin) details.splice(1, 0, { label: 'Tamano aparente', value: `${formatNumber(selected.sizeArcmin, 0)}'` });
        details.splice(1, 0, { label: 'Naturaleza', value: dsoTypeMeaning(selected) });
        return details;
    }

    if (isConstellationTarget(selected)) {
        const count = selected.desc.match(/(\d+)\s+estrellas/i)?.[1];
        details.splice(1, 0, { label: 'Tipo', value: 'Region del cielo' });
        if (count) details.splice(2, 0, { label: 'Catalogo', value: `${count} estrellas enlazadas` });
        return details;
    }

    const distance = formatDistanceAu(selected.dist);
    if (solarSystemInfo?.planetType) details.splice(1, 0, { label: 'Tipo', value: solarSystemInfo.planetType });
    if (distance) details.splice(2, 0, { label: 'Distancia', value: distance });
    if (solarSystemInfo?.moonsCount !== undefined) details.push({ label: 'Lunas', value: String(solarSystemInfo.moonsCount) });
    if (solarSystemInfo?.hasRings !== undefined) details.push({ label: 'Anillos', value: solarSystemInfo.hasRings ? 'Si' : 'No' });
    if (solarSystemInfo?.orbitalPeriodDays) details.push({ label: 'Orbita', value: formatOrbitalPeriod(solarSystemInfo.orbitalPeriodDays) ?? '' });
    return details.filter((item) => item.value);
}

function buildStories(
    selected: CelestialObject,
    solarSystemInfo?: ReturnType<typeof getSolarSystemBodyByName>
) {
    if ('constellation' in selected) {
        return [
            { title: 'Por que importa', text: selected.desc },
            { title: 'Como mirarla', text: 'Usala como ancla visual: primero localiza la estrella brillante y luego sigue las lineas de su constelacion para orientarte en la boveda.' },
        ];
    }

    if ('type' in selected) {
        return [
            { title: 'Naturaleza', text: selected.desc },
            { title: 'Como observarlo', text: selected.mag <= 6 ? 'Con cielo oscuro puede insinuarse a simple vista; con prismaticos gana contraste.' : 'Conviene cielo oscuro, vision lateral y paciencia: estos objetos aparecen mejor cuando no los miras de frente.' },
        ];
    }

    if (isConstellationTarget(selected)) {
        return [
            { title: 'Mapa celeste', text: selected.desc },
            { title: 'Para enamorar al publico', text: 'Una constelacion no es un objeto unico: es una forma humana de convertir puntos lejanos en una ruta reconocible por el cielo.' },
        ];
    }

    return [
        { title: 'Contexto', text: solarSystemInfo?.longDesc || selected.desc },
        ...(solarSystemInfo?.observationTips ? [{ title: 'Observacion', text: solarSystemInfo.observationTips }] : []),
        ...(solarSystemInfo?.funFact ? [{ title: 'Dato memorable', text: solarSystemInfo.funFact }] : []),
    ];
}

function InfoRow({ item }: { item: DetailItem }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
            <span className="text-[11px] font-medium text-white/38">{item.label}</span>
            <span className="max-w-[62%] text-right text-[12px] font-bold leading-snug text-white/88">{item.value}</span>
        </div>
    );
}

function StoryBlock({ item, accent }: { item: StoryItem; accent: string }) {
    return (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3.5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: `${accent}ee` }}>
                {item.title}
            </div>
            <p className="text-[13px] leading-relaxed text-white/68">{item.text}</p>
        </div>
    );
}

export default function MobileObjectSheet() {
    const [expanded, setExpanded] = useState(false);
    const selected = useAppStore((state) => state.selectedObject) as CelestialObject | null;
    const targetedObject = useAppStore((state) => state.targetedObject);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const favorites = useAppStore((state) => state.favorites);
    const toggleFavorite = useAppStore((state) => state.toggleFavorite);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const solarSystemBodies = useCatalog((state) => state.solarSystemBodies);
    const coords = useCelestialVisibility(selected?.ra ?? 0, selected?.dec ?? 0);

    if (!selected || sidebarOpen) return null;

    const id = objectId(selected);
    const isFavorite = favorites.includes(id);
    const isTargeted = targetedObject?.name === selected.name;
    const accent = selected.color || '#60a5fa';
    const visible = coords.alt > 0;
    const isStar = 'constellation' in selected;
    const solarSystemInfo = !isStar && !('type' in selected) && !isConstellationTarget(selected)
        ? getSolarSystemBodyByName(selected.name, solarSystemBodies)
        : undefined;
    const detailItems = buildDetails(selected, coords, solarSystemInfo);
    const storyItems = buildStories(selected, solarSystemInfo);

    const close = () => {
        setExpanded(false);
        setSelectedObject(null);
        setTargetedObject(null);
    };

    const openDetails = () => {
        setExpanded(false);
        setSidebarOpen(true);
    };

    return (
        <AnimatePresence>
            <>
                {isStar && (
                    <motion.div
                        key={`${selected.name}-beacon`}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        className="fixed left-1/2 z-[74] md:hidden pointer-events-none"
                        style={{
                            bottom: expanded ? 'min(58svh, 560px)' : '258px',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div className="relative flex h-16 w-16 items-center justify-center">
                            <div
                                className="absolute h-16 w-16 rounded-full opacity-40 blur-xl"
                                style={{ backgroundColor: accent }}
                            />
                            <div
                                className="absolute h-8 w-8 rounded-full border"
                                style={{ borderColor: `${accent}cc`, boxShadow: `0 0 22px ${accent}` }}
                            />
                            <div
                                className="h-2.5 w-2.5 rounded-full bg-white"
                                style={{ boxShadow: `0 0 12px #fff, 0 0 28px ${accent}` }}
                            />
                        </div>
                    </motion.div>
                )}

                <motion.section
                    key={selected.name}
                    initial={{ y: 220, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 220, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                    className="md:hidden fixed inset-x-0 bottom-0 z-[75] pointer-events-auto rounded-t-[1.35rem] border-t border-white/10 bg-[#111820]/95 shadow-[0_-24px_70px_rgba(0,0,0,0.55)] glass-blur-heavy"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-label={expanded ? 'Contraer ficha del objeto' : 'Ampliar ficha del objeto'}
                    className="mx-auto mt-2 flex h-5 w-16 items-center justify-center text-white/35"
                >
                    <span className="h-1 w-10 rounded-full bg-white/25" />
                </button>

                <div className="px-5 pb-4 pt-2">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-black/35"
                            style={{ borderColor: `${accent}aa`, boxShadow: `0 0 28px ${accent}44` }}
                        >
                            <div className="h-10 w-10 rounded-full border-2 border-white/70" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="rounded border border-white/10 bg-white/6 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                                    {objectTypeLabel(selected)}
                                </span>
                                <span className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', visible ? 'text-emerald-300' : 'text-rose-300')}>
                                    {visible ? 'Visible' : 'Oculto'}
                                </span>
                            </div>
                            <h2 className="mt-1 truncate text-3xl font-bold tracking-tight text-white">
                                {selected.name}
                            </h2>
                            <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug" style={{ color: `${accent}ee` }}>
                                {objectKindLabel(selected)}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={close}
                            aria-label="Cerrar ficha"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/45"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTargetedObject(isTargeted ? null : selected)}
                            className={cn(
                                'flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-[12px] font-bold uppercase tracking-[0.14em]',
                                isTargeted
                                    ? 'border-cyan-300/50 bg-cyan-400/20 text-cyan-100'
                                    : 'border-white/10 bg-white/[0.06] text-white/72'
                            )}
                        >
                            <Navigation className="h-4 w-4" />
                            {isTargeted ? 'Centrado' : 'Centrar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFavorite(id)}
                            aria-label={isFavorite ? 'Quitar favorito' : 'Anadir favorito'}
                            className={cn(
                                'flex h-11 w-11 items-center justify-center rounded-full border',
                                isFavorite
                                    ? 'border-rose-300/50 bg-rose-400/20 text-rose-100'
                                    : 'border-white/10 bg-white/[0.06] text-white/72'
                            )}
                        >
                            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
                        </button>
                        <button
                            type="button"
                            onClick={openDetails}
                            aria-label="Abrir informacion completa"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/72"
                        >
                            <BookOpen className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpanded((value) => !value)}
                            aria-label={expanded ? 'Contraer' : 'Ampliar'}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/72"
                        >
                            {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                        </button>
                    </div>

                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="max-h-[50svh] overflow-y-auto custom-scrollbar"
                            >
                                <div className="mt-4 border-t border-white/10 pt-4">
                                    <div className="rounded-xl border border-white/[0.07] bg-black/15 px-3">
                                        {detailItems.map((item) => <InfoRow key={item.label} item={item} />)}
                                    </div>

                                    <div className="mt-3 space-y-2.5">
                                        {storyItems.map((item) => (
                                            <StoryBlock key={item.title} item={item} accent={accent} />
                                        ))}
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                </motion.section>
            </>
        </AnimatePresence>
    );
}
