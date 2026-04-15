'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Camera, Map as MapIcon, Aperture } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { useEffect } from 'react';

export default function ViewModeWidget() {
    const viewMode = useAppStore(s => s.viewMode);
    const setViewMode = useAppStore(s => s.setViewMode);
    const followOrientation = useAppStore(s => s.followOrientation);
    const setFollowOrientation = useAppStore(s => s.setFollowOrientation);
    const { isSupported, requestAndStart } = useDeviceOrientation();

    useEffect(() => {
        if (viewMode === 'camera' && isSupported && !followOrientation) {
            requestAndStart().then((granted) => {
                setFollowOrientation(granted);
            });
        }
    }, [viewMode, isSupported, followOrientation, requestAndStart, setFollowOrientation]);

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
            {/* Modo de Cámara / Lente */}
            <div className="flex bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl pointer-events-auto">
                <button
                    onClick={() => setViewMode('vault')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all",
                        viewMode === 'vault' 
                            ? "bg-blue-600/80 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                            : "text-white/40 hover:text-white/70"
                    )}
                >
                    <MapIcon className="w-3.5 h-3.5" />
                    BÓVEDA
                </button>
                <button
                    onClick={() => setViewMode('camera')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all",
                        viewMode === 'camera' 
                            ? "bg-purple-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]" 
                            : "text-white/40 hover:text-white/70"
                    )}
                >
                    <Camera className="w-3.5 h-3.5" />
                    CÁMARA AR
                </button>
            </div>

            {/* Indicador de Estado Lente (solo en AR) */}
            {viewMode === 'camera' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-lg px-4 py-2.5 backdrop-blur-md">
                   <div className="relative">
                       <Aperture className="w-4 h-4 text-purple-400 animate-[spin_4s_linear_infinite]" />
                       <div className="absolute inset-0 bg-purple-400/20 blur-md rounded-full" />
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-purple-200 tracking-[0.2em] uppercase leading-none mb-1">
                           Lente AR Activo
                       </span>
                       <span className="text-[9px] text-purple-300/50 font-mono">
                           {followOrientation ? 'TRACKING GYRO: OK' : 'GIROSCOPIO: ESPERANDO'}
                       </span>
                   </div>
                </div>
            )}
        </div>
    );
}
