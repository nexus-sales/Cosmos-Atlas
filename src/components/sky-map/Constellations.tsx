'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CONSTELLATIONS } from '@/data/constellations';
import { useCatalog } from '@/stores/useCatalogStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

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
    const selectedObject = useAppStore((state) => state.selectedObject);
    const stars = useCatalog(s => s.stars);
    const RADIUS = 92;
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
            const uniquePointsMap = new Map<string, Point3>();

            constLines.forEach(([startName, endName]) => {
                const startStar = starMap.get(startName);
                const endStar = starMap.get(endName);
                if (!startStar || !endStar) return;
                
                const p1 = equatorialTo3D(startStar.ra, startStar.dec, RADIUS);
                const p2 = equatorialTo3D(endStar.ra, endStar.dec, RADIUS);
                
                pointsList.push([p1, p2]);
                uniquePointsMap.set(startName, p1);
                uniquePointsMap.set(endName, p2);
            });
            
            const nodes = Array.from(uniquePointsMap.values());
            const nodesPositions = new Float32Array(nodes.length * 3);
            nodes.forEach((p, i) => {
                nodesPositions[i * 3] = p[0];
                nodesPositions[i * 3 + 1] = p[1];
                nodesPositions[i * 3 + 2] = p[2];
            });

            return { name, pointsList, nodesPositions };
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

    return (
        <group renderOrder={3}>
            {constellationsData.map(({ name, pointsList, nodesPositions }) => {
                const isFocused = name === focusedConstellation || selectedObject?.name === name;

                const color = nightMode
                    ? (isFocused ? '#ff4444' : '#441111')
                    : (isFocused ? '#4fd1ff' : (dayVisibility > 0.15 ? '#f5fbff' : '#ffffff'));

                const opacity = isFocused
                    ? THREE.MathUtils.clamp(1.0 * overallPresence * pulse * dayOpacityBoost, 0, 1)
                    : THREE.MathUtils.clamp(0.35 * overallPresence * nonFocusedVisibility * dayOpacityBoost, 0, 0.72);

                const lineWidth = isFocused 
                    ? 1.8 * pulse * dayLineBoost
                    : 0.9 * dayLineBoost;

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
                                lineWidth={lineWidth * 3.2}
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
                                    lineWidth={lineWidth * 4}
                                    transparent
                                    opacity={0.1 * overallPresence}
                                    depthTest={false}
                                    depthWrite={false}
                                />
                                <Line
                                    points={points}
                                    color={color}
                                    lineWidth={lineWidth * 2.5}
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
                            <points>
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
                                    size={isFocused ? 1.5 * pulse : 0.6}
                                    color={color}
                                    transparent
                                    opacity={isFocused ? Math.min(1, opacity * 1.5) : opacity * 0.7}
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
