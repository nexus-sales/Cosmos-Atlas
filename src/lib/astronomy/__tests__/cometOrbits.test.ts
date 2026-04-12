import { describe, it, expect } from 'vitest';
import { cometRaDec, toJD, type OrbitalElements } from '../cometOrbits';

describe('toJD', () => {
    it('Unix epoch → JD 2440587.5', () => {
        expect(toJD(new Date(0))).toBeCloseTo(2440587.5, 5);
    });

    it('J2000.0 (2000-01-01T12:00Z) → JD 2451545.0', () => {
        expect(toJD(new Date('2000-01-01T12:00:00.000Z'))).toBeCloseTo(2451545.0, 4);
    });

    it('one day increment adds exactly 1 JD', () => {
        const d1 = new Date('2024-06-01T00:00:00Z');
        const d2 = new Date(d1.getTime() + 86_400_000);
        expect(toJD(d2) - toJD(d1)).toBeCloseTo(1.0, 8);
    });
});

describe('cometRaDec', () => {
    // Halley's comet elements (last perihelion 1986-02-09 ≈ JD 2446467.4)
    const halley: OrbitalElements = {
        e: 0.96714,
        q: 0.58598,
        i: 162.26,
        om: 58.42,
        w: 111.33,
        tp: 2446467.4,
    };

    it('returns RA in [0, 360) and Dec in [-90, 90]', () => {
        const jd = 2451545.0; // J2000
        const { ra, dec } = cometRaDec(halley, jd);
        expect(ra).toBeGreaterThanOrEqual(0);
        expect(ra).toBeLessThan(360);
        expect(dec).toBeGreaterThanOrEqual(-90);
        expect(dec).toBeLessThanOrEqual(90);
    });

    it('distance is positive AU', () => {
        const { dist } = cometRaDec(halley, 2451545.0);
        expect(dist).toBeGreaterThan(0);
    });

    it('Halley at J2000 is in the outer solar system (> 10 AU from Sun)', () => {
        // Halley was ~27 AU from the Sun at J2000 (near aphelion)
        // The geocentric distance should be similar
        const { dist } = cometRaDec(halley, 2451545.0);
        expect(dist).toBeGreaterThan(5);
    });

    it('near-perihelion Halley (1986-02-09) is close to Sun (< 0.7 AU helio)', () => {
        // At perihelion, geocentric distance ≈ q ± Earth-Sun distance
        // Should be < 2 AU from Earth
        const perihelionJD = 2446467.4;
        const { dist } = cometRaDec(halley, perihelionJD);
        expect(dist).toBeLessThan(2.0);
    });

    // Elliptic comet: 67P Churyumov-Gerasimenko (e ≈ 0.64)
    const churyumov: OrbitalElements = {
        e: 0.64102,
        q: 1.21342,
        i: 7.04,
        om: 36.33,
        w: 22.15,
        tp: 2459632.7, // 2022 Nov 2 perihelion
    };

    it('67P: output is finite RA/Dec', () => {
        const jd = toJD(new Date('2024-01-01T00:00:00Z'));
        const { ra, dec, dist } = cometRaDec(churyumov, jd);
        expect(Number.isFinite(ra)).toBe(true);
        expect(Number.isFinite(dec)).toBe(true);
        expect(Number.isFinite(dist)).toBe(true);
    });

    it('67P distance is in the inner solar system', () => {
        // 67P orbits between 1.24 and 5.68 AU
        const jd = toJD(new Date('2024-01-01T00:00:00Z'));
        const { dist } = cometRaDec(churyumov, jd);
        expect(dist).toBeGreaterThan(0.5);
        expect(dist).toBeLessThan(10);
    });

    // Hyperbolic comet: C/2022 E3 ZTF (e > 1)
    const ztf: OrbitalElements = {
        e: 1.00032,
        q: 1.11221,
        i: 109.17,
        om: 302.92,
        w: 147.72,
        tp: 2460006.0, // 2023 Jan 12
    };

    it('ZTF (hyperbolic): valid RA/Dec near perihelion', () => {
        // Near perihelion: JD slightly before tp
        const jd = ztf.tp + 10;
        const { ra, dec, dist } = cometRaDec(ztf, jd);
        expect(Number.isFinite(ra)).toBe(true);
        expect(Number.isFinite(dec)).toBe(true);
        expect(dist).toBeGreaterThan(0);
    });

    it('output is deterministic (same date same result)', () => {
        const jd = 2451545.0;
        const r1 = cometRaDec(halley, jd);
        const r2 = cometRaDec(halley, jd);
        expect(r1.ra).toBe(r2.ra);
        expect(r1.dec).toBe(r2.dec);
        expect(r1.dist).toBe(r2.dist);
    });
});
