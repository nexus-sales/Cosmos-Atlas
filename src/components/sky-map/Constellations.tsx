'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

type Point3 = [number, number, number];

function lerpPoint(a: Point3, b: Point3, t: number): Point3 {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

/**
 * Constellation stick figures, with a zoom-aware "draw-in" effect.
 *
 * Behavior:
 * - As you zoom in, constellations gradually appear (overallPresence).
 * - When zoomed close, only the focused constellation stays prominent (nonFocusedVisibility).
 * - The focused constellation is progressively drawn segment-by-segment (focusedDrawProgress).
 */
export default function Constellations() {
    const showLines = useAppStore((state) => state.settings.showConstellations);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const camFov = useAppStore((state) => state.camFov);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const RADIUS = 92;

    const constellationsData = useMemo(() => {
        const starMap = new Map<string, (typeof STARS)[number]>();
        STARS.forEach((star) => starMap.set(star.name, star));

        return Object.entries(CONSTELLATIONS).map(([name, constLines]) => {
            const pointsList: Point3[][] = [];
            constLines.forEach(([startName, endName]) => {
                const startStar = starMap.get(startName);
                const endStar = starMap.get(endName);
                if (!startStar || !endStar) return;
                pointsList.push([
                    equatorialTo3D(startStar.ra, startStar.dec, RADIUS),
                    equatorialTo3D(endStar.ra, endStar.dec, RADIUS),
                ]);
            });
            return { name, pointsList };
        });
    }, []);

    if (!showLines) return null;

    const overallPresence = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 95, 55, 0.0, 1.0),
        0.0,
        1.0
    );

    const nonFocusedVisibility = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 35, 70, 0.0, 1.0),
        0.0,
        1.0
    );

    const focusedDrawProgress = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 55, 20, 0.0, 1.0),
        0.0,
        1.0
    );

    return (
        <group renderOrder={3}>
            {constellationsData.map(({ name, pointsList }) => {
                const isFocused = name === focusedConstellation;

                const color = nightMode
                    ? (isFocused ? '#ff3333' : '#441111')
                    : (isFocused ? '#ffffff' : '#4a6da0');

                const opacity = isFocused
                    ? 0.9 * overallPresence
                    : 0.15 * overallPresence * nonFocusedVisibility;

                const lineWidth = isFocused ? 2.2 : 0.8;

                if (opacity < 0.01) return null;

                let pointsToRender: Point3[][] = pointsList;

                if (isFocused && pointsList.length > 0) {
                    const segmentCount = pointsList.length;
                    const rawSegments = focusedDrawProgress * segmentCount;
                    const fullSegments = Math.floor(rawSegments);
                    const partialT = rawSegments - fullSegments;

                    pointsToRender = [
                        ...pointsList.slice(0, fullSegments),
                        ...(fullSegments < segmentCount && partialT > 0.01
                            ? (() => {
                                const seg = pointsList[fullSegments];
                                const a = seg[0];
                                const b = seg[1];
                                return [[a, lerpPoint(a, b, partialT)]];
                            })()
                            : []),
                    ];
                }

                return (
                    <group key={name}>
                        {isFocused && pointsToRender.map((points, i) => (
                            <Line
                                key={`glow-${i}`}
                                points={points}
                                color={color}
                                lineWidth={lineWidth * 6}
                                transparent
                                opacity={0.15}
                                depthTest={false}
                                depthWrite={false}
                            />
                        ))}

                        {pointsToRender.map((points, i) => (
                            <Line
                                key={i}
                                points={points}
                                color={color}
                                lineWidth={lineWidth}
                                transparent
                                opacity={opacity}
                                depthTest={false}
                                depthWrite={false}
                            />
                        ))}
                    </group>
                );
            })}
        </group>
    );
}

