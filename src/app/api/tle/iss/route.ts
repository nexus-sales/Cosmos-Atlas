/**
 * API Route: GET /api/tle/iss
 *
 * Proxy server-side para el TLE de la ISS.
 * Celestrak bloquea peticiones directas desde el browser (403/CORS).
 * Este proxy pasa la petición desde el servidor de Next.js, donde
 * no hay restricciones CORS, y cachea el resultado 2 horas.
 */

import { NextResponse } from 'next/server';

// Celestrak no requiere auth para peticiones server-side
const ISS_URL = 'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle';

// Cache en proceso: TTL 2 horas (los TLE se actualizan varias veces al día)
let _cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 2 * 3600 * 1000;

export async function GET() {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return new NextResponse(_cache.data, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(ISS_URL, {
            signal: controller.signal,
            headers: {
                // Identificarse correctamente ante Celestrak
                'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)',
            },
        });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`Celestrak ISS HTTP ${res.status}`);

        const text = await res.text();
        _cache = { ts: Date.now(), data: text };

        return new NextResponse(text, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    } catch (err) {
        console.error('[/api/tle/iss] fetch error:', err);
        return NextResponse.json({ error: 'TLE fetch failed' }, { status: 502 });
    }
}
