import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // CSP Base - Move here from next.config.ts
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://aladin.cds.unistra.fr ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.tile.openstreetmap.org https://celestrak.org https://aladin.cds.unistra.fr https://alasky.cds.unistra.fr https://alaskybis.cds.unistra.fr https://irsa.ipac.caltech.edu;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co https://celestrak.org https://cdsweb.u-strasbg.fr https://aladin.cds.unistra.fr https://alasky.cds.unistra.fr https://alaskybis.cds.unistra.fr https://irsa.ipac.caltech.edu wss://*.supabase.co;
    worker-src 'self' blob:;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  
  // En desarrollo, una CSP estricta bloquea los scripts internos de Next.js.
  // Solo aplicamos CSP restrictiva en producción real para no romper el renderizado.
  //
  // OJO: VERCEL_ENV NO es "solo durante el build" -- Vercel la fija en tiempo de
  // ejecucion para cualquier despliegue (production/preview/development), incluido
  // el trafico real de produccion. La condicion anterior (`&& !process.env.VERCEL_ENV`)
  // desactivaba la CSP para siempre en la produccion real de Vercel; solo parecia
  // funcionar porque se verifico con `npm run build && npm run start` en local,
  // donde VERCEL_ENV no existe.
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    requestHeaders.set('Content-Security-Policy', cspHeader);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  if (isProduction) {
    response.headers.set('Content-Security-Policy', cspHeader);
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
