'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { CONSTELLATION_ART } from '@/data/constellationArt';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

type Point3 = [number, number, number];

const RADIUS = 91;

function smoothPolyline(points: Point3[], closed: boolean) {
    if (points.length < 4) return points;
    const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal', 0.5);
    const target = Math.min(220, Math.max(40, points.length * 10));
    return curve.getPoints(target).map((v) => [v.x, v.y, v.z] as Point3);
}

export default function ConstellationArt() {
    const showConstellationArt = useAppStore((state) => state.settings.showConstellationArt);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const selectedObject = useAppStore((state) => state.selectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const kidsMode = useAppStore((state) => state.settings.kidsMode);
    const camFov = useAppStore((state) => state.camFov);

    const figures = useMemo(() => {
        return CONSTELLATION_ART.map((figure) => ({
            name: figure.name,
            polylines: figure.paths.map((path) => {
                const pts = path.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
                const closed = pts.length >= 3 &&
                    pts[0][0] === pts[pts.length - 1][0] &&
                    pts[0][1] === pts[pts.length - 1][1] &&
                    pts[0][2] === pts[pts.length - 1][2];
                return smoothPolyline(pts, closed);
            }),
            fillOutlines: (figure.fills ?? []).map((fill) => {
                const pts = fill.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
                const closedPts = pts.length > 2 ? [...pts, pts[0]] : pts;
                return smoothPolyline(closedPts, true);
            }),
        }));
    }, []);

    // Auto behavior: if the user zooms in and a constellation is focused, show only that figure.
    // Auto: show line-art mythology for the focused constellation when you zoom in,
    // even if the toggle is off. Threshold is intentionally not extreme.
    const activeConstellation = focusedConstellation || (selectedObject && CONSTELLATION_ART.some(a => a.name === selectedObject.name) ? selectedObject.name : null);
    const autoFigure = !showConstellationArt && !!activeConstellation && camFov <= 60;
    const shouldRender = showConstellationArt || autoFigure;
    if (!shouldRender) return null;

    // Fade-in for the auto mode so it doesn't pop on/off.
    const autoPresence = autoFigure
        ? THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 70, 35, 0.0, 1.0), 0.0, 1.0)
        : 1.0;

    return (
        <group renderOrder={2}>
            {figures.map(({ name, polylines, fillOutlines }) => {
                const isFocused = name === activeConstellation;
                if (autoFigure && !isFocused) return null;

                const color = nightMode
                    ? (isFocused ? '#ff4422' : '#661100')
                    : (isFocused
                        ? (kidsMode ? '#44ccff' : '#e7c36a')
                        : (kidsMode ? '#114466' : '#8a6510'));

                // Avoid the old filled silhouettes: they read like cardboard cutouts.
                // Keep the mythology as subtle engraving-like line art.
                const outlineOpacity = (isFocused ? (kidsMode ? 0.55 : 0.28) : 0.08) * autoPresence;
                const lineOpacity = (isFocused ? (kidsMode ? 0.70 : 0.35) : 0.10) * autoPresence;
                const lineWidth = isFocused ? (kidsMode ? 2.6 : 1.5) : 0.8;

                if (Math.max(outlineOpacity, lineOpacity) < 0.01) return null;

                return (
                    <group key={name}>
                        {fillOutlines.map((points, i) => (
                            <Line
                                key={`fill-outline-${i}`}
                                points={points}
                                color={color}
                                lineWidth={lineWidth * 0.9}
                                transparent
                                opacity={outlineOpacity}
                                depthTest={false}
                                depthWrite={false}
                            />
                        ))}

                        {isFocused && polylines.map((points, i) => (
                            <group key={`glow-group-${i}`}>
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 10}
                                    transparent
                                    opacity={0.04 * autoPresence}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 5}
                                    transparent
                                    opacity={0.10 * autoPresence}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            </group>
                        ))}

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
