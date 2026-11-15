'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, ExternalLink, Globe, History, Loader2, Search, Star, Trash2 } from 'lucide-react';

import { useAppStore } from '@/stores/useAppStore';
import { resolveObjectName } from '@/lib/astronomy/sesame';
import { useCatalog } from '@/stores/useCatalogStore';
import { getSolarSystemPosition, SOLAR_SYSTEM_EPHEMERIS } from '@/lib/solarSystem';
import type { Star as StarType, DSO } from '@/types/celestial';

const SEARCH_HISTORY_KEY = 'cosmos-search-history';
const MAX_HISTORY_ITEMS = 5;
const MAX_HISTORY_BYTES = 10_000;

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

function sanitizeHistoryItem(value: unknown): StarType | null {
    if (!value || typeof value !== 'object') return null;
    const item = value as Partial<StarType>;
    if (typeof item.name !== 'string' || item.name.trim().length < 1 || item.name.length > 120) return null;
    if (typeof item.ra !== 'number' || !Number.isFinite(item.ra) || item.ra < 0 || item.ra >= 360) return null;
    if (typeof item.dec !== 'number' || !Number.isFinite(item.dec) || item.dec < -90 || item.dec > 90) return null;

    return {
        name: item.name.trim(),
        ra: item.ra,
        dec: item.dec,
        mag: typeof item.mag === 'number' && Number.isFinite(item.mag) ? item.mag : 10,
        constellation: typeof item.constellation === 'string' ? item.constellation.slice(0, 120) : 'SIMBAD',
        color: typeof item.color === 'string' && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#00f2ff',
        desc: typeof item.desc === 'string' ? item.desc.slice(0, 240) : 'Objeto recuperado desde historial local.',
        baseSize: typeof item.baseSize === 'number' && Number.isFinite(item.baseSize) ? item.baseSize : 1,
    };
}

