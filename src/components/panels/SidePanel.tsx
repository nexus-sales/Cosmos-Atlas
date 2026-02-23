'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, BookOpen, Layers, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';

type TabType = 'challenge' | 'info' | 'guide';

export default function SidePanel() {
    const [activeTab, setActiveTab] = useState<TabType>('challenge');
    const selectedObject = useAppStore((state) => state.selectedObject);
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const toggleSetting = useAppStore((state) => state.toggleSetting);

    // Auto-switch to info tab when something is selected
    useEffect(() => {
        if (selectedObject) setActiveTab('info');
    }, [selectedObject]);

    const tabs = [
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'info',      label: 'OBJETO', icon: Info },
        { id: 'guide',     label: 'GUÍA', icon: BookOpen },
    ] as const;

    return (
        <aside className="w-[300px] flex flex-col z-20 overflow-hidden relative shadow-2xl border-l border-white/5"
            style={{ background: 'linear-gradient(180deg, rgba(4,12,28,0.97) 0%, rgba(2,6,18,0.99) 100%)' }}>

            {/* Tabs */}
            <div className="flex border-b border-white/8 h-12 shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden",
                                isActive
                                    ? "text-blue-400"
                                    : "text-white/25 hover:text-white/50"
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.2) transparent' }}>
                {activeTab === 'challenge' && <ChallengeTab />}
                {activeTab === 'info' && <ObjectInfoTab />}
                {activeTab === 'guide' && <GuideTab />}
            </div>

            {/* Layer toggles */}
            <div className="border-t border-white/8 p-3 shrink-0">
                <div className="text-[8px] text-white/20 tracking-[0.25em] uppercase mb-2.5 px-1">Capas</div>
                <div className="grid grid-cols-2 gap-1.5">
                    {[
                        { key: 'showGrid' as const,           label: 'GRID',       icon: Grid3X3, active: showGrid },
                        { key: 'showConstellations' as const,  label: 'CONSTEL.',   icon: Layers,  active: showConstellations },
                        { key: 'showMilkyWay' as const,        label: 'VÍA LÁCTEA', icon: Layers,  active: showMilkyWay },
                        { key: 'showEcliptic' as const,        label: 'ECLÍPTICA',  icon: Layers,  active: showEcliptic },
                    ].map(({ key, label, icon: Icon, active }) => (
                        <button
                            key={key}
                            onClick={() => toggleSetting(key)}
                            className={cn(
                                "flex flex-col items-center gap-1 py-1.5 rounded text-[8px] font-bold tracking-wider transition-all border",
                                active
                                    ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                    : "text-white/20 border-white/5 hover:text-white/40 hover:border-white/10"
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
        </aside>
    );
}
