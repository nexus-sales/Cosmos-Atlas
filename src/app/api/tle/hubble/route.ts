/**
 * API Route: GET /api/tle/hubble
 * Proxy server-side para el TLE del Hubble Space Telescope (NORAD 20580).
 */

import { createTleRouteHandler } from '@/lib/tleProxy';

export const GET = createTleRouteHandler('20580', 'hubble');
