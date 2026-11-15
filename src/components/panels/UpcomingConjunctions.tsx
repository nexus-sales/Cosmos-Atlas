'use client';

/**
 * UpcomingConjunctions.tsx
 * Calcula y muestra las próximas conjunciones planetarias en los siguientes 90 días.
 * Una conjunción ocurre cuando dos planetas están a menos de 3° de separación angular.
 *
 * Usa astronomy-engine (ya importado en Planets.tsx) para efemérides reales.
 * El cálculo se hace una sola vez al montar el componente — sin coste en cada frame.
 */

import { useEffect, useState, useMemo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { useAppStore } from '@/stores/useAppStore';

interface Conjunction {
    bodyA: string;
    bodyB: string;
    symbolA: string;
    symbolB: string;
    colorA: string;
    colorB: string;
    date: Date;
    separation: number; // grados
    daysFromNow: number;
}

const PLANET_CONFIG = [
    { body: Astronomy.Body.Mercury, name: 'Mercurio', symbol: '☿', color: '#b0b0b0' },
    { body: Astronomy.Body.Venus,   name: 'Venus',    symbol: '♀', color: '#f0e6c0' },
    { body: Astronomy.Body.Mars,    name: 'Marte',    symbol: '♂', color: '#c1440e' },
    { body: Astronomy.Body.Jupiter, name: 'Júpiter',  symbol: '♃', color: '#c88b3a' },
    { body: Astronomy.Body.Saturn,  name: 'Saturno',  symbol: '♄', color: '#e8d890' },
    { body: Astronomy.Body.Moon,    name: 'Luna',     symbol: '☽', color: '#d8d6c0' },
] as const;

/** Calcula la separación angular en grados entre dos cuerpos en una fecha dada */
function angularSeparation(
    bodyA: Astronomy.Body,
    bodyB: Astronomy.Body,
    date: Date,
    obs: Astronomy.Observer,
): number {
    try {
        const eqA = Astronomy.Equator(bodyA, date, obs, true, true);
        const eqB = Astronomy.Equator(bodyB, date, obs, true, true);

        // Conversión a radianes
        const ra1  = (eqA.ra  * 15 * Math.PI) / 180;
        const dec1 = (eqA.dec * Math.PI) / 180;
        const ra2  = (eqB.ra  * 15 * Math.PI) / 180;
        const dec2 = (eqB.dec * Math.PI) / 180;

        // Fórmula de Vincenty para separación angular (numericamente estable)
        const dRa   = ra2 - ra1;
        const sinDec1 = Math.sin(dec1), cosDec1 = Math.cos(dec1);
        const sinDec2 = Math.sin(dec2), cosDec2 = Math.cos(dec2);

        const y = Math.sqrt(
            Math.pow(cosDec2 * Math.sin(dRa), 2) +
            Math.pow(cosDec1 * sinDec2 - sinDec1 * cosDec2 * Math.cos(dRa), 2)
        );
        const x = sinDec1 * sinDec2 + cosDec1 * cosDec2 * Math.cos(dRa);
        return (Math.atan2(y, x) * 180) / Math.PI;
    } catch {
        return 999;
    }
}

const MAX_SEP = 3.5; // grados — umbral para considerar conjunción
const STEP_HOURS = 6; // precisión del barrido (cada 6h, 90 días = 360 pasos)

function findConjunctions(observer: { lat: number; lon: number }): Conjunction[] {
    const now = new Date();
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const results: Conjunction[] = [];
    const bodies = PLANET_CONFIG;

    // Barrido en el tiempo: cada 6h durante 90 días
    const totalSteps = (90 * 24) / STEP_HOURS;
    const stepMs = STEP_HOURS * 3600 * 1000;

    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const cfgA = bodies[i];
            const cfgB = bodies[j];

            let prevSep = Infinity;
            let minSep = Infinity;
            let minDate = now;

            for (let step = 0; step < totalSteps; step++) {
                const t = new Date(now.getTime() + step * stepMs);
                const sep = angularSeparation(cfgA.body, cfgB.body, t, obs);

                if (sep < minSep) {
                    minSep = sep;
                    minDate = t;
                }

                // Detectar mínimo local: separación vuelve a crecer → registrar
                if (step > 0 && sep > prevSep && prevSep < MAX_SEP) {
                    const daysFromNow = (minDate.getTime() - now.getTime()) / 86400000;
                    // Evitar duplicados cercanos (< 3 días entre eventos similares)
                    const isDuplicate = results.some(
                        r =>
                            ((r.bodyA === cfgA.name && r.bodyB === cfgB.name) ||
                                (r.bodyA === cfgB.name && r.bodyB === cfgA.name)) &&
                            Math.abs(r.daysFromNow - daysFromNow) < 3,
                    );
                    if (!isDuplicate) {
                        results.push({
                            bodyA: cfgA.name,
                            bodyB: cfgB.name,
                            symbolA: cfgA.symbol,
                            symbolB: cfgB.symbol,
                            colorA: cfgA.color,
                            colorB: cfgB.color,
                            date: minDate,
                            separation: prevSep,
                            daysFromNow,
                        });
                    }
                    minSep = Infinity; // reset para el siguiente evento
                }

                prevSep = sep;
            }
        }
    }

    // Ordenar por fecha y devolver los próximos 8
    return results
        .filter(r => r.daysFromNow >= 0)
        .sort((a, b) => a.daysFromNow - b.daysFromNow)
        .slice(0, 8);
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDays(days: number): string {
    if (days < 1) return 'Hoy';
    if (days < 2) return 'Mañana';
    return `En ${Math.round(days)} días`;
}

