import { describe, expect, it } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { buildOrbitPath, heliocentricEclipticPosition, interplanetaryDistanceAu, lightTimeMinutes, projectEarthMoon, projectGalileanMoons, scaleSolarDistance } from '../solarSystemOrbits';

describe('solar system orbit model', () => {
    it('returns physical heliocentric distances in AU', () => {
        const date = new Date('2026-01-01T00:00:00Z');
        expect(heliocentricEclipticPosition(Astronomy.Body.Earth, date).distanceAu).toBeGreaterThan(0.98);
        const neptune = heliocentricEclipticPosition(Astronomy.Body.Neptune, date).distanceAu;
        expect(neptune).toBeGreaterThan(29);
        expect(neptune).toBeLessThan(31);
    });

    it('preserves Mercury eccentricity instead of drawing a circle', () => {
        const distances = buildOrbitPath(Astronomy.Body.Mercury, 87.969, 90).map((point) => point.distanceAu);
        expect(Math.max(...distances) - Math.min(...distances)).toBeGreaterThan(0.14);
    });

    it('separates physical and educational scale', () => {
        expect(scaleSolarDistance(15.5, 100, 'physical', 31)).toBeCloseTo(50, 6);
        expect(scaleSolarDistance(1, 100, 'educational', 31)).toBeGreaterThan(scaleSolarDistance(1, 100, 'physical', 31));
    });

    it('calculates real Earth-target distance and light time', () => {
        const distance = interplanetaryDistanceAu(Astronomy.Body.Mars, new Date('2026-01-01T00:00:00Z'));
        expect(distance).toBeGreaterThan(0.3);
        expect(distance).toBeLessThan(2.7);
        expect(lightTimeMinutes(1)).toBeCloseTo(8.3167, 3);
    });
});

describe('sistema Tierra-Luna', () => {
    it('mantiene distancia y fase dentro de rangos físicos', () => {
        const moon = projectEarthMoon(new Date('2026-10-23T00:00:00Z'));
        expect(moon.distanceEarthRadii).toBeGreaterThan(55);
        expect(moon.distanceEarthRadii).toBeLessThan(64);
        expect(moon.illuminatedFraction).toBeGreaterThanOrEqual(0);
        expect(moon.illuminatedFraction).toBeLessThanOrEqual(1);
        expect(Math.hypot(moon.xEarthRadii, moon.yEarthRadii, moon.zEarthRadii)).toBeCloseTo(moon.distanceEarthRadii, 8);
    });
});

describe('lunas galileanas', () => {
    it('proyecta las cuatro lunas con distancias orbitales físicas plausibles', () => {
        const moons = projectGalileanMoons(new Date('2026-10-23T00:00:00Z'));
        expect(moons.map((moon) => moon.name)).toEqual(['Io', 'Europa', 'Ganímedes', 'Calisto']);
        expect(moons[0].orbitalDistanceJupiterRadii).toBeGreaterThan(5);
        expect(moons[0].orbitalDistanceJupiterRadii).toBeLessThan(7);
        expect(moons[3].orbitalDistanceJupiterRadii).toBeGreaterThan(24);
        expect(moons[3].orbitalDistanceJupiterRadii).toBeLessThan(28);
        moons.forEach((moon) => {
            expect(Number.isFinite(moon.xJupiterRadii)).toBe(true);
            expect(Number.isFinite(moon.yJupiterRadii)).toBe(true);
            expect(['free', 'transit', 'occulted']).toContain(moon.phenomenon);
            if (moon.shadow) {
                expect(Math.hypot(moon.shadow.xJupiterRadii, moon.shadow.yJupiterRadii)).toBeLessThanOrEqual(1.000001);
            }
        });
    });

    it('encuentra sombras geométricas sobre el disco a lo largo de una órbita de Io', () => {
        let shadowFound = false;
        const start = Date.parse('2026-10-23T00:00:00Z');
        for (let hours = 0; hours <= 48; hours += 2) {
            if (projectGalileanMoons(new Date(start + hours * 3_600_000)).some((moon) => moon.shadow)) {
                shadowFound = true;
                break;
            }
        }
        expect(shadowFound).toBe(true);
    });
});
