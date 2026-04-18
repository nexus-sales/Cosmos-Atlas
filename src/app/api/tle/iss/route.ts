/**
 * API Route: GET /api/tle/iss
 *
 * Proxy server-side para el TLE de la ISS con fallback entre fuentes.
 * Cache 2 horas (los TLE se actualizan varias veces al día).
 */

import { NextResponse } from 'next/server';

const ISS_SOURCES = [
    'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle',
    'https://celestrak.com/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle',
    'https://celestrak.org/satcat/tle.php?CATNR=25544',
];

let _cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 2 * 3600 * 1000;

async function fetchTLE(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)' },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

export async function GET() {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return new NextResponse(_cache.data, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    for (const url of ISS_SOURCES) {
        try {
            const text = await fetchTLE(url);
            _cache = { ts: Date.now(), data: text };
            return new NextResponse(text, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        } catch (err) {
            console.warn(`[/api/tle/iss] failed ${url}:`, (err as Error).message);
        }
    }

    console.error('[/api/tle/iss] all sources failed');
    return NextResponse.json({ error: 'TLE fetch failed' }, { status: 502 });
}
