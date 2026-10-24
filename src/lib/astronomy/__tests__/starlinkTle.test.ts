import { describe, expect, it } from 'vitest';
import { limitTleCatalog } from '@/lib/astronomy/starlinkTle';

describe('Starlink TLE catalog', () => {
    it('keeps complete real records and applies the rendering cap', () => {
        const record = (id: string) => `STARLINK-${id}\n1 ${id.padEnd(5, '0')}U 19074B   26295.9  .0001  00000+0  10000-3 0  9991\n2 ${id.padEnd(5, '0')}  53.1 100.0 0001000 100.0 200.0 15.50000000`;
        const result = limitTleCatalog([record('1'), record('2'), record('3')].join('\n'), 2);
        expect(result.split('\n').filter(Boolean)).toHaveLength(6);
        expect(result).toContain('STARLINK-1');
        expect(result).not.toContain('STARLINK-3');
    });

    it('rejects malformed provider responses', () => {
        expect(() => limitTleCatalog('<html>error</html>')).toThrow(/valid/);
    });
});
