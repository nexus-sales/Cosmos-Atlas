'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Target, Info, List, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChallengeTab from '@/components/panels/ChallengeTab';
import ObjectInfoTab from '@/components/panels/ObjectInfoTab';
import GuideTab from '@/components/panels/GuideTab';

type TabType = 'challenge' | 'info' | 'guide';

export default function SidePanel() {
    const [activeTab, setActiveTab] = useState<TabType>('challenge');
    const selectedObject = useAppStore((state) => state.selectedObject);

    const tabs = [
        { id: 'challenge', label: 'RETO', icon: Target },
        { id: 'info', label: 'OBJETO', icon: Info },
        { id: 'guide', label: 'GUÍA', icon: List },
    ];

    return (
        <aside className="w-[320px] glass-panel flex flex-col z-20 overflow-hidden relative shadow-2xl">
            {/* Tab selection */}
            <div className="flex border-b border-white/10 h-14">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group",
                                isActive ? "text-blue-400 bg-blue-500/5" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "scale-110" : "")} />
                            <span className="text-[9px] font-bold tracking-[0.2em]">{tab.label}</span>
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'challenge' && <ChallengeTab />}
                {activeTab === 'info' && <ObjectInfoTab />}
                {activeTab === 'guide' && <GuideTab />}
            </div>

            {/* Sub-panel for settings or extra info at bottom */}
            <div className="p-4 border-t border-white/10 bg-blue-500/5">
                <div className="flex items-center justify-between text-[10px] text-white/40 tracking-widest uppercase">
                    <span>Estado</span>
                    <span className="text-green-500 flex items-center gap-1 animate-pulse">
                        <div className="w-1 h-1 bg-green-500 rounded-full" />
                        Online
                    </span>
                </div>
            </div>
        </aside>
    );
}
