'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import {
    Target,
    Info,
    BookOpen,
    Layers,
    Grid3X3,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    X,
    Moon,
    Mountain,
    Camera,
    Satellite,
    Globe,
    CloudRain,
    Settings2,
    Crosshair,
    Sparkles,
    Activity,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';
import PassportTab from '@/components/panels/PassportTab';
import MeteorShowerInfo from '@/components/panels/MeteorShowerInfo';
import DailyEventsPanel from '@/components/panels/DailyEventsPanel';

type TabType = 'challenge' | 'info' | 'guide' | 'passport';

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

function PanelContent({
    activeTab,
    setActiveTab,
    onClose,
    isMobile,
}: {
    activeTab: TabType;
    setActiveTab: (t: TabType) => void;
    onClose: () => void;
    isMobile: boolean;
}) {
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const showConstellationArt = useAppStore((state) => state.settings.showConstellationArt);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showSatellites = useAppStore((state) => state.settings.showSatellites);
    const showStarlink = useAppStore((state) => state.settings.showStarlink);
    const showDiagnostics = useAppStore((state) => state.settings.showDiagnostics);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const followTarget = useAppStore((state) => state.settings.followTarget);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const setBortleScale = useAppStore((state) => state.setBortleScale);
    const showFOV = useAppStore((state) => state.settings.showFOV);
    const focalLength = useAppStore((state) => state.settings.focalLength);
    const telescopeMode = useAppStore((state) => state.settings.telescopeMode);
    const setFOVParams = useAppStore((state) => state.setFOVParams);
    const toggleSetting = useAppStore((state) => state.toggleSetting);
    const kidsMode = useAppStore((state) => state.settings.kidsMode);
    const satelliteInfo = useAppStore((state) => state.satelliteInfo);
    const viewMode = useAppStore((state) => state.viewMode);
    const arHealthHistory = useAppStore((state) => state.arHealthHistory);
    const clearArHealthHistory = useAppStore((state) => state.clearArHealthHistory);

    const scoreFromSample = (item: { success: boolean; jitterDeg: number; stableRatio: number }) => {
        const successScore = item.success ? 40 : 0;
        const stableScore = Math.max(0, Math.min(40, Math.round(item.stableRatio * 40)));
        const jitterPenalty = Math.min(30, Math.round(item.jitterDeg * 1.5));
        const jitterScore = Math.max(0, 20 - jitterPenalty);
        return successScore + stableScore + jitterScore;
    };

    const arHealthScore =
        arHealthHistory.length === 0
            ? null
            : Math.round(
                  arHealthHistory.reduce((acc, item) => acc + scoreFromSample(item), 0) / arHealthHistory.length
              );
    const arHealthTrend = [...arHealthHistory].reverse().map((item) => scoreFromSample(item));
    const avgJitter =
        arHealthHistory.length === 0
            ? null
            : Math.round(arHealthHistory.reduce((acc, item) => acc + item.jitterDeg, 0) / arHealthHistory.length);
    const avgStability =
        arHealthHistory.length === 0
            ? null
            : Math.round((arHealthHistory.reduce((acc, item) => acc + item.stableRatio, 0) / arHealthHistory.length) * 100);

    const arHealthLabel =
        arHealthScore == null
            ? 'No data'
            : arHealthScore >= 85
              ? 'Excellent'
              : arHealthScore >= 65
                ? 'Good'
                : arHealthScore >= 45
                  ? 'Unstable'
                  : 'Critical';
    const arHealthRecommendation =
        arHealthScore == null
            ? 'Run a full calibration to create your AR baseline.'
            : arHealthScore >= 85
              ? 'AR ready. Tracking is precise for premium overlays.'
              : arHealthScore >= 65
                ? 'Usable, but recalibrate before long observation sessions.'
                : arHealthScore >= 45
                  ? 'Medium drift detected. Recalibrate in open sky and away from metal.'
                  : 'Low reliability. Recalibrate now with a clear sky and figure-8 motion.';

    const arHealthBadgeClass =
        arHealthScore == null
            ? 'text-white/70 border-white/20 bg-white/10'
            : arHealthScore >= 85
              ? 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10'
              : arHealthScore >= 65
                ? 'text-cyan-300 border-cyan-400/35 bg-cyan-500/10'
                : arHealthScore >= 45
                  ? 'text-amber-300 border-amber-400/35 bg-amber-500/10'
                  : 'text-red-300 border-red-400/35 bg-red-500/10';

    const tabs = [
        { id: 'guide', label: 'GUIDE', icon: BookOpen },
        { id: 'info', label: 'OBJECT', icon: Info },
        { id: 'challenge', label: 'CHALLENGE', icon: Target },
        { id: 'passport', label: 'PASSPORT', icon: Sparkles },
    ] as const;

    const layerToggles = [
        { key: 'showGrid' as const, label: 'GRID', icon: Grid3X3, active: showGrid },
        { key: 'showConstellations' as const, label: 'CONSTELL.', icon: Layers, active: showConstellations },
        { key: 'showConstellationArt' as const, label: 'MYTH', icon: Sparkles, active: showConstellationArt },
        { key: 'showMilkyWay' as const, label: 'MILKY WAY', icon: Layers, active: showMilkyWay },
        { key: 'showEcliptic' as const, label: 'ECLIPTIC', icon: Layers, active: showEcliptic },
        { key: 'nightMode' as const, label: 'NIGHT', icon: Moon, active: nightMode },
        { key: 'showFOV' as const, label: 'FOV SIM', icon: Camera, active: showFOV },
        { key: 'showSatellites' as const, label: 'SATELLITES', icon: Satellite, active: showSatellites },
        { key: 'showStarlink' as const, label: 'STARLINK', icon: Globe, active: showStarlink },
        { key: 'showDiagnostics' as const, label: 'DIAGNOSTIC', icon: Activity, active: showDiagnostics },
        { key: 'telescopeMode' as const, label: 'TELESCOPE', icon: Camera, active: telescopeMode },
        { key: 'followTarget' as const, label: 'FOLLOW', icon: Crosshair, active: followTarget },
        { key: 'kidsMode' as const, label: 'KIDS MODE', icon: Sparkles, active: kidsMode },
    ];

    const [layersOpen, setLayersOpen] = useState(false);
    const [bortleOpen, setBortleOpen] = useState(false);
    const [satellitesOpen, setSatellitesOpen] = useState(false);
    const [fovOpen, setFovOpen] = useState(false);
    const [eventsOpen, setEventsOpen] = useState(false);
    const [meteorsOpen, setMeteorsOpen] = useState(false);
    const [arHealthOpen, setArHealthOpen] = useState(false);

    return (
        <>
            <div className="flex border-b border-white/8 h-14 shrink-0 items-center">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-hidden h-full cursor-pointer',
                                isActive ? 'text-blue-400' : 'text-white/35 hover:text-white/65'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-[0.14em]">{tab.label}</span>
                            {isActive && <div className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-blue-500 rounded-t-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />}
                        </button>
                    );
                })}
                <button
                    onClick={onClose}
                    className={cn(
                        'flex items-center justify-center transition-colors shrink-0 border-l border-white/8 h-full cursor-pointer',
                        isMobile ? 'w-16 bg-white/5 hover:bg-red-500/30 text-white/60' : 'w-12 text-white/30 hover:text-white/60'
                    )}
                    aria-label="Close panel"
                >
                    {isMobile ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6">
                    <div className="mb-6 bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                        <button
                            onClick={() => useAppStore.getState().setViewMode('vault')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] transition-all cursor-pointer',
                                viewMode === 'vault' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/50'
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            VAULT
                        </button>
                        <button
                            onClick={() => useAppStore.getState().setViewMode('camera')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] transition-all cursor-pointer',
                                viewMode === 'camera' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-white/30 hover:text-white/50'
                            )}
                        >
                            <Camera className="w-3.5 h-3.5" />
                            CAMERA
                        </button>
                    </div>

                    {activeTab === 'challenge' && <ChallengeTab />}
                    {activeTab === 'info' && <ObjectInfoTab />}
                    {activeTab === 'guide' && <GuideTab />}
                    {activeTab === 'passport' && <PassportTab />}
                </div>

                <div className="border-t border-white/8 divide-y divide-white/5">
                    <AccordionSection title="Sky Layers" icon={<Settings2 className="w-4 h-4" />} isOpen={layersOpen} onToggle={() => setLayersOpen(!layersOpen)}>
                        <div className="grid grid-cols-2 gap-2">
                            {layerToggles.map(({ key, label, icon: Icon, active }) => (
                                <button
                                    key={key}
                                    onClick={() => toggleSetting(key)}
                                    className={cn(
                                        'flex flex-col items-center gap-1.5 py-3 rounded-lg text-[10px] font-bold tracking-[0.08em] transition-all border outline-none cursor-pointer',
                                        active ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-white/35 border-white/5 hover:text-white/60 hover:border-white/12'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </AccordionSection>

                    <AccordionSection title={`Light Pollution: Bortle ${bortleScale}`} icon={<Mountain className="w-4 h-4" />} isOpen={bortleOpen} onToggle={() => setBortleOpen(!bortleOpen)}>
                        <div className="space-y-3">
                            <div className="flex gap-1 justify-between">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                                    <button key={val} onClick={() => setBortleScale(val)} className={cn('flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all border outline-none cursor-pointer', bortleScale === val ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-transparent text-white/25 hover:bg-white/10')}>
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] text-blue-400/60 font-medium uppercase tracking-[0.1em] text-center bg-blue-500/5 py-1 rounded">
                                {bortleScale <= 2 ? 'Pristine Sky' : bortleScale <= 4 ? 'Rural' : bortleScale <= 6 ? 'Suburban' : 'Bright City'}
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Satellites" icon={<Satellite className="w-4 h-4" />} isOpen={satellitesOpen} onToggle={() => setSatellitesOpen(!satellitesOpen)}>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" /> ISS/HUBBLE
                                </div>
                                <div className="text-[11px] text-blue-300 font-mono">{satelliteInfo.visibleSpecial} visible</div>
                            </div>
                            <div className="rounded-lg border border-white/8 bg-white/2 p-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-[#88aaff] shadow-[0_0_6px_#88aaff]" /> STARLINK
                                </div>
                                <div className="text-[11px] text-blue-300 font-mono">{satelliteInfo.visibleStarlink} visible</div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="AR Health" icon={<ShieldCheck className="w-4 h-4" />} isOpen={arHealthOpen} onToggle={() => setArHealthOpen(!arHealthOpen)}>
                        <div className="space-y-3">
                            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[11px] text-white/70">AR Health Score</div>
                                    <div className={cn('text-[10px] px-2 py-0.5 rounded-full border font-bold tracking-wide', arHealthBadgeClass)}>
                                        {arHealthLabel}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[12px]">
                                    <span className="text-white/40">Score</span>
                                    <span className="text-blue-300 font-mono font-bold">
                                        {arHealthScore == null ? 'N/A' : `${arHealthScore}/100`}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full transition-all duration-500',
                                            arHealthScore == null
                                                ? 'bg-white/30'
                                                : arHealthScore >= 85
                                                  ? 'bg-emerald-400/85'
                                                  : arHealthScore >= 65
                                                    ? 'bg-cyan-400/85'
                                                    : arHealthScore >= 45
                                                      ? 'bg-amber-400/85'
                                                      : 'bg-red-400/85'
                                        )}
                                        style={{ width: `${Math.max(6, arHealthScore ?? 6)}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-[10px] text-white/45">
                                    Calibrations: <span className="text-white/75">{arHealthHistory.length}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Last status: <span className="text-white/75">{arHealthHistory[0]?.success ? 'OK' : arHealthHistory.length > 0 ? 'Failed' : 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Avg jitter: <span className="text-white/75">{avgJitter == null ? 'N/A' : `${avgJitter}deg`}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Avg stability: <span className="text-white/75">{avgStability == null ? 'N/A' : `${avgStability}%`}</span>
                                </div>
                                <p className="mt-2 text-[10px] leading-relaxed text-white/60">{arHealthRecommendation}</p>
                            </div>

                            {arHealthHistory.length === 0 ? (
                                <div className="text-[10px] text-white/45 rounded-lg border border-white/8 p-3">
                                    No data yet. Run AR calibration to start health tracking.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
                                        <div className="flex items-end gap-1 h-10">
                                            {arHealthTrend.map((score, idx) => (
                                                <div key={`trend-${idx}`} className="flex-1 rounded-sm bg-white/8 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            'w-full transition-all',
                                                            score >= 85
                                                                ? 'bg-emerald-400/80'
                                                                : score >= 65
                                                                  ? 'bg-cyan-400/80'
                                                                  : score >= 45
                                                                    ? 'bg-amber-400/80'
                                                                    : 'bg-red-400/80'
                                                        )}
                                                        style={{ height: `${Math.max(12, score)}%` }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-1 text-[9px] text-white/45 flex items-center justify-between">
                                            <span>Trend (old to new)</span>
                                            <span className="font-mono">last {arHealthTrend.length}</span>
                                        </div>
                                    </div>
                                    {arHealthHistory.map((item, idx) => (
                                        <div key={`${item.timestamp}-${idx}`} className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className={cn('font-bold', item.success ? 'text-emerald-300' : 'text-red-300')}>
                                                    {item.success ? 'Calibration OK' : 'Calibration failed'}
                                                </span>
                                                <span className="text-white/40 font-mono">
                                                    {new Date(item.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-[10px] text-white/55">
                                                Jitter: {item.jitterDeg}deg - Stability: {Math.round(item.stableRatio * 100)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={clearArHealthHistory}
                                className="w-full rounded-lg border border-red-400/25 bg-red-500/10 text-red-300 text-[10px] font-bold tracking-[0.08em] py-2 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                CLEAR AR HISTORY
                            </button>
                        </div>
                    </AccordionSection>

                    {showFOV && (
                        <AccordionSection title="Capture Settings" icon={<Camera className="w-4 h-4" />} isOpen={fovOpen} onToggle={() => setFovOpen(!fovOpen)}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-white/60">
                                        <span>Focal Length</span>
                                        <span className="text-blue-400 font-bold">{focalLength}mm</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="3000"
                                        step="10"
                                        aria-label="Focal length"
                                        title="Focal length"
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

                    <AccordionSection title="Daily Events" icon={<Globe className="w-4 h-4" />} isOpen={eventsOpen} onToggle={() => setEventsOpen(!eventsOpen)}>
                        <DailyEventsPanel />
                    </AccordionSection>

                    <AccordionSection title="Meteors" icon={<CloudRain className="w-4 h-4" />} isOpen={meteorsOpen} onToggle={() => setMeteorsOpen(!meteorsOpen)}>
                        <MeteorShowerInfo />
                    </AccordionSection>
                </div>
            </div>

            <div className="mt-auto border-t border-white/8 p-4 shrink-0 bg-black/40">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase">
                    <span className="text-white/20">ATLAS SYSTEM</span>
                    <span className="flex items-center gap-1.5 text-emerald-500">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                    </span>
                </div>
            </div>
        </>
    );
}

function BottomSheet({
    open,
    onClose,
    activeTab,
    setActiveTab,
}: {
    open: boolean;
    onClose: () => void;
    activeTab: TabType;
    setActiveTab: (t: TabType) => void;
}) {
    const sheetHeight = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600;
    const y = useMotionValue(open ? 0 : sheetHeight);
    const dragHandleOpacity = useTransform(y, [0, sheetHeight * 0.5], [1, 0.3]);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (!open) y.set(sheetHeight);
        else y.set(0);
    }, [open, sheetHeight, y]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="bs-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={onClose}
                    />

                    <motion.div
                        key="bs-sheet"
                        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl overflow-hidden shadow-2xl border-t border-white/10"
                        style={{
                            height: sheetHeight,
                            y,
                            background: 'linear-gradient(180deg, rgba(4,12,28,0.98) 0%, rgba(2,6,18,1) 100%)',
                        }}
                        initial={{ y: sheetHeight }}
                        animate={{ y: 0 }}
                        exit={{ y: sheetHeight }}
                        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: sheetHeight }}
                        dragElastic={0.12}
                        onDragStart={() => {
                            isDraggingRef.current = true;
                        }}
                        onDragEnd={(_, info) => {
                            isDraggingRef.current = false;
                            if (info.offset.y > sheetHeight * 0.3 || info.velocity.y > 500) onClose();
                            else y.set(0);
                        }}
                    >
                        <motion.div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing" style={{ opacity: dragHandleOpacity }}>
                            <div className="w-10 h-1 rounded-full bg-white/25" />
                        </motion.div>

                        <PanelContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={onClose} isMobile={true} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function SidePanel() {
    const [activeTab, setActiveTab] = useState<TabType>('guide');
    const selectedObject = useAppStore((state) => state.selectedObject);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!selectedObject) return;
        const id = setTimeout(() => setActiveTab('info'), 0);
        return () => clearTimeout(id);
    }, [selectedObject]);

    if (isMobile) {
        return (
            <BottomSheet
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        );
    }

    const tabs = [
        { id: 'challenge', label: 'CHALLENGE', icon: Target },
        { id: 'info', label: 'OBJECT', icon: Info },
        { id: 'guide', label: 'GUIDE', icon: BookOpen },
    ] as const;

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 340 : 52 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="relative h-full z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/5 shrink-0"
            style={{ background: 'linear-gradient(180deg, rgba(4,12,28,0.98) 0%, rgba(2,6,18,1) 100%)' }}
        >
            {sidebarOpen ? (
                <PanelContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={() => setSidebarOpen(false)} isMobile={false} />
            ) : (
                <div className="flex flex-col items-center py-2 gap-1">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center justify-center h-12 w-full text-white/30 hover:text-blue-400 hover:bg-white/5 transition-colors border-b border-white/8 cursor-pointer mb-1"
                        title="Open panel"
                        aria-label="Open panel"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as TabType);
                                setSidebarOpen(true);
                            }}
                            title={tab.label}
                            aria-label={tab.label}
                            className={cn(
                                'flex items-center justify-center w-9 h-9 rounded-lg transition-all cursor-pointer',
                                activeTab === tab.id ? 'text-blue-400 bg-blue-500/10' : 'text-white/25 hover:text-white/50 hover:bg-white/5'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            )}
        </motion.aside>
    );
}

function AccordionSection({
    title,
    icon,
    isOpen,
    onToggle,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    const [hasOpened, setHasOpened] = useState(() => isOpen);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => {
                    if (!isOpen) setHasOpened(true);
                    onToggle();
                }}
                className={cn('flex items-center justify-between w-full p-4 text-left transition-colors outline-none cursor-pointer', isOpen ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]')}
            >
                <div className="flex items-center gap-3">
                    <span className={cn('transition-colors', isOpen ? 'text-blue-400' : 'text-white/30')}>{icon}</span>
                    <span className={cn('text-[10px] font-bold tracking-widest uppercase transition-colors', isOpen ? 'text-white' : 'text-white/40')}>{title}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-white/20 transition-transform duration-300', isOpen ? 'rotate-180 text-blue-400/50' : '')} />
            </button>
            <div className={cn('overflow-hidden transition-all duration-200', isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0')}>
                {hasOpened && <div className="px-5 pb-5 pt-1">{children}</div>}
            </div>
        </div>
    );
}
