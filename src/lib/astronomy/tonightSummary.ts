import * as Astronomy from 'astronomy-engine';
import { getMoonDetails } from '@/lib/astronomy/moon';

export interface TonightSummary {
    moon: { phaseName: string; phaseIcon: string; illumination: number };
    /** true si ahora mismo el Sol está bajo el horizonte. */
    isNight: boolean;
    sunset: Date | null;
    sunrise: Date | null;
    /** Planetas a simple vista que superan 10° de altura con cielo oscuro esta noche. */
    planets: string[];
}

const NAKED_EYE_PLANETS = [
    { body: Astronomy.Body.Mercury, name: 'Mercurio' },
    { body: Astronomy.Body.Venus, name: 'Venus' },
    { body: Astronomy.Body.Mars, name: 'Marte' },
    { body: Astronomy.Body.Jupiter, name: 'Júpiter' },
    { body: Astronomy.Body.Saturn, name: 'Saturno' },
];

const HOUR_MS = 3_600_000;
const SAMPLE_MS = 30 * 60_000;

function altitude(body: Astronomy.Body, date: Date, observer: Astronomy.Observer) {
    const equator = Astronomy.Equator(body, date, observer, true, true);
    return Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal').altitude;
}

/**
 * Resumen ligero de la noche para la portada de arranque: fase lunar,
 * próxima puesta y salida del Sol y planetas visibles. Se calcula en
 * milisegundos, sin esperar al catálogo ni a la escena 3D.
 */
export function buildTonightSummary(date: Date, lat: number, lon: number): TonightSummary {
    const observer = new Astronomy.Observer(lat, lon, 0);
    const moon = getMoonDetails(date);
    const isNight = altitude(Astronomy.Body.Sun, date, observer) < -0.833;

    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1)?.date ?? null;
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 1)?.date ?? null;

    // Ventana de la noche: desde ahora (si ya es de noche) o desde la puesta,
    // hasta la salida del Sol que le sigue. En latitudes sin puesta/salida
    // se usa una ventana fija de 12 h y el filtro de cielo oscuro decide.
    const start = isNight ? date : sunset ?? date;
    const end = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, start, 1)?.date
        ?? new Date(start.getTime() + 12 * HOUR_MS);

    const planets = NAKED_EYE_PLANETS.filter(({ body }) => {
        for (let t = start.getTime(); t <= end.getTime(); t += SAMPLE_MS) {
            const sample = new Date(t);
            if (altitude(Astronomy.Body.Sun, sample, observer) < -6 && altitude(body, sample, observer) > 10) return true;
        }
        return false;
    }).map(({ name }) => name);

    return {
        moon: { phaseName: moon.phaseName, phaseIcon: moon.phaseIcon, illumination: moon.illumination },
        isNight,
        sunset,
        sunrise,
        planets,
    };
}
