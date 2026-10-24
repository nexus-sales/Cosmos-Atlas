'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Info, Navigation, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import type { DSO, Planet, Star } from '@/types/celestial';

type CelestialObject = Star | DSO | Planet;

function typeLabel(object: CelestialObject) {
    if ('constellation' in object) return 'Estrella';
    if ('type' in object) return object.type === 'galaxy' ? 'Galaxia' : object.type === 'nebula' ? 'Nebulosa' : 'Cúmulo';
    return object.name === 'Luna' ? 'Satélite' : 'Planeta';
}

export default function DesktopObjectPeek() {
    const selected = useAppStore((state) => state.selectedObject) as CelestialObject | null;
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const coords = useCelestialVisibility(selected?.ra ?? 0, selected?.dec ?? 0);

    return (
        <AnimatePresence>
            {selected && !sidebarOpen && (
                <motion.aside
                    key={selected.name}
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.97 }}
                    className="pointer-events-auto fixed bottom-24 left-1/2 z-[70] hidden w-[min(390px,calc(100vw-3rem))] -translate-x-1/2 rounded-2xl border border-white/12 bg-[#07101d]/94 p-4 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-xl md:block"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-white" style={{ boxShadow: `0 0 14px ${selected.color}, 0 0 28px ${selected.color}` }} />
                        <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300/75">{typeLabel(selected)}</div>
                            <h3 className="truncate text-lg font-bold text-white">{selected.name}</h3>
                            {'constellation' in selected && <p className="truncate text-[10px] text-white/45">{selected.constellation}</p>}
                        </div>
                        <button onClick={() => setSelectedObject(null)} aria-label="Cerrar ficha" className="rounded-full p-1.5 text-white/35 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl border border-white/7 bg-black/20 p-2 text-center font-mono">
                        <div><span className="block text-[8px] uppercase text-white/30">Mag.</span><strong className="text-[11px] text-white/80">{selected.mag.toFixed(2)}</strong></div>
                        <div><span className="block text-[8px] uppercase text-white/30">Alt.</span><strong className="text-[11px] text-white/80">{coords.alt.toFixed(0)}°</strong></div>
                        <div><span className="block text-[8px] uppercase text-white/30">AR</span><strong className="text-[11px] text-white/80">{(selected.ra / 15).toFixed(2)}h</strong></div>
                        <div><span className="block text-[8px] uppercase text-white/30">Dec.</span><strong className="text-[11px] text-white/80">{selected.dec >= 0 ? '+' : ''}{selected.dec.toFixed(1)}°</strong></div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/45">{selected.desc}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button onClick={() => setTargetedObject(selected)} className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-500/10 py-2 text-[9px] font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-500/20"><Navigation className="h-3 w-3" /> Centrar</button>
                        <button onClick={() => setSidebarOpen(true)} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-[9px] font-bold uppercase tracking-wider text-white/65 hover:bg-white/10"><Info className="h-3 w-3" /> Más información</button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
