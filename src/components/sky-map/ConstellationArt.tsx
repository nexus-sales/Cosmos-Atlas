'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { CONSTELLATION_ART } from '@/data/constellationArt';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

/**
 * ConstellationArt — mythological figure overlays.
 *
 * Renders simplified stick-art silhouettes of the mythological figures
 * associated with key constellations. Paths are defined in RA/Dec space
 * in constellationArt.ts and projected onto the celestial sphere at
 * radius 91 (just inside the constellation stick lines at radius 92).
 *
 * Visual style:
 *   – Warm amber (#c8961a) at low opacity — distinct from the cyan stick lines
 *   – Focused constellation brightens to highlight the active figure
 *   – Night mode switches to deep red to preserve dark adaptation
 */
export default function ConstellationArt() {
    const showConstellationArt = useAppStore(
        (state) => state.settings.showConstellationArt
    );
    const showConstellations = useAppStore(
        (state) => state.settings.showConstellations
    );
    const focusedConstellation = useAppStore(
        (state) => state.focusedConstellation
    );
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const RADIUS = 91;

    const figures = useMemo(() => {
        return CONSTELLATION_ART.map((figure) => ({
            name: figure.name,
            polylines: figure.paths.map((path) =>
                path.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS))
            ),
        }));
    }, []);

    if (!showConstellationArt) return null;

    return (
        <group renderOrder={2}>
            {figures.map(({ name, polylines }) => {
                const isFocused = name === focusedConstellation;

                const color = nightMode
                    ? (isFocused ? '#ff6644' : '#661100')
                    : (isFocused ? '#f0b840' : '#c8961a');

                const opacity = isFocused ? 0.65 : 0.22;
                const lineWidth = isFocused ? 1.2 : 0.7;

                return (
                    <group key={name}>
                        {/* Glow pass for focused figure */}
                        {isFocused &&
                            polylines.map((points, i) => (
                                <Line
                                    key={`glow-${i}`}
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 8}
                                    transparent
                                    opacity={0.08}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            ))}

                        {/* Main art lines */}
                        {polylines.map((points, i) => (
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
