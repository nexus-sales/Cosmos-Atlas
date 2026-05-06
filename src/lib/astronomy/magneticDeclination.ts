/**
 * Magnetic Declination — World Magnetic Model 2025 (WMM2025)
 *
 * Implements spherical harmonic expansion truncated at degree/order 4.
 * Updated to WMM2025 coefficients for accuracy during the 2025-2030 epoch.
 *
 * Source: NOAA/NCEI & BGS, WMM2025COF.txt
 * Valid epoch: 2025.0 – 2030.0
 */

// ── WMM2025 Gauss coefficients ────────────────────────────────────────────────
// [n, m, g_nm (nT), h_nm (nT), ġ_nm (nT/yr), ḣ_nm (nT/yr)]
type WmmCoeff = readonly [number, number, number, number, number, number];

const WMM2025: readonly WmmCoeff[] = [
    // n  m        g          h        ġ        ḣ
    [1, 0, -29243.0,      0.0,   12.5,    0.0],
    [1, 1,  -1422.1,   4667.5,   11.7,  -11.8],
    [2, 0,  -2516.4,      0.0,   -7.9,    0.0],
    [2, 1,   2990.2,  -3112.5,   -1.1,  -29.0],
    [2, 2,   1685.0,   -854.1,    1.9,  -26.7],
    [3, 0,   1361.6,      0.0,    0.4,    0.0],
    [3, 1,  -2374.9,   -132.0,   -3.5,   -8.2],
    [3, 2,   1239.5,    219.0,    4.5,   -8.1],
    [3, 3,    451.9,   -565.4,   -9.9,   -5.8],
    [4, 0,    904.5,      0.0,    0.4,    0.0],
    [4, 1,    819.3,    288.5,    2.2,    1.3],
    [4, 2,     84.8,   -179.6,   -4.5,   -6.7],
    [4, 3,   -322.8,    218.4,   -2.2,    6.2],
    [4, 4,     36.0,   -349.0,   -2.6,    0.9],
] as const;

const EPOCH  = 2025.0;
const N_MAX  = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDecimalYear(date: Date): number {
    const y     = date.getFullYear();
    const start = Date.UTC(y,     0, 1);
    const end   = Date.UTC(y + 1, 0, 1);
    return y + (date.getTime() - start) / (end - start);
}

/**
 * Schmidt quasi-normal associated Legendre polynomials P[n][m](θ)
 * and their θ-derivatives dP[n][m](θ).
 *
 * Algorithm:
 *   1. Compute unnormalized associated Legendre polynomials via recursion.
 *   2. Apply Schmidt semi-normalization:
 *        N(n,0) = 1
 *        N(n,m) = sqrt( 2*(n-m)! / (n+m)! )   for m > 0
 */
function legendreSchmidt(theta: number): { P: number[][], dP: number[][] } {
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const S    = N_MAX + 2;

    // Unnormalized
    const p:  number[][] = Array.from({ length: S }, () => new Array(S).fill(0.0));
    const dp: number[][] = Array.from({ length: S }, () => new Array(S).fill(0.0));

    p[0][0]  = 1.0;
    dp[0][0] = 0.0;
    p[1][0]  =  cosT;
    dp[1][0] = -sinT;
    p[1][1]  = sinT;          // No Condon-Shortley phase (WMM convention)
    dp[1][1] = cosT;

    for (let n = 2; n <= N_MAX; n++) {
        // Diagonal: P[n][n] = (2n-1)*sinT*P[n-1][n-1]
        p[n][n]  = (2 * n - 1) * sinT * p[n - 1][n - 1];
        dp[n][n] = (2 * n - 1) * (cosT * p[n - 1][n - 1] + sinT * dp[n - 1][n - 1]);

        // Sub-diagonal: P[n][n-1] = (2n-1)*cosT*P[n-1][n-1]
        p[n][n - 1]  = (2 * n - 1) * cosT * p[n - 1][n - 1];
        dp[n][n - 1] = (2 * n - 1) * (-sinT * p[n - 1][n - 1] + cosT * dp[n - 1][n - 1]);

        // General: P[n][m] = [(2n-1)*cosT*P[n-1][m] - (n+m-1)*P[n-2][m]] / (n-m)
        for (let m = 0; m <= n - 2; m++) {
            const a = 2 * n - 1;
            const b = n + m - 1;
            const c = n - m;
            p[n][m]  = (a * cosT * p[n - 1][m]  - b * p[n - 2][m])  / c;
            dp[n][m] = (a * (-sinT * p[n - 1][m] + cosT * dp[n - 1][m]) - b * dp[n - 2][m]) / c;
        }
    }

    // Apply Schmidt semi-normalization
    const P:  number[][] = Array.from({ length: S }, () => new Array(S).fill(0.0));
    const dP: number[][] = Array.from({ length: S }, () => new Array(S).fill(0.0));

    for (let n = 0; n <= N_MAX; n++) {
        // m = 0: normalization factor = 1
        P[n][0]  = p[n][0];
        dP[n][0] = dp[n][0];

        // m > 0: N(n,m) = sqrt(2*(n-m)!/(n+m)!)
        for (let m = 1; m <= n; m++) {
            // Compute (n+m)! / (n-m)! = (n-m+1)*(n-m+2)*...*(n+m)
            let ratio = 1.0;
            for (let k = n - m + 1; k <= n + m; k++) ratio *= k;
            const N = Math.sqrt(2.0 / ratio);
            P[n][m]  = N * p[n][m];
            dP[n][m] = N * dp[n][m];
        }
    }

    return { P, dP };
}

