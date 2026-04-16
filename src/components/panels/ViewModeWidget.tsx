'use client';

import { useAppStore } from '@/stores/useAppStore';
import { Camera, Map as MapIcon, Aperture, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceOrientation, deviceOrientationRef } from '@/hooks/useDeviceOrientation';
import { useCallback, useEffect, useRef, useState } from 'react';

type CalibrationPhase = 'idle' | 'running' | 'done' | 'failed';

export default function ViewModeWidget() {
    const [, setUiTick] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>('idle');
    const [calibrationProgress, setCalibrationProgress] = useState(0);
    const [stabilityHint, setStabilityHint] = useState<'good' | 'noisy'>('good');
    const timersRef = useRef<{
        intervalId: ReturnType<typeof setInterval> | null;
        timeoutId: ReturnType<typeof setTimeout> | null;
        clearStatusId: ReturnType<typeof setTimeout> | null;
    }>({
        intervalId: null,
        timeoutId: null,
        clearStatusId: null,
    });

    const viewMode = useAppStore((s) => s.viewMode);
    const setViewMode = useAppStore((s) => s.setViewMode);
    const followOrientation = useAppStore((s) => s.followOrientation);
    const setFollowOrientation = useAppStore((s) => s.setFollowOrientation);
    const addArHealthSample = useAppStore((s) => s.addArHealthSample);
    const { isSupported, permission, requestAndStart, stop } = useDeviceOrientation();

    const clearCalibrationTimers = useCallback(() => {
        if (timersRef.current.intervalId) clearInterval(timersRef.current.intervalId);
        if (timersRef.current.timeoutId) clearTimeout(timersRef.current.timeoutId);
        if (timersRef.current.clearStatusId) clearTimeout(timersRef.current.clearStatusId);
        timersRef.current.intervalId = null;
        timersRef.current.timeoutId = null;
        timersRef.current.clearStatusId = null;
    }, []);

    const calibrateAR = useCallback(async () => {
        clearCalibrationTimers();
        setCalibrationPhase('running');
        setCalibrationProgress(0);
        setStabilityHint('good');

        stop();
        setFollowOrientation(false);

        const granted = await requestAndStart();
        if (!granted) {
            setCalibrationPhase('failed');
            setCalibrationProgress(0);
            addArHealthSample({
                timestamp: Date.now(),
                success: false,
                jitterDeg: Math.round(deviceOrientationRef.headingJitter),
                stableRatio: 0,
            });
            timersRef.current.clearStatusId = setTimeout(() => setCalibrationPhase('idle'), 2400);
            return;
        }

        setFollowOrientation(true);

        const durationMs = 3000;
        const stepMs = 100;
        const totalSteps = Math.ceil(durationMs / stepMs);
        let currentStep = 0;
        let stableSamples = 0;
        let samples = 0;

        timersRef.current.intervalId = setInterval(() => {
            currentStep += 1;
            samples += 1;

            const stable = !deviceOrientationRef.needsCalibration && deviceOrientationRef.headingJitter < 7;
            if (stable) stableSamples += 1;
            setStabilityHint(stable ? 'good' : 'noisy');
            setCalibrationProgress(Math.min(100, Math.round((currentStep / totalSteps) * 100)));
        }, stepMs);

        timersRef.current.timeoutId = setTimeout(() => {
            clearCalibrationTimers();
            const stableRatio = samples > 0 ? stableSamples / samples : 0;
            const success = deviceOrientationRef.active && !deviceOrientationRef.needsCalibration && stableRatio >= 0.55;
            addArHealthSample({
                timestamp: Date.now(),
                success,
                jitterDeg: Math.round(deviceOrientationRef.headingJitter),
                stableRatio,
            });
            setCalibrationPhase(success ? 'done' : 'failed');
            if (!success) setFollowOrientation(false);
            timersRef.current.clearStatusId = setTimeout(() => setCalibrationPhase('idle'), 2400);
        }, durationMs + 80);
    }, [addArHealthSample, clearCalibrationTimers, requestAndStart, setFollowOrientation, stop]);

    const scheduleCollapse = useCallback(() => {
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = setTimeout(() => setCollapsed(true), 2000);
    }, []);

    const handleActivateCameraMode = useCallback(() => {
        setViewMode('camera');
        scheduleCollapse();
    }, [setViewMode, scheduleCollapse]);

    const handleActivateVaultMode = useCallback(() => {
        setViewMode('vault');
        scheduleCollapse();
    }, [setViewMode, scheduleCollapse]);

    const toggleGyro = useCallback(async () => {
        if (followOrientation) {
            stop();
            setFollowOrientation(false);
        } else {
            await calibrateAR();
        }
    }, [calibrateAR, followOrientation, setFollowOrientation, stop]);

    useEffect(() => {
        const timer = setInterval(() => setUiTick((v) => v + 1), 800);
        return () => {
            clearInterval(timer);
            clearCalibrationTimers();
            if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
        };
    }, [clearCalibrationTimers]);

    const needsCalibration = followOrientation && deviceOrientationRef.needsCalibration;
    const jitter = Math.round(deviceOrientationRef.headingJitter);
    const showCalibrationCard =
        isSupported && (
            permission === 'denied' ||
            needsCalibration ||
            calibrationPhase !== 'idle'
        );

    const arStatusText =
        calibrationPhase === 'running'
            ? `Calibrando... ${calibrationProgress}%`
            : calibrationPhase === 'done'
                ? 'Calibracion completada'
                : calibrationPhase === 'failed'
                    ? 'Calibracion incompleta'
                    : !isSupported
                        ? 'Este dispositivo no soporta giroscopio.'
                        : needsCalibration
                            ? `Deriva magnetica detectada (jitter ${jitter}°)`
                            : followOrientation
                                ? 'TRACKING GYRO: OK'
                                : permission === 'denied'
                                    ? 'Permiso denegado: activa sensores en el navegador'
                                    : 'Modo manual activo';

    const methodText = followOrientation ? 'Metodo: giroscopio' : 'Metodo: manual';

    // ── Chip colapsado ─────────────────────────────────────────────────────────
    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                className={cn(
                    'fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full border backdrop-blur-xl shadow-xl transition-all active:scale-95 pointer-events-auto md:bottom-6 md:right-6',
                    viewMode === 'camera'
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                )}
                title="Cambiar modo de vista"
                aria-label="Cambiar modo de vista"
            >
                {viewMode === 'camera' ? <Camera className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold tracking-widest uppercase">
                    {viewMode === 'camera' ? 'CAMARA' : 'BOVEDA'}
                </span>
                <ChevronUp className="w-3 h-3 opacity-50" />
            </button>
        );
    }

    // ── Panel expandido ────────────────────────────────────────────────────────
    return (
        <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-3 pointer-events-none md:bottom-6 md:right-6">
            <div className="flex bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl pointer-events-auto">
                <button
                    onClick={handleActivateVaultMode}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all',
                        viewMode === 'vault'
                            ? 'bg-blue-600/80 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-white/40 hover:text-white/70'
                    )}
                >
                    <MapIcon className="w-3.5 h-3.5" />
                    BOVEDA
                </button>
                <button
                    onClick={handleActivateCameraMode}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all',
                        viewMode === 'camera'
                            ? 'bg-cyan-500/80 text-white shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                            : 'text-white/40 hover:text-white/70'
                    )}
                >
                    <Camera className="w-3.5 h-3.5" />
                    CAMARA
                </button>
            </div>

            {isSupported && (
                <div
                    onClick={() => { void toggleGyro(); }}
                    className={cn(
                        'atlas-card animate-in fade-in slide-in-from-right-4 duration-500 flex items-center gap-3 rounded-2xl px-4 py-3 pointer-events-auto cursor-pointer transition-all active:scale-95',
                        followOrientation ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-white/5 bg-black/40 opacity-70'
                    )}
                >
                    <div className="relative">
                        <Aperture className={cn(
                            'w-4 h-4 transition-colors',
                            followOrientation ? 'text-cyan-300 animate-[spin_4s_linear_infinite]' : 'text-white/30'
                        )} />
                        {followOrientation && <div className="absolute inset-0 bg-cyan-300/20 blur-md rounded-full" />}
                    </div>
                    <div className="flex flex-col">
                        <span className={cn(
                            'text-[10px] font-bold tracking-[0.2em] uppercase leading-none mb-1',
                            followOrientation ? 'text-cyan-100' : 'text-white/40'
                        )}>
                            {followOrientation ? 'Giroscopio Activo' : 'Giroscopio Apagado'}
                        </span>
                        <span className="text-[10px] text-white/50 font-mono">{arStatusText}</span>
                        <span className="text-[10px] text-white/35 font-mono mt-1">{methodText}</span>
                    </div>
                </div>
            )}

            {showCalibrationCard && (
                <div className="atlas-panel pointer-events-auto max-w-[290px] rounded-2xl px-3.5 py-3">
                    <p className="text-[10px] text-white/78 uppercase tracking-[0.18em] font-semibold mb-1.5">Calibracion Sensores</p>
                    <p className="text-[11px] text-white/55 leading-relaxed mb-2.5">
                        {calibrationPhase === 'running'
                            ? 'Mueve el movil en forma de 8 durante 3 segundos.'
                            : needsCalibration
                                ? 'Señal magnetica inestable. Haz un movimiento en forma de 8 y recalibra.'
                                : permission === 'denied'
                                    ? 'La vista manual sigue disponible. Si quieres apuntar con el movil, activa el permiso de sensores en el navegador.'
                                    : 'Puedes usar dos metodos: navegacion manual o giroscopio. Activa el giroscopio solo cuando quieras apuntar con el movil.'}
                    </p>

                    {calibrationPhase === 'running' && (
                        <>
                            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                                <div
                                    className={cn(
                                        'h-full transition-all duration-150',
                                        stabilityHint === 'good' ? 'bg-emerald-400/80' : 'bg-amber-400/80'
                                    )}
                                    style={{ width: `${calibrationProgress}%` }}
                                />
                            </div>
                            <p
                                className={cn(
                                    'text-[10px] mb-2.5 font-mono',
                                    stabilityHint === 'good' ? 'text-emerald-300/80' : 'text-amber-300/80'
                                )}
                            >
                                {stabilityHint === 'good' ? 'Señal estable' : 'Señal ruidosa, sigue moviendo'}
                            </p>
                        </>
                    )}

                    {calibrationPhase === 'done' && (
                        <p className="text-[10px] mb-2.5 font-mono text-emerald-300/80">Calibracion correcta</p>
                    )}
                    {calibrationPhase === 'failed' && (
                        <p className="text-[10px] mb-2.5 font-mono text-red-300/80">No se pudo estabilizar. Repite calibracion.</p>
                    )}

                    <button
                        onClick={calibrateAR}
                        disabled={calibrationPhase === 'running'}
                        className="w-full rounded-xl border border-cyan-400/35 bg-cyan-500/18 text-cyan-100 text-[10px] font-bold tracking-[0.16em] py-2 hover:bg-cyan-500/26 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {calibrationPhase === 'running'
                            ? 'Calibrando...'
                            : needsCalibration || calibrationPhase === 'failed'
                                ? 'Recalibrar Giroscopio'
                                : 'Activar Giroscopio'}
                    </button>
                </div>
            )}
        </div>
    );
}
