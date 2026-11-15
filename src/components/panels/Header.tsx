'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Bot, BookOpen, Compass as CompassIcon, LocateFixed, MapPin, Play, Search, Shield, Square, Telescope } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceOrientation, deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import CelestialSearch from './CelestialSearch';
import MiniCompass from './MiniCompass';
import { cn } from '@/lib/utils';

const SolarSystemMap = dynamic(() => import('@/components/sky-map/SolarSystemMap'), { ssr: false });
const ScientificSkyView = dynamic(() => import('@/components/sky-map/ScientificSkyView'), { ssr: false });

interface HeaderProps {
    onRequestLocation?: () => void;
}

export default function Header({ onRequestLocation }: HeaderProps) {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const geolocation = useAppStore((state) => state.geolocation);
    const isTourActive = useAppStore((state) => state.isTourActive);
    const setIsTourActive = useAppStore((state) => state.setIsTourActive);
    const sidebarOpen = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setFollowOrientation = useAppStore((state) => state.setFollowOrientation);
    const viewMode = useAppStore((state) => state.viewMode);
    const setViewMode = useAppStore((state) => state.setViewMode);
    const isLive = useAppStore((state) => state.isLive);
    const setIsLive = useAppStore((state) => state.setIsLive);
    const aiAstronomer = useAppStore((state) => state.settings.aiAstronomer ?? true);
    const toggleSetting = useAppStore((state) => state.toggleSetting);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const setFocusedConstellation = useAppStore((state) => state.setFocusedConstellation);
    const mounted = useSyncExternalStore(
        () => () => undefined,
        () => true,
        () => false,
    );
    const [showSolar, setShowSolar] = useState(false);
    const [showScientificSky, setShowScientificSky] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { isSupported, requestAndStart, stop } = useDeviceOrientation();

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const handleARToggle = useCallback(async () => {
        if (followOrientation || viewMode === 'camera') {
            stop();
            setFollowOrientation(false);
            setViewMode('vault');
            return;
        }

        setViewMode('camera');
        if (!isSupported) return;
        const granted = await requestAndStart();
        setFollowOrientation(granted && !!deviceOrientationRef.active);
    }, [followOrientation, isSupported, requestAndStart, setFollowOrientation, setViewMode, stop, viewMode]);

    const toggleAstronomer = useCallback(() => {
        const nextEnabled = !aiAstronomer;
        toggleSetting('aiAstronomer');
        if (nextEnabled) window.dispatchEvent(new CustomEvent('cosmos:open-ai-astronomer'));
        else window.dispatchEvent(new CustomEvent('cosmos:close-ai-astronomer'));
    }, [aiAstronomer, toggleSetting]);

    const openSolarSystem = useCallback(() => {
        setTargetedObject(null);
        setSelectedObject(null);
        setFocusedConstellation(null);
        window.dispatchEvent(new CustomEvent('cosmos:close-ai-astronomer'));
        setShowSolar(true);
    }, [setFocusedConstellation, setSelectedObject, setTargetedObject]);

    const gpsLabel = geolocation.source === 'gps' && geolocation.accuracyM != null
        ? `±${Math.round(geolocation.accuracyM)}m`
        : 'GPS';

    const arActive = followOrientation;

    return (
        <>
            <header className="atlas-panel !overflow-visible h-14 md:h-16 !border-x-0 !border-t-0 flex items-center justify-between gap-3 px-2.5 md:px-6 z-20 shrink-0">
                
                {/* 1. Navigation & Search Group */}
                <div className="flex items-center gap-2 lg:gap-4 flex-1">
                    <MiniCompass />

                    <div className="hidden min-w-0 flex-1 sm:block md:max-w-xs lg:max-w-sm">
                        <CelestialSearch />
                    </div>

                    <button
                        onClick={() => setSearchOpen(true)}
                        title="Buscar objeto"
                        aria-label="Buscar objeto"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-blue-400/40 hover:text-blue-100 sm:hidden"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                    
                    <div className="hidden lg:flex flex-col ml-2 text-left">
                        <div className="flex items-center gap-2 text-[11px] text-white/60 tracking-[0.2em] uppercase mb-0.5 font-semibold">
                            <MapPin className="w-3 h-3" />
                            Ubicación
                        </div>
                        <div className="text-sm font-mono text-blue-200/90 font-medium">
                            {Math.abs(observer.lat).toFixed(2)}°{observer.lat < 0 ? 'S' : 'N'} {Math.abs(observer.lon).toFixed(2)}°{observer.lon < 0 ? 'O' : 'E'}
                        </div>
                    </div>
                </div>

                {/* 2. Tools & Actions Group */}
                <div className="flex shrink-0 items-center gap-1.5 md:gap-2.5 font-mono">
                    <div className="hidden sm:flex items-center bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setIsTourActive(!isTourActive)}
                            title={isTourActive ? 'Detener tour' : 'Tour del cielo'}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all',
                                isTourActive
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                            )}
                        >
                            {isTourActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span className="hidden lg:inline">{isTourActive ? 'Stop' : 'Tour'}</span>
                        </button>

                        <button
                            onClick={openSolarSystem}
                            title="Sistema Solar"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all text-white/60 hover:bg-white/[0.06] hover:text-white"
                        >
                            <CompassIcon className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Sistema</span>
                        </button>

                        <button
                            onClick={() => setShowScientificSky(true)}
                            title="Vía Láctea científica HiPS"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all text-white/60 hover:bg-white/[0.06] hover:text-cyan-100"
                        >
                            <Telescope className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">HiPS</span>
                        </button>
                    </div>

                    <div className="h-6 w-px bg-white/10 hidden md:block mx-1"></div>

                    <button
                        onClick={() => setIsLive(true)}
                        title={isLive ? 'Tiempo real activo' : 'Volver a tiempo real'}
                        className={cn(
                            'flex w-[72px] shrink-0 flex-col items-center justify-center rounded-xl px-1 py-1 text-center transition-colors md:w-[92px]',
                            isLive ? 'text-blue-400 hover:bg-white/[0.04]' : 'border border-amber-400/35 bg-amber-500/12 text-amber-200'
                        )}
                    >
                        <div className="text-[17px] md:text-[18px] tabular-nums leading-none font-bold glow-text">
                            {mounted ? formatTime(time) : '--:--:--'}
                        </div>
                        <div className="hidden md:block whitespace-nowrap text-[11px] text-white/50 uppercase mt-1 tracking-wider font-semibold">
                            {isLive ? (mounted ? formatDate(time) : '...') : 'Tiempo real'}
                        </div>
                        {!isLive && <span className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-amber-200 md:hidden">Real</span>}
                    </button>

                    <div className="flex items-center bg-white/[0.02] border border-white/[0.06] rounded-xl p-1 gap-1">
                        <button
                            onClick={handleARToggle}
                            title={arActive ? 'Desactivar AR' : 'Activar AR'}
                            className={cn(
                                'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-[11px] font-bold leading-none transition-colors md:h-11 md:w-11',
                                arActive
                                    ? 'bg-cyan-500/20 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                                    : 'text-white/60 hover:bg-white/[0.08] hover:text-cyan-100'
                            )}
                        >
                            <Shield className="mb-0.5 h-3.5 w-3.5" />
                            AR
                        </button>

                        <button
                            onClick={onRequestLocation}
                            title="Activar GPS"
                            className={cn(
                                'hidden h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold uppercase leading-none transition-colors min-[380px]:flex md:h-11',
                                geolocation.source === 'gps'
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'text-white/60 hover:bg-white/[0.08] hover:text-emerald-100'
                            )}
                        >
                            <LocateFixed className="h-3.5 w-3.5" />
                            <span className="max-w-[34px] truncate">{gpsLabel}</span>
                        </button>

                        <button
                            onClick={toggleAstronomer}
                            title={aiAstronomer ? 'Desactivar IA astronomica' : 'Activar IA astronomica'}
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors md:h-11 md:w-11',
                                aiAstronomer
                                    ? 'bg-cyan-500/20 text-cyan-200'
                                    : 'text-white/60 hover:bg-white/[0.08] hover:text-cyan-100'
                            )}
                        >
                            <Bot className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={sidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors md:h-11 md:w-11',
                                sidebarOpen
                                    ? 'bg-blue-500/20 text-blue-200'
                                    : 'text-white/60 hover:bg-white/[0.08] hover:text-blue-100'
                            )}
                        >
                            <BookOpen className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {searchOpen && (
                <div className="atlas-panel fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[90] rounded-2xl p-3 sm:hidden">
                    <CelestialSearch />
                    <button
                        onClick={() => setSearchOpen(false)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-2 text-[11px] font-bold uppercase tracking-widest text-white/80 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {mounted && showSolar && createPortal(
                <SolarSystemMap onClose={() => setShowSolar(false)} />,
                document.body,
            )}
            {mounted && showScientificSky && createPortal(
                <ScientificSkyView onClose={() => setShowScientificSky(false)} />,
                document.body,
            )}
        </>
    );
}
