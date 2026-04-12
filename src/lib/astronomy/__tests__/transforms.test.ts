import { describe, it, expect } from 'vitest';
import { equatorialTo3D, applyRefraction } from '../transforms';

// Three.js is a real dependency — transforms.ts uses it for precession
// but equatorialTo3D is pure math we can test directly.

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
            [83.82, -5.39, 94],   // Orion Nebula direction
            [10.68, 41.27, 96],   // Andromeda direction
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
        expect(applyRefraction(-3)).toBe(-3);
        expect(applyRefraction(-10)).toBe(-10);
    });

    it('adds positive correction near horizon', () => {
        const apparent = applyRefraction(0);
        // At horizon, refraction ≈ 0.58° (about 34.5 arcmin)
        expect(apparent).toBeGreaterThan(0);
        expect(apparent).toBeLessThan(1.5);
    });

    it('correction decreases with altitude', () => {
        const low  = applyRefraction(5)  - 5;
        const high = applyRefraction(45) - 45;
        expect(low).toBeGreaterThan(high);
    });

    it('at 90° (zenith) correction is near zero', () => {
        const correction = applyRefraction(90) - 90;
        expect(correction).toBeLessThan(0.01);
    });
});
