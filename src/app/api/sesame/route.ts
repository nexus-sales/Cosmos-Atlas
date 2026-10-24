/** Proxy normalizado para CDS Sesame (SIMBAD/NED/VizieR). */
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, isAllowedOrigin, rateLimitResponse } from '@/lib/server/rateLimit';
import { parseSesame, type SesameApiResolution } from '@/lib/astronomy/sesameParser';

const SESAME_BASE = 'https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oI/A';
const TIMEOUT_MS = 8000;
const POSITIVE_TTL = 6 * 3600 * 1000;
const NEGATIVE_TTL = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 250;
const MAX_QUERY_LENGTH = 80;

const cache = new Map<string, { ts: number; data: SesameApiResolution | null }>();

function cacheSet(key: string, data: SesameApiResolution | null) {
    if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { ts: Date.now(), data });
}

export async function GET(req: NextRequest) {
    if (!isAllowedOrigin(req)) return NextResponse.json({ error: 'origin not allowed' }, { status: 403 });
    const q = req.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 2) return NextResponse.json({ error: 'query too short' }, { status: 400 });
    if (q.length > MAX_QUERY_LENGTH) return NextResponse.json({ error: 'query too long' }, { status: 413 });

    const key = q.toLowerCase();
    const cached = cache.get(key);
    if (cached) {
        const ttl = cached.data ? POSITIVE_TTL : NEGATIVE_TTL;
        if (Date.now() - cached.ts < ttl) {
            return cached.data ? NextResponse.json(cached.data) : NextResponse.json({ error: 'object not found' }, { status: 404 });
        }
        cache.delete(key);
    }

    const limit = await checkRateLimit(req, { namespace: 'sesame', max: 30, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) return rateLimitResponse(limit);

    try {
        const res = await fetch(`${SESAME_BASE}?${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!res.ok) return NextResponse.json({ error: 'sesame upstream unavailable' }, { status: 502 });
        const data = parseSesame(await res.text());
        if (!data) {
            cacheSet(key, null);
            return NextResponse.json({ error: 'object not found' }, { status: 404 });
        }
        cacheSet(key, data);
        return NextResponse.json(data);
    } catch (err) {
        console.error('[/api/sesame] error:', err);
        return NextResponse.json({ error: 'sesame fetch failed' }, { status: 502 });
    }
}
