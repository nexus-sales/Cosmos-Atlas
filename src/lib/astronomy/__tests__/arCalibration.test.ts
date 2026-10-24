import { describe, expect, it } from 'vitest';
import { calibrateArToTarget, signedAngularDifference } from '../arCalibration';

describe('AR one-point calibration', () => {
    it('uses the shortest correction across north', () => {
        expect(signedAngularDifference(2, 358)).toBe(4);
        expect(signedAngularDifference(358, 2)).toBe(-4);
    });

    it('aligns the sensor optical axis with the Moon coordinates', () => {
        const result = calibrateArToTarget({
            sensorHeading: 70,
            sensorElevation: 35,
            magneticDeclination: -4,
            currentHeadingOffset: 0,
            currentElevationOffset: 0,
            targetAzimuth: 80,
            targetAltitude: 42,
        });

        expect(result.headingOffset).toBe(14);
        expect(result.elevationOffset).toBe(7);
    });

    it('refines an existing calibration instead of discarding it', () => {
        const result = calibrateArToTarget({
            sensorHeading: 100,
            sensorElevation: 30,
            magneticDeclination: 2,
            currentHeadingOffset: 10,
            currentElevationOffset: 5,
            targetAzimuth: 115,
            targetAltitude: 37,
        });

        expect(result.headingOffset).toBe(13);
        expect(result.elevationOffset).toBe(7);
    });
});
