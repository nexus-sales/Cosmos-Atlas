/**
 * hipparcos.ts
 * Carga asíncrona del catálogo Hipparcos desde /hipparcos.bin
 *
 * Formato binario (generado por scripts/generate-hipparcos.mjs):
 *   Bytes 0-3   : uint32LE — número de estrellas N
 *   Bytes 4...  : N × 20 bytes — uint32 HIP + 4× float32LE por estrella.
 *                   [0] ra  (grados J2000)
 *                   [1] dec (grados J2000)
 *                   [2] Vmag
 *                   [3] B-V (índice de color)
 */

export interface HipStar {
    hip: number;  // identificador Hipparcos
    ra: number;   // grados J2000
    dec: number;  // grados J2000
    mag: number;  // magnitud visual
    bv: number;   // índice B-V (color)
}

export function parseHipparcos(buf: ArrayBuffer): HipStar[] {
    const view = new DataView(buf);
    if (buf.byteLength < 4) throw new Error('Truncated Hipparcos header');
    const count = view.getUint32(0, true); // little-endian

    const stride = (buf.byteLength - 4) / count;
    if (stride !== 16 && stride !== 20) throw new Error(`Formato Hipparcos desconocido: ${stride} bytes/estrella`);
    const stars: HipStar[] = new Array(count);
    for (let i = 0; i < count; i++) {
        const off = 4 + i * stride;
        const modern = stride === 20;
        stars[i] = {
            hip: modern ? view.getUint32(off, true) : i + 1,
            ra:  view.getFloat32(off + (modern ? 4 : 0), true),
            dec: view.getFloat32(off + (modern ? 8 : 4), true),
            mag: view.getFloat32(off + (modern ? 12 : 8), true),
            bv:  view.getFloat32(off + (modern ? 16 : 12), true),
        };
        const star = stars[i];
        if (!Number.isFinite(star.ra) || star.ra < 0 || star.ra >= 360 || !Number.isFinite(star.dec) || Math.abs(star.dec) > 90 || !Number.isFinite(star.mag)) {
            throw new Error('Invalid Hipparcos coordinates or magnitude');
        }
    }
    return stars;
}

/** Singleton: se descarga una sola vez y se cachea en memoria */
let cachedStars: HipStar[] | null = null;
let loadPromise: Promise<HipStar[]> | null = null;

/**
 * Convierte índice B-V a color RGB hex.
 * Tabla basada en la secuencia principal de Ballesteros (2012) y Johnson.
 */
export function bvToHex(bv: number): string {
    // Clamp para evitar valores fuera de rango
    const b = Math.max(-0.4, Math.min(2.0, bv));

    let r: number, g: number, bl: number;

    if (b < -0.35) {
        // Tipo O — azul intenso
        r = 0.63; g = 0.72; bl = 1.00;
    } else if (b < 0.0) {
        // Tipo B — azul-blanco
        const t = (b + 0.35) / 0.35;
        r = 0.63 + t * 0.17;
        g = 0.72 + t * 0.16;
        bl = 1.00;
    } else if (b < 0.15) {
        // Tipo A — blanco
        const t = b / 0.15;
        r = 0.80 + t * 0.10;
        g = 0.88 + t * 0.08;
        bl = 1.00;
    } else if (b < 0.40) {
        // Tipo F — blanco-amarillo
        const t = (b - 0.15) / 0.25;
        r = 0.90 + t * 0.08;
        g = 0.96 + t * 0.02;
        bl = 1.00 - t * 0.10;
    } else if (b < 0.75) {
        // Tipo G — amarillo (como el Sol: B-V ≈ 0.63)
        const t = (b - 0.40) / 0.35;
        r = 0.98 + t * 0.02;
        g = 0.98 - t * 0.08;
        bl = 0.90 - t * 0.25;
    } else if (b < 1.15) {
        // Tipo K — naranja
        const t = (b - 0.75) / 0.40;
        r = 1.00;
        g = 0.90 - t * 0.22;
        bl = 0.65 - t * 0.33;
    } else {
        // Tipo M — rojo-naranja
        const t = Math.min((b - 1.15) / 0.85, 1.0);
        r = 1.00;
        g = 0.68 - t * 0.22;
        bl = 0.32 - t * 0.22;
    }

    const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/**
 * Carga el catálogo Hipparcos desde /hipparcos.bin.
 * La segunda llamada devuelve el caché sin red.
 */
export async function loadHipparcos(): Promise<HipStar[]> {
    if (cachedStars) return cachedStars;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch('/hipparcos.bin?v=2', { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const buf = await res.arrayBuffer();
            const stars = parseHipparcos(buf);

            cachedStars = stars;
            return stars;
        } catch (err) {
            clearTimeout(timer);
            console.warn('[Hipparcos] No se pudo cargar el catálogo:', err);
            cachedStars = [];
            return [];
        }
    })();

    return loadPromise;
}
