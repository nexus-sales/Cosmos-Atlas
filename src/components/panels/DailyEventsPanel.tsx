'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getDailyEventsSummary, formatEventTime } from '@/lib/dailyEvents';
import type { CelestialEvent } from '@/lib/dailyEvents';
import { Eye, EyeOff, Clock3, CalendarDays, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyEventsPanel() {
    const dateKey = useAppStore((state) => state.timeMinute.toDateString());
    const timeDisplay = useAppStore((state) => state.timeMinute);
    const observer = useAppStore((state) => state.observer);
    const hour = timeDisplay.getHours();
    const timestamp = timeDisplay.getTime();

    const { events, bestEvents } = useMemo(() => {
        const currentTime = new Date(timestamp);
        return getDailyEventsSummary(currentTime, observer);
    }, [observer, timestamp]);

    const todayStr = new Date(dateKey).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    // Night badge: true when most night-relevant events are visible
    const isNight = hour >= 20 || hour <= 5;
    const visibleCount = events.filter((event) => event.visible).length;

    return (
        <div className="space-y-4">
            <div className="atlas-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                            <CalendarDays className="h-3.5 w-3.5 text-blue-300/70" />
                            Resumen del Cielo
                        </div>
                        <div className="mt-1 text-[15px] font-semibold capitalize text-white">{todayStr}</div>
                        <div className="mt-1 text-[11px] leading-5 text-white/58">
                            Lectura rápida de las mejores ventanas de observación y la línea temporal de hoy.
                        </div>
                    </div>
                    <div
                        className={cn(
                            'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                            isNight
                                ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200'
                                : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                        )}
                    >
                        {isNight ? 'Noche' : 'Día'}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                    <Metric label="Ahora" value={formatEventTime(timeDisplay)} hint="local" />
                    <Metric label="Visible" value={`${visibleCount}`} hint="eventos" />
                    <Metric label="Destac." value={`${bestEvents.length}`} hint="mejor" />
                </div>
            </div>

            {bestEvents.length > 0 && (
                <section className="space-y-2">
                    <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                        <Sparkles className="h-3.5 w-3.5 text-blue-300/70" />
                        Mejores Momentos
                    </div>
                    <div className="space-y-2">
                        {bestEvents.slice(0, 4).map((event) => (
                            <EventCard key={event.id} event={event} compact />
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-2">
                <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/34">
                    <div className="flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5 text-blue-300/70" />
                        Línea Temporal
                    </div>
                    <span className="font-mono text-white/44">{events.length}</span>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function EventCard({ event, compact = false }: { event: CelestialEvent; compact?: boolean }) {
    const isVisible = event.visible;

    return (
        <div
            className={cn(
                'atlas-card rounded-2xl px-3 py-3 transition-all',
                isVisible ? '!border-emerald-400/40 bg-emerald-500/[0.04]' : ''
            )}
        >
            <div className="flex items-start gap-3">
                <div className="atlas-card flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg leading-none">
                    {event.icon}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn('truncate text-[12px] font-semibold', isVisible ? 'text-white' : 'text-white/70')}>
                                    {event.object}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/42">
                                    {event.type === 'twilight' ? 'crepúsc.' : event.type}
                                </span>
                            </div>
                            {!compact && (
                                <p className="mt-1 text-[11px] leading-5 text-white/54">{event.description}</p>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="text-[12px] font-mono text-blue-200">{formatEventTime(event.time)}</div>
                            <div className="mt-1 flex justify-end">
                                {isVisible ? (
                                    <Eye className="h-3.5 w-3.5 text-emerald-300/70" />
                                ) : (
                                    <EyeOff className="h-3.5 w-3.5 text-white/22" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="atlas-card rounded-xl px-3 py-2.5">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/38">{label}</div>
            <div className="mt-1 text-[14px] font-semibold text-white">{value}</div>
            <div className="text-[9px] uppercase tracking-[0.14em] text-white/32">{hint}</div>
        </div>
    );
}
