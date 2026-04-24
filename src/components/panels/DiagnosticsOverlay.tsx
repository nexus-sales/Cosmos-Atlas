'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { getArHealthSummary } from '@/lib/arHealth';
import type { ArHealthTone } from '@/lib/arHealth';
import { cn } from '@/lib/utils';

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function formatUtcOffset(date: Date): string {
    const total = -date.getTimezoneOffset();
    const sign = total >= 0 ? '+' : '-';
    const abs = Math.abs(total);
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    return `UTC${sign}${pad(hh)}:${pad(mm)}`;
}

function arToneClass(tone: ArHealthTone): string {
    switch (tone) {
        case 'excellent': return 'text-emerald-300';
        case 'good':      return 'text-cyan-300';
        case 'warning':   return 'text-amber-400';
        case 'critical':  return 'text-red-400';
        default:          return 'text-slate-400';
    }
}

export default function DiagnosticsOverlay() {
    const showDiagnostics = useAppStore((s) => s.settings.showDiagnostics);
    const observer       = useAppStore((s) => s.observer);
    const geolocation    = useAppStore((s) => s.geolocation);
    const followOrientation = useAppStore((s) => s.followOrientation);
    // `time` updates every second — drives the 1 Hz refresh of the readout
    const time           = useAppStore((s) => s.time);
    const arHealthHistory = useAppStore((s) => s.arHealthHistory);

    const d = useMemo(() => {
        const lstDeg   = getLST(time, observer.lon);
        const lstHours = lstDeg / 15;
        const hh = Math.floor(lstHours);
        const mm = Math.floor((lstHours - hh) * 60);
        const ss = Math.floor((((lstHours - hh) * 60) - mm) * 60);

        const summary   = getArHealthSummary(arHealthHistory);
        const jitterVal = deviceOrientationRef.headingJitter;
        const arActive  = followOrientation && deviceOrientationRef.active;

        return {
            lst:      `${pad(hh)}:${pad(mm)}:${pad(ss)}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A',
            utcOffset: formatUtcOffset(time),
            gpsSource:   geolocation.source,
            gpsStatus:   geolocation.status,
            gpsAccuracy: geolocation.accuracyM == null ? 'N/A' : `±${Math.round(geolocation.accuracyM)}m`,
            gpsOk:       geolocation.accuracyM != null && geolocation.accuracyM < 30,
            arActive,
            heading:   `${Math.round(deviceOrientationRef.heading)}°`,
            elevation: `${Math.round(deviceOrientationRef.elevation)}°`,
            jitter:    `${jitterVal.toFixed(1)}°`,
            jitterHigh: jitterVal > 5,
            magneticQuality: deviceOrientationRef.magneticQuality,
            magneticOk:      deviceOrientationRef.magneticQuality === 'good',
            needsCalibration: deviceOrientationRef.needsCalibration,
            arScore: summary.score != null ? `${summary.score}/100` : null,
            arTone:  summary.tone,
        };
    }, [time, observer.lon, geolocation, followOrientation, arHealthHistory]);

    if (!showDiagnostics) return null;

    return (
        <div className="fixed top-20 left-3 md:left-6 z-[75] pointer-events-none">
            <div className="min-w-[230px] max-w-[290px] rounded-xl border border-cyan-400/30 bg-black/75 backdrop-blur-md px-3 py-2.5 text-[10px] font-mono leading-relaxed shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <div className="mb-2 text-[9px] uppercase tracking-widest text-cyan-300">
                    Diagnóstico Astronómico
                </div>

                <Row label="LST"    value={d.lst}       cls="text-cyan-300" />
                <Row label="Zona"   value={d.timezone}  cls="text-slate-400" />
                <Row label="Offset" value={d.utcOffset} cls="text-slate-400" />

                <Divider />

                <Row label="GPS"      value={d.gpsSource}   cls="text-emerald-300" />
                <Row label="Estado"   value={d.gpsStatus}   cls="text-slate-400" />
                <Row label="Precisión" value={d.gpsAccuracy} cls={d.gpsOk ? 'text-emerald-300' : 'text-amber-400'} />

                <Divider />

                <Row
                    label="AR Tracking"
                    value={d.arActive ? 'ACTIVO' : 'OFF'}
                    cls={d.arActive ? 'text-emerald-300' : 'text-slate-400'}
                />
                <Row label="Rumbo"    value={d.heading}   cls="text-cyan-300" />
                <Row label="Elevación" value={d.elevation} cls="text-cyan-300" />
                <Row
                    label="Jitter"
                    value={d.jitter}
                    cls={d.jitterHigh ? 'text-amber-400' : 'text-emerald-300'}
                />
                <Row
                    label="Cal. magnética"
                    value={d.magneticQuality}
                    cls={d.magneticOk ? 'text-emerald-300' : 'text-amber-400'}
                />
                <Row
                    label="Recalibrar"
                    value={d.needsCalibration ? 'SÍ' : 'NO'}
                    cls={d.needsCalibration ? 'text-red-400' : 'text-emerald-300'}
                />

                {d.arScore != null && (
                    <Row
                        label="Salud AR"
                        value={d.arScore}
                        cls={cn('font-bold', arToneClass(d.arTone))}
                    />
                )}
            </div>
        </div>
    );
}

function Row({ label, value, cls }: { label: string; value: string; cls: string }) {
    return (
        <div className="flex justify-between gap-2 text-white/65">
            <span>{label}</span>
            <span className={cn('font-semibold', cls)}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="my-1.5 border-t border-white/10" />;
}
