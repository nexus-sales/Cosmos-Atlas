'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { useCatalog } from '@/stores/useCatalogStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import type { Planet } from '@/types/celestial';
import { terrainHorizonRef } from '@/lib/skyRefs';
import { horizonAltitudeAtAzimuth } from '@/lib/astronomy/horizonProfile';

type ConstellationTarget = Planet & {
    angularSize: number;
};

const PIN_MS = 8000;
const VISIBILITY_THROTTLE_MS = 180;
const CONSTELLATION_SYMBOL = '\u2726';

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
    const selectedObject = useAppStore((state) => state.selectedObject);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const stars = useCatalog(s => s.stars);
    const starMap = useMemo(() => new Map(stars.map(s => [s.name, s])), [stars]);
    const groupRef = useRef<THREE.Group>(null);

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
                const star = starMap.get(sName);
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
    }, [starMap]);

    useFrame(({ camera }) => {
        const now = Date.now();
        const pinned = pinnedRef.current;
        if (pinned && pinned.until > now) {
            if (pinned.name !== focusedConstellation) setFocusedConstellation(pinned.name);
        }
        if (pinned && pinned.until <= now) pinnedRef.current = null;

        if (hoveredRef.current) {
            if (hoveredRef.current !== focusedConstellation) {
                setFocusedConstellation(hoveredRef.current);
            }
        }

        // 1. Camera direction in World Space
        const camWorldDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

        // 2. Transform that direction to Local Space of the celestial group
        // This is critical because the group rotates with the sky!
        const groupQuat = groupRef.current ? groupRef.current.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
        const localLookDir = camWorldDir.clone()
            .applyQuaternion(groupQuat.clone().invert())
            .normalize();

        let bestName: string | null = null;
        let bestDot = 0.86; 

        labels.forEach(({ name, vector }) => {
            const dot = localLookDir.dot(vector.clone().normalize());
            if (dot > bestDot) {
                bestDot = dot;
                bestName = name;
            }
        });

        if (bestName !== focusedConstellation && !pinnedRef.current && !hoveredRef.current) {
            setFocusedConstellation(bestName);
        }

        // --- VISIBILITY CALCULATION ---
        const nextVisible = new Set<string>();

        const sortedLabels = labels
            .map((l) => ({ ...l, dot: localLookDir.dot(l.vector.clone().normalize()) }))
            .sort((a, b) => b.dot - a.dot);

        // ALWAYS show at least the top N closest to center to allow interaction
        // If FOV is very narrow, we show fewer to avoid clutter.
        const maxToShow = camFov < 30 ? 3 : (camFov < 60 ? 6 : 10);
        
        sortedLabels.slice(0, maxToShow).forEach(l => {
            if (l.dot > (camFov > 70 ? 0.2 : 0.45)) {
                nextVisible.add(l.name);
            }
        });

        if (focusedConstellation) nextVisible.add(focusedConstellation);
        if (selectedObject && CONSTELLATIONS[selectedObject.name]) {
            nextVisible.add(selectedObject.name);
        }

        // Los elementos Html no participan en el depth buffer de Three.js.
        // Se ocultan si su centro queda detrás del perfil DEM.
        labels.forEach(({ name, vector }) => {
            const worldDirection = vector.clone().applyQuaternion(groupQuat).normalize();
            const altitude = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(worldDirection.y, -1, 1)));
            const azimuth = (THREE.MathUtils.radToDeg(Math.atan2(worldDirection.x, -worldDirection.z)) + 360) % 360;
            if (altitude <= horizonAltitudeAtAzimuth(terrainHorizonRef.current, azimuth)) nextVisible.delete(name);
        });

        const nowMs = Date.now();
        if (visibleRef.current.size === 0 || nowMs - lastVisibilityUpdateRef.current >= VISIBILITY_THROTTLE_MS) {
            const prev = visibleRef.current;
            let changed = prev.size !== nextVisible.size;
            if (!changed) {
                for (const item of nextVisible) {
                    if (!prev.has(item)) { changed = true; break; }
                }
            }

            if (changed) {
                visibleRef.current = nextVisible;
                lastVisibilityUpdateRef.current = nowMs;
                forceRender((v) => v + 1);
            }
        }
    });

    // Labels fade out as you zoom in UNLESS focused/selected
    const zoomFade = clamp01(THREE.MathUtils.mapLinear(camFov, 45, 80, 0.0, 1.0));

    return (
        <group ref={groupRef} renderOrder={100}>
            {labels.map(({ name, label, pos, vector }) => {
                const isFocused = name === focusedConstellation;
                const isSelected = selectedObject?.name === name;
                const isVisible = isFocused || isSelected || visibleRef.current.has(name);
                
                if (!isVisible) return null;

                // Priority: focused/selected are always fully opaque.
                // Others fade out as we zoom in (declutter).
                const opacity = (isFocused || isSelected) ? 1.0 : 0.8 * zoomFade;
                
                if (opacity < 0.01) return null;

                return (
                    <Html
                        key={name}
                        position={pos}
                        center
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
                                
                                const sizes: Record<string, number> = {
                                    'Orion': 25,
                                    'Ursa Major': 40,
                                    'Cassiopeia': 18,
                                    'Leo': 30,
                                    'Scorpius': 35,
                                    'Crux': 12,
                                    'Lyra': 15,
                                    'Cygnus': 30,
                                };
                                const angularSize = sizes[name] || 35;

                                const constellationTarget: ConstellationTarget = {
                                    name,
                                    ra,
                                    dec,
                                    desc: `La constelación de ${display}.`,
                                    color: '#60a5fa',
                                    mag: 0,
                                    symbol: CONSTELLATION_SYMBOL,
                                    kind: 'planet',
                                    angularSize,
                                };

                                setSelectedObject(constellationTarget);
                                setTargetedObject(constellationTarget);
                            }}
                            className={cn(
                                'flex flex-col items-center pointer-events-auto cursor-pointer select-none',
                                'transition-opacity duration-500 transform-gpu'
                            )}
                            style={{
                                opacity,
                                transition: 'opacity 0.4s ease',
                            }}
                        >
                            <span
                                className={cn(
                                    'text-[14px] font-medium tracking-[0.25em] whitespace-nowrap',
                                    'transition-all duration-500',
                                    (isFocused || isSelected)
                                        ? (nightMode
                                            ? 'text-red-400 font-bold'
                                            : 'text-white font-bold')
                                        : (nightMode
                                            ? 'text-red-900/70'
                                            : 'text-white/60')
                                )}
                                style={{
                                    textShadow: nightMode 
                                        ? '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,0.9)' 
                                        : '0 0 12px rgba(0,0,0,1), 0 0 5px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
                                    transform: name === 'Perseus' ? 'translateY(60px)' : (name === 'Orion' ? 'translateY(80px)' : 'none')
                                }}
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
