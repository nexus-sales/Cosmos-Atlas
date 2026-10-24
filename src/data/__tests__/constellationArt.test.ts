import { describe, expect, it } from 'vitest';
import { CONSTELLATION_ART } from '@/data/constellationArt';
import { CONSTELLATIONS } from '@/data/constellations';

const ZODIAC = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpius', 'Sagittarius', 'Capricornus', 'Aquarius', 'Pisces',
] as const;

describe('constellation art', () => {
    it('cubre las doce constelaciones zodiacales', () => {
        const names = new Set(CONSTELLATION_ART.map((figure) => figure.name));
        expect(ZODIAC.every((name) => names.has(name))).toBe(true);
    });

    it('solo referencia constelaciones existentes y no duplica figuras', () => {
        const names = CONSTELLATION_ART.map((figure) => figure.name);
        expect(new Set(names).size).toBe(names.length);
        expect(names.every((name) => name in CONSTELLATIONS)).toBe(true);
    });

    it('mantiene geometría suficiente para una silueta reconocible', () => {
        for (const figure of CONSTELLATION_ART) {
            expect(figure.paths.length).toBeGreaterThanOrEqual(2);
            expect(figure.paths.every((path) => path.length >= 2)).toBe(true);
        }
    });

    it('combina figuras detalladas y sigilos para cubrir las 88 constelaciones', () => {
        const detailed = new Set(CONSTELLATION_ART.map((figure) => figure.name));
        const generated = Object.keys(CONSTELLATIONS).filter((name) => !detailed.has(name));
        expect(detailed.size).toBe(20);
        expect(detailed.size + generated.length).toBe(88);
    });
});
