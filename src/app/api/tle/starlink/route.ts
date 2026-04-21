/**
 * API Route: GET /api/tle/starlink
 *
 * Proxy server-side para TLEs de Starlink con cadena de fallback.
 * CelesTrak a veces devuelve 502/403 — se intentan múltiples fuentes.
 * Cache en proceso de 4 horas.
 */

import { NextResponse } from 'next/server';

const TLE_SOURCES = [
    // CelesTrak GP API (primaria)
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    // CelesTrak dominio alternativo
    'https://celestrak.com/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    // CelesTrak supplemental (datos más recientes de operadores)
    'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle',
];

// Cache en proceso: TTL 4 horas
let _cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 4 * 3600 * 1000;
const TLE_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=7200',
};

async function fetchTLE(url: string, timeoutMs = 12_000): Promise<string> {
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
        // Validate: a TLE file must have at least a few lines
        if (text.split('\n').filter(l => l.trim()).length < 6) {
            throw new Error('Response too short to be valid TLE data');
        }
        return text;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

export async function GET() {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return new NextResponse(_cache.data, {
            headers: TLE_HEADERS,
        });
    }

    for (const url of TLE_SOURCES) {
        try {
            const text = await fetchTLE(url);
            _cache = { ts: Date.now(), data: text };
            return new NextResponse(text, {
                headers: TLE_HEADERS,
            });
        } catch (err) {
            console.warn(`[/api/tle/starlink] failed ${url}:`, (err as Error).message);
        }
    }

    console.error('[/api/tle/starlink] all sources failed');
    return NextResponse.json({ error: 'TLE fetch failed — all sources unavailable' }, { status: 502 });
}
