import { Observer } from '../types/celestial';
import * as Astronomy from 'astronomy-engine';

export interface CelestialEvent {
    id: string;
    type: 'rise' | 'set' | 'transit' | 'conjunction' | 'phase' | 'eclipse' | 'shower';
    object: string;
    time: Date;
    description: string;
    visible: boolean;
    altitude?: number; // Para eventos de salida/puesta
    azimuth?: number;
    icon: string;
}

/**
 * Calcula los eventos celestes para un día dado
 */
export function getDailyEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    // Eventos del Sol
    events.push(...getSolarEvents(date, observer));

    // Eventos de la Luna
    events.push(...getLunarEvents(date, observer));

    // Eventos de planetas
    events.push(...getPlanetaryEvents(date, observer));

    // Lluvia de meteoros activa
    events.push(...getMeteorShowerEvents(date));

    // Ordenar por hora
    events.sort((a, b) => a.time.getTime() - b.time.getTime());

    return events;
}

/**
 * Eventos solares (salida, tránsito, puesta)
 */
function getSolarEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    // Salida del Sol
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, 0, date, 1);
    if (sunrise) {
        events.push({
            id: 'sunrise',
            type: 'rise',
            object: 'Sol',
            time: sunrise.toDate(),
            description: 'Amanecer — El Sol aparece por el horizonte',
            visible: true,
            altitude: 0,
            azimuth: calculateAzimuth(Astronomy.Body.Sun, sunrise.toDate(), observer),
            icon: '🌅'
        });
    }

    // Tránsito solar (mediodía)
    const transit = Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, date, 1);
    if (transit) {
        events.push({
            id: 'sun-transit',
            type: 'transit',
            object: 'Sol',
            time: transit.time.toDate(),
            description: 'Mediodía solar — El Sol alcanza su punto más alto',
            visible: true,
            altitude: calculateAltitude(Astronomy.Body.Sun, transit.time.toDate(), observer),
            icon: '☀️'
        });
    }

    // Puesta del Sol
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, 0, date, -1);
    if (sunset) {
        events.push({
            id: 'sunset',
            type: 'set',
            object: 'Sol',
            time: sunset.toDate(),
            description: 'Atardecer — El Sol desaparece por el horizonte',
            visible: true,
            altitude: 0,
            azimuth: calculateAzimuth(Astronomy.Body.Sun, sunset.toDate(), observer),
            icon: '🌇'
        });
    }

    return events;
}

/**
 * Eventos lunares (salida, tránsito, puesta, fase)
 */
function getLunarEvents(date: Date, observer: Observer): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

    // Salida de la Luna
    const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, 0, date, 1);
    if (moonrise) {
        events.push({
            id: 'moonrise',
            type: 'rise',
            object: 'Luna',
            time: moonrise.toDate(),
            description: 'Salida de la Luna',
            visible: true,
            altitude: 0,
            icon: '🌙'
        });
    }

    // Tránsito lunar
    const moonTransit = Astronomy.SearchHourAngle(Astronomy.Body.Moon, obs, 0, date, 1);
    if (moonTransit) {
        events.push({
            id: 'moon-transit',
            type: 'transit',
            object: 'Luna',
            time: moonTransit.time.toDate(),
            description: 'La Luna alcanza su punto más alto',
            visible: true,
            altitude: calculateAltitude(Astronomy.Body.Moon, moonTransit.time.toDate(), observer),
            icon: '🌕'
        });
    }

    // Puesta de la Luna
    const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, 0, date, -1);
    if (moonset) {
        events.push({
            id: 'moonset',
            type: 'set',
            object: 'Luna',
            time: moonset.toDate(),
            description: 'Puesta de la Luna',
            visible: true,
            altitude: 0,
            icon: '🌘'
        });
    }

    // Fase lunar
    const phase = Astronomy.MoonPhase(date);
    const phaseName = getMoonPhaseName(phase);
    events.push({
        id: 'moon-phase',
        type: 'phase',
        object: 'Luna',
        time: date,
        description: `Fase: ${phaseName} (${phase.toFixed(0)}°)`,
        visible: true,
        icon: getMoonPhaseIcon(phase)
    });

    return events;
}

