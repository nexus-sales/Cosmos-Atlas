import * as Astronomy from 'astronomy-engine';

import type { Planet } from '@/types/celestial';
import type { SolarSystemBody } from '@/data/solarSystemCatalog';
import { getSolarSystemBodyByName } from '@/data/solarSystemCatalog';
import { equToHor } from '@/lib/astronomy/transforms';

export const SOLAR_SYSTEM_EPHEMERIS: Record<string, { body: Astronomy.Body; symbol: string; fallbackColor: string; fallbackDesc: string }> = {
    Mercurio: { body: Astronomy.Body.Mercury, symbol: '☿', fallbackColor: '#b0b0b0', fallbackDesc: 'Planeta más cercano al Sol.' },
    Venus: { body: Astronomy.Body.Venus, symbol: '♀', fallbackColor: '#f0e6c0', fallbackDesc: 'El lucero del alba.' },
    Marte: { body: Astronomy.Body.Mars, symbol: '♂', fallbackColor: '#c1440e', fallbackDesc: 'El planeta rojo.' },
    'Júpiter': { body: Astronomy.Body.Jupiter, symbol: '♃', fallbackColor: '#c88b3a', fallbackDesc: 'El gigante gaseoso.' },
    Saturno: { body: Astronomy.Body.Saturn, symbol: '♄', fallbackColor: '#e8d890', fallbackDesc: 'El señor de los anillos.' },
    Urano: { body: Astronomy.Body.Uranus, symbol: '⛢', fallbackColor: '#7de8e8', fallbackDesc: 'Gigante helado.' },
    Neptuno: { body: Astronomy.Body.Neptune, symbol: '♆', fallbackColor: '#3f54ba', fallbackDesc: 'El planeta más lejano.' },
    Luna: { body: Astronomy.Body.Moon, symbol: '☽', fallbackColor: '#d8d6c0', fallbackDesc: 'Nuestro satélite natural.' },
    Sol: { body: Astronomy.Body.Sun, symbol: '☉', fallbackColor: '#fff5a0', fallbackDesc: 'Nuestra estrella.' },
};

export function getMoonPhaseLabel(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return 'Luna nueva';
    if (p < 67.5) return 'Creciente cóncava';
    if (p < 112.5) return 'Cuarto creciente';
    if (p < 157.5) return 'Gibosa creciente';
    if (p < 202.5) return 'Luna llena';
    if (p < 247.5) return 'Gibosa menguante';
    if (p < 292.5) return 'Cuarto menguante';
    return 'Creciente menguante';
}

export function getMoonPhaseSymbol(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return '🌑';
    if (p < 67.5) return '🌒';
    if (p < 112.5) return '🌓';
    if (p < 157.5) return '🌔';
    if (p < 202.5) return '🌕';
    if (p < 247.5) return '🌖';
    if (p < 292.5) return '🌗';
    return '🌘';
}

export function getSolarSystemCatalogBody(name: string, bodies: SolarSystemBody[]) {
    return getSolarSystemBodyByName(name, bodies);
}

export function buildSolarSystemTarget(
    name: string,
    date: Date,
    lat: number,
    lon: number,
    catalogBodies: SolarSystemBody[]
): (Planet & { alt: number; phaseInfo?: string }) | null {
    const config = SOLAR_SYSTEM_EPHEMERIS[name];
    if (!config) return null;

    try {
        const obs = new Astronomy.Observer(lat, lon, 0);
        const eq = Astronomy.Equator(config.body, date, obs, true, true);
        const illum = Astronomy.Illumination(config.body, date);
        const ra = eq.ra * 15;
        const dec = eq.dec;
        const dist = eq.dist;
        const { alt } = equToHor(ra, dec, lat, lon, date);
        const catalog = getSolarSystemCatalogBody(name, catalogBodies);

        let desc = catalog?.shortDesc || config.fallbackDesc;
        let symbol = catalog?.symbol || config.symbol;
        let phaseInfo: string | undefined;

        if (config.body === Astronomy.Body.Moon) {
            const moonPhase = Astronomy.MoonPhase(date);
            const phaseName = getMoonPhaseLabel(moonPhase);
            const pct = (illum.phase_fraction * 100).toFixed(0);
            desc = `${phaseName} — ${pct}% iluminada. ${catalog?.shortDesc || config.fallbackDesc}`;
            symbol = getMoonPhaseSymbol(moonPhase);
            phaseInfo = `${phaseName} (${pct}%)`;
        }

        return {
            name,
            symbol,
            ra,
            dec,
            mag: illum.mag,
            dist,
            color: catalog?.color || config.fallbackColor,
            desc,
            kind: 'planet',
            alt,
            phaseInfo,
        };
    } catch {
        return null;
    }
}

export function getSolarSystemPosition(name: string) {
    const config = SOLAR_SYSTEM_EPHEMERIS[name];
    if (!config) return null;
    const time = Astronomy.MakeTime(new Date());
    const vec = Astronomy.GeoVector(config.body, time, true);
    const equ = Astronomy.EquatorFromVector(vec);
    return { ra: equ.ra * 15, dec: equ.dec };
}
