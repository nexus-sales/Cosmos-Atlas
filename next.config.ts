import withSerwist from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Imagen Docker minima para Dokploy (genera .next/standalone)
    output: "standalone",
    // Headers de caché para los catálogos binarios grandes
    async headers() {
        return [
            {
                source: "/(hipparcos|ngc|iau-boundaries)\\.bin",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=7776000, immutable", // 90 días
                    },
                ],
            },
        ];
    },
};

const withPWA = withSerwist({
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // En desarrollo no registramos SW para no interferir con HMR
    disable: process.env.NODE_ENV === "development",
});

export default withPWA(nextConfig);
