/**
 * Catálogo de cometas activos y sus elementos orbitales
 * Datos actualizados de JPL Small-Body Database
 */

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
        description: 'El cometa más famoso. Visible cada 75-76 años. Próximo paso: 2061.'
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
        description: 'Cometa de período más corto conocido. Regresa cada 3.3 años.'
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
        description: 'Visitado por la sonda Rosetta en 2014. Primer aterrizaje en cometa.'
    },
    {
        id: 'C2023A3',
        name: 'Cometa Tsuchinshan-ATLAS',
        designation: 'C/2023 A3',
        period: 80000,
        perihelion: 0.39,
        aphelion: 25000,
        inclination: 139,
        eccentricity: 0.9999,
        magnitude: 3.5,
        color: '#ffffff',
        tailLength: 20,
        active: true,
        description: 'Cometa del siglo. Visible a simple vista en 2024-2025. Cola espectacular.'
    },
    {
        id: 'C2022E3',
        name: 'Cometa ZTF',
        designation: 'C/2022 E3 (ZTF)',
        period: 50000,
        perihelion: 1.11,
        aphelion: 350,
        inclination: 109,
        eccentricity: 0.994,
        magnitude: 5.0,
        color: '#88ffaa',
        tailLength: 8,
        active: false,
        description: 'Cometa verde por CO+ ionizado. Visible en 2023. Color esmeralda único.'
    },
    {
        id: 'C2024G3',
        name: 'Cometa ATLAS',
        designation: 'C/2024 G3 (ATLAS)',
        period: 600,
        perihelion: 0.13,
        aphelion: 85,
        inclination: 136,
        eccentricity: 0.998,
        magnitude: 2.0,
        color: '#ffdd88',
        tailLength: 25,
        active: true,
        description: 'Cometa rasante solar. Potencialmente brillante en 2025. Superviviente del perihelio.'
    },
    {
        id: '73P',
        name: 'Cometa Schwassmann-Wachmann 3',
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
        description: 'Cometa fragmentado en múltiples piezas. Restos de un núcleo roto.'
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
        description: 'Cometa hiperactivo. Objetivo cancelado de la misión Rosetta.'
    },
    {
        id: '8P',
        name: 'Cometa Tuttle',
        designation: '8P/Tuttle',
        period: 13.6,
        perihelion: 1.03,
        aphelion: 10.3,
        inclination: 54.7,
        eccentricity: 0.82,
        magnitude: 8.0,
        color: '#aaddff',
        tailLength: 6,
        active: true,
        description: 'Padre de las Leónidas. Origen de la lluvia de meteoros.'
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
        description: 'Cometa de la familia de Júpiter. Descubierta en 1867.'
    }
];

/**
 * Calcula la posición aproximada de un cometa en una fecha dada
 * Simplificado para visualización
 */
export function getCometPosition(comet: Comet, date: Date): { ra: number; dec: number; distance: number } {
    const jd = date.getTime() / 86400000 + 2440587.5;
    const epoch = 2451545.0; // J2000
    const T = (jd - epoch) / 36525; // Siglos julianos

    // Simplificación: posición basada en período orbital
    const phase = (T % comet.period) / comet.period * Math.PI * 2;
    
    // RA y Dec aproximados (esto debería usar elementos orbitales reales)
    const ra = (phase * 180 / Math.PI + comet.inclination) % 360;
    const dec = Math.sin(phase) * comet.inclination;
    const distance = comet.perihelion + (comet.aphelion - comet.perihelion) * (1 + Math.sin(phase)) / 2;

    return { ra, dec, distance };
}

/**
 * Obtiene cometas activos en una fecha
 */
export function getActiveComets(date: Date): Comet[] {
    return COMETS.filter(c => c.active);
}

/**
 * Calcula el brillo aparente del cometa
 */
export function getCometMagnitude(comet: Comet, date: Date): number {
    const pos = getCometPosition(comet, date);
    // Fórmula simplificada de magnitud
    const delta = pos.distance; // distancia a la Tierra (UA)
    const r = pos.distance; // distancia al Sol (UA)
    
    // m = H + 5 log(delta) + 2.5 n log(r)
    // n = 4 para cometas típicos
    const H = comet.magnitude;
    const m = H + 5 * Math.log10(delta) + 10 * Math.log10(r);
    
    return Math.min(m, 15); // Límite de visibilidad
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
