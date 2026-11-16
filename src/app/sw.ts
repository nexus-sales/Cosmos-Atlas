import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

declare global {
    interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    precacheOptions: { cleanupOutdatedCaches: true },
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // ── Catálogos binarios astronómicos ─────────────────────────────────
        // hipparcos.bin (234KB) y ngc.bin (200KB): raramente cambian, siempre en caché
        {
            matcher: ({ url }) => /\/(hipparcos|ngc|iau-boundaries)\.bin$/.test(url.pathname),
            handler: new CacheFirst({
                cacheName: "cosmos-catalogs-v2",
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 10,
                        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 días
                    }),
                ],
            }),
        },

        // ── TLEs de satélites (Celestrak) ────────────────────────────────────
        // NetworkFirst: intenta red, usa caché si offline. TLEs son válidos ~48h.
        {
            matcher: /\/api\/tle\//,
            handler: new NetworkFirst({
                cacheName: "cosmos-tles-v2",
                networkTimeoutSeconds: 6,
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 30,
                        maxAgeSeconds: 2 * 24 * 60 * 60, // 48 horas
                    }),
                ],
            }),
        },

        // ── Imágenes y assets estáticos ──────────────────────────────────────
        {
            matcher: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
            handler: new CacheFirst({
                cacheName: "cosmos-images-v1",
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 60,
                        maxAgeSeconds: 30 * 24 * 60 * 60,
                    }),
                ],
            }),
        },

        // ── Cache estándar de Next.js (JS/CSS/HTML chunks) ──────────────────
        ...defaultCache,
    ],
});

serwist.addEventListeners();
