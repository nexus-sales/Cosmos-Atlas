'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Star, Globe, Crosshair, ExternalLink, History, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { resolveObjectName } from '@/lib/astronomy/sesame';
import { STARS } from '@/data/stars';
import { DSOS } from '@/data/dsos';
import type { Star as StarType, DSO } from '@/types/celestial';
import * as Astronomy from 'astronomy-engine';

const PLANET_CATALOG: { name: string; body: Astronomy.Body; color: string; desc: string }[] = [
    { name: 'Mercurio', body: Astronomy.Body.Mercury, color: '#b0b0b0', desc: 'Planeta más cercano al Sol.' },
    { name: 'Venus',    body: Astronomy.Body.Venus,   color: '#f0e6c0', desc: 'El lucero del alba.' },
    { name: 'Marte',    body: Astronomy.Body.Mars,    color: '#c1440e', desc: 'El planeta rojo.' },
    { name: 'Júpiter',  body: Astronomy.Body.Jupiter, color: '#c88b3a', desc: 'El gigante gaseoso.' },
    { name: 'Saturno',  body: Astronomy.Body.Saturn,  color: '#e8d890', desc: 'El señor de los anillos.' },
    { name: 'Urano',    body: Astronomy.Body.Uranus,  color: '#7de8e8', desc: 'Gigante helado.' },
    { name: 'Neptuno',  body: Astronomy.Body.Neptune, color: '#3f54ba', desc: 'El planeta más lejano.' },
    { name: 'Luna',     body: Astronomy.Body.Moon,    color: '#dddddd', desc: 'Nuestro satélite natural.' },
    { name: 'Sol',      body: Astronomy.Body.Sun,     color: '#fff5a0', desc: 'Nuestra estrella.' },
];

function getPlanetPosition(body: Astronomy.Body): { ra: number; dec: number } {
    const time = Astronomy.MakeTime(new Date());
    const vec = Astronomy.GeoVector(body, time, true);
    const equ = Astronomy.EquatorFromVector(vec);
    return { ra: equ.ra * 15, dec: equ.dec }; // hours → degrees
}

interface SearchResult {
    resultType: 'star' | 'dso' | 'error' | 'history';
    source?: 'local' | 'simbad' | 'history';
    name?: string;
    constellation?: string;
    ra?: number;
    dec?: number;
    mag?: number;
    desc?: string;
    color?: string;
    baseSize?: number;
    id?: string;
    sizeArcmin?: number;
    kind?: 'star' | 'dso' | 'planet';
}

