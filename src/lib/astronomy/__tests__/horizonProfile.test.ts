import { describe, expect, it } from 'vitest';
import { buildHorizonBands, buildHorizonProfile, destinationPoint, horizonAltitudeAtAzimuth } from '../horizonProfile';

describe('terrain horizon profile', () => {
    it('projects a destination north without shifting longitude materially', () => {
        const point = destinationPoint(28.47, -16.3, 0, 10);
        expect(point.lat).toBeGreaterThan(28.55);
        expect(point.lon).toBeCloseTo(-16.3, 3);
    });

    it('keeps the highest obstruction for each azimuth', () => {
        const profile = buildHorizonProfile(100, [
            { azimuth: 90, distanceKm: 1, elevationM: 150 },
            { azimuth: 90, distanceKm: 2, elevationM: 500 },
            { azimuth: 180, distanceKm: 2, elevationM: 0 },
        ]);
        expect(profile).toHaveLength(2);
        expect(profile[0].azimuth).toBe(90);
        expect(profile[0].altitude).toBeGreaterThan(10);
        expect(profile[1]).toEqual({ azimuth: 180, altitude: 0 });
    });

    it('interpolates altitude and wraps through north', () => {
        const profile = [
            { azimuth: 0, altitude: 4 },
            { azimuth: 10, altitude: 8 },
            { azimuth: 350, altitude: 2 },
        ];
        expect(horizonAltitudeAtAzimuth(profile, 5)).toBeCloseTo(6);
        expect(horizonAltitudeAtAzimuth(profile, 355)).toBeCloseTo(3);
    });

    it('separates terrain samples into non-overlapping distance bands', () => {
        const bands = buildHorizonBands(100, [
            { azimuth: 0, distanceKm: 1, elevationM: 200 },
            { azimuth: 0, distanceKm: 4, elevationM: 400 },
            { azimuth: 0, distanceKm: 16, elevationM: 800 },
        ], [2, 8, 32]);
        expect(bands.map((band) => band.maxDistanceKm)).toEqual([2, 8, 32]);
        expect(bands.every((band) => band.profile.length === 1)).toBe(true);
        expect(bands[0].profile[0].altitude).not.toBe(bands[1].profile[0].altitude);
    });
});
