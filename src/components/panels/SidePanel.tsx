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
    Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import dynamic from 'next/dynamic';
const GuideTab = dynamic(() => import('@/components/panels/GuideTab'), { ssr: false });
import PassportTab from '@/components/panels/PassportTab';
import NeuralLink from './NeuralLink';
import MeteorShowerInfo from '@/components/panels/MeteorShowerInfo';
import DailyEventsPanel from '@/components/panels/DailyEventsPanel';
import { getArHealthSummary, getArToneClasses } from '@/lib/arHealth';

type TabType = 'challenge' | 'info' | 'guide' | 'passport';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined'
            ? window.matchMedia('(max-width: 767px)').matches
            : false
    ));

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
    const soundscape = useAppStore((state) => state.settings.soundscape);
    const satelliteInfo = useAppStore((state) => state.satelliteInfo);
    const viewMode = useAppStore((state) => state.viewMode);
    const arHealthHistory = useAppStore((state) => state.arHealthHistory);

    const arSummary = getArHealthSummary(arHealthHistory);
    const arHealthBadgeClass = getArToneClasses(arSummary.tone);
    const activeLayerCount = layerTogglesCount({
        showGrid,
        showConstellations,
        showConstellationArt,
        showMilkyWay,
        showEcliptic,
        nightMode,
        showFOV,
        showSatellites,
        showStarlink,
        showDiagnostics,
        telescopeMode,
        followTarget,
        soundscape,
    });

    const tabs = [
        { id: 'guide', label: 'GUÍA', icon: BookOpen },
        { id: 'info', label: 'OBJETO', icon: Info },
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'passport', label: 'PASAPORTE', icon: Sparkles },
    ] as const;

    const layerGroups = [
        {
            title: 'Cielo',
            items: [
                { key: 'showGrid' as const, label: 'CUADRÍCULA', icon: Grid3X3, active: showGrid },
                { key: 'showConstellations' as const, label: 'CONSTELAC.', icon: Layers, active: showConstellations },
                { key: 'showConstellationArt' as const, label: 'MITOLOGÍA', icon: Sparkles, active: showConstellationArt },
                { key: 'showMilkyWay' as const, label: 'VÍA LÁCTEA', icon: Layers, active: showMilkyWay },
                { key: 'showEcliptic' as const, label: 'ECLÍPTICA', icon: Layers, active: showEcliptic },
            ],
        },
        {
            title: 'Observación',
            items: [
                { key: 'showFOV' as const, label: 'CAMPO FOV', icon: Camera, active: showFOV },
                { key: 'telescopeMode' as const, label: 'TELESCOPIO', icon: Camera, active: telescopeMode },
                { key: 'followTarget' as const, label: 'SEGUIR', icon: Crosshair, active: followTarget },
            ],
        },
        {
            title: 'Satélites y Sistema',
            items: [
                { key: 'showSatellites' as const, label: 'SATÉLITES', icon: Satellite, active: showSatellites },
                { key: 'showStarlink' as const, label: 'STARLINK', icon: Globe, active: showStarlink },
                { key: 'showDiagnostics' as const, label: 'DIAGNÓST.', icon: Activity, active: showDiagnostics },
            ],
        },
        {
            title: 'Experiencia',
            items: [
                { key: 'nightMode' as const, label: 'MODO NOCHE', icon: Moon, active: nightMode },
                { key: 'soundscape' as const, label: 'SONIDO AMB.', icon: Volume2, active: soundscape },
            ],
        },
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
                                'flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-hidden h-full cursor-pointer group',
                                isActive ? 'text-blue-400' : 'text-white/35 hover:text-white/65'
                            )}
                        >
                            <motion.div
                                animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <Icon className={cn("w-4 h-4 transition-filter duration-300", isActive && "drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]")} />
                            </motion.div>
                            <span className="text-[10px] font-bold tracking-[0.14em]">{tab.label}</span>
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabUnderline"
                                    className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]" 
                                />
                            )}
                        </button>
                    );
                })}
                <button
                    onClick={() => toggleSetting('kidsMode')}
                    className={cn(
                        'relative flex h-full w-14 shrink-0 flex-col items-center justify-center gap-1 border-l border-white/8 transition-colors cursor-pointer',
                        kidsMode
                            ? 'bg-amber-400/12 text-amber-200'
                            : 'text-white/35 hover:text-amber-200/85'
                    )}
                    aria-label={kidsMode ? 'Desactivar modo chicos' : 'Activar modo chicos'}
                    aria-pressed={kidsMode}
                    title={kidsMode ? 'Modo chicos activo' : 'Modo chicos'}
                >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px] font-bold tracking-[0.12em]">KIDS</span>
                    {kidsMode && <div className="absolute bottom-0 h-[3px] w-8 rounded-t-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />}
                </button>
                <button
                    onClick={onClose}
                    className={cn(
                        'flex items-center justify-center transition-colors shrink-0 border-l border-white/8 h-full cursor-pointer',
                        isMobile ? 'w-16 bg-white/5 hover:bg-red-500/30 text-white/60' : 'w-12 text-white/30 hover:text-white/60'
                    )}
                    aria-label="Cerrar panel"
                >
                    {isMobile ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-5 md:p-6">
                    <div className="atlas-card mb-5 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">Modo Observación</p>
                                <h2 className="mt-1 text-[18px] font-semibold tracking-[0.08em] text-white">
                                    {viewMode === 'camera' ? 'Lente AR' : 'Bóveda Celeste'}
                                </h2>
                                <p className="mt-1 text-[12px] leading-5 text-white/58">
                                    {viewMode === 'camera'
                                        ? 'Calibración en vivo y salud del sensor para uso en campo.'
                                        : 'Exploración de cielo profundo con capas optimizadas.'}
                                </p>
                            </div>
                            <div className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]', arHealthBadgeClass)}>
                                {arSummary.score == null ? 'AR Pendiente' : `AR ${arSummary.label}`}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <StatusMetric label="Capas" value={`${activeLayerCount}`} hint="activas" />
                            <StatusMetric label="GPS" value={satelliteInfo.visibleSpecial + satelliteInfo.visibleStarlink > 0 ? 'Activo' : 'Standby'} hint="seguimiento" />
                            <StatusMetric label="AR" value={arSummary.score == null ? 'N/A' : `${arSummary.score}`} hint="salud" />
                        </div>
                        
                        {/* Phase 3: Neural Link (Uplink/IA Control) */}
                        <NeuralLink />
                    </div>

                    <div className="mb-6 bg-white/5 p-1 rounded-xl flex gap-1 border border-white/5">
                        <button
                            onClick={() => useAppStore.getState().setViewMode('vault')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] transition-all cursor-pointer',
                                viewMode === 'vault' ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/50'
                            )}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            BÓVEDA
                        </button>
                        <button
                            onClick={() => useAppStore.getState().setViewMode('camera')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold tracking-[0.12em] transition-all cursor-pointer',
                                viewMode === 'camera' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-white/30 hover:text-white/50'
                            )}
                        >
                            <Camera className="w-3.5 h-3.5" />
                            CÁMARA
                        </button>
                    </div>

                    {activeTab === 'challenge' && <ChallengeTab />}
                    {activeTab === 'info' && <ObjectInfoTab />}
                    {activeTab === 'guide' && <GuideTab />}
                    {activeTab === 'passport' && <PassportTab />}
                </div>

                <div className="border-t border-white/8 divide-y divide-white/5">
                    <AccordionSection title="Capas del Cielo" icon={<Settings2 className="w-4 h-4" />} isOpen={layersOpen} onToggle={() => setLayersOpen(!layersOpen)}>
                        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] text-white/52">
                            <span>Capas visibles optimizadas para lectura rápida.</span>
                            <span className="font-mono text-white/72">{activeLayerCount} activas</span>
                        </div>
                        <div className="space-y-4">
                            {layerGroups.map((group) => (
                                <div key={group.title} className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">{group.title}</span>
                                        <span className="font-mono text-[9px] text-white/24">
                                            {group.items.filter((item) => item.active).length}/{group.items.length}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {group.items.map(({ key, label, icon: Icon, active }) => (
                                            <button
                                                key={key}
                                                onClick={() => toggleSetting(key)}
                                                className={cn(
                                                    'flex items-center gap-2.5 px-3 py-3 rounded-xl text-[10px] font-bold tracking-[0.08em] transition-all border outline-none cursor-pointer text-left',
                                                    active ? 'text-blue-300 border-blue-500/30 bg-blue-500/10' : 'text-white/35 border-white/5 hover:text-white/60 hover:border-white/12'
                                                )}
                                            >
                                                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', active ? 'border-blue-400/20 bg-blue-500/10' : 'border-white/8 bg-white/[0.03]')}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                                    <span className="truncate">{label}</span>
                                                    <span className={cn('text-[9px] font-mono', active ? 'text-blue-200/80' : 'text-white/25')}>
                                                        {active ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionSection>

                    <AccordionSection title={`Contaminación: Bortle ${bortleScale}`} icon={<Mountain className="w-4 h-4" />} isOpen={bortleOpen} onToggle={() => setBortleOpen(!bortleOpen)}>
                        <div className="space-y-3">
                            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-5 text-white/60">
                                {bortleScale <= 2 ? 'Contraste óptimo para nebulosas y la Vía Láctea.' : bortleScale <= 4 ? 'Cielo rural equilibrado con buena visibilidad de cielo profundo.' : bortleScale <= 6 ? 'Resplandor suburbano moderado. Los objetos brillantes son visibles.' : 'Fuerte resplandor urbano. Prioriza Luna, planetas y estrellas brillantes.'}
                            </div>
                            <div className="flex gap-1 justify-between">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
                                    <button key={val} onClick={() => setBortleScale(val)} className={cn('flex-1 py-1.5 rounded-md text-[11px] font-mono transition-all border outline-none cursor-pointer', bortleScale === val ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-transparent text-white/25 hover:bg-white/10')}>
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] text-blue-400/60 font-medium uppercase tracking-[0.1em] text-center bg-blue-500/5 py-1 rounded">
                                {bortleScale <= 2 ? 'Cielo Prístino' : bortleScale <= 4 ? 'Rural' : bortleScale <= 6 ? 'Suburbano' : 'Ciudad'}
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Satélites" icon={<Satellite className="w-4 h-4" />} isOpen={satellitesOpen} onToggle={() => setSatellitesOpen(!satellitesOpen)}>
                        <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-5 text-white/60">
                            Vista rápida del tráfico de satélites sin abrir el rastreador detallado.
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="atlas-card rounded-xl p-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1.5">
                                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_white]" /> ISS/HUBBLE
                                </div>
                                <div className="text-[18px] text-blue-200 font-mono">{satelliteInfo.visibleSpecial}</div>
                                <div className="text-[10px] text-white/42 uppercase tracking-[0.16em]">visible ahora</div>
                            </div>
                            <div className="atlas-card rounded-xl p-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-white/70 mb-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#88aaff] shadow-[0_0_6px_#88aaff]" /> STARLINK
                                </div>
                                <div className="text-[18px] text-blue-200 font-mono">{satelliteInfo.visibleStarlink}</div>
                                <div className="text-[10px] text-white/42 uppercase tracking-[0.16em]">visible ahora</div>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="Salud AR" icon={<ShieldCheck className="w-4 h-4" />} isOpen={arHealthOpen} onToggle={() => setArHealthOpen(!arHealthOpen)}>
                        <div className="space-y-3">
                            <div className="atlas-card rounded-2xl p-3.5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[11px] text-white/74">Puntuación Salud AR</div>
                                    <div className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold tracking-[0.16em] uppercase', arHealthBadgeClass)}>
                                        {arSummary.label}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                    <span className="text-white/40">Puntuación</span>
                                    <span className="text-blue-300 font-mono font-bold">
                                        {arSummary.score == null ? 'N/A' : `${arSummary.score}/100`}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full transition-all duration-500',
                                            arSummary.score == null
                                                ? 'bg-white/30'
                                                : arSummary.score >= 85
                                                  ? 'bg-emerald-400/85'
                                                  : arSummary.score >= 65
                                                    ? 'bg-cyan-400/85'
                                                    : arSummary.score >= 45
                                                      ? 'bg-amber-400/85'
                                                      : 'bg-red-400/85'
                                        )}
                                        style={{ width: `${Math.max(6, arSummary.score ?? 6)}%` }}
                                    />
                                </div>
                                <div className="mt-2 text-[10px] text-white/45">
                                    Calibraciones: <span className="text-white/75">{arHealthHistory.length}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Último estado: <span className="text-white/75">{arSummary.lastSample?.success ? 'OK' : arHealthHistory.length > 0 ? 'Fallido' : 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Jitter medio: <span className="text-white/75">{arSummary.avgJitter == null ? 'N/A' : `${arSummary.avgJitter}°`}</span>
                                </div>
                                <div className="text-[10px] text-white/45">
                                    Estabilidad media: <span className="text-white/75">{arSummary.avgStability == null ? 'N/A' : `${arSummary.avgStability}%`}</span>
                                </div>
                                <p className="mt-2.5 text-[11px] leading-relaxed text-white/60">{arSummary.recommendation}</p>
                            </div>

                            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 text-[10px] text-white/50">
                                {arHealthHistory.length === 0
                                    ? 'El sistema guardará una memoria de calibración interna una vez uses AR.'
                                    : `Memoria interna activa con ${arHealthHistory.length} muestra${arHealthHistory.length > 1 ? 's' : ''} de calibración reciente.`}
                            </div>
                        </div>
                    </AccordionSection>

                    {showFOV && (
                        <AccordionSection title="Ajustes de Captura" icon={<Camera className="w-4 h-4" />} isOpen={fovOpen} onToggle={() => setFovOpen(!fovOpen)}>
                            <div className="space-y-4">
                                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-5 text-white/60">
                                    Encuadra tu objetivo con longitud focal y sensor preconfigurado para planificación de astrofotografía.
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-mono text-white/60">
                                        <span>Longitud Focal</span>
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

                    <AccordionSection title="Eventos del Día" icon={<Globe className="w-4 h-4" />} isOpen={eventsOpen} onToggle={() => setEventsOpen(!eventsOpen)}>
                        <DailyEventsPanel />
                    </AccordionSection>

                    <AccordionSection title="Meteoros" icon={<CloudRain className="w-4 h-4" />} isOpen={meteorsOpen} onToggle={() => setMeteorsOpen(!meteorsOpen)}>
                        <MeteorShowerInfo />
                    </AccordionSection>
                </div>
            </div>

            <div className="mt-auto border-t border-white/8 p-4 shrink-0 bg-black/40">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] uppercase">
                    <span className="text-white/20">SISTEMA ATLAS</span>
                    <span className="flex items-center gap-1.5 text-emerald-500">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> EN LÍNEA
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
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'info', label: 'OBJETO', icon: Info },
        { id: 'guide', label: 'GUÍA', icon: BookOpen },
        { id: 'passport', label: 'PASAPORTE', icon: Sparkles },
    ] as const;

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 340 : 52 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="atlas-panel relative h-full z-50 flex flex-col overflow-hidden border-l border-white/5 shrink-0"
        >
            {sidebarOpen ? (
                <PanelContent activeTab={activeTab} setActiveTab={setActiveTab} onClose={() => setSidebarOpen(false)} isMobile={false} />
            ) : (
                <div className="flex flex-col items-center py-2 gap-1">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center justify-center h-12 w-full text-white/30 hover:text-blue-400 hover:bg-white/5 transition-colors border-b border-white/8 cursor-pointer mb-1"
                        title="Abrir panel"
                        aria-label="Abrir panel"
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
                className={cn('flex items-center justify-between w-full px-4 py-4 text-left transition-colors outline-none cursor-pointer', isOpen ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]')}
            >
                <div className="flex items-center gap-3">
                    <span className={cn('transition-colors', isOpen ? 'text-blue-400' : 'text-white/30')}>{icon}</span>
                    <span className={cn('text-[11px] font-bold tracking-[0.2em] uppercase transition-colors', isOpen ? 'text-white' : 'text-white/40')}>{title}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-white/20 transition-transform duration-300', isOpen ? 'rotate-180 text-blue-400/50' : '')} />
            </button>
            <div className={cn('overflow-hidden transition-all duration-200', isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0')}>
                {hasOpened && <div className="px-5 pb-5 pt-1">{children}</div>}
            </div>
        </div>
    );
}

function StatusMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <motion.div 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 transition-colors relative group overflow-hidden"
        >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            <div className="relative z-10">
                <div className="text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</div>
                <div className="mt-1 text-[15px] font-semibold text-white tracking-wider font-mono">{value}</div>
                <div className="text-[9px] uppercase tracking-[0.14em] text-white/32">{hint}</div>
            </div>
        </motion.div>
    );
}

function layerTogglesCount(settings: {
    showGrid: boolean;
    showConstellations: boolean;
    showConstellationArt: boolean;
    showMilkyWay: boolean;
    showEcliptic: boolean;
    nightMode: boolean;
    showFOV: boolean;
    showSatellites: boolean;
    showStarlink: boolean;
    showDiagnostics: boolean;
    telescopeMode: boolean;
    followTarget: boolean;
    soundscape: boolean;
}) {
    return Object.values(settings).filter(Boolean).length;
}
