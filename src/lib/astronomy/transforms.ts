import { toRad, toDeg, gmstDeg } from './time';

export function equToHor(ra: number, dec: number, lat: number, lon: number, date: Date) {
    const lst = ((gmstDeg(date) + lon) % 360 + 360) % 360;
    const ha = toRad(((lst - ra) % 360 + 360) % 360);
    const d = toRad(dec);
    const l = toRad(lat);

    const sinAlt = Math.sin(d) * Math.sin(l) + Math.cos(d) * Math.cos(l) * Math.cos(ha);
    const alt = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));

    const cosAz = (Math.sin(d) - sinAlt * Math.sin(l)) / (Math.cos(toRad(alt)) * Math.cos(l));
    let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));

    if (Math.sin(ha) > 0) az = 360 - az;

    return { alt, az };
}

/**
 * Converts Equatorial coordinates (RA, Dec) to 3D Cartesian coordinates (x, y, z)
 * on a sphere of a given radius.
 */
export function equatorialTo3D(ra: number, dec: number, radius: number): [number, number, number] {
    const phi = toRad(90 - dec);      // Colatitude
    const theta = toRad(ra - 180);    // Longitude adjusted

    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    ];
}
