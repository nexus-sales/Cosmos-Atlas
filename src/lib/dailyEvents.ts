import { Observer } from '../types/celestial';
import * as Astronomy from 'astronomy-engine';
import { getActiveShowers, getShowerInfo } from '../data/meteorShowers';
import type { MeteorShower } from '../data/meteorShowers';

export interface CelestialEvent {
    id: string;
    type: 'rise' | 'set' | 'transit' | 'conjunction' | 'phase' | 'eclipse' | 'shower' | 'twilight';
    object: string;
    time: Date;
    description: string;
    visible: boolean;
    altitude?: number;
    azimuth?: number;
    icon: string;
}

export function getDailyEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    events.push(...getTwilightEvents(date, observer));
    events.push(...getSolarEvents(date, observer));
    events.push(...getLunarEvents(date, observer));
    events.push(...getPlanetaryEvents(date, observer));
    events.push(...getMeteorShowerEvents(date));
    events.sort((a, b) => a.time.getTime() - b.time.getTime());
    return events;
}

function getTwilightEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    try {
        // Civil twilight −6°: estrellas de primera magnitud visibles
        const civilDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, -1, date, 1, -6);
        if (civilDusk) events.push({
            id: 'civil-dusk', type: 'twilight', object: 'Crepúsculo civil',
            time: civilDusk.date,
            description: 'Anochecer civil — las estrellas más brillantes comienzan a aparecer (Sol a −6°)',
            visible: true, icon: '🌆'
        });

        const civilDawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, +1, date, 1, -6);
        if (civilDawn) events.push({
            id: 'civil-dawn', type: 'twilight', object: 'Crepúsculo civil',
            time: civilDawn.date,
            description: 'Amanecer civil — las estrellas más brillantes desaparecen (Sol a −6°)',
            visible: true, icon: '🌃'
        });

        // Astronomical twilight −18°: cielo completamente oscuro para observación
        const astroNightStart = Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, -1, date, 1, -18);
        if (astroNightStart) events.push({
            id: 'astro-dark', type: 'twilight', object: 'Noche astronómica',
            time: astroNightStart.date,
            description: 'Inicio de la noche astronómica — cielo completamente oscuro, visible la Vía Láctea',
            visible: true, icon: '🌌'
        });

        const astroNightEnd = Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, +1, date, 1, -18);
        if (astroNightEnd) events.push({
            id: 'astro-dawn', type: 'twilight', object: 'Noche astronómica',
            time: astroNightEnd.date,
            description: 'Fin de la noche astronómica — el horizonte comienza a aclarar (Sol a −18°)',
            visible: true, icon: '🌌'
        });
    } catch {
        // Latitudes polares pueden no tener crepúsculo en ciertos meses
    }

    return events;
}

function getSolarEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, 0, date, 1);
    if (sunrise) {
        events.push({
            id: 'sunrise', type: 'rise', object: 'Sol',
            time: sunrise.date,
            description: 'Amanecer — El Sol aparece por el horizonte',
            visible: true, altitude: 0,
            azimuth: calculateAzimuth(Astronomy.Body.Sun, sunrise.date, observer),
            icon: '🌅'
        });
    }

    const transit = Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, date, 1);
    if (transit) {
        events.push({
            id: 'sun-transit', type: 'transit', object: 'Sol',
            time: transit.time.date,
            description: 'Mediodía solar — El Sol alcanza su punto más alto',
            visible: true,
            altitude: calculateAltitude(Astronomy.Body.Sun, transit.time.date, observer),
            icon: '☀️'
        });
    }

    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, 0, date, -1);
    if (sunset) {
        events.push({
            id: 'sunset', type: 'set', object: 'Sol',
            time: sunset.date,
            description: 'Atardecer — El Sol desaparece por el horizonte',
            visible: true, altitude: 0,
            azimuth: calculateAzimuth(Astronomy.Body.Sun, sunset.date, observer),
            icon: '🌇'
        });
    }
    return events;
}

function getLunarEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, 0, date, 1);
    if (moonrise) {
        events.push({
            id: 'moonrise', type: 'rise', object: 'Luna',
            time: moonrise.date,
            description: 'Salida de la Luna',
            visible: true, altitude: 0, icon: '🌙'
        });
    }

    const moonTransit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, obs, 0, date, 1);
    if (moonTransit) {
        events.push({
            id: 'moon-transit', type: 'transit', object: 'Luna',
            time: moonTransit.time.date,
            description: 'La Luna alcanza su punto más alto',
            visible: true,
            altitude: calculateAltitude(Astronomy.Body.Moon, moonTransit.time.date, observer),
            icon: '🌕'
        });
    }

    const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, 0, date, -1);
    if (moonset) {
        events.push({
            id: 'moonset', type: 'set', object: 'Luna',
            time: moonset.date,
            description: 'Puesta de la Luna',
            visible: true, altitude: 0, icon: '🌘'
        });
    }

    const phase = Astronomy.MoonPhase(date);
    const phaseName = getMoonPhaseName(phase);
    events.push({
        id: 'moon-phase', type: 'phase', object: 'Luna',
        time: date,
        description: `Fase: ${phaseName} (${phase.toFixed(0)}°)`,
        visible: true, icon: getMoonPhaseIcon(phase)
    });
    return events;
}

function getPlanetaryEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const planets = [
        { body: Astronomy.Body.Mercury, name: 'Mercurio', icon: '☿️' },
        { body: Astronomy.Body.Venus, name: 'Venus', icon: '♀️' },
        { body: Astronomy.Body.Mars, name: 'Marte', icon: '♂️' },
        { body: Astronomy.Body.Jupiter, name: 'Júpiter', icon: '♃' },
        { body: Astronomy.Body.Saturn, name: 'Saturno', icon: '♄' }
    ];

    planets.forEach(({ body, name, icon }) => {
        const rise = Astronomy.SearchRiseSet(body, obs, 0, date, 1);
        if (rise) {
            const riseAz = calculateAzimuth(body, rise.date, observer);
            const cardinalDir = riseAz < 90 ? 'NE' : riseAz < 180 ? 'SE' : riseAz < 270 ? 'SO' : 'NO';
            events.push({
                id: `${name.toLowerCase()}-rise`, type: 'rise', object: name,
                time: rise.date,
                description: `${name} sale por el horizonte ${cardinalDir} (${riseAz.toFixed(0)}°)`,
                visible: true, altitude: 0, azimuth: riseAz, icon
            });
        }

        const transit = Astronomy.SearchHourAngle(body, obs, 0, date, 1);
        if (transit) {
            const alt = calculateAltitude(body, transit.time.date, observer);
            events.push({
                id: `${name.toLowerCase()}-transit`, type: 'transit', object: name,
                time: transit.time.date,
                description: `${name} alcanza su punto más alto (${alt.toFixed(1)}°)`,
                visible: alt > 10, altitude: alt, icon
            });
        }

        const set = Astronomy.SearchRiseSet(body, obs, 0, date, -1);
        if (set) {
            const setAz = calculateAzimuth(body, set.date, observer);
            events.push({
                id: `${name.toLowerCase()}-set`, type: 'set', object: name,
                time: set.date,
                description: `${name} se pone por el horizonte (${setAz.toFixed(0)}°)`,
                visible: false, altitude: 0, azimuth: setAz, icon
            });
        }
    });
    return events;
}

function getMeteorShowerEvents(date: Date): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const active = getActiveShowers(date);

    active.forEach((shower: MeteorShower) => {
        const info = getShowerInfo(shower, date);
        if (info.status !== 'inactive') {
            const peakLabel = info.status === 'peaking' ? '¡MÁXIMO! ' : '';
            const daysLabel = info.daysToPeak === 0
                ? 'hoy es el pico'
                : info.daysToPeak > 0
                    ? `pico en ${info.daysToPeak}d`
                    : `${Math.abs(info.daysToPeak)}d tras el pico`;
            events.push({
                id: `shower-${shower.id}`,
                type: 'shower',
                object: shower.name,
                time: date,
                description: `${peakLabel}${shower.shortName}: ~${info.thz} meteoros/h · ${daysLabel} · ${shower.parentBody}`,
                visible: true,
                icon: info.status === 'peaking' ? '🌠' : '☄️'
            });
        }
    });

    return events;
}

function calculateAltitude(body: Astronomy.Body, date: Date, observer: Observer): number {
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const equ = Astronomy.Equator(body, date, obs, true, true);
    const hor = Astronomy.Horizon(date, obs, equ.ra, equ.dec, 'normal');
    return hor.altitude;
}

function calculateAzimuth(body: Astronomy.Body, date: Date, observer: Observer): number {
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const equ = Astronomy.Equator(body, date, obs, true, true);
    const hor = Astronomy.Horizon(date, obs, equ.ra, equ.dec, 'normal');
    return hor.azimuth;
}

function getMoonPhaseName(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return 'Luna nueva';
    if (p < 67.5) return 'Luna creciente';
    if (p < 112.5) return 'Cuarto creciente';
    if (p < 157.5) return 'Gibosa creciente';
    if (p < 202.5) return 'Luna llena';
    if (p < 247.5) return 'Gibosa menguante';
    if (p < 292.5) return 'Cuarto menguante';
    return 'Luna menguante';
}

function getMoonPhaseIcon(phase: number): string {
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

function getSunAltitude(date: Date, observer: Observer): number {
    try {
        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
        const equ = Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true);
        const hor = Astronomy.Horizon(date, obs, equ.ra, equ.dec, 'normal');
        return hor.altitude;
    } catch {
        const hour = date.getHours();
        return hour >= 20 || hour <= 6 ? -20 : 10;
    }
}

export function getBestViewingEvents(date: Date, observer: Observer): CelestialEvent[] {
    const allEvents = getDailyEvents(date, observer);
    const sunAlt = getSunAltitude(date, observer);
    const isAstronomicalNight = sunAlt < -12;
    const isCivilNight = sunAlt < -6;

    return allEvents
        .filter(event => event.visible && event.type !== 'rise' && event.type !== 'set' && event.type !== 'twilight')
        .filter(event => {
            if (event.type === 'shower') return isCivilNight;
            if (event.object === 'Sol') return false;
            if (event.type === 'transit' && event.altitude != null && event.altitude < 10) return false;
            // Prefer night events (transit/phase/shower) at night
            if (event.type === 'transit') return isAstronomicalNight || (event.altitude != null && event.altitude > 30);
            return true;
        })
        .slice(0, 10);
}

export function formatEventTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}
