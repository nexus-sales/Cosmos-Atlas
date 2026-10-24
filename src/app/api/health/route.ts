import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/server/rateLimit';

type Probe = { ok: boolean; status: number | null; latencyMs: number; error?: string };
let deepCache: { ts: number; probes: Record<string, Probe> } | null = null;
const PROBE_TTL = 5 * 60 * 1000;

async function probe(url: string, timeoutMs = 4_000): Promise<Probe> {
    const started = Date.now();
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(timeoutMs),
            headers: { 'User-Agent': 'CosmosAtlas-health/3.6' },
            cache: 'no-store',
        });
        await response.body?.cancel().catch(() => undefined);
        return { ok: response.ok, status: response.status, latencyMs: Date.now() - started };
    } catch (error) {
        return {
            ok: false,
            status: null,
            latencyMs: Date.now() - started,
            error: error instanceof Error ? error.name : 'unknown',
        };
    }
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const deep = url.searchParams.get('deep') === '1';
    const base = {
        status: 'ok',
        version: process.env.npm_package_version ?? '3.6.0',
        timestamp: new Date().toISOString(),
        runtime: process.env.VERCEL ? 'vercel' : 'node',
        distributedRateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        optionalServices: {
            openai: Boolean(process.env.OPENAI_API_KEY),
            supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
    };
    if (!deep) return NextResponse.json(base, { headers: { 'Cache-Control': 'no-store' } });

    const limit = await checkRateLimit(request, { namespace: 'health-deep', max: 12, windowMs: 10 * 60 * 1000 });
    if (!limit.ok) return rateLimitResponse(limit);
    if (!deepCache || Date.now() - deepCache.ts > PROBE_TTL) {
        const results = await Promise.all([
            probe('https://huggingface.co/datasets/juliensimon/starlink-tle-latest/resolve/main/data/starlink.tle'),
            probe('https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oI/A?M31'),
            probe('https://ssd-api.jpl.nasa.gov/sbdb_query.api?fields=pdes&sb-kind=c&limit=1'),
            probe('https://api.open-meteo.com/v1/forecast?latitude=28.47&longitude=-16.30&current=temperature_2m'),
        ]);
        deepCache = {
            ts: Date.now(),
            probes: Object.fromEntries(['starlink', 'sesame', 'jpl', 'openMeteo'].map((name, index) => [name, results[index]])),
        };
    }
    const degraded = Object.values(deepCache.probes).some((item) => !item.ok);
    return NextResponse.json(
        { ...base, status: degraded ? 'degraded' : 'ok', providers: deepCache.probes },
        { status: degraded ? 207 : 200, headers: { 'Cache-Control': 'public, s-maxage=300' } },
    );
}
