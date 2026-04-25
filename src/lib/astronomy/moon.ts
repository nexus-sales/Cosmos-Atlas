import * as Astronomy from 'astronomy-engine';

export function getMoonPhaseName(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 5 || p >= 355) return 'Luna nueva';
    if (p < 85) return 'Luna creciente';
    if (p < 95) return 'Cuarto creciente';
    if (p < 175) return 'Gibosa creciente';
    if (p < 185) return 'Luna llena';
    if (p < 265) return 'Gibosa menguante';
    if (p < 275) return 'Cuarto menguante';
    return 'Luna menguante';
}

export function getMoonPhaseIcon(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return '🌑';
    if (p < 67.5) return '🌒';
    if (p < 112.5) return '🌓';
    if (p < 157.5) return '🌔';
    if (p < 202.5) return '🌕';
    if (p < 247.5) return '🌖';
    if (p < 292.5) return '🌗';
    return '🌘';
}

export function getMoonDetails(date: Date) {
    const phase = Astronomy.MoonPhase(date);
    const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date);
    
    return {
        phase,
        phaseName: getMoonPhaseName(phase),
        phaseIcon: getMoonPhaseIcon(phase),
        illumination: illumination.phase_fraction * 100 // percentage
        // distance eliminado: IlluminationInfo no tiene 'dist'
    };
}
