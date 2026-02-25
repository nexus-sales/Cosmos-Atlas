'use client';

import { useMemo } from 'react';
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
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const RADIUS = 92;

    const constellationsData = useMemo(() => {
        const starMap = new Map();
        STARS.forEach((s) => starMap.set(s.name, s));

        return Object.entries(CONSTELLATIONS).map(([name, constLines]) => {
            const pointsList: [number, number, number][][] = [];
            constLines.forEach(([startName, endName]) => {
                const startStar = starMap.get(startName);
                const endStar = starMap.get(endName);
                if (startStar && endStar) {
                    pointsList.push([
                        equatorialTo3D(startStar.ra, startStar.dec, RADIUS),
                        equatorialTo3D(endStar.ra, endStar.dec, RADIUS)
                    ]);
                }
            });
            return { name, pointsList };
        });
    }, []);

    if (!showLines) return null;

    return (
        <group renderOrder={3}>
            {constellationsData.map(({ name, pointsList }) => {
                const isFocused = name === focusedConstellation;

                // Estética dinámica: 
                // La enfocada es brillante y nítida. El resto son "fantasmas" sutiles.
                const color = nightMode
                    ? (isFocused ? '#ff3333' : '#661111')
                    : (isFocused ? '#ffffff' : '#a8c4e8');

                const opacity = isFocused ? 0.9 : 0.15;
                const lineWidth = isFocused ? 1.8 : 0.6;

                return (
                    <group key={name}>
                        {/* Glow line (sólo para la enfocada) */}
                        {isFocused && pointsList.map((points, i) => (
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

                        {/* Main line */}
                        {pointsList.map((points, i) => (
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
