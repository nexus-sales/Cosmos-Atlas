'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
    const selectedObject = useAppStore((state) => state.selectedObject);
    const RADIUS = 92;
    const [drawT, setDrawT] = useState(1);
    const rafRef = useRef<number | null>(null);
    const lastKeyRef = useRef<string>('');

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
    }, [focusedConstellation, camFov, shouldAnimateDraw]);

    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const pulseRef = useRef(0);

    // Continuous pulse for the focused one
    const [pulse, setPulse] = useState(1);
    
    // We use a small optimization here: only pulse if something is focused
    useEffect(() => {
        if (!focusedConstellation && !selectedObject) {
            setPulse(1);
            return;
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

    return (
        <group renderOrder={3}>
            {constellationsData.map(({ name, pointsList }) => {
                const isFocused = name === focusedConstellation || selectedObject?.name === name;

                const color = nightMode
                    ? (isFocused ? '#ff4444' : '#441111')
                    : (isFocused ? '#4fd1ff' : '#ffffff');

                const opacity = isFocused
                    ? 1.0 * overallPresence * (isFocused ? pulse : 1.0)
                    : 0.35 * overallPresence * nonFocusedVisibility;

                const lineWidth = isFocused 
                    ? 1.8 * (isFocused ? pulse : 1.0) 
                    : 0.9;

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
                            />
                        ))}
                    </group>
                );
            })}
        </group>
    );
}
