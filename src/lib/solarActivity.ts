/**
 * Datos de actividad solar para auroras
 * Índice KP: 0-9 (mayor = más actividad)
 */

export interface SolarActivity {
    kpIndex: number; // 0-9
    description: string;
    auroraVisible: boolean;
    minLatitude: number; // Latitud mínima para ver aurora
    color: string;
}

/**
 * Calcula el índice KP aproximado (simulado)
 * En producción, usar NOAA SWPC API
 */
export function getSolarActivity(date: Date): SolarActivity {
    // Simulación basada en fecha (variación cíclica)
    const dayOfYear = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    );
    
    // Ciclo solar aproximado (11 años) + variación diaria
    const solarCycle = Math.sin(dayOfYear * 0.01) * 3;
    const dailyVar = Math.sin(dayOfYear * 0.1 + date.getHours() * 0.1) * 2;
    
    let kp = 2 + solarCycle + dailyVar + Math.random() * 1.5;
    kp = Math.max(0, Math.min(9, kp)); // Clamp 0-9
    
    const kpIndex = Math.round(kp * 10) / 10;
    
    if (kpIndex >= 8) {
        return {
            kpIndex,
            description: 'Tormenta geomagnética extrema',
            auroraVisible: true,
            minLatitude: 40,
            color: '#ff00ff' // Púrpura intenso
        };
    } else if (kpIndex >= 6) {
        return {
            kpIndex,
            description: 'Tormenta geomagnética fuerte',
            auroraVisible: true,
            minLatitude: 50,
            color: '#00ff00' // Verde brillante
        };
    } else if (kpIndex >= 4) {
        return {
            kpIndex,
            description: 'Actividad moderada',
            auroraVisible: true,
            minLatitude: 60,
            color: '#00ff88' // Verde azulado
        };
    } else if (kpIndex >= 2) {
        return {
            kpIndex,
            description: 'Actividad baja',
            auroraVisible: false,
            minLatitude: 75,
            color: '#008844' // Verde oscuro
        };
    } else {
        return {
            kpIndex,
            description: 'Actividad muy baja',
            auroraVisible: false,
            minLatitude: 85,
            color: '#004422' // Casi invisible
        };
    }
}

/**
 * Determina si la aurora es visible desde una latitud dada
 */
export function isAuroraVisible(kpIndex: number, latitude: number): boolean {
    // Latitud mínima aproximada según KP
    const minLat = 90 - (kpIndex * 8);
    return Math.abs(latitude) >= minLat;
}

/**
 * Obtiene el tipo de aurora según hemisferio
 */
export function getAuroraType(latitude: number): 'boreal' | 'austral' {
    return latitude >= 0 ? 'boreal' : 'austral';
}

/**
 * Colores de aurora por altura (emisión atmosférica)
 */
export const AURORA_COLORS = {
    oxygen557: '#00ff00', // Oxígeno a 557.7nm (verde, 100-150km)
    oxygen630: '#ff0000', // Oxígeno a 630nm (rojo, 200-400km)
    nitrogen427: '#0088ff', // Nitrógeno ionizado (azul, <100km)
    nitrogen500: '#ff00ff', // Nitrógeno (púrpura, mezcla)
};
