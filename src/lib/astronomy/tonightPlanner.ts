import * as Astronomy from 'astronomy-engine';
import { equToHor } from './transforms';

export interface PlanningTarget {
    id: string;
    name: string;
    ra: number;
    dec: number;
    mag: number;
    kind: 'star' | 'dso';
    type?: string;
}

export interface PlannerBreakdown {
    duration: number;
    altitude: number;
    moon: number;
    darkness: number;
    target: number;
}

export interface PlannedTarget extends PlanningTarget {
    score: number;
    rating: 'excelente' | 'bueno' | 'difícil' | 'no visible';
    maxAltitude: number;
    bestTime: Date;
    windowStart: Date | null;
    windowEnd: Date | null;
    observableMinutes: number;
    moonSeparation: number;
    moonIllumination: number;
    breakdown: PlannerBreakdown;
    reason: string;
    curve: readonly { time: Date; altitude: number; dark: boolean }[];
}

export interface NightPlan {
    start: Date;
    end: Date;
    astronomicalStart: Date | null;
    astronomicalEnd: Date | null;
    targets: PlannedTarget[];
}

const STEP_MINUTES = 30;
const MIN_ALTITUDE = 25;

function clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
}

function angularSeparation(raA: number, decA: number, raB: number, decB: number) {
    const toRad = Math.PI / 180;
    const a = decA * toRad;
    const b = decB * toRad;
    const delta = (raA - raB) * toRad;
    return Math.acos(Math.max(-1, Math.min(1, Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(delta)))) / toRad;
}

function sunAltitude(date: Date, observer: Astronomy.Observer) {
    const eq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
    return Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal').altitude;
}

function nightBounds(date: Date) {
    const start = new Date(date);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start.getTime() + 15 * 60 * 60 * 1000);
    return { start, end };
}

function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours} h ${mins ? `${mins} min` : ''}`.trim() : `${mins} min`;
}

export function buildNightPlan(
    date: Date,
    location: { lat: number; lon: number },
    bortleScale: number,
    inputTargets: readonly PlanningTarget[],
): NightPlan {
    const { start, end } = nightBounds(date);
    const observer = new Astronomy.Observer(location.lat, location.lon, 0);
    const sampleTimes: Date[] = [];
    for (let time = start.getTime(); time <= end.getTime(); time += STEP_MINUTES * 60_000) sampleTimes.push(new Date(time));
    const darkness = sampleTimes.map((time) => sunAltitude(time, observer) <= -18);
    const astronomicalIndices = darkness.flatMap((dark, index) => dark ? [index] : []);
    const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, new Date((start.getTime() + end.getTime()) / 2)).phase_fraction * 100;

    const targets = inputTargets.map((target): PlannedTarget => {
        const curve = sampleTimes.map((time, index) => ({
            time,
            altitude: equToHor(target.ra, target.dec, location.lat, location.lon, time).alt,
            dark: darkness[index],
        }));
        const useful = curve.map((sample) => sample.dark && sample.altitude >= MIN_ALTITUDE);
        let bestStart = -1, bestEnd = -1, runStart = -1;
        useful.forEach((active, index) => {
            if (active && runStart < 0) runStart = index;
            if ((!active || index === useful.length - 1) && runStart >= 0) {
                const runEnd = active && index === useful.length - 1 ? index : index - 1;
                if (runEnd - runStart > bestEnd - bestStart) [bestStart, bestEnd] = [runStart, runEnd];
                runStart = -1;
            }
        });
        const darkCurve = curve.filter((sample) => sample.dark);
        const peak = (darkCurve.length ? darkCurve : curve).reduce((best, sample) => sample.altitude > best.altitude ? sample : best);
        const moonEq = Astronomy.Equator(Astronomy.Body.Moon, peak.time, observer, true, true);
        const moonSeparation = angularSeparation(target.ra, target.dec, moonEq.ra * 15, moonEq.dec);
        const observableMinutes = bestStart >= 0 ? (bestEnd - bestStart + 1) * STEP_MINUTES : 0;
        const breakdown: PlannerBreakdown = {
            duration: 35 * clamp01(observableMinutes / 240),
            altitude: 25 * clamp01((peak.altitude - MIN_ALTITUDE) / 50),
            moon: 20 * clamp01(1 - (moonIllumination / 100) * clamp01((60 - moonSeparation) / 50)),
            darkness: 10 * clamp01((10 - bortleScale) / 9),
            target: 10 * clamp01((target.kind === 'star' ? 5 - target.mag : 11 - target.mag) / (target.kind === 'star' ? 6 : 10)),
        };
        const score = observableMinutes === 0 ? Math.min(24, Math.round(breakdown.altitude + breakdown.moon / 2)) : Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0));
        const rating = observableMinutes === 0 ? 'no visible' : score >= 78 ? 'excelente' : score >= 58 ? 'bueno' : 'difícil';
        const windowStart = bestStart >= 0 ? curve[bestStart].time : null;
        const windowEnd = bestEnd >= 0 ? new Date(curve[bestEnd].time.getTime() + STEP_MINUTES * 60_000) : null;
        const reason = observableMinutes
            ? `${formatDuration(observableMinutes)} sobre ${MIN_ALTITUDE}°, máximo ${Math.round(peak.altitude)}° y Luna a ${Math.round(moonSeparation)}°.`
            : `No alcanza ${MIN_ALTITUDE}° durante la noche astronómica.`;
        return { ...target, score, rating, maxAltitude: peak.altitude, bestTime: peak.time, windowStart, windowEnd, observableMinutes, moonSeparation, moonIllumination, breakdown, reason, curve };
    }).sort((a, b) => b.score - a.score || b.maxAltitude - a.maxAltitude);

    return {
        start, end,
        astronomicalStart: astronomicalIndices.length ? sampleTimes[astronomicalIndices[0]] : null,
        astronomicalEnd: astronomicalIndices.length ? sampleTimes[astronomicalIndices.at(-1)!] : null,
        targets,
    };
}
