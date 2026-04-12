'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getDailyEvents, getBestViewingEvents, formatEventTime } from '@/lib/dailyEvents';
import type { CelestialEvent } from '@/lib/dailyEvents';
import { Eye, EyeOff, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DailyEventsPanel() {
    // Only re-render when the date (day) or hour changes, NOT every second
    const dateKey = useAppStore((state) => state.time.toDateString());
    const hour = useAppStore((state) => state.time.getHours());
    const timeDisplay = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const [events, setEvents] = useState<CelestialEvent[]>([]);
    const [bestEvents, setBestEvents] = useState<CelestialEvent[]>([]);

    useEffect(() => {
        const currentTime = useAppStore.getState().time;
        const allEvents = getDailyEvents(currentTime, observer);
        const best = getBestViewingEvents(currentTime, observer);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEvents(allEvents);
        setBestEvents(best);
    }, [dateKey, observer]);

    const todayStr = new Date(dateKey).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const isNight = hour >= 20 || hour <= 6;

    return (
        <div className="space-y-4">
            {/* Header con fecha */}
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase px-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
                EVENTOS DEL DÍA
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                <div className="text-[11px] text-white/60 mb-1">{todayStr}</div>
                <div className="flex items-center gap-2 text-[9px]">
                    <span className={cn(
                        "px-1.5 py-0.5 rounded",
                        isNight ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                        {isNight ? '🌙 Noche' : '☀️ Día'}
                    </span>
                    <span className="text-white/40 font-mono">{formatEventTime(timeDisplay)}</span>
                </div>
            </div>

            {/* Mejores eventos para observar */}
            {bestEvents.length > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[8px] text-white/20 uppercase tracking-wider px-1">
                        <Eye className="w-2.5 h-2.5" />
                        Mejores eventos
                    </div>
                    {bestEvents.slice(0, 5).map((event) => (
                        <EventCard key={event.id} event={event} compact />
                    ))}
                </div>
            )}

            {/* Todos los eventos del día */}
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[8px] text-white/20 uppercase tracking-wider px-1">
                    <Clock className="w-2.5 h-2.5" />
                    Cronología ({events.length})
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function EventCard({ event, compact = false }: { event: CelestialEvent; compact?: boolean }) {
    const isVisible = event.visible;

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded border transition-all",
                isVisible
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-white/5 bg-white/2"
            )}
        >
            {/* Icono */}
            <div className="text-lg leading-none">{event.icon}</div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "text-[9px] font-bold",
                        isVisible ? "text-white/70" : "text-white/40"
                    )}>
                        {event.object}
                    </span>
                    {event.type === 'rise' && <span className="text-[7px] text-emerald-400/60">↑</span>}
                    {event.type === 'set' && <span className="text-[7px] text-red-400/60">↓</span>}
                    {event.type === 'transit' && <span className="text-[7px] text-blue-400/60">⊕</span>}
                </div>
                {!compact && (
                    <div className="text-[8px] text-white/30 truncate">{event.description}</div>
                )}
            </div>

            {/* Hora */}
            <div className="text-[8px] text-white/40 font-mono">
                {formatEventTime(event.time)}
            </div>

            {/* Visibilidad */}
            {isVisible ? (
                <Eye className="w-3 h-3 text-emerald-400/50" />
            ) : (
                <EyeOff className="w-3 h-3 text-white/20" />
            )}
        </div>
    );
}
