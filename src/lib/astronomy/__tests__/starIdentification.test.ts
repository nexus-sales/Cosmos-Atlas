import { describe, expect, it } from 'vitest';
import { angularSeparationDeg, findNamedStarNear } from '../starIdentification';
import type { Star } from '@/types/celestial';

const stars: Star[] = [
    { name: 'Vega', ra: 279.234, dec: 38.783, mag: 0.03, constellation: 'Lyra', desc: '', color: '#fff', baseSize: 1 },
    { name: 'Lyr-St1', ra: 279.25, dec: 38.79, mag: 4.5, constellation: 'Lyr', desc: '', color: '#fff', baseSize: 1 },
];

describe('identificación cruzada de estrellas', () => {
    it('encuentra una estrella nominal pese al redondeo de coordenadas', () => {
        expect(findNamedStarNear({ ra: 279.235, dec: 38.782 }, stars)?.name).toBe('Vega');
    });

    it('no presenta los puntos guía como estrellas reales con nombre', () => {
        expect(findNamedStarNear({ ra: 279.25, dec: 38.79 }, [stars[1]])).toBeNull();
    });

    it('maneja correctamente el cruce de ascensión recta 0/360', () => {
        expect(angularSeparationDeg({ ra: 359.99, dec: 0 }, { ra: 0.01, dec: 0 })).toBeCloseTo(0.02, 5);
    });
});
