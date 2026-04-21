import { applyPrecession } from './transforms';
import { gmstDeg, toDeg, toRad } from './time';

export interface VisibilityEvents {
    rise: Date | null;
    transit: Date | null;
    set: Date | null;
    status: 'normal' | 'circumpolar' | 'never-rises';
}

const SIDEREAL_DAY_HOURS = 23.9344696;
const HORIZON_ALTITUDE_DEG = -0.5667;

function normalizeDeg(value: number) {
    return ((value % 360) + 360) % 360;
}

function nextTimeForLst(targetLstDeg: number, from: Date, lon: number) {
    const currentLst = normalizeDeg(gmstDeg(from) + lon);
    const deltaDeg = normalizeDeg(targetLstDeg - currentLst);
    const deltaHours = (deltaDeg / 360) * SIDEREAL_DAY_HOURS;
    return new Date(from.getTime() + deltaHours * 3_600_000);
}

export function calculateVisibilityEvents(
    ra: number,
    dec: number,
    observer: { lat: number; lon: number },
    from: Date,
): VisibilityEvents {
    const epochCoords = applyPrecession(ra, dec, from);
    const latRad = toRad(observer.lat);
    const decRad = toRad(epochCoords.dec);
    const horizonRad = toRad(HORIZON_ALTITUDE_DEG);
    const denominator = Math.cos(latRad) * Math.cos(decRad);

    if (Math.abs(denominator) < 1e-8) {
        return {
            rise: null,
            transit: nextTimeForLst(epochCoords.ra, from, observer.lon),
            set: null,
            status: 'circumpolar',
        };
    }

    const cosHourAngle = (Math.sin(horizonRad) - Math.sin(latRad) * Math.sin(decRad)) / denominator;
    const transit = nextTimeForLst(epochCoords.ra, from, observer.lon);

    if (cosHourAngle > 1) {
        return { rise: null, transit, set: null, status: 'never-rises' };
    }

    if (cosHourAngle < -1) {
        return { rise: null, transit, set: null, status: 'circumpolar' };
    }

    const hourAngleDeg = toDeg(Math.acos(cosHourAngle));

    return {
        rise: nextTimeForLst(normalizeDeg(epochCoords.ra - hourAngleDeg), from, observer.lon),
        transit,
        set: nextTimeForLst(normalizeDeg(epochCoords.ra + hourAngleDeg), from, observer.lon),
        status: 'normal',
    };
}

export function formatVisibilityEvents(events: VisibilityEvents, locale = 'es-ES') {
    const formatTime = (date: Date | null) => date?.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
    }) ?? 'no aplicable';

    if (events.status === 'circumpolar') {
        return `circumpolar; transito aprox. ${formatTime(events.transit)}`;
    }

    if (events.status === 'never-rises') {
        return `no sale desde esta latitud; transito teorico ${formatTime(events.transit)}`;
    }

    return `sale ${formatTime(events.rise)} | transita ${formatTime(events.transit)} | se pone ${formatTime(events.set)}`;
}
