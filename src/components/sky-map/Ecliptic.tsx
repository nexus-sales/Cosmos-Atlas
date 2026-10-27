'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

/**
 * Eclíptica — el camino aparente del Sol sobre la esfera celeste.
 * Inclinada ~23.44° respecto al ecuador celeste (oblicuidad de la eclíptica).
 * Es fundamental para entender por qué los planetas siempre aparecen
 * cercanos a esta línea.
 */

const OBLIQUITY_RAD = (23.4393 * Math.PI) / 180;
const RADIUS = 91; // ligeramente dentro de la cuadrícula ecuatorial

/** Convierte longitud eclíptica λ (grados) a coordenadas ecuatoriales */
function eclipticToEquatorial(lambdaDeg: number): { ra: number; dec: number } {
    const l = (lambdaDeg * Math.PI) / 180;
    const raDeg = ((Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY_RAD), Math.cos(l)) * 180) / Math.PI + 360) % 360;
    const decDeg = (Math.asin(Math.sin(OBLIQUITY_RAD) * Math.sin(l)) * 180) / Math.PI;
    return { ra: raDeg, dec: decDeg };
}

export default function Ecliptic() {
    const { lineGeom, innerGeom } = useMemo(() => {
        // Línea principal de la eclíptica
        const mainPts: number[] = [];
        for (let lambda = 0; lambda <= 361; lambda += 1) {
            const { ra, dec } = eclipticToEquatorial(lambda);
            mainPts.push(...equatorialTo3D(ra, dec, RADIUS));
        }
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(mainPts, 3));

        // Línea interior (efecto doble tenue)
        const innerPts: number[] = [];
        for (let lambda = 0; lambda <= 361; lambda += 1) {
            const { ra, dec } = eclipticToEquatorial(lambda);
            innerPts.push(...equatorialTo3D(ra, dec, RADIUS - 0.2));
        }
        const innerGeom = new THREE.BufferGeometry();
        innerGeom.setAttribute('position', new THREE.Float32BufferAttribute(innerPts, 3));

        return { lineGeom, innerGeom };
    }, []);

    return (
        <group>
            {/* Línea exterior más brillante */}
            <line>
                <primitive object={lineGeom} attach="geometry" />
                <lineBasicMaterial color="#f59e0b" transparent opacity={0.45} depthWrite={false} depthTest={true} />
            </line>

            {/* Línea interior tenue para efecto de grosor */}
            <line>
                <primitive object={innerGeom} attach="geometry" />
                <lineBasicMaterial color="#fbbf24" transparent opacity={0.12} depthWrite={false} depthTest={true} />
            </line>
        </group>
    );
}
