/**
 * API Route: GET /api/tle/tiangong
 * Proxy server-side para el TLE de la CSS Tiangong (NORAD 48274).
 */

import { createTleRouteHandler } from '@/lib/tleProxy';

export const GET = createTleRouteHandler('48274', 'tiangong');
