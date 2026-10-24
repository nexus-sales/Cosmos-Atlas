import * as Astronomy from 'astronomy-engine';

export type SolarScaleMode = 'physical' | 'educational';
export interface EclipticPoint { x: number; y: number; z: number; distanceAu: number }
export interface GalileanMoonProjection {
    id: 'io' | 'europa' | 'ganymede' | 'callisto';
    name: string;
    xJupiterRadii: number;
    yJupiterRadii: number;
    depthJupiterRadii: number;
    orbitalDistanceJupiterRadii: number;
    phenomenon: 'free' | 'transit' | 'occulted';
    shadow: { xJupiterRadii: number; yJupiterRadii: number } | null;
}
export interface EarthMoonProjection {
    xEarthRadii: number;
    yEarthRadii: number;
    zEarthRadii: number;
    distanceEarthRadii: number;
    phaseAngleDeg: number;
    illuminatedFraction: number;
}

const JUPITER_EQUATORIAL_RADIUS_AU = 71_492 / 149_597_870.7;
const EARTH_MEAN_RADIUS_AU = 6_371 / 149_597_870.7;

export function heliocentricEclipticPosition(body: Astronomy.Body, date: Date): EclipticPoint {
    const ecliptic = Astronomy.Ecliptic(Astronomy.HelioVector(body, date)).vec;
    return { x: ecliptic.x, y: ecliptic.y, z: ecliptic.z, distanceAu: Math.hypot(ecliptic.x, ecliptic.y, ecliptic.z) };
}

export function scaleSolarDistance(distanceAu: number, maxRadius: number, mode: SolarScaleMode, maxAu = 31): number {
    if (mode === 'physical') return (distanceAu / maxAu) * maxRadius;
    return Math.log1p((distanceAu / maxAu) * (Math.E - 1)) * maxRadius;
}

export function buildOrbitPath(body: Astronomy.Body, periodDays: number, samples = 180): EclipticPoint[] {
    const epoch = new Date('2025-01-01T12:00:00Z');
    return Array.from({ length: samples + 1 }, (_, index) => {
        const date = new Date(epoch.getTime() + (periodDays * index / samples) * 86_400_000);
        return heliocentricEclipticPosition(body, date);
    });
}

export function interplanetaryDistanceAu(body: Astronomy.Body, date: Date): number {
    if (body === Astronomy.Body.Earth) return 0;
    const earth = heliocentricEclipticPosition(Astronomy.Body.Earth, date);
    const target = heliocentricEclipticPosition(body, date);
    return Math.hypot(target.x - earth.x, target.y - earth.y, target.z - earth.z);
}

export function lightTimeMinutes(distanceAu: number): number {
    return distanceAu * 8.3167464;
}

