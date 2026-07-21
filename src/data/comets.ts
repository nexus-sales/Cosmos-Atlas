/**
 * Catálogo de cometas activos y sus elementos orbitales
 * Datos actualizados de JPL Small-Body Database
 */

import { cometRaDec, toJD, type OrbitalElements } from '@/lib/astronomy/cometOrbits';

export interface Comet {
    id: string;
    name: string;
    designation: string;
    period: number; // años
    perihelion: number; // UA
    aphelion: number; // UA
    inclination: number; // grados
    eccentricity: number;
    magnitude: number;
    color: string;
    tailLength: number; // grados en el cielo
    active: boolean;
    description: string;
    /** Elementos orbitales precisos (opcionales — fallback usa aproximación) */
    elements?: OrbitalElements;
}

// Cometas periódicos y no periódicos visibles
// Elementos orbitales verificados contra JPL Small-Body Database (2026-07-21).
// Los tres cometas C/ (paso unico) se refinan con cada nueva observacion; en
// C/2023 A3 la excentricidad paso de <1 a >1 desde la version anterior de
// este archivo -- confirmado hiperbolico, no periodico. Ver detalle completo
// de la comparacion en el historial de este cambio.
export const COMETS: Comet[] = [
    {
        id: '1P',
        name: 'Cometa Halley',
        designation: '1P/Halley',
        period: 75.92,
        perihelion: 0.57486,
        aphelion: 35.282,
        inclination: 162.191,
        eccentricity: 0.967936,
        magnitude: 5.5,
        color: '#88ddff',
        tailLength: 15,
        active: false,
        description: 'El cometa más famoso. Visible cada 75-76 años. Próximo paso: 2061.',
        elements: { e: 0.967936, q: 0.574864, i: 162.191, om: 59.099, w: 112.241, tp: 2446469.97 }
    },
    {
        id: '2P',
        name: 'Cometa Encke',
        designation: '2P/Encke',
        period: 3.31,
        perihelion: 0.33795,
        aphelion: 4.101,
        inclination: 11.412,
        eccentricity: 0.84775,
        magnitude: 7.0,
        color: '#aaddff',
        tailLength: 5,
        active: true,
        description: 'Cometa de período más corto conocido. Regresa cada 3.3 años.',
        elements: { e: 0.84775, q: 0.337948, i: 11.412, om: 334.194, w: 187.134, tp: 2460239.65 }
    },
    {
        id: '67P',
        name: 'Churyumov-Gerasimenko',
        designation: '67P/C-G',
        period: 6.44,
        perihelion: 1.24327,
        aphelion: 5.681,
        inclination: 7.04,
        eccentricity: 0.640908,
        magnitude: 12.0,
        color: '#88ccff',
        tailLength: 3,
        active: true,
        description: 'Visitado por la sonda Rosetta en 2014. Primer aterrizaje en cometa.',
        elements: { e: 0.640908, q: 1.243266, i: 7.04, om: 50.136, w: 12.798, tp: 2457247.59 }
    },
    {
        id: 'C2023A3',
        name: 'Tsuchinshan-ATLAS',
        designation: 'C/2023 A3',
        period: Infinity,
        perihelion: 0.39143,
        aphelion: Infinity,
        inclination: 139.112,
        eccentricity: 1.000095,
        magnitude: 3.5,
        color: '#ffffff',
        tailLength: 20,
        active: false,
        description: 'Cometa del siglo. Visible a simple vista en oct 2024. Órbita hiperbólica confirmada (e>1): no volverá al sistema solar.',
        elements: { e: 1.000095, q: 0.39143, i: 139.112, om: 21.559, w: 308.492, tp: 2460581.24 }
    },
    {
        id: 'C2022E3',
        name: 'Cometa ZTF',
        designation: 'C/2022 E3 (ZTF)',
        period: Infinity,
        perihelion: 1.11224,
        aphelion: Infinity,
        inclination: 109.169,
        eccentricity: 1.000302,
        magnitude: 5.0,
        color: '#88ffaa',
        tailLength: 8,
        active: false,
        description: 'Cometa verde por CO+ ionizado. Visible en 2023. Color esmeralda único. Órbita hiperbólica: no volverá.',
        elements: { e: 1.000302, q: 1.112244, i: 109.169, om: 302.555, w: 145.815, tp: 2459957.29 }
    },
    {
        id: 'C2024G3',
        name: 'Cometa ATLAS',
        designation: 'C/2024 G3 (ATLAS)',
        period: Infinity,
        perihelion: 0.09349,
        aphelion: Infinity,
        inclination: 116.851,
        eccentricity: 1.000012,
        magnitude: 2.0,
        color: '#ffdd88',
        tailLength: 25,
        active: false,
        description: 'Cometa rasante solar. Brillante en enero 2025. Superviviente del perihelio. Órbita hiperbólica: no volverá.',
        elements: { e: 1.000012, q: 0.093493, i: 116.851, om: 220.332, w: 108.125, tp: 2460688.92 }
    },
    {
        id: '73P',
        name: 'Schwassmann-Wachmann 3',
        designation: '73P/S-W 3',
        period: 5.44,
        perihelion: 0.9723,
        aphelion: 5.214,
        inclination: 11.232,
        eccentricity: 0.685659,
        magnitude: 8.5,
        color: '#aaddff',
        tailLength: 4,
        active: true,
        description: 'Cometa fragmentado en múltiples piezas (JPL cataloga 74 fragmentos por separado). Restos de un núcleo roto; datos del fragmento principal.',
        elements: { e: 0.685659, q: 0.972305, i: 11.232, om: 69.644, w: 199.451, tp: 2459817.09 }
    },
    {
        id: '46P',
        name: 'Cometa Wirtanen',
        designation: '46P/Wirtanen',
        period: 5.44,
        perihelion: 1.05536,
        aphelion: 5.13,
        inclination: 11.748,
        eccentricity: 0.658755,
        magnitude: 7.5,
        color: '#88ccff',
        tailLength: 5,
        active: true,
        description: 'Cometa hiperactivo. Objetivo cancelado de la misión Rosetta.',
        elements: { e: 0.658755, q: 1.055355, i: 11.748, om: 82.158, w: 356.341, tp: 2458465.43 }
    },
    {
        id: '12P',
        name: 'Cometa Pons-Brooks',
        designation: '12P/Pons-Brooks',
        period: 71.24,
        perihelion: 0.78086,
        aphelion: 33.589,
        inclination: 74.191,
        eccentricity: 0.954561,
        magnitude: 4.5,
        color: '#ffcc88',
        tailLength: 12,
        active: true,
        description: 'El "cometa diabólico". Espectacular en 2024. Regresa cada 71 años.',
        elements: { e: 0.954561, q: 0.780861, i: 74.191, om: 255.855, w: 198.988, tp: 2460421.63 }
    },
    {
        id: '10P',
        name: 'Cometa Tempel 2',
        designation: '10P/Tempel 2',
        period: 5.36,
        perihelion: 1.41758,
        aphelion: 4.711,
        inclination: 12.029,
        eccentricity: 0.537375,
        magnitude: 10.0,
        color: '#88ccff',
        tailLength: 3,
        active: true,
        description: 'Cometa de la familia de Júpiter. Descubierto en 1873.',
        elements: { e: 0.537375, q: 1.417583, i: 12.029, om: 117.803, w: 195.541, tp: 2457340.75 }
    }
];

