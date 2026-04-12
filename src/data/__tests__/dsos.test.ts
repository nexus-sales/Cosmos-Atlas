import { describe, it, expect } from 'vitest';
import { DSOS } from '../dsos';

describe('DSOS catalog', () => {
    it('has at least 100 objects (expanded catalog)', () => {
        expect(DSOS.length).toBeGreaterThanOrEqual(100);
    });

    it('every DSO has required fields with valid values', () => {
        for (const d of DSOS) {
            expect(typeof d.id).toBe('string');
            expect(d.id.length).toBeGreaterThan(0);
            expect(typeof d.ra).toBe('number');
            expect(d.ra).toBeGreaterThanOrEqual(0);
            expect(d.ra).toBeLessThan(360);
            expect(typeof d.dec).toBe('number');
            expect(d.dec).toBeGreaterThanOrEqual(-90);
            expect(d.dec).toBeLessThanOrEqual(90);
            expect(['galaxy', 'nebula', 'cluster']).toContain(d.type);
            expect(d.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(d.kind).toBe('dso');
        }
    });

    it('all Messier objects M1-M110 are present (excluding M40, M73)', () => {
        const EXCLUDED = new Set(['M40', 'M73']); // asterisms
        for (let i = 1; i <= 110; i++) {
            const id = `M${i}`;
            if (EXCLUDED.has(id)) continue;
            expect(DSOS.some(d => d.id === id), `Missing ${id}`).toBe(true);
        }
    });

    it('includes notable NGCs', () => {
        const expected = ['NGC869', 'NGC884', 'NGC104', 'NGC5139', 'NGC253', 'NGC5128'];
        for (const id of expected) {
            expect(DSOS.some(d => d.id === id), `Missing ${id}`).toBe(true);
        }
    });

    it('no duplicate IDs', () => {
        const ids = DSOS.map(d => d.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('sizeArcmin is positive when present', () => {
        for (const d of DSOS) {
            if (d.sizeArcmin !== undefined) {
                expect(d.sizeArcmin).toBeGreaterThan(0);
            }
        }
    });
});
