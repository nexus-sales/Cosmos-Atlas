'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';

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

export default function DiagnosticsOverlay() {
    const showDiagnostics = useAppStore((s) => s.settings.showDiagnostics);
    const observer = useAppStore((s) => s.observer);
    const geolocation = useAppStore((s) => s.geolocation);
    const followOrientation = useAppStore((s) => s.followOrientation);
    const time = useAppStore((s) => s.time);

    const diagnostics = useMemo(() => {
        const lstDeg = getLST(time, observer.lon);
        const lstHours = lstDeg / 15;
        const hh = Math.floor(lstHours);
        const mm = Math.floor((lstHours - hh) * 60);
        const ss = Math.floor((((lstHours - hh) * 60) - mm) * 60);
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A';

        return {
            lst: `${pad(hh)}:${pad(mm)}:${pad(ss)}`,
            utcOffset: formatUtcOffset(time),
            timezone,
            geolocationSource: geolocation.source,
            geolocationStatus: geolocation.status,
            geolocationAccuracy: geolocation.accuracyM == null ? 'N/A' : `±${Math.round(geolocation.accuracyM)}m`,
            heading: `${Math.round(deviceOrientationRef.heading)}°`,
            elevation: `${Math.round(deviceOrientationRef.elevation)}°`,
            arTracking: followOrientation && deviceOrientationRef.active ? 'ON' : 'OFF',
        };
    }, [time, observer.lon, geolocation.source, geolocation.status, geolocation.accuracyM, followOrientation]);

    if (!showDiagnostics) return null;

    return (
        <div className="fixed top-20 left-3 md:left-6 z-[75] pointer-events-none">
            <div className="min-w-[220px] max-w-[280px] rounded-xl border border-cyan-400/30 bg-black/70 backdrop-blur-md px-3 py-2 text-[10px] font-mono leading-relaxed shadow-[0_0_30px_rgba(34,211,238,0.12)]">
                <div className="text-cyan-300 uppercase tracking-widest text-[9px] mb-1.5">Diagnóstico Astronómico</div>
                <div className="text-white/70">LST: <span className="text-cyan-300">{diagnostics.lst}</span></div>
                <div className="text-white/70">Zona: <span className="text-cyan-300">{diagnostics.timezone}</span></div>
                <div className="text-white/70">Offset: <span className="text-cyan-300">{diagnostics.utcOffset}</span></div>
                <div className="text-white/70">GPS: <span className="text-cyan-300">{diagnostics.geolocationSource}</span></div>
                <div className="text-white/70">Estado GPS: <span className="text-cyan-300">{diagnostics.geolocationStatus}</span></div>
                <div className="text-white/70">Precisión: <span className="text-cyan-300">{diagnostics.geolocationAccuracy}</span></div>
                <div className="text-white/70">AR Tracking: <span className="text-cyan-300">{diagnostics.arTracking}</span></div>
                <div className="text-white/70">Heading: <span className="text-cyan-300">{diagnostics.heading}</span></div>
                <div className="text-white/70">Elevación: <span className="text-cyan-300">{diagnostics.elevation}</span></div>
            </div>
        </div>
    );
}
