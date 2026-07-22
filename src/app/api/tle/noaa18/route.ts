/**
 * API Route: GET /api/tle/noaa18
 * Proxy server-side para el TLE de NOAA 18 (NORAD 28654).
 */

import { createTleRouteHandler } from '@/lib/tleProxy';

export const GET = createTleRouteHandler('28654', 'noaa18');
