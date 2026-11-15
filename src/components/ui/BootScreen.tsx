'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { BOOT_STEPS, isBootComplete, useBootStore } from '@/stores/useBootStore';
import { loadHipparcos } from '@/lib/astronomy/hipparcos';
import { buildTonightSummary, type TonightSummary } from '@/lib/astronomy/tonightSummary';
import { cn } from '@/lib/utils';

// La portada se queda hasta que el usuario pulsa "Continuar". El botón aparece
// cuando la bóveda está lista, o pasado un máximo por si un paso se queda colgado.
const MAX_WAIT_MS = 9000;

// Campo de estrellas en CSS: no depende de la escena 3D que estamos esperando.
const STARFIELD = [
    'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.9) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 27% 62%, rgba(255,255,255,0.7) 50%, transparent 51%)',
    'radial-gradient(1.5px 1.5px at 41% 33%, rgba(255,255,255,0.85) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 58% 78%, rgba(255,255,255,0.6) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 66% 14%, rgba(255,255,255,0.8) 50%, transparent 51%)',
    'radial-gradient(1.5px 1.5px at 79% 47%, rgba(255,255,255,0.75) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 88% 84%, rgba(255,255,255,0.65) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 93% 26%, rgba(255,255,255,0.8) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 6% 88%, rgba(255,255,255,0.6) 50%, transparent 51%)',
    'radial-gradient(1px 1px at 49% 6%, rgba(255,255,255,0.7) 50%, transparent 51%)',
].join(', ');

const formatTime = (date: Date | null) =>
    date ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';

