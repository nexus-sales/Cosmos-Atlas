'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Líneas de constelación — estilo Sky Map:
 *  - depthTest={false} → siempre visibles encima de las estrellas
 *  - renderOrder={3}   → pintadas al final en la pila de transparencias
 *  - Color cian brillante con opacidad media para buen contraste sin tapar estrellas
 */
export default function Constellations() {
    const showLines = useAppStore((state) => state.settings.showConstellations);
    const nightMode = useAppStore((state) => state.settings.nightMode);
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

    // En modo noche las líneas son rojo oscuro para preservar la visión
    const lineColor = nightMode ? '#882222' : '#4bcffa';
    const lineOpacity = nightMode ? 0.45 : 0.65;

    return (
        <group renderOrder={3}>
            {lines.map((points, i) => (
                <Line
                    key={i}
                    points={points}
                    color={lineColor}
                    lineWidth={1.2}
                    transparent
                    opacity={lineOpacity}
                    depthTest={false}   // ← Siempre visible, encima de estrellas
                    depthWrite={false}
                />
            ))}
        </group>
    );
}
