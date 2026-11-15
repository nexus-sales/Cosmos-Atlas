import { describe, expect, it } from 'vitest';
import { buildTonightSummary } from '../tonightSummary';

// Tenerife.
const LAT = 28.3;
const LON = -16.3;

describe('buildTonightSummary', () => {
    it('de día da la puesta de hoy y la salida de mañana', () => {
        const noon = new Date('2026-11-15T13:00:00Z');
        const summary = buildTonightSummary(noon, LAT, LON);

        expect(summary.isNight).toBe(false);
        // Puesta en Canarias a mediados de noviembre: ~18:10 UTC.
        expect(summary.sunset!.toISOString().slice(0, 13)).toBe('2026-11-15T18');
        // Salida siguiente: ~07:25 UTC del día 16.
        expect(summary.sunrise!.toISOString().slice(0, 13)).toBe('2026-11-16T07');
        expect(summary.sunrise!.getTime()).toBeGreaterThan(summary.sunset!.getTime());
    });

    it('de noche marca isNight y la salida llega antes que la siguiente puesta', () => {
        const midnight = new Date('2026-11-16T01:00:00Z');
        const summary = buildTonightSummary(midnight, LAT, LON);

        expect(summary.isNight).toBe(true);
        expect(summary.sunrise!.getTime()).toBeLessThan(summary.sunset!.getTime());
    });

    it('devuelve fase lunar coherente y solo planetas a simple vista', () => {
        const summary = buildTonightSummary(new Date('2026-11-15T13:00:00Z'), LAT, LON);

        expect(summary.moon.phaseName.length).toBeGreaterThan(0);
        expect(summary.moon.illumination).toBeGreaterThanOrEqual(0);
        expect(summary.moon.illumination).toBeLessThanOrEqual(100);
        for (const planet of summary.planets) {
            expect(['Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno']).toContain(planet);
        }
    });

    it('no falla en latitudes sin puesta de Sol', () => {
        const summary = buildTonightSummary(new Date('2026-06-21T12:00:00Z'), 78, 15);
        expect(summary.sunset).toBeNull();
        expect(summary.planets).toEqual([]);
    });
});
