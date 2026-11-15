import * as Astronomy from 'astronomy-engine';
import { STARS } from '@/data/stars';
import { equToHor } from '@/lib/astronomy/transforms';

export interface ArAlignmentTarget {
    id: string;
    name: string;
    kind: 'moon' | 'planet' | 'star';
    azimuth: number;
    altitude: number;
    magnitude: number;
}

// Cerca del horizonte la refracción y los obstáculos estropean la referencia;
// cerca del cénit el azimut del sensor deja de estar bien condicionado.
export const AR_TARGET_MIN_ALTITUDE = 8;
export const AR_TARGET_MAX_ALTITUDE = 75;
/** Una corrección de elevación mayor indica que no se apuntaba al astro pedido. */
export const AR_MAX_ELEVATION_CORRECTION = 30;

const PLANET_SUN_ALTITUDE_LIMIT = -4;
const STAR_SUN_ALTITUDE_LIMIT = -9;
const STAR_MAG_LIMIT = 1.3;
const PLANET_MAG_LIMIT = 1.2;

const PLANETS = [
    { body: Astronomy.Body.Venus, name: 'Venus' },
    { body: Astronomy.Body.Jupiter, name: 'Júpiter' },
    { body: Astronomy.Body.Mars, name: 'Marte' },
    { body: Astronomy.Body.Saturn, name: 'Saturno' },
];

function bodyHorizontal(body: Astronomy.Body, date: Date, observer: Astronomy.Observer) {
    const equator = Astronomy.Equator(body, date, observer, true, true);
    const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal');
    return { altitude: horizon.altitude, azimuth: horizon.azimuth };
}

const inUsableBand = (altitude: number) => altitude >= AR_TARGET_MIN_ALTITUDE && altitude <= AR_TARGET_MAX_ALTITUDE;

/**
 * Astros con los que se puede alinear la cámara AR ahora mismo, ordenados por
 * facilidad de identificación: primero la Luna y después por brillo. El Sol
 * se excluye siempre (no se le pide a nadie que apunte la cámara al Sol).
 */
export function listArAlignmentTargets(date: Date, lat: number, lon: number): ArAlignmentTarget[] {
    const observer = new Astronomy.Observer(lat, lon, 0);
    const sunAltitude = bodyHorizontal(Astronomy.Body.Sun, date, observer).altitude;
    const targets: ArAlignmentTarget[] = [];

    const moon = bodyHorizontal(Astronomy.Body.Moon, date, observer);
    if (inUsableBand(moon.altitude)) {
        targets.push({ id: 'moon', name: 'Luna', kind: 'moon', ...moon, magnitude: Astronomy.Illumination(Astronomy.Body.Moon, date).mag });
    }

    const rest: ArAlignmentTarget[] = [];
    if (sunAltitude < PLANET_SUN_ALTITUDE_LIMIT) {
        for (const planet of PLANETS) {
            const position = bodyHorizontal(planet.body, date, observer);
            const magnitude = Astronomy.Illumination(planet.body, date).mag;
            if (inUsableBand(position.altitude) && magnitude <= PLANET_MAG_LIMIT) {
                rest.push({ id: `planet:${planet.name}`, name: planet.name, kind: 'planet', ...position, magnitude });
            }
        }
    }
    if (sunAltitude < STAR_SUN_ALTITUDE_LIMIT) {
        for (const star of STARS) {
            if (star.mag > STAR_MAG_LIMIT) continue;
            const { alt, az } = equToHor(star.ra, star.dec, lat, lon, date);
            if (inUsableBand(alt)) {
                rest.push({ id: `star:${star.name}`, name: star.name, kind: 'star', azimuth: az, altitude: alt, magnitude: star.mag });
            }
        }
    }

    return [...targets, ...rest.sort((a, b) => a.magnitude - b.magnitude)];
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** "SE · 34° de altura": dónde buscar el astro a simple vista. */
export function describeTargetDirection(target: Pick<ArAlignmentTarget, 'azimuth' | 'altitude'>) {
    const point = COMPASS_POINTS[Math.round((((target.azimuth % 360) + 360) % 360) / 45) % 8];
    return `${point} · ${Math.round(target.altitude)}° de altura`;
}

export function isPlausibleElevationCorrection(elevationCorrection: number) {
    return Math.abs(elevationCorrection) <= AR_MAX_ELEVATION_CORRECTION;
}
