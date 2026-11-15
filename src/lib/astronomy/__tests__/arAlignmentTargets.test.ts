import { describe, expect, it } from 'vitest';
import {
    AR_TARGET_MAX_ALTITUDE,
    AR_TARGET_MIN_ALTITUDE,
    describeTargetDirection,
    isPlausibleElevationCorrection,
    listArAlignmentTargets,
} from '../arAlignmentTargets';

// Tenerife (valor por defecto del observador).
const LAT = 28.3;
const LON = -16.3;

describe('AR alignment targets', () => {
    it('ofrece astros brillantes aunque la Luna no sirva', () => {
        // 15 nov 2026, 22:00 UTC: noche cerrada en Canarias.
        const night = new Date('2026-11-15T22:00:00Z');
        const targets = listArAlignmentTargets(night, LAT, LON);

        expect(targets.length).toBeGreaterThan(0);
        expect(targets.some((target) => target.kind !== 'moon')).toBe(true);
        for (const target of targets) {
            expect(target.altitude).toBeGreaterThanOrEqual(AR_TARGET_MIN_ALTITUDE);
            expect(target.altitude).toBeLessThanOrEqual(AR_TARGET_MAX_ALTITUDE);
        }
    });

    it('pone la Luna primero y ordena el resto por brillo', () => {
        for (let hour = 0; hour < 24 * 30; hour += 3) {
            const date = new Date(Date.UTC(2026, 10, 1, hour));
            const targets = listArAlignmentTargets(date, LAT, LON);
            const moonIndex = targets.findIndex((target) => target.kind === 'moon');
            expect(moonIndex).toBeLessThanOrEqual(0);
            const rest = targets.filter((target) => target.kind !== 'moon');
            for (let i = 1; i < rest.length; i++) {
                expect(rest[i].magnitude).toBeGreaterThanOrEqual(rest[i - 1].magnitude);
            }
        }
    });

    it('de día solo admite la Luna: ni estrellas ni planetas', () => {
        // Mediodía solar aproximado en Canarias.
        const noon = new Date('2026-11-15T13:00:00Z');
        const targets = listArAlignmentTargets(noon, LAT, LON);
        expect(targets.every((target) => target.kind === 'moon')).toBe(true);
    });

    it('describe la dirección en puntos cardinales', () => {
        expect(describeTargetDirection({ azimuth: 133, altitude: 34.4 })).toBe('SE · 34° de altura');
        expect(describeTargetDirection({ azimuth: 359, altitude: 10 })).toBe('N · 10° de altura');
    });

    it('rechaza correcciones de elevación imposibles', () => {
        expect(isPlausibleElevationCorrection(7)).toBe(true);
        expect(isPlausibleElevationCorrection(-30)).toBe(true);
        expect(isPlausibleElevationCorrection(45)).toBe(false);
    });
});
