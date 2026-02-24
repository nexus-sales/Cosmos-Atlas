'use client';

import { useMemo } from 'react';
import { CHALLENGES } from '@/data/challenges';
import { useAppStore } from '@/stores/useAppStore';
import { Trophy, Compass, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChallengeTab() {
    const dayN = useMemo(() => {
        return Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    }, []);
    const challenge = CHALLENGES[dayN % CHALLENGES.length];
    const foundChallenges = useAppStore((state) => state.foundChallenges);
    const isFound = foundChallenges.includes(challenge.name);

    return (
        <div className="space-y-6">
            <div className={cn(
                "p-5 rounded-lg glass-card transition-all relative overflow-hidden",
                isFound
                    ? 'border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                    : 'border-yellow-500/20'
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "text-[9px] font-bold tracking-widest px-2 py-1 rounded",
                        isFound ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-500"
                    )}>
                        {isFound ? '✓ COMPLETADO' : '◎ RETO DEL DÍA'}
                    </div>
                    <div className="text-[10px] text-white/30 font-mono">DÍA {dayN}</div>
                </div>

                <h3 className={cn(
                    "text-lg font-bold mb-3",
                    isFound ? "text-green-400" : "text-yellow-500"
                )}>
                    {challenge.name}
                </h3>

                <p className="text-sm text-white/60 leading-relaxed mb-4 italic">
                    &ldquo;{challenge.hint}&rdquo;
                </p>

                {!isFound && (
                    <div className="flex items-center gap-2 text-[10px] text-yellow-500/50">
                        <Compass className="w-3 h-3 animate-spin-slow" />
                        <span>LOCALÍZALO EN LA ESFERA CELESTE</span>
                    </div>
                )}
            </div>

            <div className="p-5 rounded-lg glass-card border border-white/10">
                <div className="flex items-center gap-2 mb-3 text-blue-400">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Dato Curioso</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                    {challenge.fun}
                </p>
            </div>

            {foundChallenges.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-white/30 tracking-widest uppercase px-1">Tus Logros</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {foundChallenges.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 glass-card border-blue-500/20 rounded-md">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-[11px] font-mono text-blue-200/70">{c} desbloqueado</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
