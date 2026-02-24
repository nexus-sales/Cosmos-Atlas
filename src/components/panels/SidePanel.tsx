'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, BookOpen, Layers, Grid3X3, ChevronRight, ChevronLeft, ChevronDown, X, Moon, Mountain, Camera, Satellite, Globe, CloudRain, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';
import MeteorShowerInfo from '@/components/panels/MeteorShowerInfo';
import DailyEventsPanel from '@/components/panels/DailyEventsPanel';

type TabType = 'challenge' | 'info' | 'guide';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobile(mq.matches);
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
    const satelliteInfo = useAppStore((state) => state.satelliteInfo);

    const isMobile = useIsMobile();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (selectedObject) setActiveTab('info');
    }, [selectedObject, setActiveTab]);

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

    const [layersOpen, setLayersOpen] = useState(true);
    const [bortleOpen, setBortleOpen] = useState(false);
    const [satellitesOpen, setSatellitesOpen] = useState(false);
    const [fovOpen, setFovOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [meteorsOpen, setMeteorsOpen] = useState(false);

    // ── Full panel (desktop open OR mobile overlay) ───────────────────────────
    const mobileHidden = isMobile && !sidebarOpen;
    return (
        <motion.aside
            initial={false}
            animate={{ x: mobileHidden ? 340 : 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className={cn(
                'z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/5 shrink-0',
                isMobile ? 'fixed top-0 right-0 h-full w-[300px]' : 'relative w-[340px]'
            )}
            style={{
                background: 'linear-gradient(180deg, rgba(4,12,28,0.98) 0%, rgba(2,6,18,1) 100%)',
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
                                'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden',
                                isActive ? 'text-blue-400' : 'text-white/30 hover:text-white/60'
                            )}
                        >
                            <Icon className="w-4.5 h-4.5" />
                            <span className="text-[10px] font-bold tracking-[0.2em]">{tab.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-blue-500 rounded-t-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={() => setSidebarOpen(false)}
                    title={isMobile ? 'Cerrar' : 'Colapsar'}
                    className={cn(
                        "flex items-center justify-center transition-colors shrink-0 border-l border-white/8",
                        isMobile
                            ? "w-16 bg-white/5 hover:bg-red-500/30 text-white/60 hover:text-red-400"
                            : "w-12 text-white/30 hover:text-white/60"
                    )}
                >
                    {isMobile ? <X className="w-6 h-6" /> : <ChevronRight className="w-5 h-5" />}
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

            {/* Accordion Sections */}
            <div className="border-t border-white/8 divide-y divide-white/5 overflow-y-auto soft-scrollbar">

                {/* 1. Capas y Visibilidad */}
                <AccordionSection
                    title="Capas del Cielo"
                    icon={<Settings2 className="w-4 h-4" />}
                    isOpen={layersOpen}
                    onToggle={() => setLayersOpen(!layersOpen)}
                >
                    <div className="grid grid-cols-2 gap-2">
                        {layerToggles.map(({ key, label, icon: Icon, active }) => (
                            <button
                                key={key}
                                onClick={() => toggleSetting(key)}
                                className={cn(
                                    'flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all border outline-none',
                                    active
                                        ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                                        : 'text-white/30 border-white/5 hover:text-white/50 hover:border-white/12'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </AccordionSection>

                {/* 2. Contaminación Lumínica */}
                <AccordionSection
                    title={`Contaminación: Bortle ${bortleScale}`}
                    icon={<Mountain className="w-4 h-4" />}
                    isOpen={bortleOpen}
                    onToggle={() => setBortleOpen(!bortleOpen)}
                >
                    <div className="space-y-3">
                        <div className="flex gap-1 justify-between">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                                <button key={val} onClick={() => setBortleScale(val)}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all border outline-none",
                                        bortleScale === val ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-transparent text-white/25 hover:bg-white/10"
                                    )}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] text-blue-400/60 font-medium uppercase tracking-[0.1em] text-center bg-blue-500/5 py-1 rounded">
                            {bortleScale <= 2 ? "Cielo Primigenio" : bortleScale <= 4 ? "Rural" : bortleScale <= 6 ? "Suburbano" : "Ciudad Muy Brillante"}
                        </div>
                    </div>
                </AccordionSection>

                {/* 3. Satélites */}
                <AccordionSection
                    title="Rastreo de Satélites"
                    icon={<Satellite className="w-4 h-4" />}
                    isOpen={satellitesOpen}
                    onToggle={() => setSatellitesOpen(!satellitesOpen)}
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" />
                                    ISS/HUBBLE
                                </div>
                                <div className="text-[11px] text-blue-300 font-mono">
                                    {satelliteInfo.visibleSpecial} visibles
                                </div>
                            </div>
                            <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-[#88aaff] shadow-[0_0_6px_#88aaff]" />
                                    STARLINK
                                </div>
                                <div className="text-[11px] text-blue-300 font-mono">
                                    {satelliteInfo.visibleStarlink} visibles
                                </div>
                            </div>
                        </div>
                        <div className="text-[9px] text-white/40 leading-relaxed italic px-1">
                            {satelliteInfo.starlinkStatus === 'Online' ? '✓ Feed de datos Starlink activo' : '⚠ Error en feed de datos'}
                        </div>
                    </div>
                </AccordionSection>

                {/* 4. Simulador FOV (Condicional) */}
                {showFOV && (
                    <AccordionSection
                        title="Ajustes de Captura"
                        icon={<Camera className="w-4 h-4" />}
                        isOpen={fovOpen}
                        onToggle={() => setFovOpen(!fovOpen)}
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono text-white/60">
                                    <span>Distancia Focal</span>
                                    <span className="text-blue-400 font-bold">{focalLength}mm</span>
                                </div>
                                <input type="range" min="10" max="3000" step="10" value={focalLength}
                                    onChange={(e) => setFOVParams({ focalLength: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setFOVParams({ sensorWidth: 36, sensorHeight: 24 })}
                                    className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/40 hover:text-white shadow-sm transition-all"
                                >
                                    Full Frame
                                </button>
                                <button onClick={() => setFOVParams({ sensorWidth: 23.6, sensorHeight: 15.6 })}
                                    className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/40 hover:text-white shadow-sm transition-all"
                                >
                                    APS-C
                                </button>
                            </div>
                        </div>
                    </AccordionSection>
                )}

                {/* 5. Eventos del Día */}
                <AccordionSection
                    title="Eventos del Día"
                    icon={<Globe className="w-4 h-4" />}
                    isOpen={eventsOpen}
                    onToggle={() => setEventsOpen(!eventsOpen)}
                >
                    <DailyEventsPanel />
                </AccordionSection>

                {/* 6. Lluvias de Meteoros */}
                <AccordionSection
                    title="Lluvias de Meteoros"
                    icon={<CloudRain className="w-4 h-4" />}
                    isOpen={meteorsOpen}
                    onToggle={() => setMeteorsOpen(!meteorsOpen)}
                >
                    <MeteorShowerInfo />
                </AccordionSection>
            </div>

            {/* Footer STATUS */}
            <div className="mt-auto border-t border-white/8 p-4 shrink-0 bg-black/40">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase">
                    <span className="text-white/20">SISTEMA ATLAS</span>
                    <span className="flex items-center gap-1.5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        ONLINE
                    </span>
                </div>
            </div>
        </motion.aside>
    );
}

// ── Helper Component for Accordion ───────────────────────────────────────────
function AccordionSection({ title, icon, isOpen, onToggle, children }: {
    title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode
}) {
    return (
        <div className="flex flex-col">
            <button
                onClick={onToggle}
                className={cn(
                    "flex items-center justify-between p-4 text-left transition-colors outline-none",
                    isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                )}
            >
                <div className="flex items-center gap-3">
                    <span className={cn("transition-colors", isOpen ? "text-blue-400" : "text-white/30")}>
                        {icon}
                    </span>
                    <span className={cn(
                        "text-[10px] font-bold tracking-widest uppercase transition-colors",
                        isOpen ? "text-white" : "text-white/40"
                    )}>
                        {title}
                    </span>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 text-white/20 transition-transform duration-300",
                    isOpen ? "rotate-180 text-blue-400/50" : ""
                )} />
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="px-5 pb-5 pt-1">
                    {children}
                </div>
            </motion.div>
        </div>
    );
}
        </motion.aside >
    );
}
