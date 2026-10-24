import type { Star } from '@/types/celestial';

const GUIDE_POINT_PATTERN = /-St\d+$/i;

export function angularSeparationDeg(
    a: { ra: number; dec: number },
    b: { ra: number; dec: number },
): number {
    const toRad = Math.PI / 180;
    const decA = a.dec * toRad;
    const decB = b.dec * toRad;
    const deltaRa = (a.ra - b.ra) * toRad;
    const cosine = Math.sin(decA) * Math.sin(decB)
        + Math.cos(decA) * Math.cos(decB) * Math.cos(deltaRa);
    return Math.acos(Math.max(-1, Math.min(1, cosine))) / toRad;
}

/**
 * Resuelve una fuente de catálogo contra las estrellas nominales de la app.
 * 0,08° tolera el redondeo de las coordenadas locales sin confundir estrellas
 * próximas en la inmensa mayoría de campos a simple vista.
 */
export function findNamedStarNear(
    position: { ra: number; dec: number },
    stars: Star[],
    toleranceDeg = 0.08,
): Star | null {
    let nearest: Star | null = null;
    let nearestDistance = toleranceDeg;

    for (const star of stars) {
        if (GUIDE_POINT_PATTERN.test(star.name)) continue;
        const distance = angularSeparationDeg(position, star);
        if (distance <= nearestDistance) {
            nearest = star;
            nearestDistance = distance;
        }
    }

    return nearest;
}
