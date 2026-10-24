import { describe, expect, it } from 'vitest';
import { parseSesame } from '@/lib/astronomy/sesameParser';

describe('CDS Sesame parser', () => {
    it('parses a real M31-style response', () => {
        const result = parseSesame(`# M31\n#=Sc=Simbad\n%C.0 AGN\n%J 10.68470833 +41.26875000 = 00 42\n%M.V 3.44 [0.03]\n%I.0 M  31\n`);
        expect(result).toEqual({ name: 'M  31', ra: 10.68470833, dec: 41.26875, type: 'AGN', mag: 3.44, source: 'SIMBAD' });
    });

    it('returns null when no position was resolved', () => {
        expect(parseSesame('# object not found')).toBeNull();
    });
});