function loadSearchHistory(): StarType[] {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!saved || saved.length > MAX_HISTORY_BYTES) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const unique = new Map<string, StarType>();
    for (const rawItem of parsed) {
        const item = sanitizeHistoryItem(rawItem);
        if (!item || unique.has(item.name)) continue;
        unique.set(item.name, item);
        if (unique.size >= MAX_HISTORY_ITEMS) break;
    }
    return [...unique.values()];
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
    const stars = useCatalog((state) => state.stars);
    const dsos = useCatalog((state) => state.dsos);
    const solarSystemBodies = useCatalog((state) => state.solarSystemBodies);

    useEffect(() => {
        try {
            const parsed = loadSearchHistory();
            setHistory(parsed);
            parsed.forEach((obj) => addSimbadObject(obj));
        } catch (error) {
            console.error('Error loading history', error);
            localStorage.removeItem(SEARCH_HISTORY_KEY);
        }
    }, [addSimbadObject]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const saveToHistory = (obj: StarType) => {
        const safeObject = sanitizeHistoryItem(obj);
        if (!safeObject) return;
        const newHistory = [safeObject, ...history.filter((item) => item.name !== safeObject.name)].slice(0, MAX_HISTORY_ITEMS);
        setHistory(newHistory);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    };

    const clearHistory = (event: React.MouseEvent) => {
        event.stopPropagation();
        setHistory([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    };

    const handleSearch = async (value: string) => {
        setQuery(value);
        if (value.length < 2) {
            if (history.length > 0) {
                setResults(history.map((item) => ({ ...item, resultType: 'history' as const, source: 'history' as const })));
                setIsOpen(true);
            } else {
                setResults([]);
            }
            return;
        }

        const q = value.toLowerCase();

        const starMatches: SearchResult[] = stars
            .filter((star) => star.name.toLowerCase().includes(q) || star.constellation?.toLowerCase().includes(q))
            .slice(0, 3)
            .map((star) => ({ ...star, resultType: 'star' as const, source: 'local' as const }));

        const dsoMatches: SearchResult[] = dsos
            .filter((dso) => dso.name.toLowerCase().includes(q) || dso.id?.toLowerCase().includes(q))
            .slice(0, 2)
            .map((dso) => ({ ...dso, resultType: 'dso' as const, source: 'local' as const }));

        const planetMatches = solarSystemBodies
            .filter((body) =>
                ['planet', 'moon'].includes(body.bodyKind) &&
                body.name !== 'Tierra' &&
                body.name.toLowerCase().includes(q) &&
                Boolean(SOLAR_SYSTEM_EPHEMERIS[body.name])
            )
            .slice(0, 2)
            .map((body) => {
                const pos = getSolarSystemPosition(body.name);
                if (!pos) return null;
                return {
                    resultType: 'star' as const,
                    source: 'local' as const,
                    name: body.name,
                    ra: pos.ra,
                    dec: pos.dec,
                    mag: body.magVisual ?? 0,
                    constellation: body.bodyKind === 'moon' ? 'Satélite del Sistema Solar' : 'Planeta del Sistema Solar',
                    color: body.color,
                    desc: body.shortDesc,
                    baseSize: 1.5,
                    kind: 'planet' as const,
                };
            })
            .filter((item) => item !== null) as SearchResult[];

        setResults([...planetMatches, ...starMatches, ...dsoMatches].slice(0, 6));
        setIsOpen(true);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== 'Enter') return;
        if (results.length > 0 && results[0].resultType !== 'error' && results[0].resultType !== 'history') {
            selectObject(results[0]);
            return;
        }
        if (query.length > 2 && !isSearching) {
            void searchSimbad();
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
                    baseSize: 1,
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
            <div className="group relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-blue-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(event) => void handleSearch(event.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={() => {
                        if (query.length < 2 && history.length > 0) {
                            setResults(history.map((item) => ({ ...item, resultType: 'history' as const, source: 'history' as const })));
                            setIsOpen(true);
                        } else if (query.length >= 2) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder="Explorar el Cosmos..."
                    className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-9 pr-4 font-mono text-[11px] text-white placeholder:text-white/20 transition-all focus:bg-white/10 focus:border-blue-500/50 focus:outline-none"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-blue-400" />}
            </div>

            {isOpen && (results.length > 0 || query.length > 2) && (
                <div className="animate-in slide-in-from-top-2 absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-2xl glass-blur-heavy fade-in duration-200">
                    <div className="p-1">
                        {results.length > 0 && results[0].resultType === 'history' && (
                            <div className="mb-1 flex items-center justify-between border-b border-white/5 px-3 py-1.5">
                                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40">
                                    <History className="h-2.5 w-2.5" /> Recientes
                                </span>
                                <button onClick={clearHistory} className="group rounded p-1 hover:bg-red-500/10" title="Limpiar historial">
                                    <Trash2 className="h-2.5 w-2.5 text-white/20 transition-colors group-hover:text-red-400" />
                                </button>
                            </div>
                        )}

                        {results.map((result, index) => (
                            <button
                                key={`${result.name || 'result'}-${index}`}
                                onClick={() => selectObject(result)}
                                className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                        {result.resultType === 'error' ? (
                                            <ExternalLink className="h-3.5 w-3.5 text-red-400" />
                                        ) : result.kind === 'planet' ? (
                                            <Globe className="h-3.5 w-3.5 text-cyan-300" />
                                        ) : result.resultType === 'dso' ? (
                                            <Crosshair className="h-3.5 w-3.5 text-violet-300" />
                                        ) : (
                                            <Star className="h-3.5 w-3.5 text-amber-300" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[11px] font-semibold tracking-wide text-white">
                                            {result.name}
                                        </div>
                                        <div className="truncate text-[11px] font-mono text-white/35">
                                            {result.desc || result.constellation || 'Sin descripción'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}

                        {results.length === 0 && query.length > 2 && (
                            <button
                                onClick={() => void searchSimbad()}
                                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:bg-white/5"
                            >
                                {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                Buscar en SIMBAD
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
