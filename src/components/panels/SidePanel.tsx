'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, BookOpen, Layers, Grid3X3, ChevronRight, ChevronLeft, ChevronDown, X, Moon, Mountain, Camera, Satellite, Globe, CloudRain, Settings2, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';
import MeteorShowerInfo from '@/components/panels/MeteorShowerInfo';
import DailyEventsPanel from '@/components/panels/DailyEventsPanel';

type TabType = 'challenge' | 'info' | 'guide';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 767px)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
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
    const followTarget = useAppStore((state) => state.settings.followTarget);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const setBortleScale = useAppStore((state) => state.setBortleScale);
    const showFOV = useAppStore((state) => state.settings.showFOV);
    const focalLength = useAppStore((state) => state.settings.focalLength);
    const telescopeMode = useAppStore((state) => state.settings.telescopeMode);
    const setFOVParams = useAppStore((state) => state.setFOVParams);
    const toggleSetting = useAppStore((state) => state.toggleSetting);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const satelliteInfo = useAppStore((state) => state.satelliteInfo);

    const isMobile = useIsMobile();

    useEffect(() => {
        if (selectedObject) setActiveTab('info');
    }, [selectedObject]);

    const tabs = [
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'info', label: 'OBJETO', icon: Info },
        { id: 'guide', label: 'GUÍA', icon: BookOpen },
    ] as const;

    const layerToggles = [
        { key: 'showGrid' as const, label: 'GRID', icon: Grid3X3, active: showGrid },
        { key: 'showConstellations' as const, label: 'CONSTEL.', icon: Layers, active: showConstellations },
        { key: 'showMilkyWay' as const, label: 'VÍA LÁCTEA', icon: Layers, active: showMilkyWay },
        { key: 'showEcliptic' as const, label: 'ECLÍPT.', icon: Layers, active: showEcliptic },
        { key: 'nightMode' as const, label: 'NOCTURNO', icon: Moon, active: nightMode },
        { key: 'showFOV' as const, label: 'SIM. FOV', icon: Camera, active: showFOV },
        { key: 'showSatellites' as const, label: 'SATÉLITES', icon: Satellite, active: showSatellites },
        { key: 'showStarlink' as const, label: 'STARLINK', icon: Globe, active: showStarlink },
        { key: 'telescopeMode' as const, label: 'TELESCOPIO', icon: Camera, active: telescopeMode },
        { key: 'followTarget' as const, label: 'SEGUIR', icon: Crosshair, active: followTarget },
    ];

    const [layersOpen, setLayersOpen] = useState(true);
    const [bortleOpen, setBortleOpen] = useState(false);
    const [satellitesOpen, setSatellitesOpen] = useState(false);
    const [fovOpen, setFovOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [meteorsOpen, setMeteorsOpen] = useState(false);

    // Consolidated sidebar logic for smooth animation
    const isExpanded = sidebarOpen || isMobile;
    const desktopWidth = sidebarOpen ? 340 : 52;
    const mobileWidth = 300;

    // On mobile we animate x (off-screen), on desktop we animate width
    const currentWidth = isMobile ? mobileWidth : desktopWidth;
    const currentX = (isMobile && !sidebarOpen) ? mobileWidth + 20 : 0; // extra 20px to ensure shadow is gone

    return (
        <motion.aside
            initial={false}
            animate={{
                width: currentWidth,
                x: currentX
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className={cn(
                'z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/5 shrink-0',
                isMobile ? 'fixed top-0 right-0 h-full' : 'relative h-full'
            )}
            style={{
                background: 'linear-gradient(180deg, rgba(4,12,28,0.98) 0%, rgba(2,6,18,1) 100%)',
                pointerEvents: (isMobile && !sidebarOpen) ? 'none' : 'auto',
            }}
        >
            {/* Header / Tabs / Toggle Area */}
            <div className={cn(
                "flex border-b border-white/8 h-12 shrink-0 items-center overflow-hidden",
                !isExpanded ? "flex-col border-b-0" : ""
            )}>
                {isExpanded ? (
                    <>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={cn(
                                        'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden h-full cursor-pointer',
                                        isActive ? 'text-blue-400' : 'text-white/30 hover:text-white/60'
                                    )}
                                >
                                    <Icon className="w-4.5 h-4.5" />
                                    <span className="text-[10px] font-bold tracking-[0.2em]">{tab.label}</span>
                                    {isActive && <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-blue-500 rounded-t-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                                "flex items-center justify-center transition-colors shrink-0 border-l border-white/8 h-full cursor-pointer",
                                isMobile ? "w-16 bg-white/5 hover:bg-red-500/30 text-white/60" : "w-12 text-white/30 hover:text-white/60"
                            )}
                        >
                            {isMobile ? <X className="w-6 h-6" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center justify-center h-12 w-full text-white/30 hover:text-blue-400 hover:bg-white/5 transition-colors border-b border-white/8 cursor-pointer"
                        title="Abrir panel"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Content / Mini Icons Area */}
            <div className={cn(
                "flex-1 flex flex-col overflow-hidden",
                !isExpanded ? "items-center py-2 gap-1" : "overflow-y-auto custom-scrollbar"
            )}>
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="p-5">
                                {activeTab === 'challenge' && <ChallengeTab />}
                                {activeTab === 'info' && <ObjectInfoTab />}
                                {activeTab === 'guide' && <GuideTab />}
                            </div>

                            {/* Accordions */}
                            <div className="border-t border-white/8 divide-y divide-white/5">
                                <AccordionSection title="Capas del Cielo" icon={<Settings2 className="w-4 h-4" />} isOpen={layersOpen} onToggle={() => setLayersOpen(!layersOpen)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        {layerToggles.map(({ key, label, icon: Icon, active }) => (
                                            <button key={key} onClick={() => toggleSetting(key)} className={cn('flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[9px] font-bold tracking-wider transition-all border outline-none cursor-pointer', active ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-white/30 border-white/5 hover:text-white/50 hover:border-white/12')}>
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                </AccordionSection>

                                <AccordionSection title={`Contaminación: Bortle ${bortleScale}`} icon={<Mountain className="w-4 h-4" />} isOpen={bortleOpen} onToggle={() => setBortleOpen(!bortleOpen)}>
                                    <div className="space-y-3">
                                        <div className="flex gap-1 justify-between">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                                                <button key={val} onClick={() => setBortleScale(val)} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all border outline-none cursor-pointer", bortleScale === val ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-transparent text-white/25 hover:bg-white/10")}>
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-blue-400/60 font-medium uppercase tracking-[0.1em] text-center bg-blue-500/5 py-1 rounded">
                                            {bortleScale <= 2 ? "Cielo Primigenio" : bortleScale <= 4 ? "Rural" : bortleScale <= 6 ? "Suburbano" : "Ciudad Muy Brillante"}
                                        </div>
                                    </div>
                                </AccordionSection>

                                <AccordionSection title="Satélites" icon={<Satellite className="w-4 h-4" />} isOpen={satellitesOpen} onToggle={() => setSatellitesOpen(!satellitesOpen)}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" /> ISS/HUBBLE
                                            </div>
                                            <div className="text-[11px] text-blue-300 font-mono">{satelliteInfo.visibleSpecial} visibles</div>
                                        </div>
                                        <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-[#88aaff] shadow-[0_0_6px_#88aaff]" /> STARLINK
                                            </div>
                                            <div className="text-[11px] text-blue-300 font-mono">{satelliteInfo.visibleStarlink} visibles</div>
                                        </div>
                                    </div>
                                </AccordionSection>

                                {showFOV && (
                                    <AccordionSection title="Ajustes de Captura" icon={<Camera className="w-4 h-4" />} isOpen={fovOpen} onToggle={() => setFovOpen(!fovOpen)}>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-mono text-white/60">
                                                    <span>Distancia Focal</span>
                                                    <span className="text-blue-400 font-bold">{focalLength}mm</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="10" 
                                                    max="3000" 
                                                    step="10" 
                                                    aria-label="Distancia focal"
                                                    title="Distancia focal"
                                                    value={focalLength} 
                                                    onChange={(e) => setFOVParams({ focalLength: Number(e.target.value) })} 
                                                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer" 
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setFOVParams({ sensorWidth: 36, sensorHeight: 24 })} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/40 hover:text-white shadow-sm transition-all cursor-pointer">Full Frame</button>
                                                <button onClick={() => setFOVParams({ sensorWidth: 23.6, sensorHeight: 15.6 })} className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/40 hover:text-white shadow-sm transition-all cursor-pointer">APS-C</button>
                                            </div>
                                        </div>
                                    </AccordionSection>
                                )}

                                <AccordionSection title="Eventos del Día" icon={<Globe className="w-4 h-4" />} isOpen={eventsOpen} onToggle={() => setEventsOpen(!eventsOpen)}>
                                    <DailyEventsPanel />
                                </AccordionSection>

                                <AccordionSection title="Meteoros" icon={<CloudRain className="w-4 h-4" />} isOpen={meteorsOpen} onToggle={() => setMeteorsOpen(!meteorsOpen)}>
                                    <MeteorShowerInfo />
                                </AccordionSection>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-1"
                        >
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as TabType); setSidebarOpen(true); }}
                                    title={tab.label}
                                    className={cn(
                                        'flex items-center justify-center w-9 h-9 rounded-lg transition-all cursor-pointer',
                                        activeTab === tab.id ? 'text-blue-400 bg-blue-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/5'
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            {isExpanded && (
                <div className="mt-auto border-t border-white/8 p-4 shrink-0 bg-black/40">
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase">
                        <span className="text-white/20">SISTEMA ATLAS</span>
                        <span className="flex items-center gap-1.5 text-emerald-500">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                        </span>
                    </div>
                </div>
            )}
        </motion.aside>
    );
}

function AccordionSection({ title, icon, isOpen, onToggle, children }: { title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    const [hasOpened, setHasOpened] = useState(() => isOpen);

    return (
        <div className="flex flex-col">
            <button 
                onClick={() => {
                    if (!isOpen) setHasOpened(true);
                    onToggle();
                }} 
                className={cn("flex items-center justify-between w-full p-4 text-left transition-colors outline-none cursor-pointer", isOpen ? "bg-white/[0.03]" : "hover:bg-white/[0.02]")}
            >
                <div className="flex items-center gap-3">
                    <span className={cn("transition-colors", isOpen ? "text-blue-400" : "text-white/30")}>{icon}</span>
                    <span className={cn("text-[10px] font-bold tracking-widest uppercase transition-colors", isOpen ? "text-white" : "text-white/40")}>{title}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform duration-300", isOpen ? "rotate-180 text-blue-400/50" : "")} />
            </button>
            <div
                className={cn("overflow-hidden transition-all duration-200", isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0")}
            >
                {hasOpened && <div className="px-5 pb-5 pt-1">{children}</div>}
            </div>
        </div>
    );
}
