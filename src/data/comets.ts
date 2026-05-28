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
export const COMETS: Comet[] = [
    {
        id: '1P',
        name: 'Cometa Halley',
        designation: '1P/Halley',
        period: 75.3,
        perihelion: 0.586,
        aphelion: 35.1,
        inclination: 162.3,
        eccentricity: 0.967,
        magnitude: 5.5,
        color: '#88ddff',
        tailLength: 15,
        active: false,
        description: 'El cometa más famoso. Visible cada 75-76 años. Próximo paso: 2061.',
        elements: { e: 0.96714, q: 0.58598, i: 162.26, om: 58.42, w: 111.33, tp: 2446467.4 }
    },
    {
        id: '2P',
        name: 'Cometa Encke',
        designation: '2P/Encke',
        period: 3.3,
        perihelion: 0.331,
        aphelion: 4.09,
        inclination: 11.8,
        eccentricity: 0.848,
        magnitude: 7.0,
        color: '#aaddff',
        tailLength: 5,
        active: true,
        description: 'Cometa de período más corto conocido. Regresa cada 3.3 años.',
        elements: { e: 0.84825, q: 0.33613, i: 11.78, om: 334.57, w: 186.54, tp: 2460418.0 }
    },
    {
        id: '67P',
        name: 'Churyumov-Gerasimenko',
        designation: '67P/C-G',
        period: 6.45,
        perihelion: 1.24,
        aphelion: 5.68,
        inclination: 7.04,
        eccentricity: 0.641,
        magnitude: 12.0,
        color: '#88ccff',
        tailLength: 3,
        active: true,
        description: 'Visitado por la sonda Rosetta en 2014. Primer aterrizaje en cometa.',
        elements: { e: 0.64102, q: 1.21342, i: 7.04, om: 36.33, w: 22.15, tp: 2459632.7 }
    },
    {
        id: 'C2023A3',
        name: 'Tsuchinshan-ATLAS',
        designation: 'C/2023 A3',
        period: 80000,
        perihelion: 0.39,
        aphelion: 25000,
        inclination: 139.1,
        eccentricity: 0.99997,
        magnitude: 3.5,
        color: '#ffffff',
        tailLength: 20,
        active: true,
        description: 'Cometa del siglo. Visible a simple vista en oct 2024. Cola espectacular.',
        elements: { e: 0.99997, q: 0.39147, i: 139.11, om: 21.57, w: 308.22, tp: 2460578.5 }
    },
    {
        id: 'C2022E3',
        name: 'Cometa ZTF',
        designation: 'C/2022 E3 (ZTF)',
        period: 50000,
        perihelion: 1.11,
        aphelion: 350,
        inclination: 109.2,
        eccentricity: 1.00032,
        magnitude: 5.0,
        color: '#88ffaa',
        tailLength: 8,
        active: false,
        description: 'Cometa verde por CO+ ionizado. Visible en 2023. Color esmeralda único.',
        elements: { e: 1.00032, q: 1.11221, i: 109.17, om: 302.92, w: 147.72, tp: 2460006.0 }
    },
    {
        id: 'C2024G3',
        name: 'Cometa ATLAS',
        designation: 'C/2024 G3 (ATLAS)',
        period: 600,
        perihelion: 0.13,
        aphelion: 85,
        inclination: 136.9,
        eccentricity: 0.99969,
        magnitude: 2.0,
        color: '#ffdd88',
        tailLength: 25,
        active: true,
        description: 'Cometa rasante solar. Brillante en enero 2025. Superviviente del perihelio.',
        elements: { e: 0.99969, q: 0.12951, i: 136.87, om: 81.97, w: 74.83, tp: 2460669.0 }
    },
    {
        id: '73P',
        name: 'Schwassmann-Wachmann 3',
        designation: '73P/S-W 3',
        period: 5.4,
        perihelion: 0.94,
        aphelion: 6.28,
        inclination: 11.4,
        eccentricity: 0.694,
        magnitude: 8.5,
        color: '#aaddff',
        tailLength: 4,
        active: true,
        description: 'Cometa fragmentado en múltiples piezas. Restos de un núcleo roto.',
        elements: { e: 0.69376, q: 0.93929, i: 11.39, om: 69.67, w: 195.21, tp: 2461490.0 }
    },
    {
        id: '46P',
        name: 'Cometa Wirtanen',
        designation: '46P/Wirtanen',
        period: 5.4,
        perihelion: 1.06,
        aphelion: 5.14,
        inclination: 11.7,
        eccentricity: 0.652,
        magnitude: 7.5,
        color: '#88ccff',
        tailLength: 5,
        active: true,
        description: 'Cometa hiperactivo. Objetivo cancelado de la misión Rosetta.',
        elements: { e: 0.65200, q: 1.05510, i: 11.75, om: 82.15, w: 356.36, tp: 2459180.0 }
    },
    {
        id: '12P',
        name: 'Cometa Pons-Brooks',
        designation: '12P/Pons-Brooks',
        period: 71.3,
        perihelion: 0.78,
        aphelion: 33.6,
        inclination: 74.2,
        eccentricity: 0.9546,
        magnitude: 4.5,
        color: '#ffcc88',
        tailLength: 12,
        active: true,
        description: 'El "cometa diabólico". Espectacular en 2024. Regresa cada 71 años.',
        elements: { e: 0.95462, q: 0.78133, i: 74.19, om: 255.88, w: 198.90, tp: 2460373.8 }
    },
    {
        id: '10P',
        name: 'Cometa Tempel 2',
        designation: '10P/Tempel 2',
        period: 5.4,
        perihelion: 1.5,
        aphelion: 4.7,
        inclination: 12,
        eccentricity: 0.52,
        magnitude: 10.0,
        color: '#88ccff',
        tailLength: 3,
        active: true,
        description: 'Cometa de la familia de Júpiter. Descubierto en 1873.',
        elements: { e: 0.52220, q: 1.49989, i: 12.01, om: 117.60, w: 195.03, tp: 2461000.0 }
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
