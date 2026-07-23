/**
 * API Route: GET /api/tle/iss
 *
 * Proxy server-side para el TLE de la ISS (NORAD 25544).
 * Cadena de fallback:
 *   1. celestrak.org  — puede dar 403 desde IPs de servidor
 *   2. celestrak.com  — mirror alternativo
 *   3. tle.ivanstanojevic.me — JSON API open, muy fiable
 * Cache 2 horas (los TLE se actualizan varias veces al día).
 */

import { createTleRouteHandler } from '@/lib/tleProxy';

export const GET = createTleRouteHandler('25544', 'iss');
