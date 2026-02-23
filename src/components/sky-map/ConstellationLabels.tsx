'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));

/** Constellation name labels rendered at each constellation's centroid */
export default function ConstellationLabels() {
    const labels = useMemo(() => {
        return Object.entries(CONSTELLATIONS).flatMap(([name, pairs]) => {
            // Collect unique star names for this constellation
            const starNames = new Set<string>();
            pairs.forEach(([a, b]) => { starNames.add(a); starNames.add(b); });

            // Average 3D unit vectors (handles RA wraparound correctly)
            const sum = new THREE.Vector3();
            let count = 0;
            starNames.forEach((sName) => {
                const star = STAR_MAP.get(sName);
                if (!star) return;
                const [x, y, z] = equatorialTo3D(star.ra, star.dec, 1);
                sum.add(new THREE.Vector3(x, y, z));
                count++;
            });

            if (count === 0) return [];

            const centroid = sum.divideScalar(count).normalize();
            const pos = centroid.multiplyScalar(85).toArray() as [number, number, number];
            return [{ name, pos }];
        });
    }, []);

    return (
        <>
            {labels.map(({ name, pos }) => (
                <Html
                    key={name}
                    position={pos}
                    center
                    distanceFactor={12}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <span style={{
                        color: 'rgba(180,210,255,0.35)',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        textShadow: '0 0 8px rgba(100,160,255,0.3)',
                    }}>
                        {name.toUpperCase()}
                    </span>
                </Html>
            ))}
        </>
    );
}
