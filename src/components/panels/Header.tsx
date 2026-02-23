'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Compass, Stars, Map as MapIcon, Info } from 'lucide-react';

export default function Header() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    return (
        <header className="h-16 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-20 overflow-hidden">
            <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-10 h-10 border border-blue-500/30 rounded-full bg-blue-500/5 group">
                    <Stars className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full -z-10 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-[0.3em] text-blue-400 glow-text uppercase leading-none">
                        Cosmos <span className="text-white/30">·</span> Atlas
                    </h1>
                    <p className="text-[10px] text-white/40 tracking-[0.2em] font-mono mt-1">
                        OBSERVATORIO VIRTUAL 3D
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-8 font-mono">
                <div className="hidden md:flex flex-col items-end">
                    <div className="text-[10px] text-white/30 tracking-widest uppercase">Ubicación</div>
                    <div className="text-sm text-blue-200/70">
                        {observer.lat.toFixed(2)}°N {Math.abs(observer.lon).toFixed(2)}°{observer.lon < 0 ? 'O' : 'E'}
                    </div>
                </div>

                <div className="flex flex-col items-end min-w-[120px]">
                    <div className="text-[18px] text-blue-400 tabular-nums leading-none font-bold glow-text">
                        {mounted ? formatTime(time) : '--:--:--'}
                    </div>
                    <div className="text-[10px] text-white/30 uppercase mt-1 tracking-wider">
                        {mounted ? formatDate(time) : '...'}
                    </div>
                </div>
            </div>
        </header>
    );
}
