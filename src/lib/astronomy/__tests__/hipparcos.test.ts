import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseHipparcos } from '../hipparcos';

describe('Hipparcos coordinate units', () => {
    it('keeps all shipped coordinates in the degree domain', () => {
        const bytes = readFileSync('public/hipparcos.bin');
        const stars = parseHipparcos(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        expect(stars.length).toBeGreaterThan(14000);
        expect(stars.every(star => star.ra >= 0 && star.ra < 360 && Math.abs(star.dec) <= 90)).toBe(true);
        expect(new Set(stars.map(star => star.hip)).size).toBe(stars.length);
    });
    it('rejects the old double conversion from degrees to degrees', () => {
        const bytes = new ArrayBuffer(24);
        const view = new DataView(bytes);
        view.setUint32(0, 1, true);
        view.setFloat32(8, 5803.3, true);
        view.setFloat32(12, -957.7, true);
        expect(() => parseHipparcos(bytes)).toThrow('Invalid Hipparcos');
    });
});
