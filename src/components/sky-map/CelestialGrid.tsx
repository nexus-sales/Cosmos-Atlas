'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

export default function CelestialGrid() {
    const RADIUS = 90;

    const lineGeometries = useMemo(() => {
        const results: THREE.BufferGeometry[] = [];

        // Círculos de declinación (paralelos)
        for (let dec = -60; dec <= 60; dec += 30) {
            const pts: number[] = [];
            for (let ra = 0; ra <= 360; ra += 5) {
                const p = equatorialTo3D(ra, dec, RADIUS);
                pts.push(...p);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            results.push(geom);
        }

        // Meridianos (líneas de ascensión recta)
        for (let ra = 0; ra < 360; ra += 30) {
            const pts: number[] = [];
            for (let dec = -90; dec <= 90; dec += 5) {
                const p = equatorialTo3D(ra, dec, RADIUS);
                pts.push(...p);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            results.push(geom);
        }

        return results;
    }, []);

    return (
        <group>
            {lineGeometries.map((geom, i) => (
                <line key={i}>
                    <primitive object={geom} attach="geometry" />
                    <lineBasicMaterial color="#3a5a8a" transparent opacity={0.1} />
                </line>
            ))}
        </group>
    );
}

