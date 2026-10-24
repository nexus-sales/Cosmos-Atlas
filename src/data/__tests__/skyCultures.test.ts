import { describe, expect, it } from 'vitest';
import { CONSTELLATIONS } from '@/data/constellations';
import { CONSTELLATION_FIGURE_PROFILES } from '@/data/constellationFigureProfiles';
import { getSkyCulture, SKY_CULTURES } from '@/data/skyCultures';

describe('sky cultures', () => {
    it('has unique ids and resolves an unknown culture safely', () => {
        expect(new Set(SKY_CULTURES.map((culture) => culture.id)).size).toBe(SKY_CULTURES.length);
        expect(getSkyCulture('unknown').id).toBe('western-iau');
    });

    it('uses only non-empty, unique asterisms with drawable paths', () => {
        for (const culture of SKY_CULTURES) {
            expect(new Set(culture.asterisms.map((asterism) => asterism.id)).size).toBe(culture.asterisms.length);
            for (const asterism of culture.asterisms) expect(asterism.starNames.length).toBeGreaterThanOrEqual(3);
        }
    });

    it('assigns a stable visual profile to all 88 constellations', () => {
        expect(Object.keys(CONSTELLATIONS)).toHaveLength(88);
        expect(Object.keys(CONSTELLATION_FIGURE_PROFILES).sort()).toEqual(Object.keys(CONSTELLATIONS).sort());
        for (const profile of Object.values(CONSTELLATION_FIGURE_PROFILES)) {
            expect(profile.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(profile.variant).toBeGreaterThanOrEqual(0);
            expect(profile.variant).toBeLessThan(4);
        }
    });
});
