'use client';

import { useAppStore } from '@/stores/useAppStore';
import { MousePointer2, Star, Maximize, Navigation, Activity } from 'lucide-react';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import { cn } from '@/lib/utils';

export default function ObjectInfoTab() {
    const selected = useAppStore((state) => state.selectedObject);
    const coords = useCelestialVisibility(selected?.ra || 0, selected?.dec || 0);

    if (!selected) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4 opacity-30">
                <MousePointer2 className="w-12 h-12 stroke-[1px]" />
                <div className="text-[10px] tracking-[0.2em] font-mono leading-relaxed uppercase">
                    Selecciona un objeto<br />en el mapa estelar
                </div>
            </div>
        );
    }

    const isStar = 'constellation' in selected;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 rounded-lg glass-card border-blue-500/30 relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all" />

                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-bold tracking-widest px-2 py-1 rounded bg-blue-500/20 text-blue-400">
                            {isStar ? 'ESTRELLA' : (selected as any).type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                            MAG {selected.mag.toFixed(2)}
                        </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1 glow-text uppercase">
                        {selected.name}
                    </h3>

                    {isStar && (
                        <div className="flex items-center gap-2 text-blue-400/60 mb-4">
                            <Star className="w-3 h-3" />
                            <span className="text-[10px] font-mono tracking-wider uppercase">
                                Constelación: {selected.constellation}
                            </span>
                        </div>
                    )}

                    <p className="text-sm text-white/60 leading-relaxed">
                        {selected.desc}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={Activity} label="Magnitud" value={selected.mag.toFixed(2)} />
                <MetricCard icon={Maximize} label="RA @ Dec" value={`${(selected.ra / 15).toFixed(1)}h / ${selected.dec.toFixed(0)}°`} />
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Navigation className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Visibilidad Actual</span>
                </div>
                <div className="text-[11px] text-white/50 leading-relaxed font-mono">
                    {coords.alt > 0 ? (
                        <span className="text-emerald-400">VISIBLE</span>
                    ) : (
                        <span className="text-red-400">OCULTO</span>
                    )}
                    <br />
                    Altitud: {coords.alt.toFixed(1)}° Azimut: {coords.az.toFixed(1)}°
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-1000",
                            coords.alt > 0 ? "bg-emerald-500/50" : "bg-red-500/50"
                        )}
                        style={{ width: `${Math.max(5, (coords.alt + 90) / 180 * 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="p-3 rounded-md glass-card border-white/5 hover:border-blue-500/20 transition-colors">
            <div className="flex items-center gap-2 mb-1 opacity-40">
                <Icon className="w-3 h-3" />
                <span className="text-[9px] font-bold tracking-widest uppercase">{label}</span>
            </div>
            <div className="text-xs font-bold text-white/90 font-mono">{value}</div>
        </div>
    );
}