/**
 * Calcula la posición geocéntrica de un cometa en una fecha dada.
 * Usa elementos orbitales Keplerianos si están disponibles; de lo contrario
 * usa una aproximación basada en período.
 */
export function getCometPosition(comet: Comet, date: Date): { ra: number; dec: number; distance: number; heliocentricDist: number } {
    const jd = toJD(date);

    if (comet.elements) {
        const { ra, dec, dist, r } = cometRaDec(comet.elements, jd);
        return { ra, dec, distance: dist, heliocentricDist: r };
    }

    // Fallback approximation (no orbital elements available)
    const T = (jd - 2451545.0) / 36525;
    const phase = (T % comet.period) / comet.period * Math.PI * 2;
    const ra = (phase * 180 / Math.PI + comet.inclination) % 360;
    const dec = Math.sin(phase) * comet.inclination * 0.3;
    const distance = comet.perihelion + (comet.aphelion - comet.perihelion) * (1 + Math.sin(phase)) / 2;
    return { ra, dec, distance, heliocentricDist: distance };
}

/**
 * Obtiene cometas activos en una fecha
 */
export function getActiveComets(): Comet[] {
    return COMETS.filter(c => c.active);
}

/**
 * Calcula el brillo aparente del cometa
 */
export function getCometMagnitude(comet: Comet, date: Date): number {
    const pos = getCometPosition(comet, date);
    const delta = Math.max(0.001, pos.distance);         // geocéntrica (UA)
    const r     = Math.max(0.001, pos.heliocentricDist); // heliocéntrica (UA)

    // m = H + 5·log(Δ) + 2.5·n·log(r),  n = 4 para cometas típicos
    const H = comet.magnitude;
    const m = H + 5 * Math.log10(delta) + 10 * Math.log10(r);

    return Math.min(m, 15);
}

/**
 * Obtiene información completa del cometa para UI
 */
export function getCometInfo(comet: Comet, date: Date): {
    name: string;
    magnitude: number;
    visible: boolean;
    tailAngle: number;
    description: string;
} {
    const mag = getCometMagnitude(comet, date);
    const visible = mag < 6.5; // Visible a simple vista o binoculares
    
    return {
        name: comet.name,
        magnitude: mag,
        visible,
        tailAngle: comet.tailLength,
        description: comet.description
    };
}
