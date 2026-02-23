'use client';

import { STARS } from '@/data/stars';
import { DSOS } from '@/data/dsos';
import { useAppStore } from '@/stores/useAppStore';
import { Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function GuideTab() {
    const [search, setSearch] = useState('');
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);

    const filteredStars = STARS.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);
    const filteredDSOs = DSOS.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                    type="text"
                    placeholder="BUSCAR OBJETO..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full glass-card border-white/10 rounded-md py-2.5 pl-10 pr-4 text-[11px] font-mono focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/10"
                />
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase border-b border-white/5 pb-2">Estrellas Brillantes</h4>
                <div className="space-y-1">
                    {filteredStars.map(star => (
                        <button
                            key={star.name}
                            onClick={() => setSelectedObject(star)}
                            className="w-full flex items-center justify-between p-2 rounded-md hover:glass-card text-left transition-all border border-transparent hover:border-blue-500/20 group"
                        >
                            <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-white/80 group-hover:text-blue-400 transition-colors uppercase">
                                    {star.name}
                                </span>
                                <span className="text-[9px] text-white/30 lowercase italic">{star.constellation}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-blue-400/50" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase border-b border-white/5 pb-2">Cielo Profundo</h4>
                <div className="space-y-1">
                    {filteredDSOs.map(dso => (
                        <button
                            key={dso.id}
                            onClick={() => setSelectedObject(dso)}
                            className="w-full flex items-center justify-between p-2 rounded-md hover:glass-card text-left transition-all border border-transparent hover:border-purple-500/20 group"
                        >
                            <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-white/80 group-hover:text-purple-400 transition-colors">
                                    {dso.id} <span className="text-[10px] font-normal opacity-50 opacity-100">{dso.name}</span>
                                </span>
                                <span className="text-[9px] text-white/30 uppercase">{dso.type} · MAG {dso.mag}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-purple-400/50" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
