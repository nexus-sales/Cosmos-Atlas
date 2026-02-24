'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, BookOpen, Layers, Grid3X3, ChevronRight, ChevronLeft, X, Moon, Mountain, Camera, Satellite, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';

type TabType = 'challenge' | 'info' | 'guide';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return isMobile;
}

export default function SidePanel() {
    const [activeTab, setActiveTab] = useState<TabType>('guide');
    const selectedObject = useAppStore((state) => state.selectedObject);
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showSatellites = useAppStore((state) => state.settings.showSatellites);
    const showStarlink = useAppStore((state) => state.settings.showStarlink);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const setBortleScale = useAppStore((state) => state.setBortleScale);
    const showFOV = useAppStore((state) => state.settings.showFOV);
    const focalLength = useAppStore((state) => state.settings.focalLength);
    const setFOVParams = useAppStore((state) => state.setFOVParams);
    const toggleSetting = useAppStore((state) => state.toggleSetting);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

    const isMobile = useIsMobile();

    useEffect(() => {
        if (selectedObject) setActiveTab('info');
    }, [selectedObject]);

    const tabs = [
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'info', label: 'OBJETO', icon: Info },
        { id: 'guide', label: 'GU\u00cdA', icon: BookOpen },
    ] as const;

    const layerToggles = [
        { key: 'showGrid' as const, label: 'GRID', icon: Grid3X3, active: showGrid },
        { key: 'showConstellations' as const, label: 'CONSTEL.', icon: Layers, active: showConstellations },
        { key: 'showMilkyWay' as const, label: 'V\u00cdA L\u00c1CTEA', icon: Layers, active: showMilkyWay },
        { key: 'showEcliptic' as const, label: 'ECL\u00cdPT.', icon: Layers, active: showEcliptic },
        { key: 'nightMode' as const, label: 'NOCTURNO', icon: Moon, active: nightMode },
        { key: 'showFOV' as const, label: 'SIM. FOV', icon: Camera, active: showFOV },
        { key: 'showSatellites' as const, label: 'SAT\u00c9LITES', icon: Satellite, active: showSatellites },
        { key: 'showStarlink' as const, label: 'STARLINK', icon: Globe, active: showStarlink },
    ];

    // ── Desktop collapsed icon strip ─────────────────────────────────────────
    if (!isMobile && !sidebarOpen) {
        return (
            <motion.aside
                initial={{ width: 300 }}
                animate={{ width: 52 }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className="z-20 flex flex-col overflow-hidden relative shadow-2xl border-l border-white/5 shrink-0"
                style={{ background: 'linear-gradient(180deg, rgba(4,12,28,0.97) 0%, rgba(2,6,18,0.99) 100%)' }}
            >
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center justify-center h-12 w-full text-white/30 hover:text-blue-400 transition-colors border-b border-white/8"
                    title="Abrir panel"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center py-2 gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSidebarOpen(true); }}
                                title={tab.label}
                                className={cn(
                                    'flex items-center justify-center w-9 h-9 rounded-lg transition-all',
                                    isActive ? 'text-blue-400 bg-blue-500/10' : 'text-white/25 hover:text-white/50'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto flex flex-col items-center py-3 gap-1.5 border-t border-white/8">
                    {layerToggles.map(({ key, label, icon: Icon, active }) => (
                        <button
                            key={key}
                            onClick={() => toggleSetting(key)}
                            title={label}
                            className={cn(
                                'flex items-center justify-center w-8 h-8 rounded transition-all',
                                active ? 'text-blue-400' : 'text-white/20 hover:text-white/40'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                        </button>
                    ))}
                </div>
            </motion.aside>
        );
    }

    // ── Full panel (desktop open OR mobile overlay) ───────────────────────────
    const mobileHidden = isMobile && !sidebarOpen;
    return (
        <motion.aside
            initial={false}
            animate={{ x: mobileHidden ? 300 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className={cn(
                'z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/5 shrink-0',
                isMobile ? 'fixed top-0 right-0 h-full w-[300px]' : 'relative w-[300px]'
            )}
            style={{
                background: 'linear-gradient(180deg, rgba(4,12,28,0.97) 0%, rgba(2,6,18,0.99) 100%)',
                pointerEvents: mobileHidden ? 'none' : 'auto',
            }}
        >
            {/* Tabs + close/collapse button */}
            <div className="flex border-b border-white/8 h-12 shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden',
                                isActive ? 'text-blue-400' : 'text-white/25 hover:text-white/50'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-bold tracking-[0.18em]">{tab.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-blue-500 rounded-t-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={() => setSidebarOpen(false)}
                    title={isMobile ? 'Cerrar' : 'Colapsar'}
                    className="w-10 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors shrink-0 border-l border-white/8"
                >
                    {isMobile ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-y-auto p-5 space-y-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}
            >
                {activeTab === 'challenge' && <ChallengeTab />}
                {activeTab === 'info' && <ObjectInfoTab />}
                {activeTab === 'guide' && <GuideTab />}
            </div>

            {/* Layer toggles */}
            <div className="border-t border-white/8 p-3 shrink-0">
                <div className="text-[8px] text-white/20 tracking-[0.25em] uppercase mb-2.5 px-1">Capas</div>
                <div className="grid grid-cols-2 gap-1.5">
                    {layerToggles.map(({ key, label, icon: Icon, active }) => (
                        <button
                            key={key}
                            onClick={() => toggleSetting(key)}
                            className={cn(
                                'flex flex-col items-center gap-1 py-1.5 rounded text-[8px] font-bold tracking-wider transition-all border',
                                active
                                    ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                                    : 'text-white/20 border-white/5 hover:text-white/40 hover:border-white/10'
                            )}
                        >
                            <Icon className="w-3 h-3" />
                            {label}
                        </button>
                    ))}
                </div>

            </div>

            {/* Bortle Scale Selector */}
            <div className="mt-4 border-t border-white/5 pt-4 px-1">
                <div className="flex items-center gap-2 mb-2 text-[8px] text-white/20 tracking-[0.25em] uppercase">
                    <Mountain className="w-3 h-3" />
                    Escala de Bortle: {bortleScale}
                </div>
                <div className="flex gap-1 justify-between">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                        <button
                            key={val}
                            onClick={() => setBortleScale(val)}
                            className={cn(
                                "flex-1 py-1 rounded-[2px] text-[9px] font-mono transition-all border",
                                bortleScale === val
                                    ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                                    : "bg-white/5 border-transparent text-white/20 hover:text-white/40"
                            )}
                        >
                            {val}
                        </button>
                    ))}
                </div>
                <div className="mt-1 text-[7px] text-white/10 uppercase tracking-tighter">
                    {bortleScale <= 2 ? "Cielo Primigenio" : bortleScale <= 4 ? "Rural" : bortleScale <= 6 ? "Suburbano" : "Ciudad"}
                </div>
            </div>

            {/* FOV Simulator Settings */}
            {showFOV && (
                <div className="mt-4 border-t border-white/5 pt-4 px-1 space-y-3">
                    <div className="flex items-center gap-2 text-[8px] text-white/20 tracking-[0.25em] uppercase">
                        <Camera className="w-3 h-3" />
                        Ajustes de Captura
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-[7px] text-white/40 uppercase tracking-widest">
                            <span>Focal: {focalLength}mm</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="3000"
                            step="10"
                            value={focalLength}
                            onChange={(e) => setFOVParams({ focalLength: Number(e.target.value) })}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFOVParams({ sensorWidth: 36, sensorHeight: 24 })}
                            className={cn(
                                "flex-1 py-1 rounded-[2px] text-[7px] font-bold transition-all border border-white/5 bg-white/5 text-white/40 hover:text-white/60"
                            )}
                        >
                            Full Frame
                        </button>
                        <button
                            onClick={() => setFOVParams({ sensorWidth: 23.6, sensorHeight: 15.6 })}
                            className={cn(
                                "flex-1 py-1 rounded-[2px] text-[7px] font-bold transition-all border border-white/5 bg-white/5 text-white/40 hover:text-white/60"
                            )}
                        >
                            APS-C
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between text-[8px] text-white/20 tracking-widest uppercase px-1">
                <span>ESTADO</span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    ONLINE
                </span>
            </div>
        </motion.aside>
    );
}
