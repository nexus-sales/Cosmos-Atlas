import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, isAllowedOrigin, rateLimitResponse } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

interface GaiaSource {
    sourceId: string;
    healpix8: number;
    ra: number;
    dec: number;
    mag: number;
    bpRp: number | null;
    pmRa: number | null;
    pmDec: number | null;
}

const cache = new Map<string, { expires: number; sources: GaiaSource[] }>();
const ESA_TAP = 'https://gea.esac.esa.int/tap-server/tap/sync';

function numeric(value: string | null, fallback: number) {
    if (value === null || value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function nullable(value: string | undefined) {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(csv: string): GaiaSource[] {
    return csv.trim().split(/\r?\n/).slice(1).flatMap((line) => {
        const columns = line.split(',').map((value) => value.replace(/^"|"$/g, '').trim());
        if (columns.length < 4 || !/^\d+$/.test(columns[0])) return [];
        const sourceId = columns[0];
        return [{
            sourceId,
            // Gaia source_id embeds nested HEALPix; order 8 divisor = 2^(59 - 2*8).
            healpix8: Number(BigInt(sourceId) / BigInt('8796093022208')),
            ra: Number(columns[1]),
            dec: Number(columns[2]),
            mag: Number(columns[3]),
            bpRp: nullable(columns[4]),
            pmRa: nullable(columns[5]),
            pmDec: nullable(columns[6]),
        }];
    }).filter((source) => Number.isFinite(source.ra) && Number.isFinite(source.dec) && Number.isFinite(source.mag));
}

export async function GET(request: NextRequest) {
    if (!isAllowedOrigin(request)) {
        return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
    }
    const params = request.nextUrl.searchParams;
    const ra = numeric(params.get('ra'), NaN);
    const dec = numeric(params.get('dec'), NaN);
    const radius = Math.min(10, Math.max(0.15, numeric(params.get('radius'), 2)));
    const mag = Math.min(17, Math.max(8, numeric(params.get('mag'), 12)));
    const limit = Math.min(6000, Math.max(100, Math.round(numeric(params.get('limit'), 2000))));
    if (!Number.isFinite(ra) || !Number.isFinite(dec) || ra < 0 || ra >= 360 || dec < -90 || dec > 90) {
        return NextResponse.json({ error: 'Coordenadas ICRS no válidas.' }, { status: 400 });
    }

    const key = `${ra.toFixed(3)}:${dec.toFixed(3)}:${radius.toFixed(2)}:${mag.toFixed(1)}:${limit}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
        return NextResponse.json({ release: 'Gaia DR3', epoch: 2016, cached: true, sources: cached.sources });
    }

    const rateLimit = await checkRateLimit(request, { namespace: 'gaia', max: 60, windowMs: 10 * 60_000 });
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);

    // Hipparcos ya cubre las estrellas visibles a simple vista. Gaia solo añade
    // profundidad al ampliar, evitando duplicar las fuentes brillantes.
    const query = `SELECT TOP ${limit} source_id,ra,dec,phot_g_mean_mag,bp_rp,pmra,pmdec FROM gaiadr3.gaia_source_lite WHERE 1=CONTAINS(POINT('ICRS',ra,dec),CIRCLE('ICRS',${ra.toFixed(6)},${dec.toFixed(6)},${radius.toFixed(4)})) AND phot_g_mean_mag >= 7.1 AND phot_g_mean_mag < ${mag.toFixed(2)} ORDER BY phot_g_mean_mag`;
    const body = new URLSearchParams({ REQUEST: 'doQuery', LANG: 'ADQL', FORMAT: 'csv', QUERY: query });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
        const response = await fetch(ESA_TAP, { method: 'POST', body, signal: controller.signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, cache: 'no-store' });
        if (!response.ok) throw new Error(`Gaia TAP HTTP ${response.status}`);
        const sources = parseCsv(await response.text());
        cache.set(key, { expires: Date.now() + 10 * 60_000, sources });
        if (cache.size > 48) cache.delete(cache.keys().next().value!);
        return NextResponse.json({ release: 'Gaia DR3', epoch: 2016, cached: false, sources }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800', 'X-Astronomy-Source': 'ESA Gaia Archive TAP' },
        });
    } catch (error) {
        const message = error instanceof Error && error.name === 'AbortError' ? 'Tiempo de espera agotado consultando Gaia.' : 'El archivo Gaia no está disponible temporalmente.';
        return NextResponse.json({ error: message }, { status: 503 });
    } finally {
        clearTimeout(timeout);
    }
}