// ── Cache (declination changes <0.1°/year at most locations) ─────────────────
interface CacheEntry { lat: number; lon: number; year: number; value: number }
let cache: CacheEntry | null = null;

/**
 * Compute magnetic declination using WMM2020.
 *
 * @param lat  Geographic latitude  (degrees, positive north)
 * @param lon  Geographic longitude (degrees, positive east)
 * @param date Date for computation (secular variation applied)
 * @returns    Declination in degrees. Add to magnetic heading to get true heading.
 */
export function computeMagneticDeclination(lat: number, lon: number, date: Date): number {
    const year = toDecimalYear(date);

    // Return cached value if location and year haven't changed significantly
    if (cache
        && Math.abs(cache.lat - lat) < 0.5
        && Math.abs(cache.lon - lon) < 0.5
        && Math.abs(cache.year - year) < 0.5) {
        return cache.value;
    }

    const dt = year - EPOCH;

    // Time-adjusted Gauss coefficients
    const g: number[][] = Array.from({ length: N_MAX + 1 }, () => new Array(N_MAX + 1).fill(0.0));
    const h: number[][] = Array.from({ length: N_MAX + 1 }, () => new Array(N_MAX + 1).fill(0.0));
    for (const [n, m, gv, hv, dg, dh] of WMM2025) {
        g[n][m] = gv + dg * dt;
        h[n][m] = hv + dh * dt;
    }

    // Colatitude and longitude in radians
    const theta  = (90.0 - lat) * (Math.PI / 180.0);  // colatitude
    const lambda = lon           * (Math.PI / 180.0);  // longitude

    const { P, dP } = legendreSchmidt(theta);
    const sinT = Math.sin(theta);

    // North (X) and East (Y) components of the magnetic field at Earth's surface.
    // Derived from V = a * Σ (a/r)^(n+1) [g*cos(mλ)+h*sin(mλ)] P_nm  at r = a.
    //
    //  X = -B_θ =  Σ Σ [g*cos(mλ) + h*sin(mλ)] * dP[n][m]/dθ
    //  Y =  B_φ = -Σ Σ m * [-g*sin(mλ) + h*cos(mλ)] * P[n][m] / sin(θ)
    let X = 0.0;
    let Y = 0.0;

    for (let n = 1; n <= N_MAX; n++) {
        for (let m = 0; m <= n; m++) {
            const cosML = Math.cos(m * lambda);
            const sinML = Math.sin(m * lambda);

            X += (g[n][m] * cosML + h[n][m] * sinML) * dP[n][m];

            if (m > 0 && sinT > 1e-10) {
                // Minus sign: Y = -(1/sinθ) * Σ m * (-g*sin + h*cos) * P
                Y += -m * (-g[n][m] * sinML + h[n][m] * cosML) * P[n][m] / sinT;
            }
        }
    }

    // Declination: angle from geographic north to magnetic north (positive = east)
    const decl = Math.atan2(Y, X) * (180.0 / Math.PI);
    cache = { lat, lon, year, value: decl };
    return decl;
}
