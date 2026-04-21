import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Line, useTexture } from '@react-three/drei';
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

/**
 * Texture-based art for constellations that have premium images.
 */
function ConstellationTexture({ name, activePresence }: { name: string; activePresence: number }) {
    const fileName = name.toLowerCase().replace(' ', '_');
    const path = `/textures/constellations/${fileName}.png`;
    const texture = useTexture(path);
    
    const config = useMemo(() => {
        const mapping: Record<string, { ra: number, dec: number, size: number, rot: number, op?: number }> = {
            'leo': { ra: 164, dec: 15, size: 52, rot: 0.15 },
            'perseus': { ra: 48.0, dec: 42.5, size: 50, rot: -0.1 },
            'orion': { ra: 85.5, dec: 2.5, size: 46, rot: -0.18, op: 0.35 },
        };
        return mapping[name.toLowerCase()] || { ra: 0, dec: 0, size: 40, rot: 0 };
    }, [name]);

    const pos = useMemo(() => equatorialTo3D(config.ra, config.dec, RADIUS - 0.95), [config]);
    const lookAtPos = new THREE.Vector3(0, 0, 0);

    return (
        <mesh 
            position={pos} 
            onUpdate={(self) => {
                self.lookAt(lookAtPos);
                self.rotateZ(config.rot); 
            }}
        >
            <planeGeometry args={[config.size, config.size]} />
            <meshBasicMaterial 
                map={texture} 
                transparent 
                opacity={(config.op ?? 0.42) * activePresence}
                blending={THREE.AdditiveBlending}
                depthTest={false}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

export default function ConstellationArt() {
    const showConstellationArt = useAppStore((state) => state.settings.showConstellationArt);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const selectedObject = useAppStore((state) => state.selectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const kidsMode = useAppStore((state) => state.settings.kidsMode);
    const camFov = useAppStore((state) => state.camFov);

    // Track which constellations have textures already deployed
    const [texturesAvailable] = useState(['leo', 'perseus', 'orion']);

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

    const activeConstellation = focusedConstellation || (selectedObject && CONSTELLATION_ART.some(a => a.name === selectedObject.name) ? selectedObject.name : null);
    const autoFigure = !showConstellationArt && !!activeConstellation && camFov <= 60;
    const shouldRender = showConstellationArt || autoFigure;
    if (!shouldRender) return null;

    const autoPresence = autoFigure
        ? THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 70, 35, 0.0, 1.0), 0.0, 1.0)
        : 1.0;

    return (
        <group renderOrder={2}>
            {figures.map(({ name, polylines, fillOutlines }) => {
                const isFocused = name === activeConstellation;
                if (autoFigure && !isFocused) return null;

                // Priority: Use texture if available
                if (isFocused && texturesAvailable.includes(name.toLowerCase())) {
                    return <ConstellationTexture key={`tex-${name}`} name={name} activePresence={autoPresence} />;
                }

                const color = nightMode
                    ? (isFocused ? '#ff4422' : '#661100')
                    : (isFocused
                        ? (kidsMode ? '#44ccff' : '#d4af37')
                        : (kidsMode ? '#114466' : '#8a6510'));

                const outlineOpacity = (isFocused ? (kidsMode ? 0.35 : 0.15) : 0.04) * autoPresence;
                const lineOpacity = (isFocused ? (kidsMode ? 0.50 : 0.25) : 0.06) * autoPresence;
                const lineWidth = isFocused ? (kidsMode ? 2.0 : 0.9) : 0.6;

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
