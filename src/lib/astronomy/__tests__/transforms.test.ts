import { describe, it, expect } from 'vitest';
import { equatorialTo3D, equatorialToHorizontal3D, applyRefraction, equToHor } from '../transforms';
import { getLST } from '../time';

describe('equatorialTo3D', () => {
    it('North Pole (dec=90) maps to +Y axis', () => {
        const [x, y, z] = equatorialTo3D(0, 90, 1);
        expect(y).toBeCloseTo(1, 5);
        expect(Math.abs(x)).toBeLessThan(1e-5);
        expect(Math.abs(z)).toBeLessThan(1e-5);
    });

    it('South Pole (dec=-90) maps to -Y axis', () => {
        const [x, y, z] = equatorialTo3D(0, -90, 1);
        expect(y).toBeCloseTo(-1, 5);
        expect(Math.abs(x)).toBeLessThan(1e-5);
        expect(Math.abs(z)).toBeLessThan(1e-5);
    });

    it('output vector has correct magnitude equal to radius', () => {
        for (const [ra, dec, r] of [
            [83.82, -5.39, 94],
            [10.68, 41.27, 96],
            [0, 0, 1],
        ]) {
            const [x, y, z] = equatorialTo3D(ra, dec, r);
            const mag = Math.sqrt(x * x + y * y + z * z);
            expect(mag).toBeCloseTo(r, 4);
        }
    });

    it('equator (dec=0) has y=0', () => {
        const [, y] = equatorialTo3D(90, 0, 1);
        expect(Math.abs(y)).toBeLessThan(1e-10);
    });

    it('scales correctly with radius', () => {
        const [x1, y1, z1] = equatorialTo3D(45, 30, 1);
        const [x2, y2, z2] = equatorialTo3D(45, 30, 100);
        expect(x2).toBeCloseTo(x1 * 100, 4);
        expect(y2).toBeCloseTo(y1 * 100, 4);
        expect(z2).toBeCloseTo(z1 * 100, 4);
    });
});

describe('applyRefraction', () => {
    it('below horizon threshold returns altitude unchanged', () => {
        expect(applyRefraction(-6)).toBe(-6);
        expect(applyRefraction(-10)).toBe(-10);
    });

    it('adds positive correction near horizon', () => {
        const apparent = applyRefraction(0);
        expect(apparent).toBeGreaterThan(0);
        expect(apparent).toBeLessThan(1.5);
    });

    it('correction decreases with altitude', () => {
        const low = applyRefraction(5) - 5;
        const high = applyRefraction(45) - 45;
        expect(low).toBeGreaterThan(high);
    });

    it('at 90 degrees (zenith) correction is near zero', () => {
        const correction = applyRefraction(90) - 90;
        expect(correction).toBeLessThan(0.01);
    });
});

describe('equToHor', () => {
    it('keeps Polaris at an altitude close to observer latitude in the northern hemisphere', () => {
        const date = new Date('2026-04-16T22:00:00Z');

        for (const lat of [28.3, 40.4, 51.5]) {
            const { alt } = equToHor(37.954, 89.264, lat, -16.3, date);
            expect(alt).toBeGreaterThan(lat - 1.5);
            expect(alt).toBeLessThan(lat + 1.5);
        }
    });

    it('places Polaris near the horizon at the equator', () => {
        const date = new Date('2026-04-16T22:00:00Z');
        const { alt } = equToHor(37.954, 89.264, 0, -16.3, date);
        expect(alt).toBeGreaterThan(-1);
        expect(alt).toBeLessThan(2);
    });

    it('places Polaris below the horizon in Argentina', () => {
        const date = new Date('2026-04-16T22:00:00Z');
        const { alt } = equToHor(37.954, 89.264, -34.6, -58.4, date);
        expect(alt).toBeGreaterThan(-36.5);
        expect(alt).toBeLessThan(-32.5);
    });
});

describe('equatorialToHorizontal3D', () => {
    function worldToAltAz(x: number, y: number, z: number) {
        return {
            alt: Math.asin(y / Math.hypot(x, y, z)) * 180 / Math.PI,
            az: (Math.atan2(x, -z) * 180 / Math.PI + 360) % 360,
        };
    }

    function azDiff(a: number, b: number) {
        return Math.abs(((a - b + 540) % 360) - 180);
    }

    it('matches astronomical Alt/Az in Canarias, Galway, and Argentina', () => {
        const date = new Date('2026-05-10T22:00:00Z');
        const observers = [
            { lat: 28.3, lon: -16.3 },
            { lat: 53.27, lon: -9.05 },
            { lat: -34.6, lon: -58.4 },
        ];
        const objects = [
            { ra: 37.954, dec: 89.264 },
            { ra: 83.822, dec: -5.391 },
            { ra: 201.298, dec: -11.161 },
            { ra: 219.9, dec: -60.8 },
        ];

        for (const observer of observers) {
            const lst = getLST(date, observer.lon);
            for (const object of objects) {
                const [x, y, z] = equatorialToHorizontal3D(object.ra, object.dec, observer.lat, lst, 1);
                const got = worldToAltAz(x, y, z);
                const expected = equToHor(object.ra, object.dec, observer.lat, observer.lon, date);

                expect(Math.abs(got.alt - expected.alt)).toBeLessThan(0.8);
                expect(azDiff(got.az, expected.az)).toBeLessThan(0.6);
            }
        }
    });
});
