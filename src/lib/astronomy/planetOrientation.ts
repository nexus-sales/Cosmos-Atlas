import * as Astronomy from 'astronomy-engine';

export type Vec3 = [number, number, number];

export interface PlanetBasis {
    /** Meridiano de referencia (longitud 0, ecuador) — el centro de un mapa equirectangular. */
    prime: Vec3;
    /** Polo norte del cuerpo. */
    north: Vec3;
    /** Completa la base dextrógira: prime × north. Es el "oeste" del mapa visto desde fuera. */
    side: Vec3;
}

/** EQJ (x al equinoccio, z al polo) → marco 3D de la app (ver equatorialTo3D). Permutación cíclica: no invierte la quiralidad. */
function eqToScene(v: Vec3): Vec3 {
    return [v[1], v[2], v[0]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

/**
 * Orientación física de un cuerpo (elementos de rotación IAU vía astronomy-engine)
 * expresada en el marco 3D de la escena, con el ecuador de la fecha.
 *
 * Con esta base, una esfera de Three.js (polos en Y, longitud 0 en +X, este hacia
 * -Z) muestra un mapa con longitud 0 al centro y este a la derecha, vista desde fuera.
 */
export function planetBasis(body: Astronomy.Body, date: Date | Astronomy.AstroTime): PlanetBasis {
    const axis = Astronomy.RotationAxis(body, date);
    const alpha0 = (axis.ra * 15 * Math.PI) / 180;
    const w = (axis.spin * Math.PI) / 180;
    const n: Vec3 = [axis.north.x, axis.north.y, axis.north.z];

    // Nodo ascendente del ecuador del cuerpo sobre el ecuador ICRF: RA = α0 + 90°.
    const q: Vec3 = [-Math.sin(alpha0), Math.cos(alpha0), 0];
    const nq = cross(n, q);
    const p: Vec3 = [
        q[0] * Math.cos(w) + nq[0] * Math.sin(w),
        q[1] * Math.cos(w) + nq[1] * Math.sin(w),
        q[2] * Math.cos(w) + nq[2] * Math.sin(w),
    ];

    const rot = Astronomy.Rotation_EQJ_EQD(date);
    const toDate = (v: Vec3): Vec3 => {
        const r = Astronomy.RotateVector(rot, new Astronomy.Vector(v[0], v[1], v[2], Astronomy.MakeTime(date)));
        return eqToScene([r.x, r.y, r.z]);
    };

    const prime = toDate(p);
    const north = toDate(n);
    return { prime, north, side: cross(prime, north) };
}