export default function CelestialSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<StarType[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const addSimbadObject = useAppStore((state) => state.addSimbadObject);

    useEffect(() => {
        const saved = localStorage.getItem('cosmos-search-history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHistory(parsed);
                parsed.forEach((obj: StarType) => addSimbadObject(obj));
            } catch (e) {
                console.error('Error loading history', e);
            }
        }
    }, [addSimbadObject]);

    const saveToHistory = (obj: StarType) => {
        const newHistory = [obj, ...history.filter(h => h.name !== obj.name)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem('cosmos-search-history', JSON.stringify(newHistory));
    };

    const clearHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHistory([]);
        localStorage.removeItem('cosmos-search-history');
    };

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
            if (history.length > 0) {
                setResults(history.map(h => ({ ...h, resultType: 'history' as const, source: 'history' as const })));
                setIsOpen(true);
            } else {
                setResults([]);
            }
            return;
        }

        const q = val.toLowerCase();

        const starMatches: SearchResult[] = STARS.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.constellation?.toLowerCase().includes(q)
        ).slice(0, 3).map(s => ({ ...s, resultType: 'star' as const, source: 'local' as const }));

        const dsoMatches: SearchResult[] = DSOS.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.id?.toLowerCase().includes(q)
        ).slice(0, 2).map(d => ({ ...d, resultType: 'dso' as const, source: 'local' as const }));

        const planetMatches: SearchResult[] = PLANET_CATALOG.filter(p =>
            p.name.toLowerCase().includes(q)
        ).slice(0, 2).map(p => {
            const pos = getPlanetPosition(p.body);
            return {
                resultType: 'star' as const,
                source: 'local' as const,
                name: p.name,
                ra: pos.ra,
                dec: pos.dec,
                mag: 0,
                constellation: 'Planeta del Sistema Solar',
                color: p.color,
                desc: p.desc,
                baseSize: 1.5,
                kind: 'planet' as const,
            };
        });

        setResults([...planetMatches, ...starMatches, ...dsoMatches].slice(0, 6));
        setIsOpen(true);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        if (results.length > 0 && results[0].resultType !== 'error' && results[0].resultType !== 'history') {
            selectObject(results[0]);
            return;
        }
        if (query.length > 2 && !isSearching) {
            searchSimbad();
        }
    };

    const searchSimbad = async () => {
        setIsSearching(true);
        try {
            const data = await resolveObjectName(query);

            if (data && data.ra !== undefined && data.dec !== undefined) {
                const newObj: StarType = {
                    name: data.name,
                    ra: data.ra,
                    dec: data.dec,
                    mag: data.mag || 10,
                    constellation: `SIMBAD: ${data.source}`,
                    color: '#00f2ff',
                    desc: `Objeto remoto recuperado vía Sesame/SIMBAD. Magnitud: ${data.mag || 'N/A'}.`,
                    baseSize: 1.0,
                };

                addSimbadObject(newObj);
                saveToHistory(newObj);

                setResults([{ ...newObj, resultType: 'dso', source: 'simbad' }]);
            } else {
                setResults([{ name: 'No encontrado en SIMBAD', resultType: 'error' }]);
            }
        } catch (error) {
            console.error(error);
            setResults([{ name: 'Error en conexión SIMBAD', resultType: 'error' }]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectObject = (obj: SearchResult) => {
        if (obj.resultType === 'error') return;
        if (obj.resultType === 'dso' && obj.source === 'local') {
            setTargetedObject(obj as unknown as DSO);
        } else {
            const starObj = obj as StarType;
            setTargetedObject(starObj);
            if (obj.source === 'simbad') saveToHistory(starObj);
        }
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
                    onKeyDown={onKeyDown}
                    onFocus={() => {
                        if (query.length < 2 && history.length > 0) {
                            setResults(history.map(h => ({ ...h, resultType: 'history' as const, source: 'history' as const })));
                            setIsOpen(true);
                        } else if (query.length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder="Explorar el Cosmos..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 animate-spin" />}
            </div>

            {isOpen && (results.length > 0 || query.length > 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-white/10 rounded-xl backdrop-blur-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                        {results.length > 0 && results[0].resultType === 'history' && (
                            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 mb-1">
                                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                    <History className="w-2.5 h-2.5" /> Recientes
                                </span>
                                <button
                                    onClick={clearHistory}
                                    className="p-1 hover:bg-red-500/10 rounded group"
                                    title="Limpiar historial"
                                >
                                    <Trash2 className="w-2.5 h-2.5 text-white/20 group-hover:text-red-400 transition-colors" />
                                </button>
                            </div>
                        )}

                        {results.map((res, i) => (
                            <button
                                key={i}
                                onClick={() => selectObject(res)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors rounded-lg group text-left"
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                                    res.source === 'simbad' ? 'bg-cyan-500/10 border-cyan-500/20' :
                                    res.source === 'history' ? 'bg-white/5 border-white/10' :
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}>
                                    {res.resultType === 'star' ? <Star className="w-3 h-3 text-blue-400" /> :
                                     res.resultType === 'history' ? <History className="w-3 h-3 text-white/40" /> :
                                     <Globe className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[11px] font-bold transition-colors truncate uppercase tracking-wider ${
                                        res.source === 'simbad' ? 'text-cyan-400' : 'text-white group-hover:text-blue-400'
                                    }`}>
                                        {res.name}
                                    </div>
                                    <div className="text-[9px] text-white/30 truncate font-mono">
                                        {res.constellation}
                                    </div>
                                </div>
                                {res.source === 'simbad' ? (
                                    <div className="px-1.5 py-0.5 rounded-sm bg-cyan-500/10 text-[7px] text-cyan-500 font-bold border border-cyan-500/20">DB</div>
                                ) : (
                                    <Crosshair className="w-3 h-3 text-white/0 group-hover:text-white/20 transition-all" />
                                )}
                            </button>
                        ))}

                        {query.length > 2 && (
                            <button
                                onClick={searchSimbad}
                                disabled={isSearching}
                                className={`w-full flex items-center gap-3 px-3 py-2 transition-all rounded-lg group text-left border-t border-white/5 mt-1 ${isSearching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:border-cyan-500/40">
                                    {isSearching ? <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" /> : <Globe className="w-3 h-3 text-cyan-400" />}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        Consultar SIMBAD {isSearching && <span className="text-[8px] animate-pulse">Conectando...</span>}
                                    </div>
                                    <div className="text-[8px] text-white/20 font-mono">
                                        Búsqueda profesional en Estrasburgo
                                    </div>
                                </div>
                                <ExternalLink className="w-3 h-3 text-cyan-500/0 group-hover:text-cyan-500/40 transition-all" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
