import { toRad, toDeg, gmstDeg } from './time';
import * as THREE from 'three';

/**
 * Calculates the Precession Matrix to convert from J2000 to Current Epoch.
 * Based on Newcomb's precession constants.
 */
export function getPrecessionMatrix(date: Date): THREE.Matrix4 {
    const jd = (date.getTime() / 86400000) + 2440587.5;
    const T = (jd - 2451545.0) / 36525.0; // Julian Centuries since J2000

    // Precession angles in arcseconds
    const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) / 3600;
    const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) / 3600;
    const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) / 3600;

    // Convert to radians
    const rZeta = toRad(zeta);
    const rZ = toRad(z);
    const rTheta = toRad(theta);

    // Rotation matrices
    const m1 = new THREE.Matrix4().makeRotationZ(-rZeta);
    const m2 = new THREE.Matrix4().makeRotationY(rTheta);
    const m3 = new THREE.Matrix4().makeRotationZ(-rZ);

    return new THREE.Matrix4().multiplyMatrices(m3, new THREE.Matrix4().multiplyMatrices(m2, m1));
}

/**
 * Corrects RA and Dec for Precession
 */
export function applyPrecession(ra: number, dec: number, date: Date): { ra: number; dec: number } {
    const matrix = getPrecessionMatrix(date);
    const phi = toRad(90 - dec);
    const theta = toRad(ra);

    // Equatorial position vector in J2000
    const v = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
    );

    // Apply precession
    v.applyMatrix4(matrix);

    // Convert back to RA/Dec
    const newDec = 90 - toDeg(Math.acos(Math.max(-1, Math.min(1, v.y))));
    let newRA = toDeg(Math.atan2(v.z, v.x));
    if (newRA < 0) newRA += 360;

    return { ra: newRA, dec: newDec };
}

/**
 * Rough atmospheric refraction correction
 * @param h true altitude in degrees
 * @returns corrected (apparent) altitude in degrees
 */
export function applyRefraction(h: number): number {
    if (h < -2) return h; // Below horizon (approx)

    // Formula from Saemundsson (1986) for altitude in degrees
    // R = 1.02 / tan(h + 10.3 / (h + 5.11)) arcmin
    const R = 1.02 / Math.tan(toRad(h + 10.3 / (h + 5.11))) / 60.0;
    return h + R;
}

export function equToHor(ra: number, dec: number, lat: number, lon: number, date: Date) {
    // 1. Correct for Precession (J2000 -> Current Epoch)
    const { ra: raEpoch, dec: decEpoch } = applyPrecession(ra, dec, date);

    const lst = ((gmstDeg(date) + lon) % 360 + 360) % 360;
    const ha = toRad(((lst - raEpoch) % 360 + 360) % 360);
    const d = toRad(decEpoch);
    const l = toRad(lat);

    const sinAlt = Math.sin(d) * Math.sin(l) + Math.cos(d) * Math.cos(l) * Math.cos(ha);
    let alt = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));

    const cosAz = (Math.sin(d) - sinAlt * Math.sin(l)) / (Math.cos(toRad(alt)) * Math.cos(l));
    let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));

    if (Math.sin(ha) > 0) az = 360 - az;

    // 2. Apply atmospheric refraction
    alt = applyRefraction(alt);

    return { alt, az };
}

/**
 * Converts Equatorial coordinates (RA, Dec) to 3D Cartesian coordinates (x, y, z)
 * on a sphere of a given radius.
 */
export function equatorialTo3D(ra: number, dec: number, radius: number): [number, number, number] {
    const phi = toRad(90 - dec);   // Colatitude
    const theta = toRad(90 - ra);  // RA creciente hacia el Este (+X) visto desde dentro

    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    ];
}
