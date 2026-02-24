import { Observer } from '../types/celestial';

export interface MeteorShower {
    id: string;
    name: string;
    shortName: string;
    radiant: { ra: number; dec: number }; // Radiante en coordenadas ecuatoriales
    constellation: string; // Constelación del radiante
    dateStart: string; // YYYY-MM-DD
    dateEnd: string; // YYYY-MM-DD
    peakDate: string; // YYYY-MM-DD
    thz: number; // Tasa Horaria Zenital (máximo)
    speed: number; // km/s
    parentBody: string; // Cometa/asteroide padre
    description: string;
    color: string;
    active: boolean; // Si está activa ahora
}

// Datos de la IMO (International Meteor Organization) 2025-2026
export const METEOR_SHOWERS: MeteorShower[] = [
    {
        id: 'QUA',
        name: 'Cuadrántidas',
        shortName: 'QUA',
        radiant: { ra: 230, dec: 49 },
        constellation: 'Boötes',
        dateStart: '2025-12-28',
        dateEnd: '2026-01-12',
        peakDate: '2026-01-03',
        thz: 80,
        speed: 41,
        parentBody: 'Asteroide 2003 EH1',
        description: 'Primera lluvia importante del año. Pico muy estrecho (solo horas). Visible desde hemisferio norte.',
        color: '#44aaff',
        active: false
    },
    {
        id: 'LYR',
        name: 'Líridas',
        shortName: 'LYR',
        radiant: { ra: 271, dec: 34 },
        constellation: 'Lyra',
        dateStart: '2026-04-16',
        dateEnd: '2026-04-25',
        peakDate: '2026-04-22',
        thz: 18,
        speed: 49,
        parentBody: 'Cometa C/1861 G1 Thatcher',
        description: 'Lluvia antigua observada desde 687 a.C. Meteoros brillantes con estelas persistentes.',
        color: '#aaddff',
        active: false
    },
    {
        id: 'ETA',
        name: 'Eta Acuáridas',
        shortName: 'ETA',
        radiant: { ra: 338, dec: -1 },
        constellation: 'Aquarius',
        dateStart: '2026-04-19',
        dateEnd: '2026-05-28',
        peakDate: '2026-05-06',
        thz: 50,
        speed: 66,
        parentBody: 'Cometa 1P/Halley',
        description: 'Restos del cometa Halley. Mejor visible desde hemisferio sur. Meteoros muy rápidos.',
        color: '#88ccff',
        active: false
    },
    {
        id: 'PER',
        name: 'Perseidas',
        shortName: 'PER',
        radiant: { ra: 46, dec: 58 },
        constellation: 'Perseus',
        dateStart: '2026-07-17',
        dateEnd: '2026-08-24',
        peakDate: '2026-08-12',
        thz: 100,
        speed: 59,
        parentBody: 'Cometa 109P/Swift-Tuttle',
        description: 'La lluvia más popular del año. Noches de verano, muchos meteoros brillantes. ¡La favorita!',
        color: '#ffdd88',
        active: false
    },
    {
        id: 'DRA',
        name: 'Dracónidas',
        shortName: 'DRA',
        radiant: { ra: 262, dec: 54 },
        constellation: 'Draco',
        dateStart: '2026-10-06',
        dateEnd: '2026-10-10',
        peakDate: '2026-10-08',
        thz: 10,
        speed: 20,
        parentBody: 'Cometa 21P/Giacobini-Zinner',
        description: 'Lluvia lenta. Ocasionalmente produce tormentas espectaculares (1933, 1946).',
        color: '#88ffaa',
        active: false
    },
    {
        id: 'ORI',
        name: 'Oriónidas',
        shortName: 'ORI',
        radiant: { ra: 95, dec: 16 },
        constellation: 'Orion',
        dateStart: '2026-10-02',
        dateEnd: '2026-11-07',
        peakDate: '2026-10-21',
        thz: 20,
        speed: 66,
        parentBody: 'Cometa 1P/Halley',
        description: 'Segunda lluvia del cometa Halley. Meteoros muy rápidos y brillantes. Cerca de Betelgeuse.',
        color: '#ffcc88',
        active: false
    },
    {
        id: 'TAU',
        name: 'Táuridas',
        shortName: 'TAU',
        radiant: { ra: 52, dec: 15 },
        constellation: 'Taurus',
        dateStart: '2026-09-07',
        dateEnd: '2026-12-10',
        peakDate: '2026-11-05',
        thz: 5,
        speed: 27,
        parentBody: 'Cometa 2P/Encke',
        description: 'Lluvia larga y débil. Famosa por bólidos extremadamente brillantes (bolas de fuego).',
        color: '#ffaa88',
        active: false
    },
    {
        id: 'LEO',
        name: 'Leónidas',
        shortName: 'LEO',
        radiant: { ra: 153, dec: 22 },
        constellation: 'Leo',
        dateStart: '2026-11-06',
        dateEnd: '2026-11-30',
        peakDate: '2026-11-17',
        thz: 15,
        speed: 71,
        parentBody: 'Cometa 55P/Tempel-Tuttle',
        description: 'Famosa por tormentas históricas (1833, 1966, 1999, 2001). Meteoros más rápidos (71 km/s).',
        color: '#aaffff',
        active: false
    },
    {
        id: 'GEM',
        name: 'Gemínidas',
        shortName: 'GEM',
        radiant: { ra: 112, dec: 33 },
        constellation: 'Gemini',
        dateStart: '2026-12-04',
        dateEnd: '2026-12-17',
        peakDate: '2026-12-14',
        thz: 150,
        speed: 35,
        parentBody: 'Asteroide 3200 Phaethon',
        description: 'La MEJOR lluvia del año. THZ más alto, muchos meteoros brillantes, noche larga. ¡Imprescindible!',
        color: '#ffffff',
        active: false
    },
    {
        id: 'URS',
        name: 'Úrsidas',
        shortName: 'URS',
        radiant: { ra: 217, dec: 76 },
        constellation: 'Ursa Minor',
        dateStart: '2026-12-17',
        dateEnd: '2026-12-24',
        peakDate: '2026-12-22',
        thz: 10,
        speed: 33,
        parentBody: 'Cometa 8P/Tuttle',
        description: 'Lluvia de Navidad. Circumpolar norte (visible toda la noche). Ocasionalmente sorprende.',
        color: '#88aaff',
        active: false
    }
];