function TonightCard({ summary, nightMode }: { summary: TonightSummary; nightMode: boolean }) {
    const rows = [
        // De noche lo siguiente que ocurre es el amanecer; de día, el anochecer.
        ...(summary.isNight
            ? [{ label: 'Amanece', value: formatTime(summary.sunrise) }]
            : [
                { label: 'Anochece', value: formatTime(summary.sunset) },
                { label: 'Amanece', value: formatTime(summary.sunrise) },
            ]),
        { label: 'Planetas', value: summary.planets.length ? summary.planets.join(' · ') : 'Ninguno a simple vista' },
    ];

    return (
        <div className={cn(
            'w-full max-w-sm rounded-2xl border p-5 text-left shadow-2xl backdrop-blur-md',
            nightMode ? 'border-red-500/25 bg-red-950/30' : 'border-cyan-300/20 bg-[#07101f]/85',
        )}>
            <p className={cn('text-xs font-bold uppercase tracking-[0.2em]', nightMode ? 'text-red-300/80' : 'text-cyan-200/80')}>
                Esta noche
            </p>
            <div className="mt-3 flex items-center gap-3">
                <span className={cn('text-4xl leading-none', nightMode && 'grayscale sepia hue-rotate-[-50deg] saturate-[4]')} aria-hidden="true">
                    {summary.moon.phaseIcon}
                </span>
                <div>
                    <p className={cn('text-base font-semibold', nightMode ? 'text-red-100' : 'text-white')}>{summary.moon.phaseName}</p>
                    <p className={cn('text-xs', nightMode ? 'text-red-200/60' : 'text-white/60')}>
                        Iluminada al {Math.round(summary.moon.illumination)} %
                    </p>
                </div>
            </div>
            <dl className={cn('mt-4 space-y-2 border-t pt-4 text-sm', nightMode ? 'border-red-500/20' : 'border-white/10')}>
                {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                        <dt className={nightMode ? 'text-red-200/60' : 'text-white/60'}>{row.label}</dt>
                        <dd className={cn('text-right font-medium', nightMode ? 'text-red-100' : 'text-white')}>{row.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function BootScreen() {
    const done = useBootStore((state) => state.done);
    const markDone = useBootStore((state) => state.markDone);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const observer = useAppStore((state) => state.observer);
    const [dismissed, setDismissed] = useState(false);
    const [waitedTooLong, setWaitedTooLong] = useState(false);
    const [summary, setSummary] = useState<TonightSummary | null>(null);

    const complete = isBootComplete(done);

    useEffect(() => {
        const maxTimer = setTimeout(() => setWaitedTooLong(true), MAX_WAIT_MS);
        // El catálogo de estrellas lo comparte HipparcosStars: misma promesa, sin doble descarga.
        void loadHipparcos().finally(() => markDone('stars'));
        return () => clearTimeout(maxTimer);
    }, [markDone]);

    // Se calcula en cliente: depende de la hora y de la ubicación guardada.
    useEffect(() => {
        const id = setTimeout(() => {
            try {
                setSummary(buildTonightSummary(new Date(), observer.lat, observer.lon));
            } catch {
                setSummary(null);
            }
        }, 0);
        return () => clearTimeout(id);
    }, [observer.lat, observer.lon]);

    const visible = !dismissed;
    const canContinue = complete || waitedTooLong;
    const doneCount = useMemo(() => BOOT_STEPS.filter((step) => done[step.id]).length, [done]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    className={cn(
                        'fixed inset-0 z-[9999] overflow-y-auto',
                        nightMode ? 'bg-[#0a0000]' : 'bg-[#030814]',
                    )}
                    role="dialog"
                    aria-label="Portada de Cosmos Atlas"
                >
                    <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: STARFIELD }} />
                    <div className={cn(
                        'pointer-events-none absolute inset-0',
                        nightMode
                            ? 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(127,29,29,0.25),transparent_60%)]'
                            : 'bg-[radial-gradient(ellipse_at_30%_20%,rgba(30,64,175,0.28),transparent_60%)]',
                    )} />

                    <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center gap-10 px-6 py-12 md:flex-row md:items-center md:gap-16">
                        <div className="flex-1">
                            <p className={cn(
                                'inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
                                nightMode ? 'border-red-500/30 text-red-200/80' : 'border-cyan-300/30 text-cyan-100/85',
                            )}>
                                Cosmos Atlas
                            </p>
                            <h1 className={cn(
                                'mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl',
                                nightMode ? 'text-red-100' : 'text-white',
                            )}>
                                El cielo de esta noche, desde donde estás.
                            </h1>
                            <p className={cn('mt-5 max-w-md text-base leading-relaxed', nightMode ? 'text-red-200/65' : 'text-white/65')}>
                                Estrellas, planetas y cielo profundo calculados para tu ubicación y tu hora.
                            </p>

                            <ul className="mt-8 space-y-2.5" role="status" aria-live="polite">
                                {BOOT_STEPS.map((step) => {
                                    const stepDone = done[step.id];
                                    return (
                                        <li key={step.id} className={cn(
                                            'flex items-center gap-2.5 text-sm transition-colors',
                                            stepDone
                                                ? (nightMode ? 'text-red-100' : 'text-white')
                                                : (nightMode ? 'text-red-200/50' : 'text-white/50'),
                                        )}>
                                            {stepDone
                                                ? <Check className={cn('h-4 w-4', nightMode ? 'text-red-300' : 'text-emerald-300')} aria-hidden="true" />
                                                : <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                                            {step.label}
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className={cn('mt-5 h-1 w-full max-w-xs overflow-hidden rounded-full', nightMode ? 'bg-red-500/15' : 'bg-white/10')}>
                                <div
                                    className={cn('h-full rounded-full transition-[width] duration-500', nightMode ? 'bg-red-400/80' : 'bg-cyan-300/90')}
                                    style={{ width: `${(doneCount / BOOT_STEPS.length) * 100}%` }}
                                />
                            </div>
                            <button
                                type="button"
                                autoFocus
                                disabled={!canContinue}
                                onClick={() => setDismissed(true)}
                                className={cn(
                                    'mt-7 inline-flex min-h-12 items-center justify-center rounded-xl px-7 text-base font-bold transition-all',
                                    'disabled:cursor-wait disabled:opacity-40',
                                    nightMode
                                        ? 'bg-red-500/85 text-red-50 enabled:hover:bg-red-400'
                                        : 'bg-cyan-300 text-[#03101f] enabled:hover:bg-cyan-200 enabled:shadow-[0_0_28px_rgba(103,232,249,0.35)]',
                                )}
                            >
                                {canContinue ? 'Continuar →' : 'Cargando…'}
                            </button>
                        </div>

                        {summary && <TonightCard summary={summary} nightMode={nightMode} />}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
