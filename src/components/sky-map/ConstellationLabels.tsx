'use client';

import { useMemo, useRef } from 'react';
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

    // Tracks which label the mouse is currently over.
    // Prevents useFrame from overriding hover-based focus.
    const hoveredRef = useRef<string | null>(null);

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

    // Track what the user is looking at in the center of the viewport.
    // If the mouse is over a label, that takes priority over camera detection.
    useFrame(({ camera }) => {
        if (hoveredRef.current) {
            if (hoveredRef.current !== focusedConstellation) {
                setFocusedConstellation(hoveredRef.current);
            }
            return;
        }

        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let bestName = null;
        let bestDot = 0.94; // Umbral más estricto (~20 grados)

        labels.forEach(({ name, vector }) => {
            const dot = lookDir.dot(vector);
            if (dot > bestDot) {
                bestDot = dot;
                bestName = name;
            }
        });

        if (bestName !== focusedConstellation) {
            setFocusedConstellation(bestName);
        }
    });

    const setSelectedObject = useAppStore(state => state.setSelectedObject);
    const scaleFactor = THREE.MathUtils.mapLinear(camFov, 120, 10, 0.8, 1.6);

    // Fade de los labels no-focused:
    // FOV >= 70° → todos visibles (1.0)
    // FOV  35–70° → transición gradual (1.0 → 0.0)
    // FOV <  35° → solo el focused es visible, el resto desaparece
    const nonFocusedFade = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 35, 70, 0.0, 1.0),
        0.0, 1.0
    );

    return (
        <group renderOrder={100}>
            {labels.map(({ name, label, pos }) => {
                const isFocused = name === focusedConstellation;

                // Focused siempre visible; el resto se desvanece con el zoom
                const opacity = isFocused ? 1.0 : 0.80 * nonFocusedFade;

                // No renderizar elementos invisibles para ahorrar DOM
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
                                setFocusedConstellation(name);
                                // Set as selected so IA talks about it
                                setSelectedObject({
                                    name: name,
                                    ra: 0, dec: 90, // Position irrelevant for IA
                                    desc: `La constelación de ${getConstellationDisplayName(name)}.`,
                                    kind: 'planet' // We reuse the type check for IA
                                } as any);
                            }}
                            className={cn(
                                "flex flex-col items-center pointer-events-auto cursor-pointer select-none",
                                "transition-all duration-500 transform-gpu",
                                isFocused ? "scale-105" : "scale-90"
                            )}
                            style={{
                                opacity,
                                transform: `scale(${scaleFactor})`,
                                transition: 'opacity 0.4s ease',
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
                                    "px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest whitespace-nowrap",
                                    "transition-all duration-500 border-2",
                                    isFocused 
                                        ? (nightMode 
                                            ? "text-red-400 bg-red-950/90 border-red-500/80" 
                                            : "text-white bg-blue-700/80 border-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.5)]")
                                        : (nightMode
                                            ? "text-red-900 bg-black/60 border-red-900/40"
                                            : "text-white/90 bg-black/80 border-white/20")
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
