'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { useCatalog } from '@/stores/useCatalogStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';
import type { ThreeEvent } from '@react-three/fiber';
import type { Star } from '@/types/celestial';

type Point3 = [number, number, number];
type ConstellationNode = { star: Star; position: Point3 };

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
    const selectedObject = useAppStore((state) => state.selectedObject);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const setFocusedConstellation = useAppStore((state) => state.setFocusedConstellation);
    const stars = useCatalog(s => s.stars);
    const RADIUS = 92;
    const tapRef = useRef<{ constellation: string; index: number; x: number; y: number; t: number } | null>(null);
    const [drawT, setDrawT] = useState(1);
    const [dayVisibility, setDayVisibility] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastKeyRef = useRef<string>('');
    const lastSunCheckRef = useRef(0);

    const constellationsData = useMemo(() => {
        const starMap = new Map<string, typeof stars[number]>();
        stars.forEach((star) => starMap.set(star.name, star));

        return Object.entries(CONSTELLATIONS).map(([name, constLines]) => {
            const pointsList: Point3[][] = [];
            const uniquePointsMap = new Map<string, ConstellationNode>();

            constLines.forEach(([startName, endName]) => {
                const startStar = starMap.get(startName);
                const endStar = starMap.get(endName);
                if (!startStar || !endStar) return;
                
                const p1 = equatorialTo3D(startStar.ra, startStar.dec, RADIUS);
                const p2 = equatorialTo3D(endStar.ra, endStar.dec, RADIUS);
                
                pointsList.push([p1, p2]);
                uniquePointsMap.set(startName, { star: startStar, position: p1 });
                uniquePointsMap.set(endName, { star: endStar, position: p2 });
            });
            
            const nodes = Array.from(uniquePointsMap.values());
            const nodesPositions = new Float32Array(nodes.length * 3);
            nodes.forEach((node, i) => {
                nodesPositions[i * 3] = node.position[0];
                nodesPositions[i * 3 + 1] = node.position[1];
                nodesPositions[i * 3 + 2] = node.position[2];
            });

            return { name, pointsList, nodes, nodesPositions };
        });
    }, [stars]);

    // Animate when the focused constellation changes (usually via click/pin).
    // Do not tie restart to FOV or it will feel broken while zooming.
    const shouldAnimateDraw = !!focusedConstellation;

    useEffect(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        if (!shouldAnimateDraw) {
            // Defer state update to avoid setState-in-effect lint.
            const timer = setTimeout(() => {
                setDrawT(1);
                lastKeyRef.current = '';
            }, 0);
            return () => clearTimeout(timer);
        }

        const key = `${focusedConstellation ?? ''}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;

        const kick = setTimeout(() => setDrawT(0), 0);
        const start = performance.now();
        const durationMs = 650;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            setDrawT(easeOutCubic(t));
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            clearTimeout(kick);
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [focusedConstellation, shouldAnimateDraw]);

    const bortleScale = useAppStore((state) => state.settings.bortleScale);

    // Continuous pulse for the focused one
    const [pulse, setPulse] = useState(1);
    
    // We use a small optimization here: only pulse if something is focused
    useEffect(() => {
        if (!focusedConstellation && !selectedObject) {
            const timer = setTimeout(() => setPulse(1), 0);
            return () => clearTimeout(timer);
        }
        
        let alive = true;
        const tick = () => {
            if (!alive) return;
            const time = Date.now() / 1000;
            // Gentle 0.5Hz sine wave between 0.8 and 1.2
            setPulse(1 + Math.sin(time * 3) * 0.15);
            requestAnimationFrame(tick);
        };
        const raf = requestAnimationFrame(tick);
        return () => {
            alive = false;
            cancelAnimationFrame(raf);
        };
    }, [focusedConstellation, selectedObject]);

    useFrame((state) => {
        if (state.clock.elapsedTime - lastSunCheckRef.current < 1) return;
        lastSunCheckRef.current = state.clock.elapsedTime;

        const { time, observer } = useAppStore.getState();
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');
            const nextDayVisibility = THREE.MathUtils.smoothstep(hor.altitude, -6, 10);

            setDayVisibility((current) => (
                Math.abs(current - nextDayVisibility) > 0.03 ? nextDayVisibility : current
            ));
        } catch {
            setDayVisibility(0);
        }
    });

    if (!showLines) return null;

    // --- ASTRONOMICAL VISIBILITY LAW ---
    // At Bortle 9 (City), eyes see only the brightest stars, and constellations are hard to trace.
    // At Bortle 1 (Pristine), they are crisp.
    const bortleFactor = THREE.MathUtils.mapLinear(bortleScale, 1, 9, 1.0, 0.25);

    // Never go to zero: at wide FOV we still want the stick figures visible.
    const overallPresence = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 120, 60, 0.35, 1.0),
        0.30,
        1.0
    );

    const nonFocusedVisibility = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 25, 75, 0.0, 1.0),
        0.0,
        1.0
    ) * bortleFactor;

    const dayOpacityBoost = THREE.MathUtils.lerp(1.0, 2.2, dayVisibility);
    const dayLineBoost = THREE.MathUtils.lerp(1.0, 1.65, dayVisibility);
    const dayGlowOpacity = 0.16 * dayVisibility * overallPresence;

    const selectConstellationNode = (constellation: string, node: ConstellationNode) => {
        const displayName = getConstellationDisplayName(constellation);
        const isGuidePoint = /-St\d+$/i.test(node.star.name);

        if (isGuidePoint) {
            const constellationTarget = {
                name: constellation,
                ra: node.star.ra,
                dec: node.star.dec,
                mag: node.star.mag,
                desc: `Constelacion de ${displayName}. Toca sus estrellas principales para descubrir nombres, brillo y posicion; estos puntos-guia te ayudan a seguir la figura completa en la boveda.`,
                color: '#8b5cf6',
                symbol: '\u2736',
                kind: 'planet' as const,
            };
            setFocusedConstellation(constellation);
            setSelectedObject(constellationTarget);
            setTargetedObject(constellationTarget);
            return;
        }

        setFocusedConstellation(node.star.constellation || constellation);
        setTargetedObject(node.star);
    };

    return (
        <group renderOrder={3}>
            {constellationsData.map(({ name, pointsList, nodes, nodesPositions }) => {
                const isFocused = name === focusedConstellation || selectedObject?.name === name;

                const color = nightMode
                    ? (isFocused ? '#ff4444' : '#441111')
                    : (isFocused ? '#4fd1ff' : (dayVisibility > 0.15 ? '#f5fbff' : '#ffffff'));

                const opacity = isFocused
                    ? THREE.MathUtils.clamp(1.0 * overallPresence * pulse * dayOpacityBoost, 0, 1)
                    : THREE.MathUtils.clamp(0.12 * overallPresence * nonFocusedVisibility * dayOpacityBoost, 0, 0.35);

                const lineWidth = isFocused 
                    ? 1.0 * pulse * dayLineBoost
                    : 0.5 * dayLineBoost;

                if (opacity < 0.01) return null;

                let pointsToRender: Point3[][] = pointsList;

                // Important: never hide the focused constellation at wide FOV.
                // The draw-in effect only activates when zoomed in.
                if (isFocused && shouldAnimateDraw && pointsList.length > 0) {
                    const segmentCount = pointsList.length;
                    const rawSegments = THREE.MathUtils.clamp(drawT, 0, 1) * segmentCount;
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

                    // Always show at least something while animating.
                    if (pointsToRender.length === 0) pointsToRender = [pointsList[0]];
                }

                return (
                    <group key={name}>
                        {dayGlowOpacity > 0.01 && pointsToRender.map((points, i) => (
                            <Line
                                key={`day-glow-${i}`}
                                points={points}
                                color={color}
                                lineWidth={lineWidth * 2.0}
                                transparent
                                opacity={isFocused ? dayGlowOpacity * 1.4 : dayGlowOpacity}
                                depthTest={false}
                                depthWrite={false}
                            />
                        ))}

                        {isFocused && pointsToRender.map((points, i) => (
                            <group key={`glow-layers-${i}`}>
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 2.5}
                                    transparent
                                    opacity={0.1 * overallPresence}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 1.6}
                                    transparent
                                    opacity={0.2 * overallPresence}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                            </group>
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
                                dashed={isFocused}
                                dashScale={50}
                                dashSize={2}
                                gapSize={1}
                            />
                        ))}

                        {/* High-Tech Nodes at star vertices */}
                        {nodesPositions.length > 0 && opacity > 0.05 && (
                            <points
                                onClick={(e: ThreeEvent<MouseEvent>) => {
                                    // Evita que el click posterior al pointerup atraviese el nodo
                                    // y Gaia/Hipparcos reemplacen la selección de la constelación.
                                    e.stopPropagation();
                                }}
                                onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                                    e.stopPropagation();
                                    if (e.index === undefined || e.index >= nodes.length) return;
                                    tapRef.current = {
                                        constellation: name,
                                        index: e.index,
                                        x: e.nativeEvent.clientX,
                                        y: e.nativeEvent.clientY,
                                        t: performance.now(),
                                    };
                                }}
                                onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                                    if (!tapRef.current) return;
                                    const dx = e.nativeEvent.clientX - tapRef.current.x;
                                    const dy = e.nativeEvent.clientY - tapRef.current.y;
                                    if (Math.hypot(dx, dy) > 16) tapRef.current = null;
                                }}
                                onPointerUp={(e: ThreeEvent<PointerEvent>) => {
                                    e.stopPropagation();
                                    const tap = tapRef.current;
                                    tapRef.current = null;
                                    if (!tap || tap.constellation !== name) return;
                                    const dx = e.nativeEvent.clientX - tap.x;
                                    const dy = e.nativeEvent.clientY - tap.y;
                                    const quickTap = performance.now() - tap.t < 550;
                                    const sameNode = e.index === undefined || e.index === tap.index;
                                    if (!quickTap || !sameNode || Math.hypot(dx, dy) > 16) return;
                                    const node = nodes[tap.index];
                                    if (node) selectConstellationNode(name, node);
                                }}
                                onPointerOut={() => {
                                    tapRef.current = null;
                                }}
                            >
                                <bufferGeometry>
                                    <bufferAttribute
                                        attach="attributes-position"
                                        count={nodesPositions.length / 3}
                                        array={nodesPositions}
                                        itemSize={3}
                                        args={[nodesPositions, 3]}
                                    />
                                </bufferGeometry>
                                <pointsMaterial
                                    size={isFocused ? 1.25 * pulse : 0.7}
                                    color={color}
                                    transparent
                                    opacity={isFocused ? Math.min(1, opacity * 1.5) : Math.min(0.6, opacity * 1.25)}
                                    depthTest={false}
                                    depthWrite={false}
                                    sizeAttenuation={true}
                                    blending={THREE.AdditiveBlending}
                                />
                            </points>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
