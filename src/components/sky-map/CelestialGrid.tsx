'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

export default function CelestialGrid() {
    const RADIUS = 92; // Just inside the stars and labels

    const lineGeometries = useMemo(() => {
        const results: THREE.BufferGeometry[] = [];

        // Círculos de declinación (paralelos) - Cada 15 grados
        for (let dec = -75; dec <= 75; dec += 15) {
            const pts: number[] = [];
            for (let ra = 0; ra <= 360; ra += 5) {
                const p = equatorialTo3D(ra, dec, RADIUS);
                pts.push(...p);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            results.push(geom);
        }

        // Meridianos (líneas de ascensión recta) - Cada 15 grados
        for (let ra = 0; ra < 360; ra += 15) {
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

    const nightMode = useAppStore(state => state.settings.nightMode);
    const color = nightMode ? '#661111' : '#4d88ff';
    const opacity = nightMode ? 0.2 : 0.25;

    return (
        <group name="CelestialGrid">
            {lineGeometries.map((geom, i) => {
                const isEquator = i === 5; // Aproximadamente el ecuador en el primer loop
                return (
                    <line key={i}>
                        <primitive object={geom} attach="geometry" />
                        <lineBasicMaterial 
                            color={color} 
                            transparent 
                            opacity={isEquator ? opacity * 2 : opacity} 
                            depthTest={true}
                            depthWrite={false}
                        />
                    </line>
                );
            })}
        </group>
    );
}

