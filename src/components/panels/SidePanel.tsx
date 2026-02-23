'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, BookOpen, Layers, Grid3X3, ChevronRight, ChevronLeft, X } from 'lucide-react';
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
    const selectedObject     = useAppStore((state) => state.selectedObject);
    const showGrid           = useAppStore((state) => state.settings.showGrid);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const showMilkyWay       = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic       = useAppStore((state) => state.settings.showEcliptic);
    const toggleSetting      = useAppStore((state) => state.toggleSetting);
    const sidebarOpen        = useAppStore((state) => state.sidebarOpen);
    const setSidebarOpen     = useAppStore((state) => state.setSidebarOpen);

    const isMobile = useIsMobile();

    useEffect(() => {
        if (selectedObject) setActiveTab('info');
    }, [selectedObject]);

    const tabs = [
        { id: 'challenge', label: 'RETO',    icon: Target },
        { id: 'info',      label: 'OBJETO',  icon: Info },
        { id: 'guide',     label: 'GU\u00cdA', icon: BookOpen },
    ] as const;

    const layerToggles = [
        { key: 'showGrid' as const,          label: 'GRID',    icon: Grid3X3, active: showGrid },
        { key: 'showConstellations' as const, label: 'CONSTEL.', icon: Layers, active: showConstellations },
        { key: 'showMilkyWay' as const,       label: 'V\u00cdA L\u00c1CTEA', icon: Layers, active: showMilkyWay },
        { key: 'showEcliptic' as const,       label: 'ECL\u00cdPT.', icon: Layers, active: showEcliptic },
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
    return (
        <motion.aside
            initial={false}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className={cn(
                'z-50 flex flex-col overflow-hidden shadow-2xl border-l border-white/5 shrink-0',
                isMobile ? 'fixed top-0 right-0 h-full w-[300px]' : 'relative w-[300px]'
            )}
            style={{ background: 'linear-gradient(180deg, rgba(4,12,28,0.97) 0%, rgba(2,6,18,0.99) 100%)' }}
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
                {activeTab === 'info'      && <ObjectInfoTab />}
                {activeTab === 'guide'     && <GuideTab />}
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

                <div className="mt-2.5 flex items-center justify-between text-[8px] text-white/20 tracking-widest uppercase px-1">
                    <span>ESTADO</span>
                    <span className="flex items-center gap-1.5 text-emerald-500">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        ONLINE
                    </span>
                </div>
            </div>
        </motion.aside>
    );
}
