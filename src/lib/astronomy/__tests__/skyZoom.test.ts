import { describe, expect, it } from 'vitest';
import { SKY_FOV_MIN, clampSkyFov, lodForFov, targetSkyFov, wheelZoomFov } from '../skyZoom';
import { DSOS } from '@/data/dsos';

describe('deep sky zoom', () => {
    it('reaches the deepest Gaia level with every quality tier', () => {
        for (const quality of ['low', 'medium', 'high'] as const) {
            expect(lodForFov(SKY_FOV_MIN, quality)?.level).toBe(3);
        }
        expect(lodForFov(SKY_FOV_MIN, 'high')?.mag).toBe(17);
        expect(lodForFov(60, 'high')).toBeNull();
    });
    it('scales wheel gestures and respects the common bounds', () => {
        expect(wheelZoomFov(30, -1)).toBeGreaterThan(wheelZoomFov(30, -100));
        expect(wheelZoomFov(30, 1)).toBeGreaterThan(30);
        expect(wheelZoomFov(30, 1, 1)).toBe(wheelZoomFov(30, 16));
        expect(clampSkyFov(0)).toBe(SKY_FOV_MIN);
        expect(clampSkyFov(100)).toBe(90);
    });
    it('frames extended objects by their angular size', () => {
        const m31 = DSOS.find(obj => obj.id === 'M31')!;
        const m13 = DSOS.find(obj => obj.id === 'M13')!;
        expect(targetSkyFov(m31)).toBeCloseTo(4 * m31.sizeArcmin! / 60);
        expect(targetSkyFov(m13)).toBe(SKY_FOV_MIN);
    });
});
