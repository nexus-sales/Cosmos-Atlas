'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { equToHor } from '@/lib/astronomy/transforms';

const RADIUS = 98; // Ligeramente por encima de las estrellas normales (95)

export default function SimbadOverlay() {
    const simbadObjects = useAppStore((state) => state.simbadObjects);
    const observer = useAppStore((state) => state.observer);
    const time = useAppStore((state) => state.time);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const targetedObject = useAppStore((state) => state.targetedObject);

    // Filter visible objects and calculate their local horizontal positions
    const visibleObjects = useMemo(() => {
        return simbadObjects.map(obj => {
            const { alt, az } = equToHor(obj.ra, obj.dec, observer.lat, observer.lon, time);
            
            // Only if above horizon
            if (alt > -1) {
                const phi = (90 - alt) * (Math.PI / 180);
                const theta = (az + 180) * (Math.PI / 180); // 180 deg offset because our Z- is North

                const x = RADIUS * Math.sin(phi) * Math.sin(theta);
                const y = RADIUS * Math.cos(phi);
                const z = RADIUS * Math.sin(phi) * Math.cos(theta);

                return { ...obj, pos: [x, y, z] as [number, number, number], alt };
            }
            return null;
        }).filter(Boolean) as any[];
    }, [simbadObjects, observer, time]);

    if (visibleObjects.length === 0) return null;

    return (
        <group name="SimbadObjects">
            {visibleObjects.map((obj, i) => (
                <group key={`${obj.name}-${i}`} position={obj.pos}>
                    {/* Visual Marker */}
                    <mesh onClick={() => setTargetedObject(obj)}>
                        <sphereGeometry args={[0.4, 8, 8]} />
                        <meshBasicMaterial 
                            color="#00f2ff" 
                            transparent 
                            opacity={0.8} 
                            toneMapped={false} 
                        />
                    </mesh>
                    
                    {/* Ring for targeted */}
                    {targetedObject?.name === obj.name && (
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.6, 0.7, 16]} />
                            <meshBasicMaterial color="#00f2ff" transparent opacity={0.5} toneMapped={false} />
                        </mesh>
                    )}

                    {/* Label */}
                    <Html distanceFactor={110} zIndexRange={[100, 0]}>
                        <div 
                            className="pointer-events-none select-none px-2 py-0.5 rounded border border-cyan-500/30 bg-black/60 text-cyan-300 text-[10px] font-mono whitespace-nowrap -translate-x-1/2 -translate-y-6"
                            style={{ textShadow: '0 0 8px rgba(0, 242, 255, 0.5)' }}
                        >
                            {obj.name}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
