/**
 * Magnetic Declination — World Magnetic Model 2020 (WMM2020)
 *
 * Implements spherical harmonic expansion truncated at degree/order 4.
 * At mid-latitudes (|lat| < 65°) this gives ±0.5–1° accuracy.
 *
 * Source: NOAA/NGDC & BGS, WMM2020COF.txt (Dec 2019)
 * Valid epoch: 2020.0 – 2025.0; secular variation extends to ~2027.
 *
 * Declination convention (standard geomagnetic):
 *   D > 0  → magnetic north is EAST of geographic north (compass reads low)
 *   D < 0  → magnetic north is WEST of geographic north (compass reads high)
 *
 * True bearing = Magnetic bearing + D
 */

// ── WMM2020 Gauss coefficients ────────────────────────────────────────────────
// [n, m, g_nm (nT), h_nm (nT), ġ_nm (nT/yr), ḣ_nm (nT/yr)]
type WmmCoeff = readonly [number, number, number, number, number, number];

const WMM2020: readonly WmmCoeff[] = [
    // n  m        g          h        ġ        ḣ
    [1, 0, -29404.5,      0.0,    6.7,    0.0],
    [1, 1,  -1450.7,   4652.9,    7.7,  -25.1],
    [2, 0,  -2500.0,      0.0,  -11.5,    0.0],
    [2, 1,   2982.0,  -2991.6,   -7.1,  -30.2],
    [2, 2,   1676.7,   -734.8,    2.2,  -23.9],
    [3, 0,   1363.9,      0.0,    2.8,    0.0],
    [3, 1,  -2381.0,    -82.2,   -6.2,    5.7],
    [3, 2,   1236.2,    241.8,    3.4,   -1.0],
    [3, 3,    525.7,   -542.9,  -12.2,    1.1],
    [4, 0,    903.1,      0.0,   -1.1,    0.0],
    [4, 1,    809.4,    282.0,    4.0,    0.4],
    [4, 2,     86.2,   -158.4,   -2.3,    6.9],
    [4, 3,   -309.4,    199.8,   -0.8,    3.6],
    [4, 4,     47.9,   -350.1,   -2.6,   -2.5],
] as const;

const EPOCH  = 2020.0;
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
    for (const [n, m, gv, hv, dg, dh] of WMM2020) {
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
