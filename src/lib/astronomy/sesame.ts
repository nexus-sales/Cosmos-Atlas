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
        const base = process.env.NEXT_PUBLIC_SESAME_URL
            ?? 'https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oIJ/A';
        const url = `${base}?${encodeURIComponent(query)}`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!response.ok) {
            _sesameCache.set(key, null);
            return null;
        }

        const text = await response.text();
        if (text.startsWith('#') || !text.trim().startsWith('{')) {
            _sesameCache.set(key, null);
            return null;
        }

        const data = JSON.parse(text);

        const target = data.Target;
        if (!target || !target.Resolver) {
            _sesameCache.set(key, null);
            return null;
        }

        const resolvers = Array.isArray(target.Resolver) ? target.Resolver : [target.Resolver];
        const bestResolver = resolvers.find((r: any) => r.jpos) || resolvers[0];

        if (!bestResolver || !bestResolver.jpos) {
            _sesameCache.set(key, null);
            return null;
        }

        const ra = parseFloat(bestResolver.jradeg);
        const dec = parseFloat(bestResolver.jdedeg);

        if (isNaN(ra) || isNaN(dec)) {
            _sesameCache.set(key, null);
            return null;
        }

        const result: SesameResolution = {
            name: bestResolver.oname || query,
            ra,
            dec,
            type: bestResolver.otype,
            mag: parseFloat(bestResolver.vmag),
            source: bestResolver._name as any,
        };

        _sesameCache.set(key, result);
        return result;
    } catch (error) {
        clearTimeout(timer);
        if ((error as any)?.name === 'AbortError') {
            console.warn('[Sesame] Timeout al resolver:', query);
        } else {
            console.error('[Sesame] Error de conexión:', error);
        }
        // No cachear errores de red — el usuario puede reintentar
        return null;
    }
}
