// Visibilidad y etiquetado de objetos de cielo profundo en la bóveda.
// Funciones puras para poder probarlas sin montar el canvas.

/** Los DSO a simple vista se nombran a cualquier zoom, como en Stellarium. */
export const NAKED_EYE_LABEL_MAG = 4.5;
/** Tope de etiquetas simultáneas a campo amplio: cada <Html> es un nodo DOM. */
export const MAX_WIDE_FIELD_LABELS = 12;
/** Por debajo de este FOV se aplica la regla de etiquetado de detalle. */
export const DETAIL_LABEL_FOV = 35;
const DETAIL_LABEL_MAG = 8.5;

// Hasta BRIGHT_MAG la contaminación no atenúa el objeto; entre BRIGHT_MAG y
// FAINT_MAG se recupera linealmente la penalización completa.
const BRIGHT_MAG = 4;
const FAINT_MAG = 6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * Visibilidad [0..1] del sprite de un DSO.
 *
 * `limitingMag` ya incluye el Bortle, así que el factor de contaminación solo
 * se aplica a objetos débiles: un cúmulo de mag 1.6 (M45) se ve a simple vista
 * incluso desde una ciudad y no debe penalizarse dos veces.
 */
export function dsoSpriteVisibility(mag: number, bortle: number, fov: number, hovered = false): number {
    const limitingMag = 8.8 - (bortle - 1) * 0.55 + clamp(40 / fov, 0, 2.2);
    const magVisibility = clamp((limitingMag + 0.8 - mag) / 1.6, 0, 1);
    const pollutionVisibility = lerp(1.0, 0.15, (bortle - 1) / 8);
    const brightness = clamp((FAINT_MAG - mag) / (FAINT_MAG - BRIGHT_MAG), 0, 1);
    const pollutionFactor = lerp(pollutionVisibility, 1.0, brightness);
    return Math.max(hovered ? 0.35 : 0, magVisibility * pollutionFactor);
}

/**
 * Ids de los DSO que pueden llevar etiqueta a campo amplio: los visibles a
 * simple vista, priorizados por brillo y limitados a `max`.
 */
export function selectWideFieldLabelIds(
    dsos: ReadonlyArray<{ id: string; mag: number }>,
    max = MAX_WIDE_FIELD_LABELS,
): Set<string> {
    return new Set(
        dsos
            .filter((dso) => dso.mag <= NAKED_EYE_LABEL_MAG)
            .sort((a, b) => a.mag - b.mag)
            .slice(0, max)
            .map((dso) => dso.id),
    );
}

/**
 * ¿Se pinta el nombre del DSO?
 * - con hover, siempre;
 * - en detalle (FOV < 35), los de mag < 8.5;
 * - a campo amplio, solo los de simple vista que entren en el tope
 *   (`wideFieldAllowed`, ver `selectWideFieldLabelIds`).
 */
export function shouldShowDsoLabel(
    dso: { mag: number },
    bortle: number,
    fov: number,
    hovered: boolean,
    wideFieldAllowed = true,
): boolean {
    if (hovered) return true;
    if (fov < DETAIL_LABEL_FOV && dso.mag < DETAIL_LABEL_MAG) return true;
    return wideFieldAllowed
        && dso.mag <= NAKED_EYE_LABEL_MAG
        && dsoSpriteVisibility(dso.mag, bortle, fov) >= 0.02;
}

/**
 * Tamaño representativo del sprite sobre la bóveda. Acotado para que M31/LMC
 * no inunden la pantalla; los cúmulos abiertos tienen un tope mayor para que
 * M45 (110') salga a su tamaño aparente real (≈1.8°).
 */
export function dsoVisualSize(sizeArcmin: number | undefined, type: string): number {
    const cap = type === 'cluster' ? 3.0 : 2.2;
    return Math.max(0.12, Math.min(cap, (sizeArcmin || 5) * 0.027));
}
