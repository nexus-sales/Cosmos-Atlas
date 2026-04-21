'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import type { Planet } from '@/types/celestial';

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));
const PIN_MS = 8000;
const VISIBILITY_THROTTLE_MS = 180;

function clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
}

function vectorToRaDec(vec: THREE.Vector3) {
    const v = vec.clone().normalize();
    const dec = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)));
    const thetaDeg = THREE.MathUtils.radToDeg(Math.atan2(v.z, v.x));
    let ra = 90 - thetaDeg;
    ra = ((ra % 360) + 360) % 360;
    return { ra, dec };
}

export default function ConstellationLabels() {
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const camFov = useAppStore((state) => state.camFov);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const setFocusedConstellation = useAppStore((state) => state.setFocusedConstellation);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    // Mouse hover should override camera-based focusing.
    const hoveredRef = useRef<string | null>(null);
    // Clicking should "pin" the constellation so auto-focus doesn't immediately override it.
    const pinnedRef = useRef<{ name: string; until: number } | null>(null);
    const visibleRef = useRef<Set<string>>(new Set());
    const lastVisibilityUpdateRef = useRef(0);
    const [, forceRender] = useState(0);

    const labels = useMemo(() => {
        return Object.entries(CONSTELLATIONS).flatMap(([name, pairs]) => {
            const starNames = new Set<string>();
            pairs.forEach(([a, b]) => { starNames.add(a); starNames.add(b); });

            const sum = new THREE.Vector3();
            let count = 0;
            starNames.forEach((sName) => {
                const star = STAR_MAP.get(sName);
                if (!star) return;
                const [x, y, z] = equatorialTo3D(star.ra, star.dec, 1.0);
                sum.add(new THREE.Vector3(x, y, z));
                count++;
            });

            if (count === 0) return [];

            const centroid = sum.divideScalar(count).normalize();
            const pos = centroid.clone().multiplyScalar(88).toArray() as [number, number, number];
            return [{
                name,
                label: getConstellationDisplayName(name).toUpperCase(),
                pos,
                vector: centroid,
            }];
        });
    }, []);

    useFrame(({ camera }) => {
        const now = Date.now();
        const pinned = pinnedRef.current;
        if (pinned && pinned.until > now) {
            if (pinned.name !== focusedConstellation) setFocusedConstellation(pinned.name);
            // Keep the pinned label visible.
            if (!visibleRef.current.has(pinned.name)) {
                visibleRef.current = new Set([pinned.name]);
                forceRender((v) => v + 1);
            }
            return;
        }
        if (pinned && pinned.until <= now) pinnedRef.current = null;

        if (hoveredRef.current) {
            if (hoveredRef.current !== focusedConstellation) {
                setFocusedConstellation(hoveredRef.current);
            }
            // Keep hovered label visible even if we are culling.
            if (!visibleRef.current.has(hoveredRef.current)) {
                visibleRef.current = new Set([hoveredRef.current]);
                forceRender((v) => v + 1);
            }
            return;
        }

        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let bestName: string | null = null;
        let bestDot = 0.94; // ~20 deg threshold

        labels.forEach(({ name, vector }) => {
            const dot = lookDir.dot(vector);
            if (dot > bestDot) {
                bestDot = dot;
                bestName = name;
            }
        });

        if (bestName !== focusedConstellation) setFocusedConstellation(bestName);

        // Declutter: show only the most relevant labels (closest to center) as you zoom out.
        // As you zoom in, allow more labels.
        const maxLabels = Math.round(
            THREE.MathUtils.clamp(
                THREE.MathUtils.mapLinear(camFov, 120, 60, 4, 12),
                4,
                12
            )
        );
        const dotThreshold = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 120, 40, 0.975, 0.92),
            0.90,
            0.98
        );

        const candidates: Array<{ name: string; dot: number }> = [];
        labels.forEach(({ name, vector }) => {
            const dot = lookDir.dot(vector);
            if (dot >= dotThreshold) candidates.push({ name, dot });
        });
        candidates.sort((a, b) => b.dot - a.dot);

        const nextVisible = new Set<string>();
        for (const item of candidates) {
            nextVisible.add(item.name);
            if (nextVisible.size >= maxLabels) break;
        }
        if (bestName) nextVisible.add(bestName);

        const nowMs = performance.now();
        if (nowMs - lastVisibilityUpdateRef.current >= VISIBILITY_THROTTLE_MS) {
            const prev = visibleRef.current;
            let changed = prev.size !== nextVisible.size;
            if (!changed) {
                for (const name of nextVisible) {
                    if (!prev.has(name)) { changed = true; break; }
                }
            }
            if (changed) {
                visibleRef.current = nextVisible;
                lastVisibilityUpdateRef.current = nowMs;
                forceRender((v) => v + 1);
            }
        }
    });

    const scaleFactor = THREE.MathUtils.mapLinear(camFov, 120, 10, 0.6, 1.35);
    // Labels appear as you zoom in; at very wide FOV they mostly stay hidden.
    const zoomPresence = clamp01(THREE.MathUtils.mapLinear(camFov, 120, 65, 0.0, 1.0));
    const nonFocusedFade = clamp01(THREE.MathUtils.mapLinear(camFov, 35, 70, 0.0, 1.0));

    return (
        <group renderOrder={100}>
            {labels.map(({ name, label, pos, vector }) => {
                const isFocused = name === focusedConstellation;
                const isVisible = isFocused || visibleRef.current.has(name);
                if (!isVisible) return null;

                const opacity = isFocused ? 1.0 : 0.82 * nonFocusedFade * zoomPresence;
                if (opacity < 0.01 && !isFocused) return null;

                return (
                    <Html
                        key={name}
                        position={pos}
                        center
                        distanceFactor={130}
                        zIndexRange={[100, 50]}
                        pointerEvents="auto"
                    >
                        <div
                            onPointerEnter={() => { hoveredRef.current = name; }}
                            onPointerLeave={() => { hoveredRef.current = null; }}
                            onClick={(e) => {
                                e.stopPropagation();
                                pinnedRef.current = { name, until: Date.now() + PIN_MS };

                                setFocusedConstellation(name);

                                const { ra, dec } = vectorToRaDec(vector);
                                const display = getConstellationDisplayName(name);

                                // Select + target so the camera flies to the constellation center and the IA reacts.
                                const constellationTarget = {
                                    name,
                                    ra,
                                    dec,
                                    desc: `La constelacion de ${display}.`,
                                    color: '#60a5fa',
                                    mag: 0,
                                    symbol: '\u2726',
                                    kind: 'planet',
                                } satisfies Planet;

                                setSelectedObject(constellationTarget);
                                setTargetedObject(constellationTarget);
                            }}
                            className={cn(
                                'flex flex-col items-center pointer-events-auto cursor-pointer select-none',
                                'transition-all duration-500 transform-gpu',
                                isFocused ? 'scale-105' : 'scale-90'
                            )}
                            style={{
                                opacity,
                                transform: `scale(${scaleFactor * (isFocused ? 1.0 : 0.92)})`,
                                transition: 'opacity 0.4s ease',
                            }}
                        >
                            <div
                                className={cn(
                                    'w-1 h-1 rounded-full mb-1.5 transition-all duration-500',
                                    isFocused
                                        ? (nightMode ? 'bg-red-400 shadow-[0_0_8px_#ff4444]' : 'bg-blue-400 shadow-[0_0_8px_#3b82f6]')
                                        : 'bg-white/40'
                                )}
                            />

                            <span
                                className={cn(
                                    'px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest whitespace-nowrap',
                                    'transition-all duration-500 border-2',
                                    isFocused
                                        ? (nightMode
                                            ? 'text-red-400 bg-red-950/90 border-red-500/80'
                                            : 'text-white bg-blue-700/80 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.5)]')
                                        : (nightMode
                                            ? 'text-red-900 bg-black/60 border-red-900/40'
                                            : 'text-white/90 bg-black/80 border-white/20')
                                )}
                            >
                                {label}
                            </span>
                        </div>
                    </Html>
                );
            })}
        </group>
    );
}