/** Proyección sobre el cielo terrestre de las cuatro lunas galileanas. */
export function projectGalileanMoons(date: Date): GalileanMoonProjection[] {
    const jupiter = Astronomy.GeoVector(Astronomy.Body.Jupiter, date, true);
    const distanceAu = Math.hypot(jupiter.x, jupiter.y, jupiter.z);
    const observedDate = new Date(date.getTime() - (distanceAu / Astronomy.C_AUDAY) * 86_400_000);
    const moons = Astronomy.JupiterMoons(observedDate);
    const helioJupiter = Astronomy.HelioVector(Astronomy.Body.Jupiter, observedDate);
    const sunDistance = Math.hypot(helioJupiter.x, helioJupiter.y, helioJupiter.z);
    const sunward = {
        x: -helioJupiter.x / sunDistance,
        y: -helioJupiter.y / sunDistance,
        z: -helioJupiter.z / sunDistance,
    };
    const ra = Math.atan2(jupiter.y, jupiter.x);
    const dec = Math.asin(jupiter.z / distanceAu);
    const east = { x: -Math.sin(ra), y: Math.cos(ra), z: 0 };
    const north = {
        x: -Math.cos(ra) * Math.sin(dec),
        y: -Math.sin(ra) * Math.sin(dec),
        z: Math.cos(dec),
    };
    const sight = { x: jupiter.x / distanceAu, y: jupiter.y / distanceAu, z: jupiter.z / distanceAu };
    const configs = [
        { id: 'io' as const, name: 'Io', vector: moons.io },
        { id: 'europa' as const, name: 'Europa', vector: moons.europa },
        { id: 'ganymede' as const, name: 'Ganímedes', vector: moons.ganymede },
        { id: 'callisto' as const, name: 'Calisto', vector: moons.callisto },
    ];

    return configs.map(({ id, name, vector }) => {
        const xJupiterRadii = (vector.x * east.x + vector.y * east.y + vector.z * east.z) / JUPITER_EQUATORIAL_RADIUS_AU;
        const yJupiterRadii = (vector.x * north.x + vector.y * north.y + vector.z * north.z) / JUPITER_EQUATORIAL_RADIUS_AU;
        const depthJupiterRadii = (vector.x * sight.x + vector.y * sight.y + vector.z * sight.z) / JUPITER_EQUATORIAL_RADIUS_AU;
        const crossesDisc = Math.hypot(xJupiterRadii, yJupiterRadii) < 1;
        // Rayo central de la sombra: parte de la luna y continúa alejándose
        // del Sol. Júpiter se aproxima como esfera de radio ecuatorial 1 Rj.
        const moonRj = {
            x: vector.x / JUPITER_EQUATORIAL_RADIUS_AU,
            y: vector.y / JUPITER_EQUATORIAL_RADIUS_AU,
            z: vector.z / JUPITER_EQUATORIAL_RADIUS_AU,
        };
        const shadowDirection = { x: -sunward.x, y: -sunward.y, z: -sunward.z };
        const b = moonRj.x * shadowDirection.x + moonRj.y * shadowDirection.y + moonRj.z * shadowDirection.z;
        const c = moonRj.x ** 2 + moonRj.y ** 2 + moonRj.z ** 2 - 1;
        const discriminant = b * b - c;
        let shadow: GalileanMoonProjection['shadow'] = null;
        if (discriminant >= 0) {
            const roots = [-b - Math.sqrt(discriminant), -b + Math.sqrt(discriminant)].filter((root) => root >= 0);
            const distance = roots.length ? Math.min(...roots) : -1;
            if (distance >= 0) {
                const surface = {
                    x: moonRj.x + shadowDirection.x * distance,
                    y: moonRj.y + shadowDirection.y * distance,
                    z: moonRj.z + shadowDirection.z * distance,
                };
                const visibleHemisphere = surface.x * sight.x + surface.y * sight.y + surface.z * sight.z < 0;
                if (visibleHemisphere) {
                    shadow = {
                        xJupiterRadii: surface.x * east.x + surface.y * east.y + surface.z * east.z,
                        yJupiterRadii: surface.x * north.x + surface.y * north.y + surface.z * north.z,
                    };
                }
            }
        }
        return {
            id,
            name,
            xJupiterRadii,
            yJupiterRadii,
            depthJupiterRadii,
            orbitalDistanceJupiterRadii: Math.hypot(vector.x, vector.y, vector.z) / JUPITER_EQUATORIAL_RADIUS_AU,
            phenomenon: crossesDisc ? (depthJupiterRadii < 0 ? 'transit' : 'occulted') : 'free',
            shadow,
        };
    });
}

/** Posición geocéntrica de la Luna expresada en el plano eclíptico. */
export function projectEarthMoon(date: Date): EarthMoonProjection {
    const vector = Astronomy.Ecliptic(Astronomy.GeoMoon(date)).vec;
    const phaseAngleDeg = Astronomy.MoonPhase(date);
    return {
        xEarthRadii: vector.x / EARTH_MEAN_RADIUS_AU,
        yEarthRadii: vector.y / EARTH_MEAN_RADIUS_AU,
        zEarthRadii: vector.z / EARTH_MEAN_RADIUS_AU,
        distanceEarthRadii: Math.hypot(vector.x, vector.y, vector.z) / EARTH_MEAN_RADIUS_AU,
        phaseAngleDeg,
        illuminatedFraction: (1 - Math.cos(phaseAngleDeg * Math.PI / 180)) / 2,
    };
}