/**
 * Eventos planetarios (salida, puesta, tránsito)
 */
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
        // Salida
        const rise = Astronomy.SearchRiseSet(body, obs, 0, date, 1);
        if (rise) {
            const alt = calculateAltitude(body, rise.toDate(), observer);
            events.push({
                id: `${name.toLowerCase()}-rise`,
                type: 'rise',
                object: name,
                time: rise.toDate(),
                description: `${name} sale por el horizonte ${alt > 0 ? 'Este' : 'Oeste'}`,
                visible: alt > 0,
                altitude: 0,
                icon
            });
        }

        // Tránsito
        const transit = Astronomy.SearchHourAngle(body, obs, 0, date, 1);
        if (transit) {
            const alt = calculateAltitude(body, transit.time.toDate(), observer);
            events.push({
                id: `${name.toLowerCase()}-transit`,
                type: 'transit',
                object: name,
                time: transit.time.toDate(),
                description: `${name} alcanza su punto más alto (${alt.toFixed(1)}°)`,
                visible: alt > 0,
                altitude: alt,
                icon
            });
        }

        // Puesta
        const set = Astronomy.SearchRiseSet(body, obs, 0, date, -1);
        if (set) {
            events.push({
                id: `${name.toLowerCase()}-set`,
                type: 'set',
                object: name,
                time: set.toDate(),
                description: `${name} se pone por el horizonte`,
                visible: true,
                altitude: 0,
                icon
            });
        }
    });

    return events;
}

/**
 * Eventos de lluvia de meteoros
 */
function getMeteorShowerEvents(date: Date): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    
    // Importar dinámicamente para evitar circular dependency
    import('@/data/meteorShowers').then(({ getActiveShowers, getShowerActivity }) => {
        const activeShowers = getActiveShowers(date);
        activeShowers.forEach(shower => {
            const activity = getShowerActivity(shower, date);
            if (activity > 0.3) {
                events.push({
                    id: `shower-${shower.id}`,
                    type: 'shower',
                    object: shower.name,
                    time: date,
                    description: `${shower.name} activa — THZ: ${Math.round(shower.thz * activity)}`,
                    visible: true,
                    icon: '☄️'
                });
            }
        });
    });

    return events;
}

/**
 * Calcula la altitud de un cuerpo en un momento dado
 */
function calculateAltitude(body: Astronomy.Body, date: Date, observer: Observer): number {
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const equ = Astronomy.Equator(body, date, obs, true, true);
    const hor = Astronomy.Horizon(date, obs, equ.ra, equ.dec, 'normal');
    return hor.altitude;
}

/**
 * Calcula el acimut de un cuerpo en un momento dado
 */
function calculateAzimuth(body: Astronomy.Body, date: Date, observer: Observer): number {
    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
    const equ = Astronomy.Equator(body, date, obs, true, true);
    const hor = Astronomy.Horizon(date, obs, equ.ra, equ.dec, 'normal');
    return hor.azimuth;
}

/**
 * Obtiene el nombre de la fase lunar
 */
function getMoonPhaseName(phase: number): string {
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

/**
 * Obtiene el icono de la fase lunar
 */
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

/**
 * Obtiene los mejores eventos para observar (visibles y de noche)
 */
export function getBestViewingEvents(date: Date, observer: Observer): CelestialEvent[] {
    const allEvents = getDailyEvents(date, observer);
    const hour = date.getHours();
    const isNight = hour >= 20 || hour <= 6;

    return allEvents
        .filter(event => event.visible && event.type !== 'rise' && event.type !== 'set')
        .filter(event => {
            if (event.type === 'shower') return isNight;
            if (event.object === 'Sol') return false; // No mostrar eventos solares de noche
            return true;
        })
        .slice(0, 10); // Top 10 eventos
}

/**
 * Formato de hora para UI
 */
export function formatEventTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}
