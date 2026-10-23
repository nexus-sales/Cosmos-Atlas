import { describe, expect, it } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { planetBasis } from '../planetOrientation';
import { equatorialTo3D } from '../transforms';

const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: number[]) => Math.sqrt(dot(a, a));
const T = new Date('2026-10-22T20:00:00Z');

describe('planetBasis', () => {
    it.each([
        Astronomy.Body.Moon, Astronomy.Body.Mercury, Astronomy.Body.Venus, Astronomy.Body.Mars,
        Astronomy.Body.Jupiter, Astronomy.Body.Saturn, Astronomy.Body.Uranus, Astronomy.Body.Neptune,
    ])('%s: base ortonormal', (body) => {
        const b = planetBasis(body, T);
        expect(len(b.prime)).toBeCloseTo(1, 6);
        expect(len(b.north)).toBeCloseTo(1, 6);
        expect(dot(b.prime, b.north)).toBeCloseTo(0, 6);
        expect(len(b.side)).toBeCloseTo(1, 6);
    });

    it('el polo de Saturno coincide con su RA/Dec en el marco de la escena (a ~0.5° por precesión)', () => {
        const b = planetBasis(Astronomy.Body.Saturn, T);
        const axis = Astronomy.RotationAxis(Astronomy.Body.Saturn, T);
        const expected = equatorialTo3D(axis.ra * 15, axis.dec, 1);
        const angle = Math.acos(Math.min(1, dot(b.north, expected))) * 180 / Math.PI;
        expect(angle).toBeLessThan(0.5);
    });

    it('la Luna muestra su cara visible a la Tierra: el meridiano 0 apunta hacia nosotros (<10°)', () => {
        const b = planetBasis(Astronomy.Body.Moon, T);
        const m = Astronomy.GeoVector(Astronomy.Body.Moon, T, true); // EQJ, Tierra→Luna
        const rot = Astronomy.Rotation_EQJ_EQD(T);
        const r = Astronomy.RotateVector(rot, m);
        const toEarth = [-r.y, -r.z, -r.x]; // Luna→Tierra en el marco de la escena
        const c = dot(b.prime, toEarth) / len(toEarth);
        expect(Math.acos(c) * 180 / Math.PI).toBeLessThan(10);
    });

    it('cambia con el tiempo: la rotación de Júpiter avanza ~36° en 1 h', () => {
        const a = planetBasis(Astronomy.Body.Jupiter, T).prime;
        const b = planetBasis(Astronomy.Body.Jupiter, new Date(T.getTime() + 3600_000)).prime;
        const deg = Math.acos(Math.min(1, dot(a, b))) * 180 / Math.PI;
        expect(deg).toBeGreaterThan(30);
        expect(deg).toBeLessThan(42);
    });
});
