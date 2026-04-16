/**
 * API Route: GET /api/tle/starlink
 *
 * Proxy server-side para los TLE de la constelación Starlink.
 * Celestrak bloquea peticiones directas desde el browser (403/CORS).
 * Este proxy pasa la petición desde el servidor de Next.js y
 * cachea el resultado 4 horas (los TLE se actualizan 1-2 veces al día).
 */

import { NextResponse } from 'next/server';

const STARLINK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';

// Cache en proceso: TTL 4 horas
let _cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 4 * 3600 * 1000;

export async function GET() {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return new NextResponse(_cache.data, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    try {
        const controller = new AbortController();
        // Starlink tiene ~6000 líneas — dar 15 s
        const timer = setTimeout(() => controller.abort(), 15_000);

        const res = await fetch(STARLINK_URL, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)',
            },
        });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`Celestrak Starlink HTTP ${res.status}`);

        const text = await res.text();
        _cache = { ts: Date.now(), data: text };

        return new NextResponse(text, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    } catch (err) {
        console.error('[/api/tle/starlink] fetch error:', err);
        return NextResponse.json({ error: 'TLE fetch failed' }, { status: 502 });
    }
}
