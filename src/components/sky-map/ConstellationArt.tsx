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
 *   – Semi-transparent filled silhouette areas (fan-triangulated from centroid)
 *
 * Visual style:
 *   – Warm amber (#c8961a) at low opacity — distinct from cyan stick lines
 *   – Focused constellation: brightens + glow pass highlights the active figure
 *   – Night mode: deep red to preserve dark adaptation
 */

const RADIUS = 91;

/**
 * Fan-triangulates a closed polygon (RA/Dec) into a THREE.BufferGeometry.
 * Centroid is re-projected onto the sphere surface so the fill sits flush
 * with the celestial sphere (deviation < 0.1% for typical figure sizes).
 */
function createFillGeometry(fill: ArtPath): THREE.BufferGeometry {
    const pts = fill.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
    const n = pts.length;
    if (n < 3) return new THREE.BufferGeometry();

    // Spherical centroid: average then re-normalize to sphere radius
    let cx = 0, cy = 0, cz = 0;
    for (const [x, y, z] of pts) { cx += x; cy += y; cz += z; }
    const mag = Math.sqrt(cx * cx + cy * cy + cz * cz);
    const r = Math.sqrt(pts[0][0] ** 2 + pts[0][1] ** 2 + pts[0][2] ** 2);
    cx = cx / mag * r;
    cy = cy / mag * r;
    cz = cz / mag * r;

    // Fan triangulation from centroid
    const verts = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const b = i * 9;
        verts[b]     = cx;       verts[b + 1] = cy;       verts[b + 2] = cz;
        verts[b + 3] = pts[i][0]; verts[b + 4] = pts[i][1]; verts[b + 5] = pts[i][2];
        verts[b + 6] = pts[j][0]; verts[b + 7] = pts[j][1]; verts[b + 8] = pts[j][2];
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
                    ? (isFocused ? '#ff6644' : '#661100')
                    : (isFocused 
                        ? (kidsMode ? '#44ccff' : '#f0b840') 
                        : (kidsMode ? '#226688' : '#c8961a'));

                const fillOpacity = isFocused ? (kidsMode ? 0.30 : 0.18) : 0.12;
                const lineOpacity = isFocused ? 0.80 : 0.50;
                const lineWidth   = isFocused ? (kidsMode ? 3.0 : 1.6) : 1.1;

                return (
                    <group key={name}>
                        {/* Filled silhouette areas */}
                        {fillGeometries.map((geom, i) => (
                            <mesh key={`fill-${i}`} geometry={geom} renderOrder={1}>
                                <meshBasicMaterial
                                    color={color}
                                    transparent
                                    opacity={fillOpacity}
                                    side={THREE.DoubleSide}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            </mesh>
                        ))}

                        {/* Glow pass for focused figure */}
                        {isFocused && polylines.map((points, i) => (
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

                        {/* Main outline lines */}
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
