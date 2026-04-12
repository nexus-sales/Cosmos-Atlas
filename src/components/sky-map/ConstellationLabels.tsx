'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame } from '@react-three/fiber';
import { cn } from '@/lib/utils';

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));

/**
 * Constellation Labels — High visibility / Premium feel:
 * - Centered on constellation geometry
 * - Fade in/out based on camera focus
 * - Clickable to select constellation
 * - Optimized for both Desktop and Mobile
 */
export default function ConstellationLabels() {
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const camFov = useAppStore((state) => state.camFov);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const setFocusedConstellation = useAppStore((state) => state.setFocusedConstellation);
    const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

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
            // Radius 88 — puts it "floating" slightly below the stars (radius 100)
            const pos = centroid.clone().multiplyScalar(88).toArray() as [number, number, number];
            return [{ 
                name, 
                label: getConstellationDisplayName(name).toUpperCase(), 
                pos, 
                vector: centroid 
            }];
        });
    }, []);

    // Track what the user is looking at in the center of the viewport
    useFrame(({ camera }) => {
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let bestName = null;
        let bestDot = -1;

        labels.forEach(({ name, vector }) => {
            const dot = lookDir.dot(vector);
            if (dot > 0.82 && dot > bestDot) { // ~35 degrees of field of view tolerance
                bestDot = dot;
                bestName = name;
            }
        });

        if (bestName !== focusedConstellation) {
            setFocusedConstellation(bestName);
        }
    });

    const scaleFactor = THREE.MathUtils.mapLinear(camFov, 90, 10, 0.9, 1.4);

    return (
        <group renderOrder={100}>
            {labels.map(({ name, label, pos }) => {
                const isFocused = name === focusedConstellation;
                
                // Visibility logic: 
                // High contrast always for legibility.
                const baseOpacity = isFocused ? 1.0 : 0.85;
                const zoomFade = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 90, 50, 1.0, 0.4), 0.4, 1.0);
                const opacity = baseOpacity * zoomFade;

                return (
                    <Html
                        key={name}
                        position={pos}
                        center
                        distanceFactor={130}
                        zIndexRange={[100, 50]}
                    >
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                setFocusedConstellation(name);
                                setSidebarOpen(true);
                            }}
                            className={cn(
                                "flex flex-col items-center pointer-events-auto cursor-pointer select-none",
                                "transition-all duration-500 transform-gpu",
                                isFocused ? "scale-105" : "scale-90"
                            )}
                            style={{ 
                                opacity,
                                transform: `scale(${scaleFactor})`,
                            }}
                        >
                            {/* Decorative dot */}
                            <div className={cn(
                                "w-1 h-1 rounded-full mb-1.5 transition-all duration-500",
                                isFocused 
                                    ? (nightMode ? "bg-red-400 shadow-[0_0_8px_#ff4444]" : "bg-blue-400 shadow-[0_0_8px_#3b82f6]")
                                    : "bg-white/40"
                            )} />
                            
                            {/* The Label */}
                            <span 
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] whitespace-nowrap",
                                    "transition-all duration-500 border",
                                    isFocused 
                                        ? (nightMode 
                                            ? "text-red-400 bg-red-950/80 border-red-500/50" 
                                            : "text-white bg-blue-600/60 border-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]")
                                        : (nightMode
                                            ? "text-red-900 bg-black/40 border-red-900/20"
                                            : "text-white/80 bg-black/60 border-white/10")
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
