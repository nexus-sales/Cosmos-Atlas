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
    '&sb-kind=c' +           // kind=comet (replaces deprecated sb-class)
    '&sb-cdata=1' +          // include comet-specific data
    '&limit=30' +
    '&sort=tp&dir=desc' +    // most recent perihelion first
    '&full-prec=true';

// Simple in-process cache: TTL 24 hours
let _cache: { ts: number; data: CometLiveData[] } | null = null;
const CACHE_TTL = 24 * 3600 * 1000;
const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
};

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

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(SBDB_URL, { signal: controller.signal });
        clearTimeout(timer);

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
            .filter((c) => c.tp > 0 && c.q > 0 && c.e > 0);

        _cache = { ts: Date.now(), data: comets };
        return NextResponse.json({ ok: true, comets }, { headers: CACHE_HEADERS });
    } catch (err) {
        console.error('[/api/comets] fetch error:', err);
        if (_cache) {
            return NextResponse.json(
                { ok: true, comets: _cache.data, stale: true },
                { headers: CACHE_HEADERS }
            );
        }
        return NextResponse.json(
            { ok: false, error: 'JPL fetch failed', comets: [] },
            { status: 502 }
        );
    }
}

