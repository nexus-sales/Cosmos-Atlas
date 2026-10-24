import { describe, expect, it } from 'vitest';
import { lunarSkyGlow, ocularExposureTarget } from '../skyBrightness';

describe('sky brightness', () => {
    it('does not add lunar glow while the Moon is below the horizon', () => {
        expect(lunarSkyGlow(-10, 1)).toBe(0);
    });

    it('makes a full high Moon brighter than a crescent', () => {
        expect(lunarSkyGlow(45, 1)).toBeGreaterThan(lunarSkyGlow(45, 0.15));
    });

    it('adapts further in a dark moonless sky than by day or in a city', () => {
        const dark = ocularExposureTarget(-25, -20, 0, 1);
        const day = ocularExposureTarget(20, 30, 1, 1);
        const city = ocularExposureTarget(-25, -20, 0, 9);
        expect(dark).toBeGreaterThan(day);
        expect(dark).toBeGreaterThan(city);
        expect(dark).toBeCloseTo(1.14, 10);
    });
});
