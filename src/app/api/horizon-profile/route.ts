import { NextRequest, NextResponse } from 'next/server';
import { buildHorizonBands, buildHorizonProfile, destinationPoint, type TerrainSample } from '@/lib/astronomy/horizonProfile';
import { checkRateLimit, isAllowedOrigin, rateLimitResponse } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

const OPEN_METEO_ELEVATION = 'https://api.open-meteo.com/v1/elevation';
const DISTANCES_KM = [0.5, 1, 2, 4, 8, 16, 32, 64];
const AZIMUTHS = Array.from({ length: 36 }, (_, index) => index * 10);
const cache = new Map<string, {
    expires: number;
    profile: ReturnType<typeof buildHorizonProfile>;
    bands: ReturnType<typeof buildHorizonBands>;
    observerElevationM: number;
}>();

async function fetchElevations(points: Array<{ lat: number; lon: number }>) {
    const elevations: number[] = [];
    for (let offset = 0; offset < points.length; offset += 100) {
        if (offset > 0) await new Promise((resolve) => setTimeout(resolve, 1_100));
        const chunk = points.slice(offset, offset + 100);
        const query = new URLSearchParams({
            latitude: chunk.map((point) => point.lat.toFixed(5)).join(','),
            longitude: chunk.map((point) => point.lon.toFixed(5)).join(','),
        });
        let response = await fetch(`${OPEN_METEO_ELEVATION}?${query}`, { signal: AbortSignal.timeout(12_000) });
        if (response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 2_500));
            response = await fetch(`${OPEN_METEO_ELEVATION}?${query}`, { signal: AbortSignal.timeout(12_000) });
        }
        if (!response.ok) throw new Error(`Elevation API HTTP ${response.status}`);
        const payload = await response.json() as { elevation?: number[] };
        if (!payload.elevation || payload.elevation.length !== chunk.length) throw new Error('Respuesta de elevación incompleta');
        elevations.push(...payload.elevation);
    }
    return elevations;
}

export async function GET(request: NextRequest) {
    if (!isAllowedOrigin(request)) {
        return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
    }
    const latParam = request.nextUrl.searchParams.get('lat');
    const lonParam = request.nextUrl.searchParams.get('lon');
    const lat = latParam === null || latParam.trim() === '' ? NaN : Number(latParam);
    const lon = lonParam === null || lonParam.trim() === '' ? NaN : Number(lonParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json({ error: 'Coordenadas WGS84 no válidas.' }, { status: 400 });
    }

    const key = `${lat.toFixed(3)}:${lon.toFixed(3)}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return NextResponse.json({ source: 'Copernicus DEM GLO-90 / Open-Meteo', cached: true, ...cached });

    const rateLimit = await checkRateLimit(request, { namespace: 'horizon', max: 12, windowMs: 10 * 60_000 });
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);

    const sampleMeta = AZIMUTHS.flatMap((azimuth) => DISTANCES_KM.map((distanceKm) => ({ azimuth, distanceKm })));
    const coordinates = [
        { lat, lon },
        ...sampleMeta.map(({ azimuth, distanceKm }) => destinationPoint(lat, lon, azimuth, distanceKm)),
    ];

    try {
        const elevations = await fetchElevations(coordinates);
        const observerElevationM = elevations[0];
        const samples: TerrainSample[] = sampleMeta.map((meta, index) => ({ ...meta, elevationM: elevations[index + 1] }));
        const profile = buildHorizonProfile(observerElevationM, samples);
        const bands = buildHorizonBands(observerElevationM, samples, [2, 8, 32, 64]);
        const entry = { expires: Date.now() + 24 * 60 * 60_000, profile, bands, observerElevationM };
        cache.set(key, entry);
        if (cache.size > 32) cache.delete(cache.keys().next().value!);
        return NextResponse.json({ source: 'Copernicus DEM GLO-90 / Open-Meteo', cached: false, ...entry }, {
            headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
        });
    } catch (error) {
        console.warn('[horizon-profile] elevation lookup failed', error);
        return NextResponse.json({ error: 'No se pudo calcular el relieve local.' }, { status: 503 });
    }
}
