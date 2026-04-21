'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Compass, MapPinned } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { cn } from '@/lib/utils';
import { getArHealthSummary } from '@/lib/arHealth';

type AlertTone = 'ok' | 'warning' | 'critical';

type SystemAlert = {
    id: string;
    tone: AlertTone;
    title: string;
    detail: string;
    icon: typeof Compass;
};

function toneClasses(tone: AlertTone) {
    if (tone === 'ok') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
    if (tone === 'warning') return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
    return 'border-rose-400/30 bg-rose-500/10 text-rose-100';
}

export default function SystemAlerts() {
    const [tick, setTick] = useState(0);
    const geolocation = useAppStore((state) => state.geolocation);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const viewMode = useAppStore((state) => state.viewMode);
    const arHealthHistory = useAppStore((state) => state.arHealthHistory);
    const renderErrors = useAppStore((state) => state.renderErrors);
    const observer = useAppStore((state) => state.observer);

    useEffect(() => {
        const timer = setInterval(() => setTick((value) => value + 1), 1200);
        return () => clearInterval(timer);
    }, []);

    const alerts = useMemo<SystemAlert[]>(() => {
        void tick;

        const nextAlerts: SystemAlert[] = [];
        const arSummary = getArHealthSummary(arHealthHistory);

        if (renderErrors.length > 0) {
            const latest = renderErrors[0];
            nextAlerts.push({
                id: `render-error-${latest.label}`,
                tone: 'critical',
                title: `Fallo en ${latest.label}`,
                detail: latest.message || 'Se desactivo un modulo para mantener la sesion estable.',
                icon: AlertTriangle,
            });
        }

        if (geolocation.status === 'denied') {
            nextAlerts.push({
                id: 'gps-denied',
                tone: 'critical',
                title: 'GPS bloqueado',
                detail: 'La posicion usa fallback. Activa ubicacion precisa en el navegador para alinear el cielo real.',
                icon: MapPinned,
            });
        } else if (geolocation.source === 'fallback') {
            nextAlerts.push({
                id: 'gps-fallback',
                tone: geolocation.status === 'idle' ? 'ok' : 'warning',
                title: geolocation.status === 'idle' ? 'Ubicacion manual' : 'Ubicacion fallback',
                detail: geolocation.status === 'idle'
                    ? `Cielo calculado para ${observer.lat.toFixed(1)} deg, ${observer.lon.toFixed(1)} deg. Activa GPS solo si quieres alinear con tu posicion real.`
                    : `Mostrando cielo para ${observer.lat.toFixed(1)} deg, ${observer.lon.toFixed(1)} deg. Polaris cambiara de altura hasta que entre tu GPS real.`,
                icon: MapPinned,
            });
        } else if (geolocation.status === 'granted' && (geolocation.accuracyM ?? Infinity) > 1200) {
            nextAlerts.push({
                id: 'gps-weak',
                tone: 'warning',
                title: 'GPS impreciso',
                detail: `Precision actual ${Math.round(geolocation.accuracyM ?? 0)} m. Espera unos segundos o busca cielo abierto.`,
                icon: MapPinned,
            });
        }

        if (viewMode === 'camera') {
            if (!followOrientation) {
                nextAlerts.push({
                    id: 'ar-paused',
                    tone: 'warning',
                    title: 'AR pendiente',
                    detail: 'Calibra el sensor para fijar el overlay sobre el cielo.',
                    icon: Compass,
                });
            } else if (deviceOrientationRef.needsCalibration || deviceOrientationRef.headingJitter >= 8) {
                nextAlerts.push({
                    id: 'ar-drift',
                    tone: arSummary.score != null && arSummary.score < 45 ? 'critical' : 'warning',
                    title: 'Deriva magnetica',
                    detail: `Jitter ${Math.round(deviceOrientationRef.headingJitter)} deg. Recalibra lejos de metal para recuperar precision.`,
                    icon: AlertTriangle,
                });
            } else {
                nextAlerts.push({
                    id: 'ar-ok',
                    tone: 'ok',
                    title: 'AR estable',
                    detail: `Seguimiento activo con jitter ${Math.round(deviceOrientationRef.headingJitter)} deg.`,
                    icon: CheckCircle2,
                });
            }
        }

        return nextAlerts.slice(0, 2);
    }, [arHealthHistory, followOrientation, geolocation.accuracyM, geolocation.source, geolocation.status, observer.lat, observer.lon, renderErrors, tick, viewMode]);

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[72] flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 pointer-events-none md:right-6 md:top-22">
            {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                    <div
                        key={alert.id}
                        className={cn(
                            'atlas-panel pointer-events-auto rounded-2xl px-3.5 py-3 shadow-[0_18px_48px_rgba(2,6,23,0.45)]',
                            toneClasses(alert.tone)
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl border border-white/10 bg-white/6 p-2">
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">{alert.title}</p>
                                <p className="mt-1 text-[12px] leading-5 text-white/72">{alert.detail}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
