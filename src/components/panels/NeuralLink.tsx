'use client';

import { useAppStore } from '@/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Cpu, ShieldCheck, Terminal as TerminalIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * NeuralLink: El centro de persistencia e inteligencia de la Fase 3.
 * Muestra el estado del "Uplink" con Supabase y el proceso de pensamiento de la IA.
 */
export default function NeuralLink() {
    const isFlying = useAppStore(s => s.isFlying);
    const visitedCount = useAppStore(s => s.visited.length);
    const achievements = useAppStore(s => s.achievements);
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string>('STABLE');
    const syncPid = (visitedCount * 7919 + (achievements.mythologyBuff ?? 0) * 13) % 10000;

    // Simular sincronización cuando cambian datos importantes (Modo Diablo visual)
    useEffect(() => {
        if (visitedCount > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSyncing(true);
            const timer = setTimeout(() => {
                setIsSyncing(false);
                setLastSync(new Date().toLocaleTimeString());
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [visitedCount, achievements]);

    // Calcular Rango
    const rank = visitedCount > 50 ? 'COMMANDER' : visitedCount > 20 ? 'EXPLORER' : 'CADET';
    const rankColor = rank === 'COMMANDER' ? 'text-purple-400' : rank === 'EXPLORER' ? 'text-blue-400' : 'text-emerald-400';

    return (
        <div className="mt-4 p-4 atlas-panel rounded-xl border border-white/10 relative overflow-hidden group">
            {/* Animación de escaneo de fondo */}
            <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full"
                animate={{ translateX: ['100%', '-100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Cpu className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="atlas-section-title !text-[9px]">Neural Link v3.0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="font-mono text-[8px] tracking-widest text-white/50 uppercase">
                            {isSyncing ? 'Uplink Active' : 'Link Stable'}
                        </span>
                    </div>
                </div>

                {/* Métricas de Enlace */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span className="text-[8px] text-white/40 font-bold uppercase tracking-tighter">Status</span>
                        </div>
                        <div className="font-mono text-[10px] text-white/80 font-bold">
                            {isSyncing ? 'SYNCING...' : 'ENCRYPTED'}
                        </div>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="text-[8px] text-white/40 font-bold uppercase tracking-tighter">Rank</span>
                        </div>
                        <div className={`font-mono text-[10px] font-black ${rankColor}`}>
                            {rank}
                        </div>
                    </div>
                </div>

                {/* Terminal Log de la IA (Simulado) */}
                <div className="bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[9px] min-h-[60px] flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white/20">
                        <TerminalIcon className="w-3 h-3" />
                        <span className="text-[7px]">OBSERVATORY_LOG_STREAM</span>
                    </div>
                    <AnimatePresence mode="wait">
                        {isSyncing ? (
                            <motion.div 
                                key="sync"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-amber-400/80 animate-glitch"
                            >
                                {`> WRITING_TO_CLOUD... [PID: ${syncPid}]`}
                                <br />
                                {`> PUSHING_FAVORITES_CACHE...`}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="stable"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-blue-400/60"
                            >
                                {`> LOCAL_COORD_SYNC: [STABLE]`}
                                <br />
                                {`> LAST_UPLINK: ${lastSync}`}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Warning de Vuelo Warp (Si está volando) */}
                <AnimatePresence>
                    {isFlying && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg flex items-center justify-center gap-2"
                        >
                            <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                            <span className="text-[9px] font-black text-purple-300 tracking-[2px] uppercase">
                                Warp Drive Engaged
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
