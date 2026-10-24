function clamp01(value: number) {
    return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
    const t = clamp01((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
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
