import { describe, it, expect } from 'vitest';
import { toRad, toDeg, julianDate, gmstDeg, getLST } from '../time';

describe('toRad / toDeg', () => {
    it('converts 0 degrees to 0 radians', () => {
        expect(toRad(0)).toBe(0);
    });

    it('converts 180 degrees to π radians', () => {
        expect(toRad(180)).toBeCloseTo(Math.PI, 10);
    });

    it('converts 360 degrees to 2π radians', () => {
        expect(toRad(360)).toBeCloseTo(2 * Math.PI, 10);
    });

    it('toRad and toDeg are inverses', () => {
        for (const deg of [-90, 0, 45, 90, 180, 270, 360]) {
            expect(toDeg(toRad(deg))).toBeCloseTo(deg, 10);
        }
    });
});

describe('julianDate', () => {
    it('J2000.0 epoch: 2000-01-01 12:00 UTC → JD 2451545.0', () => {
        // J2000.0 = 2000-01-01T12:00:00Z
        const j2000 = new Date('2000-01-01T12:00:00.000Z');
        expect(julianDate(j2000)).toBeCloseTo(2451545.0, 4);
    });

    it('Unix epoch 1970-01-01T00:00:00Z → JD 2440587.5', () => {
        const unix0 = new Date(0);
        expect(julianDate(unix0)).toBeCloseTo(2440587.5, 4);
    });

    it('monotonically increases with time', () => {
        const d1 = new Date('2020-01-01T00:00:00Z');
        const d2 = new Date('2020-01-02T00:00:00Z');
        expect(julianDate(d2) - julianDate(d1)).toBeCloseTo(1.0, 6);
    });
});

describe('gmstDeg', () => {
    it('returns a value in [0, 360)', () => {
        const d = new Date('2024-06-15T00:00:00Z');
        const g = gmstDeg(d);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThan(360);
    });

    it('at J2000.0 GMST ≈ 280.46° (Meeus, p. 87)', () => {
        const j2000 = new Date('2000-01-01T12:00:00.000Z');
        // gmstDeg = (280.46061837 + 360.98564736629 * 0) % 360 = 280.460618...
        expect(gmstDeg(j2000)).toBeCloseTo(280.46, 1);
    });

    it('increases ~0.985 degrees extra per solar day vs full rotation', () => {
        // GMST formula: 360.98564736629 deg/day → after %360, excess is ~0.9856°
        const d1 = new Date('2024-03-20T00:00:00Z');
        const d2 = new Date(d1.getTime() + 86400_000); // +1 solar day
        const diff = ((gmstDeg(d2) - gmstDeg(d1)) + 360) % 360;
        // Earth rotates 360.985° in one solar day; after %360 → ~0.985°
        expect(diff).toBeCloseTo(0.985, 1);
    });
});

describe('getLST', () => {
    it('adds longitude offset to GMST and wraps to [0, 360)', () => {
        const d = new Date('2024-06-15T00:00:00Z');
        const gmst = gmstDeg(d);
        const lon = 45;
        const lst = getLST(d, lon);
        const expected = ((gmst + lon) % 360 + 360) % 360;
        expect(lst).toBeCloseTo(expected, 8);
    });

    it('returns value in [0, 360) for negative longitudes', () => {
        const d = new Date('2024-01-01T00:00:00Z');
        const lst = getLST(d, -180);
        expect(lst).toBeGreaterThanOrEqual(0);
        expect(lst).toBeLessThan(360);
    });
});
