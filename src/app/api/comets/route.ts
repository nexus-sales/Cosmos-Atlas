/**
 * API Route: GET /api/comets
 *
 * Fetches active comet orbital elements from JPL SBDB (Small-Body Database Query API).
 * Server-side — avoids CORS issues when querying JPL from the browser.
 *
 * Returns a subset of JF (Jupiter-family) + HT (Halley-type) comets with
 * orbital elements in the format expected by cometOrbits.ts.
 *
 * Response format:
 * {
 *   ok: true,
 *   comets: CometLiveData[]
 * }
 */

import { NextResponse } from 'next/server';

export interface CometLiveData {
    pdes: string;        // Primary designation, e.g. "12P"
    name: string;        // Full name
    e: number;           // Eccentricity
    q: number;           // Perihelion distance (AU)
    i: number;           // Inclination (degrees)
    om: number;          // Longitude of ascending node (degrees)
    w: number;           // Argument of perihelion (degrees)
    tp: number;          // JD of perihelion passage
    per: number | null;  // Orbital period (years), null for one-shot comets
    M1: number | null;   // Absolute magnitude H
}

const SBDB_URL =
    'https://ssd-api.jpl.nasa.gov/sbdb_query.api' +
    '?fields=pdes,full_name,e,q,i,om,w,tp,per,M1' +
    '&sb-kind=c' +           // comets only
    '&limit=60' +            // wider net to filter post-process
    '&sort=-tp' +            // most recent perihelion first -- current API syntax is a
                             // single "sort=-field" param (minus prefix = descending);
                             // the old "sort=tp&dir=desc" 400'd because `dir` was never a
                             // real parameter. Without this, the default order is
                             // alphabetical by pdes (1P, 2P, 3D...), so `limit=60` would
                             // always return the same low-numbered periodic comets and
                             // never anything with a "C/" designation or a high number --
                             // exactly the ones actually relevant right now.
    '&full-prec=true';       // valid boolean param, confirmed against the live API

// Simple in-process cache: TTL 24 hours
let _cache: { ts: number; data: CometLiveData[] } | null = null;
const CACHE_TTL = 24 * 3600 * 1000;
let _retryAfter = 0;
const FAILURE_RETRY_DELAY = 5 * 60 * 1000;
// 5 s is enough for JPL (responds in <3 s when healthy).
// Keeping under 6 s avoids the Next.js dev-proxy timeout (≈10 s including ~4 s compilation overhead).
const UPSTREAM_TIMEOUT = 5_000;
const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
};
const DEGRADED_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

function degradedResponse() {
    return NextResponse.json(
        {
            ok: true,
            comets: _cache?.data ?? [],
            stale: Boolean(_cache),
            degraded: true,
        },
        { headers: DEGRADED_CACHE_HEADERS }
    );
}

function isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === 'AbortError';
}

function parseField(v: string | null | undefined, fallback = 0): number {
    if (v == null) return fallback;
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
}

function parseOptionalField(v: string | null | undefined): number | null {
    if (v == null) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
}

function mapName(pdes: string, fullName: string): string {
    // fullName is like "1P/Halley (1682 Q1)" — extract the canonical part
    const match = fullName.match(/^[\w\/\-\s]+\(?\s*\d{4}/);
    if (match) return match[0].trim().replace(/\s*\($/, '');
    return fullName.split('(')[0].trim() || pdes;
}

export async function GET() {
    // Serve from cache if fresh
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
        return NextResponse.json({ ok: true, comets: _cache.data }, { headers: CACHE_HEADERS });
    }

    // JPL can occasionally be slow or unavailable. Avoid making every client
    // wait for the same timeout while the local static catalog remains usable.
    if (Date.now() < _retryAfter) return degradedResponse();

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const controller = new AbortController();
        timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

        const res = await fetch(SBDB_URL, { signal: controller.signal });

        if (!res.ok) throw new Error(`SBDB HTTP ${res.status}`);

        const json: {
            fields: string[];
            data: (string | null)[][];
        } = await res.json();

        const { fields, data } = json;
        const fi = (name: string) => fields.indexOf(name);
        const iDes   = fi('pdes');
        const iFull  = fi('full_name');
        const iE     = fi('e');
        const iQ     = fi('q');
        const iI     = fi('i');
        const iOm    = fi('om');
        const iW     = fi('w');
        const iTp    = fi('tp');
        const iPer   = fi('per');
        const iM1    = fi('M1');

        if ([iDes, iFull, iE, iQ, iI, iOm, iW, iTp, iPer, iM1].some((idx) => idx < 0)) {
            throw new Error('SBDB payload missing expected fields');
        }

        const comets: CometLiveData[] = data
            .map((row) => {
                const pdes = row[iDes] ?? '';
                const fullName = row[iFull] ?? pdes;
                const perDays = parseOptionalField(row[iPer]);
                return {
                    pdes,
                    name: mapName(pdes, fullName),
                    e:  parseField(row[iE]),
                    q:  parseField(row[iQ]),
                    i:  parseField(row[iI]),
                    om: parseField(row[iOm]),
                    w:  parseField(row[iW]),
                    tp: parseField(row[iTp]),
                    per: perDays == null ? null : perDays / 365.25,
                    M1: parseOptionalField(row[iM1]),
                } satisfies CometLiveData;
            })
            .filter((c) => {
                if (c.tp <= 0 || c.q <= 0 || c.e <= 0) return false;
                // Perihelio en ventana ±3 años desde hoy (JD actual ≈ 2451545 + days since J2000)
                const nowJD = Date.now() / 86_400_000 + 2440587.5;
                const windowDays = 3 * 365.25;
                if (c.tp < nowJD - windowDays || c.tp > nowJD + windowDays) return false;
                // Solo cometas brillantes (M1 < 13 o desconocido — dejamos pasar)
                if (c.M1 !== null && c.M1 > 13) return false;
                return true;
            })
            .slice(0, 30);

        _cache = { ts: Date.now(), data: comets };
        _retryAfter = 0;
        return NextResponse.json({ ok: true, comets }, { headers: CACHE_HEADERS });
    } catch (err) {
        _retryAfter = Date.now() + FAILURE_RETRY_DELAY;
        if (!isAbortError(err)) {
            console.error('[/api/comets] JPL fetch failed:', err);
        }
        return degradedResponse();
    } finally {
        if (timer) clearTimeout(timer);
    }
}
