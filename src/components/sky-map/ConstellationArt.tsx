'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { CONSTELLATION_ART, type ArtPath } from '@/data/constellationArt';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

/**
 * ConstellationArt — mythological figure overlays.
 *
 * Renders simplified mythological silhouettes on the celestial sphere:
 *   – Outline polylines tracing the figure's body contours
 *   – Semi-transparent filled silhouette areas (earcut triangulation via THREE.ShapeUtils)
 *
 * Visual style:
 *   – Warm amber (#c8961a) at low opacity — distinct from cyan stick lines
 *   – Focused constellation: brightens + glow pass highlights the active figure
 *   – Night mode: deep red to preserve dark adaptation
 */

const RADIUS = 91;

/**
 * Triangulates a closed polygon (RA/Dec) using earcut (via THREE.ShapeUtils).
 * Earcut handles concave shapes correctly — fan triangulation from centroid only
 * works for convex polygons and produced Picasso-like artifacts on body shapes.
 */
function createFillGeometry(fill: ArtPath): THREE.BufferGeometry {
    const pts3D = fill.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
    const n = pts3D.length;
    if (n < 3) return new THREE.BufferGeometry();

    // Project to 2D (RA/Dec) for earcut winding — compensate RA for high declination
    const decRad = (fill[0][1] + fill[Math.floor(n / 2)][1]) / 2 * (Math.PI / 180);
    const cosD = Math.cos(decRad);
    const pts2D = fill.map(([ra, dec]) => new THREE.Vector2(ra * cosD, dec));

    // THREE.ShapeUtils.triangulateShape uses earcut and handles concave polygons
    let indices: number[][];
    try {
        indices = THREE.ShapeUtils.triangulateShape(pts2D, []);
    } catch {
        return new THREE.BufferGeometry();
    }

    const verts = new Float32Array(indices.length * 9);
    for (let i = 0; i < indices.length; i++) {
        const [a, b, c] = indices[i];
        const base = i * 9;
        verts[base]     = pts3D[a][0]; verts[base + 1] = pts3D[a][1]; verts[base + 2] = pts3D[a][2];
        verts[base + 3] = pts3D[b][0]; verts[base + 4] = pts3D[b][1]; verts[base + 5] = pts3D[b][2];
        verts[base + 6] = pts3D[c][0]; verts[base + 7] = pts3D[c][1]; verts[base + 8] = pts3D[c][2];
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    return geom;
}

export default function ConstellationArt() {
    const showConstellationArt = useAppStore(
        (state) => state.settings.showConstellationArt
    );
    const focusedConstellation = useAppStore(
        (state) => state.focusedConstellation
    );
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const kidsMode  = useAppStore((state) => state.settings.kidsMode);

    const figures = useMemo(() => {
        return CONSTELLATION_ART.map((figure) => ({
            name: figure.name,
            polylines: figure.paths.map((path) =>
                path.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS))
            ),
            fillGeometries: (figure.fills ?? []).map(createFillGeometry),
        }));
    }, []);

    if (!showConstellationArt) return null;

    return (
        <group renderOrder={2}>
            {figures.map(({ name, polylines, fillGeometries }) => {
                const isFocused = name === focusedConstellation;

                const color = nightMode
                    ? (isFocused ? '#ff4422' : '#661100')
                    : (isFocused 
                        ? (kidsMode ? '#44ccff' : '#f0c050') 
                        : (kidsMode ? '#114466' : '#8a6510'));

                const fillOpacity = isFocused ? (kidsMode ? 0.25 : 0.15) : 0.04;
                const lineOpacity = isFocused ? 0.90 : 0.40;
                const lineWidth   = isFocused ? (kidsMode ? 3.5 : 2.0) : 1.0;

                return (
                    <group key={name}>
                        {/* Ethereal Dusting (Fill) */}
                        {fillGeometries.map((geom, i) => (
                            <mesh key={`fill-${i}`} geometry={geom} renderOrder={1}>
                                <meshBasicMaterial
                                    color={color}
                                    transparent
                                    opacity={fillOpacity}
                                    side={THREE.DoubleSide}
                                    depthTest={false}
                                    depthWrite={false}
                                    blending={THREE.AdditiveBlending}
                                />
                            </mesh>
                        ))}

                        {/* High-Fidelity Glow Pass */}
                        {isFocused && polylines.map((points, i) => (
                            <group key={`glow-group-${i}`}>
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 12}
                                    transparent
                                    opacity={0.05}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 6}
                                    transparent
                                    opacity={0.12}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            </group>
                        ))}

                        {/* Main Mythological Outline */}
                        {polylines.map((points, i) => (
                            <Line
                                key={i}
                                points={points}
                                color={color}
                                lineWidth={lineWidth}
                                transparent
                                opacity={lineOpacity}
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
