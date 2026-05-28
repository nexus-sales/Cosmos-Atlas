/**
 * Kepler orbital mechanics for comets.
 * Computes geocentric RA/Dec from osculating orbital elements.
 *
 * References:
 *   - Meeus, "Astronomical Algorithms" ch. 33-35
 *   - Boulet, "Methods of Orbit Determination"
 */

const K = 0.01720209895; // Gaussian gravitational constant (AU, days, solar masses)
const DEG = Math.PI / 180;

// ── Earth's approximate heliocentric ecliptic position ───────────────────────
function earthEcliptic(jd: number): [number, number, number] {
    const T = (jd - 2451545.0) / 36525;
    // Sun's mean longitude and anomaly (VSOP87-lite)
    const L0 = (100.46457 + 36000.769826 * T) * DEG;
    const M = (357.52911 + 35999.05029 * T) * DEG;
    const lam = L0 + (1.914602 - 0.004817 * T) * Math.sin(M) * DEG
                   + 0.019993 * Math.sin(2 * M) * DEG;
    // Earth is at opposite direction from Sun, same ecliptic plane (Z≈0)
    // Earth's ecliptic coords (heliocentric), distance ≈ 1 AU
    return [Math.cos(lam + Math.PI), Math.sin(lam + Math.PI), 0];
}

// ── Solve Kepler's equation ───────────────────────────────────────────────────
// Returns true anomaly ν (radians) and r (AU)
function solveKepler(
    e: number,
    q: number,
    dtDays: number   // time since perihelion in days
): { nu: number; r: number } {
    if (e < 0.98) {
        // Elliptic
        const a = q / (1 - e);
        const n = K / Math.pow(a, 1.5); // mean motion, rad/day
        let M = n * dtDays;
        // Normalise M to (-π, π)
        M = M - 2 * Math.PI * Math.round(M / (2 * Math.PI));
        let E = M;
        for (let k = 0; k < 60; k++) {
            const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            E -= dE;
            if (Math.abs(dE) < 1e-10) break;
        }
        const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
        const r = a * (1 - e * Math.cos(E));
        return { nu, r };
    } else if (e > 1.02) {
        // Hyperbolic
        const a = q / (e - 1);
        const n = K / Math.pow(a, 1.5);
        const M = n * Math.abs(dtDays);
        let H = Math.log(2 * M / e + 1.8);
        for (let k = 0; k < 60; k++) {
            const dH = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
            H -= dH;
            if (Math.abs(dH) < 1e-10) break;
        }
        const nu = dtDays >= 0
            ? 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2))
            : -2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(H / 2));
        const r = a * (e * Math.cosh(H) - 1);
        return { nu, r };
    } else {
        // Near-parabolic / parabolic (Barker's equation)
        const W = 3 * K / (Math.SQRT2 * Math.pow(q, 1.5)) * dtDays;
        const G = W / 2;
        const Y = Math.cbrt(G + Math.sqrt(G * G + 1));
        const nu = 2 * Math.atan(Y - 1 / Y);
        const r = q * (1 + Math.pow(Math.tan(nu / 2), 2));
        return { nu, r };
    }
}

// ── Main function ─────────────────────────────────────────────────────────────
export interface OrbitalElements {
    e: number;       // eccentricity
    q: number;       // perihelion distance, AU
    i: number;       // inclination, degrees
    om: number;      // longitude of ascending node Ω, degrees
    w: number;       // argument of perihelion ω, degrees
    tp: number;      // JD of perihelion passage
}

/**
 * Compute geocentric equatorial RA (degrees, 0-360) and Dec (degrees)
 * for a comet at a given Julian Date.
 */
export function cometRaDec(el: OrbitalElements, jd: number): { ra: number; dec: number; dist: number; r: number } {
    const dt = jd - el.tp;
    const { nu, r } = solveKepler(el.e, el.q, dt);

    // Heliocentric orbital-plane coords
    const x0 = r * Math.cos(nu);
    const y0 = r * Math.sin(nu);

    // Rotate to ecliptic heliocentric (Ω, i, ω)
    const cosΩ = Math.cos(el.om * DEG), sinΩ = Math.sin(el.om * DEG);
    const cosi = Math.cos(el.i * DEG),  sini = Math.sin(el.i * DEG);
    const cosω = Math.cos(el.w * DEG),  sinω = Math.sin(el.w * DEG);

    // P,Q direction cosines (standard ecliptic rotation)
    const Px =  cosΩ * cosω - sinΩ * sinω * cosi;
    const Py =  sinΩ * cosω + cosΩ * sinω * cosi;
    const Pz =  sinω * sini;
    const Qx = -cosΩ * sinω - sinΩ * cosω * cosi;
    const Qy = -sinΩ * sinω + cosΩ * cosω * cosi;
    const Qz =  cosω * sini;

    // Ecliptic heliocentric position
    const Xh = Px * x0 + Qx * y0;
    const Yh = Py * x0 + Qy * y0;
    const Zh = Pz * x0 + Qz * y0;

    // Earth's heliocentric ecliptic position (AU)
    const [Xe, Ye, Ze] = earthEcliptic(jd);

    // Geocentric ecliptic position
    const Xg = Xh - Xe;
    const Yg = Yh - Ye;
    const Zg = Zh - Ze;
    const dist = Math.sqrt(Xg * Xg + Yg * Yg + Zg * Zg);

    // Convert ecliptic → equatorial (J2000 obliquity)
    const eps = 23.4393 * DEG;
    const Xeq = Xg;
    const Yeq = Yg * Math.cos(eps) - Zg * Math.sin(eps);
    const Zeq = Yg * Math.sin(eps) + Zg * Math.cos(eps);

    const ra = ((Math.atan2(Yeq, Xeq) * 180 / Math.PI) + 360) % 360;
    const dec = Math.asin(Zeq / dist) * 180 / Math.PI;

    return { ra, dec, dist, r };
}

/** Convert a JS Date to Julian Date */
export function toJD(date: Date): number {
    return date.getTime() / 86_400_000 + 2440587.5;
}
