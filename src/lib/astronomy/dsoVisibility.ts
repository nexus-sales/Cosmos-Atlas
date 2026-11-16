// Visibilidad y etiquetado de objetos de cielo profundo en la bóveda.
// Funciones puras para poder probarlas sin montar el canvas.

/** Los DSO a simple vista se nombran a cualquier zoom, como en Stellarium. */
export const NAKED_EYE_LABEL_MAG = 4.5;
/** Tope de etiquetas simultáneas a campo amplio: cada <Html> es un nodo DOM. */
export const MAX_WIDE_FIELD_LABELS = 12;
/** Dos etiquetas a menos de esta separación se pisan a campo amplio (p. ej. el Cúmulo Doble). */
export const MIN_LABEL_SEPARATION_DEG = 2.5;
/** Por debajo de este FOV se aplica la regla de etiquetado de detalle. */
export const DETAIL_LABEL_FOV = 35;
const DETAIL_LABEL_MAG = 8.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Illustrative visibility. Bortle is applied once, in the observation threshold. */
export function dsoSpriteVisibility(mag: number, bortle: number, fov: number, hovered = false, exploreDeepSky = false): number {
    const zoomBonus = clamp(40 / Math.max(1.5, fov), 0, 2.2);
    const limitingMag = exploreDeepSky
        ? 10 + clamp(Math.log2(60 / Math.max(1.5, fov)), 0, 4)
        : 8.8 - (clamp(bortle, 1, 9) - 1) * 0.55 + zoomBonus;
    const visibility = clamp((limitingMag + 0.8 - mag) / 1.6, 0, 1);
    return Math.max(hovered ? 0.35 : 0, visibility);
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

function angularSeparationDeg(a: { ra: number; dec: number }, b: { ra: number; dec: number }) {
    const cos = Math.sin(toRad(a.dec)) * Math.sin(toRad(b.dec))
        + Math.cos(toRad(a.dec)) * Math.cos(toRad(b.dec)) * Math.cos(toRad(a.ra - b.ra));
    return (Math.acos(clamp(cos, -1, 1)) * 180) / Math.PI;
}

/**
 * Ids de los DSO que pueden llevar etiqueta a campo amplio: los visibles a
 * simple vista, priorizados por brillo, limitados a `max` y sin dos
 * etiquetas pegadas (gana la del objeto más brillante). Quien llama pasa
 * solo los objetos que están sobre el horizonte.
 */
export function selectWideFieldLabelIds(
    dsos: ReadonlyArray<{ id: string; mag: number; ra: number; dec: number }>,
    max = MAX_WIDE_FIELD_LABELS,
): Set<string> {
    const selected: Array<{ id: string; ra: number; dec: number }> = [];
    const candidates = dsos
        .filter((dso) => dso.mag <= NAKED_EYE_LABEL_MAG)
        .sort((a, b) => a.mag - b.mag);
    for (const dso of candidates) {
        if (selected.length >= max) break;
        if (selected.some((other) => angularSeparationDeg(dso, other) < MIN_LABEL_SEPARATION_DEG)) continue;
        selected.push(dso);
    }
    return new Set(selected.map((dso) => dso.id));
}

/**
 * ¿Se pinta el nombre del DSO?
 * - con hover, siempre;
 * - en detalle (FOV < 35), los de mag < 8.5;
 * - a campo amplio, solo los de simple vista que entren en el tope
 *   (`wideFieldAllowed`, ver `selectWideFieldLabelIds`).
 * Sin hover, un objeto bajo el horizonte nunca se nombra.
 */
export function shouldShowDsoLabel(
    dso: { mag: number },
    bortle: number,
    fov: number,
    hovered: boolean,
    wideFieldAllowed = true,
    aboveHorizon = true,
    exploreDeepSky = false,
): boolean {
    if (hovered) return true;
    if (!aboveHorizon) return false;
    const visible = dsoSpriteVisibility(dso.mag, bortle, fov, false, exploreDeepSky) >= 0.02;
    if (fov < DETAIL_LABEL_FOV && (exploreDeepSky || dso.mag < DETAIL_LABEL_MAG) && visible) return true;
    return wideFieldAllowed
        && dso.mag <= NAKED_EYE_LABEL_MAG
        && visible;
}

/** Angular diameter on the sky sphere of radius 94. */
// Retain the type argument for existing callers.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function dsoVisualSize(sizeArcmin: number | undefined, type: string): number {
    return 2 * 94 * Math.tan(((sizeArcmin && sizeArcmin > 0 ? sizeArcmin : 5) / 60) * Math.PI / 360);
}
