/**
 * Factory para rutas API de proxy de TLE (Two-Line Element) por NORAD ID.
 * Cadena de fuentes con fallback:
 *   1. celestrak.org (GP API, puede dar 403 desde servidores)
 *   2. celestrak.com (mirror, puede estar caído)
 *   3. tle.ivanstanojevic.me (JSON API open, muy fiable como fallback)
 */

import { NextResponse } from 'next/server';
import { checkRateLimit, isAllowedOrigin, rateLimitResponse } from '@/lib/server/rateLimit';

const TLE_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
};

/** Descarga TLE en formato texto plano desde celestrak */
async function fetchTlePlain(url: string, timeoutMs = 5000): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'CosmosAtlas/1.0 (educational planetarium; contact admin@nexus-sales.eu)',
                'Accept': 'text/plain,*/*',
            },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (text.split('\n').filter(l => l.trim()).length < 3) {
            throw new Error('Response too short to be valid TLE data');
        }
        return text;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Descarga TLE desde tle.ivanstanojevic.me (API JSON → convierte a formato TLE de texto).
 * Formato JSON: { name, line1, line2 }
 */
async function fetchTleIvanstanojevic(catnr: string, timeoutMs = 5000): Promise<string> {
    const url = `https://tle.ivanstanojevic.me/api/tle/${catnr}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)' },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as { name?: string; line1?: string; line2?: string };
        if (!json.line1 || !json.line2) throw new Error('Missing line1/line2 in JSON response');
        // Reconstruct TLE text format
        const name = (json.name ?? `CATNR ${catnr}`).padEnd(24).slice(0, 24).trimEnd();
        return `${name}\n${json.line1}\n${json.line2}\n`;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Crea un handler GET que sirve el TLE de un NORAD ID concreto, con
 * fallback entre celestrak.org, celestrak.com y tle.ivanstanojevic.me.
 * Cache en proceso para no saturar fuentes externas.
 */
export function createTleRouteHandler(catnr: string, label: string, cacheTtlMs = 2 * 3600 * 1000) {
    let cache: { ts: number; data: string } | null = null;

    const response = (data: string, source: string) => new NextResponse(data, {
        headers: { ...TLE_HEADERS, 'X-Astronomy-Source': source },
    });

    return async function GET(request: Request) {
        if (!isAllowedOrigin(request)) {
            return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
        }
        if (cache && Date.now() - cache.ts < cacheTtlMs) {
            return response(cache.data, 'server cache');
        }

        const limit = await checkRateLimit(request, { namespace: `tle-${label}`, max: 30, windowMs: 10 * 60_000 });
        if (!limit.ok) return rateLimitResponse(limit);

        try {
            const text = await fetchTleIvanstanojevic(catnr);
            cache = { ts: Date.now(), data: text };
            return response(text, 'tle.ivanstanojevic.me');
        } catch (err) {
            console.warn(`[/api/tle/${label}] ivanstanojevic failed:`, (err as Error).message);
        }

        // ── Fuentes plain-text (celestrak) ────────────────────────────────────
        const plainSources = [
            `https://celestrak.org/NORAD/elements/gp.php?CATNR=${catnr}&FORMAT=tle`,
            `https://celestrak.com/NORAD/elements/gp.php?CATNR=${catnr}&FORMAT=tle`,
        ];

        for (const url of plainSources) {
            try {
                const text = await fetchTlePlain(url);
                cache = { ts: Date.now(), data: text };
                return response(text, new URL(url).host);
            } catch (err) {
                console.warn(`[/api/tle/${label}] failed ${url}:`, (err as Error).message);
            }
        }

        console.error(`[/api/tle/${label}] all sources failed`);
        return NextResponse.json({ error: 'TLE fetch failed' }, { status: 502 });
    };
}
