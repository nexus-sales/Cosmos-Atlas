'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Celestial Grid (RA/Dec)
 * Dense (15-degree increments), high-visibility, professional look.
 */
export default function CelestialGrid() {
    const RADIUS = 92;

    const lineGeometries = useMemo(() => {
        const results: THREE.BufferGeometry[] = [];

        // Circles of declination (every 15 degrees)
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

        // Meridians (every 15 degrees)
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

    const nightMode = useAppStore((state) => state.settings.nightMode);
    const gridColor = nightMode ? '#661111' : '#4d88ff';
    const gridOpacity = nightMode ? 0.2 : 0.25;

    return (
        <group name="CelestialGrid">
            {lineGeometries.map((geom, i) => {
                const isEquator = i === 5;
                return (
                    <line key={i}>
                        <primitive object={geom} attach="geometry" />
                        <lineBasicMaterial 
                            color={gridColor} 
                            transparent 
                            opacity={isEquator ? gridOpacity * 2 : gridOpacity} 
                            depthTest={true}
                            depthWrite={false}
                        />
                    </line>
                );
            })}
        </group>
    );
}