/**
 * Calcula si una lluvia de meteoros está activa en una fecha dada
 */
export function isShowerActive(shower: MeteorShower, date: Date): boolean {
    const showerStart = new Date(shower.dateStart);
    const showerEnd = new Date(shower.dateEnd);
    return date >= showerStart && date <= showerEnd;
}

/**
 * Calcula la actividad relativa de una lluvia (0-1) según la fecha
 * Usa una curva gaussiana centrada en el pico
 */
export function getShowerActivity(shower: MeteorShower, date: Date): number {
    const peak = new Date(shower.peakDate);
    const daysFromPeak = Math.abs(date.getTime() - peak.getTime()) / (1000 * 60 * 60 * 24);
    
    // Curva gaussiana: actividad máxima en el pico, decae con los días
    const sigma = 5; // días de desviación estándar
    const activity = Math.exp(-(daysFromPeak * daysFromPeak) / (2 * sigma * sigma));
    
    return activity;
}

/**
 * Obtiene las lluvias activas para una fecha
 */
export function getActiveShowers(date: Date): MeteorShower[] {
    return METEOR_SHOWERS.filter(shower => isShowerActive(shower, date));
}

/**
 * Obtiene la lluvia con mayor actividad en una fecha
 */
export function getBestShower(date: Date): MeteorShower | null {
    const active = getActiveShowers(date);
    if (active.length === 0) return null;
    
    return active.reduce((best, shower) => {
        const bestActivity = getShowerActivity(best, date) * best.thz;
        const showerActivity = getShowerActivity(shower, date) * shower.thz;
        return showerActivity > bestActivity ? shower : best;
    });
}

/**
 * Calcula la tasa de meteoros por hora visible (ajustada por altura del radiante)
 */
export function getVisibleMeteorRate(shower: MeteorShower, observer: Observer, date: Date): number {
    const activity = getShowerActivity(shower, date);
    const thz = shower.thz;
    
    // Estimación simplificada: el radiante debe estar sobre el horizonte
    // En realidad necesitaríamos calcular la altura del radiante
    const baseRate = thz * activity;
    
    // Factor de corrección por altura (simplificado: asumiendo radiante visible de noche)
    const hour = date.getHours();
    const isVisible = hour >= 22 || hour <= 5; // Noche
    
    return isVisible ? baseRate * 0.6 : 0; // 60% del THZ cuando es visible
}

/**
 * Obtiene información de la lluvia para mostrar en UI
 */
export function getShowerInfo(shower: MeteorShower, date: Date): {
    name: string;
    activity: number; // 0-1
    thz: number;
    daysToPeak: number;
    status: 'inactive' | 'active' | 'peaking';
} {
    const peak = new Date(shower.peakDate);
    const daysToPeak = Math.round((peak.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const activity = getShowerActivity(shower, date);
    
    let status: 'inactive' | 'active' | 'peaking' = 'inactive';
    if (isShowerActive(shower, date)) {
        status = Math.abs(daysToPeak) <= 2 ? 'peaking' : 'active';
    }
    
    return {
        name: shower.name,
        activity,
        thz: Math.round(shower.thz * activity),
        daysToPeak,
        status
    };
}
