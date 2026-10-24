/**
 * Service to resolve celestial object names using CDS Sesame (SIMBAD/NED/VizieR)
 * Documentation: https://cdsweb.u-strasbg.fr/cgi-bin/Sesame
 */

export interface SesameResolution {
    name: string;
    ra: number; // Decimal degrees
    dec: number; // Decimal degrees
    type?: string;
    mag?: number;
    source: 'SIMBAD' | 'NED' | 'VizieR';
}

/** Cache en memoria — evita consultar SIMBAD dos veces por el mismo nombre */
const _sesameCache = new Map<string, SesameResolution | null>();

const TIMEOUT_MS = 8000;

/**
 * Resolver names via CDS Sesame.
 * - Timeout de 8 s con AbortController
 * - Cache en memoria para evitar peticiones duplicadas
 */
export async function resolveObjectName(query: string): Promise<SesameResolution | null> {
    if (!query || query.length < 2) return null;

    const key = query.trim().toLowerCase();

    // Devolver resultado cacheado (incluido null = "no encontrado")
    if (_sesameCache.has(key)) return _sesameCache.get(key)!;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        // -oIJ means JSON output
        const url = `/api/sesame?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!response.ok) {
            _sesameCache.set(key, null);
            return null;
        }

        const data = await response.json() as Partial<SesameResolution>;
        const ra = Number(data.ra);
        const dec = Number(data.dec);

        if (isNaN(ra) || isNaN(dec)) {
            _sesameCache.set(key, null);
            return null;
        }

        const result: SesameResolution = {
            name: data.name || query,
            ra,
            dec,
            type: data.type,
            mag: data.mag,
            source: data.source ?? 'SIMBAD',
        };

        _sesameCache.set(key, result);
        return result;
    } catch (error) {
        clearTimeout(timer);
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('[Sesame] Timeout al resolver:', query);
        } else {
            console.error('[Sesame] Error de conexión:', error);
        }
        // No cachear errores de red — el usuario puede reintentar
        return null;
    }
}
