/**
 * API Route: GET /api/sesame?q=<name>
 * Proxy server-side para CDS Sesame (SIMBAD/NED) — evita CORS desde el navegador.
 */

import { NextRequest, NextResponse } from 'next/server';

const SESAME_BASE = 'https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oIJ/A';
const TIMEOUT_MS = 8000;
const CACHE_TTL = 6 * 3600 * 1000;
const MAX_CACHE_ENTRIES = 250;
const MAX_QUERY_LENGTH = 80;

const _cache = new Map<string, { ts: number; data: object | null }>();

function cacheSet(key: string, data: object | null) {
    if (_cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = _cache.keys().next().value;
        if (oldestKey) _cache.delete(oldestKey);
    }
    _cache.set(key, { ts: Date.now(), data });
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
        return NextResponse.json({ error: 'query too short' }, { status: 400 });
    }
    if (q.length > MAX_QUERY_LENGTH) {
        return NextResponse.json({ error: 'query too long' }, { status: 413 });
    }

    const key = q.toLowerCase();
    if (_cache.has(key)) {
        const cached = _cache.get(key);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
            if (!cached.data) return NextResponse.json(null, { status: 404 });
            return NextResponse.json(cached.data);
        }
        _cache.delete(key);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const url = `${SESAME_BASE}?${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
            cacheSet(key, null);
            return NextResponse.json(null, { status: 404 });
        }

        const text = await res.text();
        if (text.startsWith('#') || !text.trim().startsWith('{')) {
            cacheSet(key, null);
            return NextResponse.json(null, { status: 404 });
        }

        const data = JSON.parse(text);
        cacheSet(key, data);
        return NextResponse.json(data);
    } catch (err) {
        clearTimeout(timer);
        console.error('[/api/sesame] error:', err);
        return NextResponse.json({ error: 'sesame fetch failed' }, { status: 502 });
    }
}