function formatSep(deg: number): string {
    if (deg < 1) return `${(deg * 60).toFixed(0)}'`;
    return `${deg.toFixed(1)}°`;
}

export default function UpcomingConjunctions() {
    const observer = useAppStore(s => s.observer);
    const nightMode = useAppStore(s => s.settings.nightMode);
    const [conjunctions, setConjunctions] = useState<Conjunction[]>([]);
    const [loading, setLoading] = useState(true);

    // Serializar observer para detectar cambios reales
    const obsKey = useMemo(
        () => `${observer.lat.toFixed(2)},${observer.lon.toFixed(2)}`,
        [observer],
    );

    useEffect(() => {
        setLoading(true);
        // Diferir al siguiente tick para no bloquear el render inicial
        const id = setTimeout(() => {
            const result = findConjunctions(observer);
            setConjunctions(result);
            setLoading(false);
        }, 50);
        return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [obsKey]);

    const accentColor = nightMode ? '#ff4444' : '#60a5fa';
    const dimColor    = nightMode ? 'rgba(255,68,68,0.45)' : 'rgba(148,163,184,0.6)';

    return (
        <div className="flex flex-col gap-1.5">
            {loading ? (
                <div className="text-[11px] text-center py-3 opacity-40" style={{ color: dimColor }}>
                    Calculando efemérides…
                </div>
            ) : conjunctions.length === 0 ? (
                <div className="text-[11px] text-center py-3 opacity-40" style={{ color: dimColor }}>
                    Sin conjunciones próximas (&lt;3.5°) en 90 días
                </div>
            ) : (
                conjunctions.map((c, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors"
                        style={{
                            background: nightMode
                                ? 'rgba(80,0,0,0.25)'
                                : 'rgba(255,255,255,0.03)',
                            borderColor: nightMode
                                ? 'rgba(255,68,68,0.15)'
                                : 'rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* Símbolos planetarios */}
                        <div className="flex items-center gap-1 shrink-0 text-[16px] leading-none w-12">
                            <span style={{ color: c.colorA }}>{c.symbolA}</span>
                            <span style={{ color: dimColor, fontSize: '10px' }}>+</span>
                            <span style={{ color: c.colorB }}>{c.symbolB}</span>
                        </div>

                        {/* Nombres y fecha */}
                        <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold font-mono truncate" style={{ color: accentColor }}>
                                {c.bodyA} — {c.bodyB}
                            </div>
                            <div className="text-[11px] mt-0.5 opacity-60 font-mono" style={{ color: dimColor }}>
                                {formatDate(c.date)}
                            </div>
                        </div>

                        {/* Separación y cuenta atrás */}
                        <div className="text-right shrink-0">
                            <div className="text-[11px] font-mono font-bold" style={{ color: accentColor }}>
                                {formatSep(c.separation)}
                            </div>
                            <div className="text-[11px] font-mono opacity-55" style={{ color: dimColor }}>
                                {formatDays(c.daysFromNow)}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}