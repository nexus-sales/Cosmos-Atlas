'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Star, Globe, Crosshair } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { STARS } from '@/data/stars';
import type { Star as StarType } from '@/types/celestial';

interface SearchResult extends Partial<StarType> {
    type: 'star' | 'dso' | 'error';
    source?: 'local' | 'simbad';
    name?: string;
    constellation?: string;
}

export default function CelestialSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }

        // 1. Local Search (Stars)
        const localMatches = STARS.filter(s =>
            s.name.toLowerCase().includes(val.toLowerCase()) ||
            s.constellation.toLowerCase().includes(val.toLowerCase())
        ).slice(0, 5).map(s => ({ ...s, type: 'star' as const, source: 'local' as const }));

        setResults(localMatches);
        setIsOpen(true);
    };

    const searchSimbad = async () => {
        setIsSearching(true);
        try {
            // CDS Sesame Resolver (SIMBAD/NED/VizieR)
            const response = await fetch(`https://cds.u-strasbg.fr/cgi-bin/nph-sesame/-oxp/SNV?${encodeURIComponent(query)}`);
            const text = await response.text();

            // Parsing XML rudimentario (Sesame devuelve XML por defecto con SNV)
            const raMatch = text.match(/<jradeg>([\d.]+)<\/jradeg>/);
            const decMatch = text.match(/<jdedeg>([-.\d]+)<\/jdedeg>/);
            const nameMatch = text.match(/<on>([^<]+)<\/on>/);

            if (raMatch && decMatch) {
                const newObj = {
                    name: nameMatch ? nameMatch[1] : query.toUpperCase(),
                    ra: parseFloat(raMatch[1]),
                    dec: parseFloat(decMatch[1]),
                    type: 'dso' as const,
                    source: 'simbad' as const,
                    mag: 10,
                    constellation: 'Simbad Data'
                };
                setResults([newObj]);
            } else {
                setResults([{ name: 'No se encontraron resultados en SIMBAD', type: 'error' as const }]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectObject = (obj: SearchResult) => {
        if (obj.type === 'error') return;
        setTargetedObject(obj as StarType);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-[200px] md:max-w-[300px]">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    placeholder="Buscar objeto / SIMBAD..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 animate-spin" />}
            </div>

            {isOpen && (results.length > 0 || query.length > 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {results.map((res, i) => (
                            <button
                                key={i}
                                onClick={() => selectObject(res)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors rounded-lg group text-left"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    {res.type === 'star' ? <Star className="w-3 h-3 text-blue-400" /> : <Globe className="w-3 h-3 text-purple-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors truncate uppercase tracking-wider">
                                        {res.name}
                                    </div>
                                    <div className="text-[9px] text-white/30 truncate font-mono">
                                        {res.constellation} {res.source === 'simbad' && '• Deep Sky'}
                                    </div>
                                </div>
                                <Crosshair className="w-3 h-3 text-white/0 group-hover:text-white/20 transition-all" />
                            </button>
                        ))}

                        {query.length > 2 && !results.some(r => r.source === 'simbad') && (
                            <button
                                onClick={searchSimbad}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-500/10 transition-colors rounded-lg group text-left border-t border-white/5 mt-1"
                            >
                                <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    < Globe className="w-3 h-3 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                                        Consultar SIMBAD
                                    </div>
                                    <div className="text-[8px] text-white/20 font-mono">
                                        Búsqueda remota profesional
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
