'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Trophy, Star, Heart, Map as MapIcon, CheckCircle2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STARS } from '@/data/stars';
import { DSOS } from '@/data/dsos';

export default function PassportTab() {
    const favorites = useAppStore((s) => s.favorites);
    const visited = useAppStore((s) => s.visited);
    const achievements = useAppStore((s) => s.achievements);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);
    const setMessage = useAppStore((s) => s.setMessage);

    // Bienvenida por voz al pasaporte
    useEffect(() => {
        setMessage("Bienvenido a tu Pasaporte Estelar. Aquí guardo tus descubrimientos. Recuerda que para ganar logros, debes localizar y pulsar sobre los objetos en el firmamento.");
    }, [setMessage]);

    const favoriteObjects = [
        ...STARS.filter(s => favorites.includes(s.name)),
        ...DSOS.filter(d => favorites.includes(d.id || d.name))
    ];

    const visitedObjects = [
        ...STARS.filter(s => visited.includes(s.name)),
        ...DSOS.filter(d => visited.includes(d.id || d.name))
    ];

    return (
        <div className="space-y-6 pb-6 animate-in fade-in duration-500">
            {/* GUÍA DE LOGROS (EXPLICACIÓN) */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 relative overflow-hidden group">
                <div className="flex gap-4 items-start relative z-10">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <MapIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[14px] font-bold text-blue-100">Guía de Campo</h3>
                        <p className="text-[11px] text-blue-200/60 leading-normal italic">
                            "Para registrar un hallazgo en tu pasaporte, localiza el objeto en el mapa estelar y interactúa con él. La IA Astrónoma documentará tu progreso automáticamente."
                        </p>
                    </div>
                </div>
            </div>

            {/* LOGROS */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">Logros Celestiales</h3>
                </div>
                
                <div className="grid gap-2">
                    <AchievementCard 
                        title="Explorador de Planetas"
                        desc="Localiza todos los planetas del sistema solar"
                        progress={achievements.planetHunter ? 100 : 0}
                        icon={<Star className="w-4 h-4" />}
                        completed={achievements.planetHunter}
                    />
                    <AchievementCard 
                        title="Maratón Messier"
                        desc="Observa objetos del catálogo Messier"
                        progress={Math.min(100, (achievements.messierMarathon / 110) * 100)}
                        icon={<MapIcon className="w-4 h-4" />}
                        stat={`${achievements.messierMarathon}/110`}
                    />
                    <AchievementCard 
                        title="Bibliotecario del Olimpo"
                        desc="Escucha relatos mitológicos de las estrellas"
                        progress={Math.min(100, (achievements.mythologyBuff / 10) * 100)}
                        icon={<Heart className="w-4 h-4" />}
                        stat={`${achievements.mythologyBuff}/10`}
                    />
                </div>
            </section>

            {/* FAVORITOS */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">Mis Favoritos</h3>
                </div>
                
                {favoriteObjects.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-lg py-8 text-center">
                        <p className="text-[11px] text-white/20 italic">No tienes objetos favoritos aún</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {favoriteObjects.map(obj => (
                            <button 
                                key={obj.name}
                                onClick={() => setTargetedObject(obj)}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all text-left"
                            >
                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white/40" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-white/80">{obj.name}</p>
                                    <p className="text-[10px] text-white/30 truncate">{'constellation' in obj ? obj.constellation : obj.type}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* VISITADOS RECIENTEMENTE */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <h3 className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase">Visitados</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {visitedObjects.slice(0, 10).map(obj => (
                        <button 
                            key={obj.name}
                            onClick={() => setTargetedObject(obj)}
                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:text-white hover:border-white/30 transition-all"
                        >
                            {obj.name}
                        </button>
                    ))}
                    {visitedObjects.length === 0 && (
                        <p className="text-[11px] text-white/20 w-full text-center py-4">Explora el cielo para llenar tu historial</p>
                    )}
                </div>
            </section>
        </div>
    );
}

function AchievementCard({ title, desc, progress, icon, completed, stat }: { 
    title: string; 
    desc: string; 
    progress: number; 
    icon: React.ReactNode;
    completed?: boolean;
    stat?: string;
}) {
    return (
        <div className={cn(
            "p-3 rounded-lg border transition-all relative overflow-hidden",
            completed ? "bg-yellow-500/10 border-yellow-500/30 shadow-[0_4px_20px_rgba(234,179,8,0.1)]" : "bg-white/[0.04] border-white/10"
        )}>
            <div className="flex gap-4 items-start relative z-10">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    completed ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-white/5 text-white/30"
                )}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className={cn("text-[13px] font-bold", completed ? "text-yellow-400" : "text-white/80")}>{title}</h4>
                        {stat && <span className="text-[10px] font-mono text-white/30">{stat}</span>}
                    </div>
                    <p className="text-[11px] text-white/40 leading-snug">{desc}</p>
                    
                    <div className="pt-2">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full transition-all duration-1000", completed ? "bg-yellow-500" : "bg-blue-500/50")} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            {completed && (
                <div className="absolute top-0 right-0 p-1">
                    <div className="animate-pulse bg-yellow-500/20 rounded-bl-lg px-2 py-0.5 text-[8px] font-black text-yellow-500 uppercase tracking-tighter">
                        Unblocked
                    </div>
                </div>
            )}
        </div>
    );
}
