import { describe, expect, it } from 'vitest';
import {
    MAX_WIDE_FIELD_LABELS,
    MIN_LABEL_SEPARATION_DEG,
    dsoSpriteVisibility,
    dsoVisualSize,
    selectWideFieldLabelIds,
    shouldShowDsoLabel,
} from '@/lib/astronomy/dsoVisibility';
import { DSOS } from '@/data/dsos';

const M45 = { mag: 1.6 };
const DEFAULT_FOV = 60;

// Referencia anterior con dos factores dependientes de Bortle.
function legacyVisibility(mag: number, bortle: number, fov: number) {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const limitingMag = 8.8 - (bortle - 1) * 0.55 + clamp(40 / fov, 0, 2.2);
    const magVisibility = clamp((limitingMag + 0.8 - mag) / 1.6, 0, 1);
    return magVisibility * (1 + (0.15 - 1) * (bortle - 1) / 8);
}

describe('dsoSpriteVisibility', () => {
    it.each([4, 7, 9])('mantiene M45 plenamente visible a FOV 60 con Bortle %i', (bortle) => {
        expect(dsoSpriteVisibility(M45.mag, bortle, DEFAULT_FOV)).toBeGreaterThanOrEqual(0.95);
    });

    it('aplica Bortle una sola vez y permite explorar M51 con cielo urbano', () => {
        const observed = dsoSpriteVisibility(7, 6, 60);
        expect(observed).toBeGreaterThan(legacyVisibility(7, 6, 60));
        expect(dsoSpriteVisibility(8.4, 6, 30)).toBe(0);
        expect(dsoSpriteVisibility(8.4, 6, 30, false, true)).toBe(1);
        expect(dsoSpriteVisibility(8.4, 1, 30, false, true)).toBe(dsoSpriteVisibility(8.4, 9, 30, false, true));
    });

    it('nunca atenúa más que la fórmula anterior y decrece con la magnitud', () => {
        for (let bortle = 1; bortle <= 9; bortle++) {
            let previous = Infinity;
            for (let mag = 0; mag <= 12; mag += 0.25) {
                const visibility = dsoSpriteVisibility(mag, bortle, DEFAULT_FOV);
                expect(visibility).toBeGreaterThanOrEqual(legacyVisibility(mag, bortle, DEFAULT_FOV) - 1e-12);
                expect(visibility).toBeLessThanOrEqual(previous + 1e-12);
                previous = visibility;
            }
        }
    });

    it('garantiza un mínimo con hover', () => {
        expect(dsoSpriteVisibility(12, 9, DEFAULT_FOV, true)).toBe(0.35);
    });
});

describe('shouldShowDsoLabel', () => {
    it.each([4, 7, 9])('etiqueta M45 a FOV 60 con Bortle %i', (bortle) => {
        expect(shouldShowDsoLabel(M45, bortle, DEFAULT_FOV, false)).toBe(true);
    });

    it('no etiqueta un objeto de mag 12 a FOV 60', () => {
        expect(shouldShowDsoLabel({ mag: 12 }, 4, DEFAULT_FOV, false)).toBe(false);
    });

    it('conserva la regla de detalle: mag 8 con FOV 25', () => {
        expect(shouldShowDsoLabel({ mag: 8 }, 4, 25, false)).toBe(true);
        expect(shouldShowDsoLabel({ mag: 8 }, 4, DEFAULT_FOV, false)).toBe(false);
    });

    it('respeta el tope de campo amplio pero no el hover', () => {
        expect(shouldShowDsoLabel(M45, 4, DEFAULT_FOV, false, false)).toBe(false);
        expect(shouldShowDsoLabel(M45, 4, DEFAULT_FOV, true, false)).toBe(true);
    });
});

describe('selectWideFieldLabelIds', () => {
    it('limita las etiquetas del catálogo y prioriza por brillo', () => {
        const ids = selectWideFieldLabelIds(DSOS);
        expect(ids.size).toBeGreaterThan(0);
        expect(ids.size).toBeLessThanOrEqual(MAX_WIDE_FIELD_LABELS);
        expect(ids.has('M45')).toBe(true);

        // Un objeto más brillante que el más débil etiquetado solo se queda sin
        // nombre si tiene pegada otra etiqueta (regla de separación mínima).
        const labelled = DSOS.filter((dso) => ids.has(dso.id));
        const faintestLabelled = Math.max(...labelled.map((dso) => dso.mag));
        const separation = (a: { ra: number; dec: number }, b: { ra: number; dec: number }) => {
            const rad = Math.PI / 180;
            const cos = Math.sin(a.dec * rad) * Math.sin(b.dec * rad)
                + Math.cos(a.dec * rad) * Math.cos(b.dec * rad) * Math.cos((a.ra - b.ra) * rad);
            return Math.acos(Math.min(1, Math.max(-1, cos))) / rad;
        };
        for (const skipped of DSOS.filter((dso) => !ids.has(dso.id) && dso.mag < faintestLabelled)) {
            expect(labelled.some((other) => separation(skipped, other) < MIN_LABEL_SEPARATION_DEG)).toBe(true);
        }
    });
});

describe('etiquetas pegadas y bajo el horizonte', () => {
    it('solo etiqueta uno de los dos cúmulos del Cúmulo Doble de Perseo', () => {
        const pair = DSOS.filter((dso) => dso.id === 'NGC869' || dso.id === 'NGC884');
        expect(pair).toHaveLength(2);
        const ids = selectWideFieldLabelIds(DSOS);
        expect(pair.filter((dso) => ids.has(dso.id))).toHaveLength(1);
    });

    it('no nombra un objeto bajo el horizonte salvo con hover', () => {
        expect(shouldShowDsoLabel(M45, 4, DEFAULT_FOV, false, true, false)).toBe(false);
        expect(shouldShowDsoLabel({ mag: 8 }, 4, 25, false, true, false)).toBe(false);
        expect(shouldShowDsoLabel(M45, 4, DEFAULT_FOV, true, true, false)).toBe(true);
    });
});

describe('dsoVisualSize', () => {
    it('respeta el tamaño angular de M45 y M31', () => {
        const radius = 94;
        const m45Degrees = (dsoVisualSize(110, 'cluster') / radius) * (180 / Math.PI);
        expect(m45Degrees).toBeGreaterThan(1.7);
        expect(m45Degrees).toBeLessThan(1.9);
        expect(dsoVisualSize(190, 'galaxy') / radius * 180 / Math.PI).toBeCloseTo(190 / 60, 2);
        expect(dsoVisualSize(undefined, 'nebula')).toBeCloseTo(0.13672, 5);
    });
});
