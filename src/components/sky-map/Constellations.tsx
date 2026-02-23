'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

export default function Constellations() {
    const showLines = useAppStore((state) => state.settings.showConstellations);
    const RADIUS = 92;

    const lines = useMemo(() => {
        const starMap = new Map();
        STARS.forEach((s) => starMap.set(s.name, s));

        const result: [number, number, number][][] = [];

        Object.values(CONSTELLATIONS).forEach((constLines) => {
            constLines.forEach(([startName, endName]) => {
                const startStar = starMap.get(startName);
                const endStar = starMap.get(endName);

                if (startStar && endStar) {
                    const p1 = equatorialTo3D(startStar.ra, startStar.dec, RADIUS);
                    const p2 = equatorialTo3D(endStar.ra, endStar.dec, RADIUS);
                    result.push([p1, p2]);
                }
            });
        });

        return result;
    }, []);

    if (!showLines) return null;

    return (
        <group>
            {lines.map((points, i) => (
                <Line
                    key={i}
                    points={points}
                    color="#5090c8"
                    lineWidth={1.5}
                    transparent
                    opacity={0.55}
                    dashed={true}
                    dashScale={3}
                    dashSize={0.6}
                    gapSize={0.4}
                />
            ))}
        </group>
    );
}
