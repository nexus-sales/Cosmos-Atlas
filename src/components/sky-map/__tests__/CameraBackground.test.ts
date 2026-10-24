import { describe, expect, it } from 'vitest';
import { estimateCoveredVerticalFov } from '../CameraBackground';

describe('camera overlay field of view', () => {
    it('uses the long camera axis as vertical FOV for portrait video', () => {
        expect(estimateCoveredVerticalFov(1080, 1920, 412, 915)).toBeCloseTo(70, 0);
    });

    it('uses the sensor short-axis FOV for landscape video', () => {
        const fov = estimateCoveredVerticalFov(1920, 1080, 915, 412);
        expect(fov).toBeGreaterThan(34);
        expect(fov).toBeLessThan(50);
    });

    it('accounts for vertical crop when the viewport is wider than the video', () => {
        const uncropped = estimateCoveredVerticalFov(1920, 1080, 1600, 900);
        const cropped = estimateCoveredVerticalFov(1920, 1080, 2200, 900);
        expect(cropped).toBeLessThan(uncropped);
    });
});
