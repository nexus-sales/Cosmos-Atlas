/**
 * API Route: GET /api/tle/starlink
 *
 * Proxy server-side para TLEs de Starlink con cadena de fallback.
 * Cadena de fuentes:
 *   1. celestrak.org GP API (puede dar 403 desde servidores)
 *   2. celestrak.com (mirror)
 *   3. celestrak.org supplemental (datos más recientes de operadores)
 *   4. tle.ivanstanojevic.me colección (JSON paginado → convierte a TLE texto)
 * Cache en proceso de 4 horas.
 */

import { NextResponse } from 'next/server';

// Cache en proceso: TTL 4 horas
let _cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 4 * 3600 * 1000;
const TLE_HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=7200',
};

const PLAIN_SOURCES = [
    // CelesTrak GP API (primaria)
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    // CelesTrak dominio alternativo
    'https://celestrak.com/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    // CelesTrak supplemental (datos más recientes de operadores)
    'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle',
];

async function fetchTlePlain(url: string, timeoutMs = 12_000): Promise<string> {
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
        // Validate: a Starlink TLE file should have many lines (100+ satellites)
        if (text.split('\n').filter(l => l.trim()).length < 6) {
            throw new Error('Response too short to be valid TLE data');
        }
        return text;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Fallback: tle.ivanstanojevic.me colección Starlink (JSON paginado).
 * Descarga hasta 3 páginas de 100 satélites y reconstruye el formato TLE texto.
 */
async function fetchStarlinkIvanstanojevic(timeoutMs = 15_000): Promise<string> {
    const lines: string[] = [];
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
        const url = `https://tle.ivanstanojevic.me/api/tle/collection/starlink?page=${page}&page-size=100`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'CosmosAtlas/1.0 (educational planetarium)' },
            });
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json() as {
                member?: Array<{ name?: string; line1?: string; line2?: string }>;
            };
            const members = json.member ?? [];
            if (members.length === 0) break;
            for (const sat of members) {
                if (sat.line1 && sat.line2) {
                    const name = (sat.name ?? 'STARLINK').padEnd(24).slice(0, 24).trimEnd();
                    lines.push(name, sat.line1, sat.line2);
                }
            }
            if (members.length < 100) break; // última página
        } catch (err) {
            clearTimeout(timer);
            // Si la primera página falla, relanzar; si no, usar lo que tenemos
            if (page === 1) throw err;
            break;
        }
    }

    if (lines.length < 6) throw new Error('ivanstanojevic returned too few Starlink satellites');
    return lines.join('\n') + '\n';
}

export async function GET() {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return new NextResponse(_cache.data, { headers: TLE_HEADERS });
    }

    // ── 1–3: Fuentes plain-text CelesTrak ────────────────────────────────────
    for (const url of PLAIN_SOURCES) {
        try {
            const text = await fetchTlePlain(url);
            _cache = { ts: Date.now(), data: text };
            return new NextResponse(text, { headers: TLE_HEADERS });
        } catch (err) {
            console.warn(`[/api/tle/starlink] failed ${url}:`, (err as Error).message);
        }
    }

    // ── 4: Fallback tle.ivanstanojevic.me (JSON paginado) ───────────────────
    try {
        const text = await fetchStarlinkIvanstanojevic();
        _cache = { ts: Date.now(), data: text };
        return new NextResponse(text, { headers: TLE_HEADERS });
    } catch (err) {
        console.warn('[/api/tle/starlink] ivanstanojevic fallback failed:', (err as Error).message);
    }

    console.error('[/api/tle/starlink] all sources failed');
    return NextResponse.json({ error: 'TLE fetch failed — all sources unavailable' }, { status: 502 });
}
