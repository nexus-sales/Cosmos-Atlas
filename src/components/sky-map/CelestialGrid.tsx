'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

export default function CelestialGrid() {
    const RADIUS = 90;

    const gridLines = useMemo(() => {
        const lines: [number, number, number][][] = [];

        for (let dec = -60; dec <= 60; dec += 30) {
            const circle: [number, number, number][] = [];
            for (let ra = 0; ra <= 360; ra += 5) {
                circle.push(equatorialTo3D(ra, dec, RADIUS));
            }
            lines.push(circle);
        }

        for (let ra = 0; ra < 360; ra += 30) {
            const line: [number, number, number][] = [];
            for (let dec = -90; dec <= 90; dec += 5) {
                line.push(equatorialTo3D(ra, dec, RADIUS));
            }
            lines.push(line);
        }

        return lines;
    }, []);

    return (
        <group>
            {gridLines.map((points, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={points.length}
                            array={new Float32Array(points.flat())}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#3a5a8a" transparent opacity={0.1} />
                </line>
            ))}
        </group>
    );
}
