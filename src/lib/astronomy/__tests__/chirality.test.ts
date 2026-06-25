/**
 * Chirality test — verifica que el azimut renderizado coincide con la verdad astronómica.
 *
 * Un espejado E/W es una isometría: conserva ángulos y separaciones, así que pasa limpio
 * todos los tests de magnitud. Este test lo detecta porque compara azimuts ABSOLUTOS contra
 * equToHor (la fuente de verdad ya testada). Un espejado produciría rendered.az ≈ 360 − truth.az.
 *
 * POR QUÉ estas estrellas: están bien separadas en azimut y lejos del polo, así que un flip
 * E/O produce errores de ~100-280°, no de fracción de grado.
 *
 * placeStarWorld replica 1:1 la pipeline de CelestialGroup en SkyCanvas.tsx:
 *   1. equatorialTo3D(ra, dec, 1)                        (mismo código)
 *   2. applyEuler(Euler(lat-90, -lst, 0, 'XYZ'))         (mismo Euler, mismo orden, mismo signo)
 * = equatorialToHorizontal3D(ra, dec, lat, getLST(date, lon), 1)
 */

import { describe, expect, it } from 'vitest';
import { equatorialToHorizontal3D, equToHor } from '../transforms';
import { getLST } from '../time';

/** Replica exacta de CelestialGroup: equatorialTo3D + Euler(lat-90, -LST, 0, XYZ) */
function placeStarWorld(
    ra: number, dec: number,
    lat: number, lon: number, date: Date,
): [number, number, number] {
    const lst = getLST(date, lon);
    return equatorialToHorizontal3D(ra, dec, lat, lst, 1);
}

/** Convención de mundo: N=−Z, E=+X, cenit=+Y — igual que SunLight y Horizon.tsx */
function worldToAltAz(x: number, y: number, z: number) {
    const mag = Math.hypot(x, y, z);
    const alt = Math.asin(y / mag) * (180 / Math.PI);
    const az  = ((Math.atan2(x, -z) * (180 / Math.PI)) + 360) % 360;
    return { alt, az };
}

/** Diferencia angular de azimut manejando el wrap 0/360 */
function azDiff(a: number, b: number): number {
    return Math.abs(((a - b + 540) % 360) - 180);
}

describe('chirality — azimut renderizado vs verdad astronómica (detecta espejado E/O)', () => {
    const date = new Date('2026-06-24T22:00:00Z');
    const lat  = 40.4;   // Madrid
    const lon  = -3.7;
    const TOL  = 0.5;    // grados — espejado produce ~180°+ de error, precesión ~0.3°

    const stars = [
        { name: 'Vega',     ra: 279.23, dec:  38.78 },
        { name: 'Arcturus', ra: 213.92, dec:  19.18 },
        { name: 'Antares',  ra: 247.35, dec: -26.43 },
    ];

    for (const star of stars) {
        it(`${star.name}: alt/az ≤ ${TOL}° de equToHor`, () => {
            const truth    = equToHor(star.ra, star.dec, lat, lon, date);
            const [wx, wy, wz] = placeStarWorld(star.ra, star.dec, lat, lon, date);
            const rendered = worldToAltAz(wx, wy, wz);

            const dAlt = Math.abs(rendered.alt - truth.alt);
            const dAz  = azDiff(rendered.az, truth.az);

            console.log(
                `  ${star.name}: ` +
                `truth(alt=${truth.alt.toFixed(2)}°, az=${truth.az.toFixed(2)}°)  ` +
                `rendered(alt=${rendered.alt.toFixed(2)}°, az=${rendered.az.toFixed(2)}°)  ` +
                `Δalt=${dAlt.toFixed(3)}°  Δaz=${dAz.toFixed(3)}°` +
                (dAz > 90 ? `  ← ESPEJADO: 360−truth.az=${(360 - truth.az).toFixed(2)}°` : ''),
            );

            expect(dAlt, `${star.name} error altitud: rendered ${rendered.alt.toFixed(2)}° vs truth ${truth.alt.toFixed(2)}°`).toBeLessThan(TOL);
            expect(dAz,  `${star.name} error azimut: rendered ${rendered.az.toFixed(2)}° vs truth ${truth.az.toFixed(2)}° (espejado sería ${(360 - truth.az).toFixed(2)}°)`).toBeLessThan(TOL);
        });
    }
});
