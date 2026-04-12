import { describe, it, expect } from 'vitest';
import { COMETS, getCometPosition, getCometMagnitude, getActiveComets } from '../comets';

describe('COMETS catalog', () => {
    it('has at least 10 entries', () => {
        expect(COMETS.length).toBeGreaterThanOrEqual(10);
    });

    it('every comet has required fields', () => {
        for (const c of COMETS) {
            expect(typeof c.id).toBe('string');
            expect(c.id.length).toBeGreaterThan(0);
            expect(typeof c.name).toBe('string');
            expect(typeof c.eccentricity).toBe('number');
            expect(c.eccentricity).toBeGreaterThan(0);
            expect(typeof c.perihelion).toBe('number');
            expect(c.perihelion).toBeGreaterThan(0);
            expect(typeof c.color).toBe('string');
            expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it('includes Halley and Encke', () => {
        expect(COMETS.some(c => c.id === '1P')).toBe(true);
        expect(COMETS.some(c => c.id === '2P')).toBe(true);
    });

    it('includes 12P/Pons-Brooks (added in audit)', () => {
        expect(COMETS.some(c => c.id === '12P')).toBe(true);
    });
});

describe('getCometPosition', () => {
    const date = new Date('2024-10-09T00:00:00Z');

    it('returns RA in [0, 360)', () => {
        for (const c of COMETS) {
            const { ra } = getCometPosition(c, date);
            expect(ra).toBeGreaterThanOrEqual(0);
            expect(ra).toBeLessThan(360);
        }
    });

    it('returns Dec in [-90, 90]', () => {
        for (const c of COMETS) {
            const { dec } = getCometPosition(c, date);
            expect(dec).toBeGreaterThanOrEqual(-90);
            expect(dec).toBeLessThanOrEqual(90);
        }
    });

    it('returns positive distance in AU', () => {
        for (const c of COMETS) {
            const { distance } = getCometPosition(c, date);
            expect(distance).toBeGreaterThan(0);
        }
    });

    it('uses Kepler solver for comets with orbital elements', () => {
        const encke = COMETS.find(c => c.id === '2P')!;
        expect(encke.elements).toBeDefined();
        // With elements, distance should be physical (not far > 1000 AU)
        const { distance } = getCometPosition(encke, date);
        expect(distance).toBeLessThan(20);
    });

    it('is deterministic — same date, same result', () => {
        const c = COMETS[0];
        const r1 = getCometPosition(c, date);
        const r2 = getCometPosition(c, date);
        expect(r1.ra).toBe(r2.ra);
        expect(r1.dec).toBe(r2.dec);
    });
});

describe('getCometMagnitude', () => {
    const date = new Date('2024-01-01T00:00:00Z');

    it('returns a number for all comets', () => {
        for (const c of COMETS) {
            const m = getCometMagnitude(c, date);
            expect(typeof m).toBe('number');
            expect(Number.isFinite(m)).toBe(true);
        }
    });

    it('caps at 15 (visibility limit)', () => {
        for (const c of COMETS) {
            expect(getCometMagnitude(c, date)).toBeLessThanOrEqual(15);
        }
    });
});

describe('getActiveComets', () => {
    it('returns only active comets', () => {
        const active = getActiveComets();
        expect(active.every(c => c.active)).toBe(true);
    });

    it('returns at least one active comet', () => {
        expect(getActiveComets().length).toBeGreaterThan(0);
    });
});
