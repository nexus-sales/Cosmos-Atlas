'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Heart, Navigation, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { cn } from '@/lib/utils';
import type { DSO, Planet, Star } from '@/types/celestial';

type CelestialObject = Star | DSO | Planet;

function objectId(obj: CelestialObject) {
    return 'id' in obj ? obj.id : obj.name;
}

function objectKindLabel(obj: CelestialObject) {
    if ('constellation' in obj) return getConstellationDisplayName(obj.constellation);
    if ('type' in obj) {
        if (obj.type === 'galaxy') return 'Galaxia';
        if (obj.type === 'nebula') return 'Nebulosa';
        return 'Cumulo estelar';
    }
    return obj.name === 'Luna' ? 'Satelite natural' : 'Sistema Solar';
}

function objectTypeLabel(obj: CelestialObject) {
    if ('constellation' in obj) return 'Estrella';
    if ('type' in obj) return obj.type === 'galaxy' ? 'Galaxia' : obj.type === 'nebula' ? 'Nebulosa' : 'Cumulo';
    return obj.name === 'Luna' ? 'Luna' : 'Planeta';
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
    const coords = useCelestialVisibility(selected?.ra ?? 0, selected?.dec ?? 0);

    if (!selected || sidebarOpen) return null;

    const id = objectId(selected);
    const isFavorite = favorites.includes(id);
    const isTargeted = targetedObject?.name === selected.name;
    const accent = selected.color || '#60a5fa';
    const visible = coords.alt > 0;
    const isStar = 'constellation' in selected;

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
                                <span className="rounded border border-white/10 bg-white/6 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                                    {objectTypeLabel(selected)}
                                </span>
                                <span className={cn('text-[9px] font-bold uppercase tracking-[0.16em]', visible ? 'text-emerald-300' : 'text-rose-300')}>
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
                                    <div className="grid grid-cols-2 gap-x-5 gap-y-2 font-mono text-[13px]">
                                        <span className="text-white/35">Magnitud</span>
                                        <span className="text-right font-bold text-white">{selected.mag?.toFixed(2) ?? '?'}</span>
                                        <span className="text-white/35">AR/Dec</span>
                                        <span className="text-right font-bold text-white">{(selected.ra / 15).toFixed(2)}h {selected.dec >= 0 ? '+' : ''}{selected.dec.toFixed(1)} deg</span>
                                        <span className="text-white/35">Ac/Alt</span>
                                        <span className="text-right font-bold text-white">{coords.az.toFixed(1)} deg {coords.alt >= 0 ? '+' : ''}{coords.alt.toFixed(1)} deg</span>
                                    </div>

                                    <p className="mt-4 text-[14px] leading-relaxed text-white/70">
                                        <span className="font-bold" style={{ color: accent }}>{selected.name}</span>
                                        {' '}
                                        {selected.desc}
                                    </p>

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
