import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ngcToDSO, parseNGC } from '../ngc';

describe('OpenNGC binary', () => {
    it('preserves identities, V magnitudes and globular classification', () => {
        const bytes = readFileSync('public/ngc.bin');
        const objects = parseNGC(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        expect(objects.length).toBe(3987);
        expect(new Set(objects.map(obj => obj.id)).size).toBe(objects.length);
        const m13 = objects.find(obj => obj.id === 'NGC 6205')!;
        expect(m13.type).toBe(3);
        expect(m13.mag).toBeCloseTo(5.8, 1);
        expect(ngcToDSO(m13).type).toBe('cluster');
        expect(objects.some(obj => obj.id.startsWith('IC '))).toBe(true);
        expect(objects.every((obj, i) => i === 0 || obj.mag >= objects[i - 1].mag)).toBe(true);
    });
    it('keeps anonymous legacy records anonymous', () => {
        const bytes = new ArrayBuffer(24);
        new DataView(bytes).setUint32(0, 1, true);
        expect(parseNGC(bytes)[0].id).toBe('Catalog row 1');
    });
    it('rejects truncated records', () => {
        expect(() => parseNGC(new ArrayBuffer(3))).toThrow();
        const bytes = new ArrayBuffer(4);
        new DataView(bytes).setUint32(0, 1, true);
        expect(() => parseNGC(bytes)).toThrow();
    });
});
