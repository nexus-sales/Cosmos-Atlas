/** Starlink TLE proxy with real, independently hosted fallbacks. */
import { NextResponse } from 'next/server';
import { checkRateLimit, isAllowedOrigin, rateLimitResponse } from '@/lib/server/rateLimit';
import { limitTleCatalog } from '@/lib/astronomy/starlinkTle';

let cache: { ts: number; data: string } | null = null;
const CACHE_TTL = 4 * 3600 * 1000;
const MAX_SATELLITES = 1200;
const HEADERS = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
};

const HF_DAILY_TLE = 'https://huggingface.co/datasets/juliensimon/starlink-tle-latest/resolve/main/data/starlink.tle';
const CELESTRAK_SOURCES = [
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=STARLINK&FORMAT=TLE',
    'https://celestrak.com/NORAD/elements/gp.php?GROUP=STARLINK&FORMAT=TLE',
    'https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=TLE',
];

async function fetchPlain(url: string, timeoutMs: number) {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
            Accept: 'text/plain,*/*',
            'User-Agent': 'CosmosAtlas/3.6 (educational planetarium; admin@nexus-sales.eu)',
        },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return limitTleCatalog(await response.text(), MAX_SATELLITES);
}

async function fetchIvan(timeoutMs = 5_000) {
    const response = await fetch('https://tle.ivanstanojevic.me/api/tle?search=starlink&page=1&page-size=50', {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': 'CosmosAtlas/3.6 (educational planetarium)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json() as { member?: Array<{ name?: string; line1?: string; line2?: string }> };
    const text = (json.member ?? [])
        .filter((sat) => sat.line1 && sat.line2)
        .flatMap((sat) => [(sat.name ?? 'STARLINK').slice(0, 24), sat.line1!, sat.line2!])
        .join('\n');
    return limitTleCatalog(text, 50);
}

function tleResponse(data: string, source: string) {
    return new NextResponse(data, { headers: { ...HEADERS, 'X-Astronomy-Source': source } });
}

export async function GET(request: Request) {
    if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'origin not allowed' }, { status: 403 });
    if (cache && Date.now() - cache.ts < CACHE_TTL) return tleResponse(cache.data, 'server cache');

    const limit = await checkRateLimit(request, { namespace: 'tle-starlink', max: 12, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) return rateLimitResponse(limit);

    const sources: Array<{ name: string; load: () => Promise<string> }> = [
        { name: 'Hugging Face daily CelesTrak mirror', load: () => fetchPlain(HF_DAILY_TLE, 8_000) },
        { name: 'NASA TLE API', load: () => fetchIvan() },
        ...CELESTRAK_SOURCES.map((url) => ({ name: new URL(url).hostname, load: () => fetchPlain(url, 5_000) })),
    ];

    for (const source of sources) {
        try {
            const data = await source.load();
            cache = { ts: Date.now(), data };
            return tleResponse(data, source.name);
        } catch (error) {
            console.warn(`[/api/tle/starlink] ${source.name} failed:`, (error as Error).message);
        }
    }
    return NextResponse.json({ error: 'TLE fetch failed — all real sources unavailable' }, { status: 502 });
}
