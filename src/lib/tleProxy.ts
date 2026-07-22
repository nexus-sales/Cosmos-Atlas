/**
 * Factory para rutas API de proxy de TLE (Two-Line Element) por NORAD ID.
 * Mismo patron que ya usaba /api/tle/iss (fallback entre dominios de
 * Celestrak + cache en proceso), extraido para no duplicarlo en cada
 * satelite nuevo.
 */

import { NextResponse } from 'next/server';

const TLE_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
};

async function fetchTLE(url: string, timeoutMs = 8000): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)' },
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
 * Crea un handler GET que sirve el TLE de un NORAD ID concreto, con
 * fallback entre celestrak.org y celestrak.com, y cache en proceso.
 */
export function createTleRouteHandler(catnr: string, label: string, cacheTtlMs = 2 * 3600 * 1000) {
    const sources = [
        `https://celestrak.org/NORAD/elements/gp.php?CATNR=${catnr}&FORMAT=tle`,
        `https://celestrak.com/NORAD/elements/gp.php?CATNR=${catnr}&FORMAT=tle`,
    ];

    let cache: { ts: number; data: string } | null = null;

    return async function GET() {
        if (cache && Date.now() - cache.ts < cacheTtlMs) {
            return new NextResponse(cache.data, { headers: TLE_HEADERS });
        }

        for (const url of sources) {
            try {
                const text = await fetchTLE(url);
                cache = { ts: Date.now(), data: text };
                return new NextResponse(text, { headers: TLE_HEADERS });
            } catch (err) {
                console.warn(`[/api/tle/${label}] failed ${url}:`, (err as Error).message);
            }
        }

        console.error(`[/api/tle/${label}] all sources failed`);
        return NextResponse.json({ error: 'TLE fetch failed' }, { status: 502 });
    };
}
