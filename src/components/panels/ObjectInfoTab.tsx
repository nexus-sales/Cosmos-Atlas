'use client';

import { useAppStore } from '@/stores/useAppStore';
import { MousePointer2, Star, Navigation, Zap, Eye, EyeOff, Globe } from 'lucide-react';
import { useCelestialVisibility } from '@/hooks/useCelestialVisibility';
import { cn } from '@/lib/utils';

export default function ObjectInfoTab() {
    const selected = useAppStore((state) => state.selectedObject);
    const coords = useCelestialVisibility(selected?.ra || 0, selected?.dec || 0);

    if (!selected) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center space-y-4">
                <div className="w-16 h-16 rounded-full border border-white/8 flex items-center justify-center">
                    <MousePointer2 className="w-6 h-6 text-white/15" />
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] tracking-[0.25em] font-mono text-white/20 uppercase">Sin selección</div>
                    <div className="text-[9px] text-white/10 font-mono">Haz clic en cualquier<br />estrella o planeta</div>
                </div>
            </div>
        );
    }

    const isStar = 'constellation' in selected;
    const isPlanet = 'kind' in selected && (selected as any).kind === 'planet';
    const typeLabel = isStar ? 'ESTRELLA' : isPlanet ? 'PLANETA' : ((selected as any).type?.toUpperCase?.() ?? 'OBJETO');
    const accentColor = isStar ? '#60a5fa' : isPlanet ? (selected as any).color : '#a78bfa';
    const isVisible = coords.alt > 0;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Header con nombre y tipo */}
            <div className="relative rounded-xl overflow-hidden p-5"
                style={{ background: `linear-gradient(135deg, ${accentColor}0a 0%, transparent 60%), rgba(255,255,255,0.03)`, border: `1px solid ${accentColor}22` }}>

                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-8 translate-x-8"
                    style={{ background: `${accentColor}10` }} />

                <div className="flex items-start justify-between mb-3">
                    <span className="text-[8px] font-bold tracking-[0.25em] px-2 py-1 rounded-sm"
                        style={{ background: `${accentColor}18`, color: accentColor }}>
                        {typeLabel}{isPlanet ? ` ${(selected as any).symbol}` : ''}
                    </span>
                    <span className="text-[9px] font-mono"
                        style={{ color: isVisible ? '#4ade80' : '#f87171' }}>
                        {isVisible ? '▲ VISIBLE' : '▽ OCULTO'}
                    </span>
                </div>

                <h3 className="text-2xl font-bold mb-1 tracking-wide"
                    style={{ color: 'white', textShadow: `0 0 20px ${accentColor}60` }}>
                    {selected.name}
                </h3>

                {isStar && (
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-2.5 h-2.5" style={{ color: accentColor }} />
                        <span className="text-[9px] font-mono tracking-wider" style={{ color: `${accentColor}90` }}>
                            {(selected as any).constellation}
                        </span>
                    </div>
                )}
                {isPlanet && (
                    <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-2.5 h-2.5" style={{ color: accentColor }} />
                        <span className="text-[9px] font-mono tracking-wider" style={{ color: `${accentColor}90` }}>
                            Sistema Solar · Feb 2026
                        </span>
                    </div>
                )}

                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {selected.desc}
                </p>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-2">
                <MetricCard
                    label="Magnitud"
                    value={selected.mag.toFixed(2)}
                    sub={selected.mag < 0 ? 'Superbrill.' : selected.mag < 2 ? 'Muy brillante' : 'Brillante'}
                    color={accentColor}
                    icon={<Zap className="w-3 h-3" />}
                />
                <MetricCard
                    label="Posición"
                    value={`${(selected.ra / 15).toFixed(1)}h`}
                    sub={`Dec ${selected.dec > 0 ? '+' : ''}${selected.dec.toFixed(1)}°`}
                    color={accentColor}
                    icon={<Navigation className="w-3 h-3" />}
                />
            </div>

            {/* Visibilidad */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 mb-3">
                    {isVisible
                        ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        : <EyeOff className="w-3.5 h-3.5 text-red-400" />}
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
                        style={{ color: isVisible ? '#4ade80' : '#f87171' }}>
                        {isVisible ? 'Visible ahora' : 'Bajo el horizonte'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <div className="text-[8px] text-white/20 mb-1 tracking-wider uppercase">Altitud</div>
                        <div className="text-base font-bold font-mono" style={{ color: isVisible ? '#4ade80' : 'rgba(255,255,255,0.4)' }}>
                            {coords.alt.toFixed(1)}°
                        </div>
                    </div>
                    <div>
                        <div className="text-[8px] text-white/20 mb-1 tracking-wider uppercase">Azimut</div>
                        <div className="text-base font-bold font-mono text-white/70">
                            {coords.az.toFixed(1)}°
                        </div>
                    </div>
                </div>

                <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${Math.max(3, Math.min(100, (coords.alt + 90) / 180 * 100))}%`,
                            background: isVisible
                                ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                : 'linear-gradient(90deg, #ef4444, #dc2626)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, sub, color, icon }: {
    label: string; value: string; sub: string; color: string; icon: React.ReactNode
}) {
    return (
        <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 mb-2" style={{ color: `${color}60` }}>
                {icon}
                <span className="text-[8px] font-bold tracking-wider uppercase">{label}</span>
            </div>
            <div className="text-lg font-bold font-mono text-white/90">{value}</div>
            <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
        </div>
    );
}


