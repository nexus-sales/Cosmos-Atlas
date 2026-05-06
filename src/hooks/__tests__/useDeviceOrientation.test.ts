import { describe, expect, it } from 'vitest';
import { computeRearCameraElevation, computeRearCameraHeading } from '../useDeviceOrientation';

describe('device orientation rear camera axis', () => {
    it('uses the rear camera -Z axis for heading instead of the screen +Z axis', () => {
        expect(computeRearCameraHeading(0, 90, 0)).toBeCloseTo(0, 5);
        expect(computeRearCameraHeading(180, 90, 0)).toBeCloseTo(180, 5);
    });

    it('maps rear camera elevation to down, horizon, and up poses', () => {
        expect(computeRearCameraElevation(180, 0)).toBeCloseTo(-90, 5);
        expect(computeRearCameraElevation(90, 0)).toBeCloseTo(0, 5);
        expect(computeRearCameraElevation(0, 0)).toBeCloseTo(90, 5);
    });

    it('raises visual elevation when an Android portrait device tilts upward', () => {
        expect(computeRearCameraElevation(60, 0)).toBeGreaterThan(computeRearCameraElevation(90, 0));
        expect(computeRearCameraElevation(30, 0)).toBeGreaterThan(computeRearCameraElevation(60, 0));
    });
});
