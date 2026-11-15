function clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

/**
 * Atenuación [floor..1] de estrellas y Vía Láctea según la altura del Sol.
 * No se ocultan del todo: la app se abre a cualquier hora para explorar, así
 * que de día quedan en un suelo mínimo (mismo criterio que los planetas).
 */
export function starDayDimming(sunAltitudeDeg: number, floor: number) {
    return 1 - smoothstep(-8, 4, sunAltitudeDeg) * (1 - clamp01(floor));
}

export function lunarSkyGlow(moonAltitudeDeg: number, illuminatedFraction: number) {
    const aboveHorizon = smoothstep(-3, 12, moonAltitudeDeg);
    return clamp01(illuminatedFraction) * aboveHorizon;
}

/** Exposure target for a gradual, restrained visual dark-adaptation effect. */
export function ocularExposureTarget(
    sunAltitudeDeg: number,
    moonAltitudeDeg: number,
    illuminatedFraction: number,
    bortleScale: number,
) {
    const daylight = smoothstep(-12, 2, sunAltitudeDeg);
    const moonlight = lunarSkyGlow(moonAltitudeDeg, illuminatedFraction) * 0.48;
    const lightPollution = clamp01((bortleScale - 1) / 8) * 0.42;
    const sceneBrightness = Math.max(daylight, moonlight, lightPollution);
    return 0.92 + (1 - sceneBrightness) * 0.22;
}
