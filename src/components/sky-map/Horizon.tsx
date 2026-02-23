'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';

export default function Horizon() {
    const groupRef = useRef<THREE.Group>(null);
    const observer = useAppStore((state) => state.observer);
    const time = useAppStore((state) => state.time);

    useFrame(() => {
        if (groupRef.current) {
            const lst = getLST(time, observer.lon);
            // Rotate the ground based on Latitude and LST
            // This aligns the Y-up of the ground with the observer's Zenith
            groupRef.current.rotation.set(0, 0, 0); // Reset

            // 1. Rotate for LST (Longitude/Time)
            groupRef.current.rotation.y = THREE.MathUtils.degToRad(-lst);
            // 2. Rotate for Latitude
            groupRef.current.rotation.x = THREE.MathUtils.degToRad(90 - observer.lat);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Semi-transparent ground disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <circleGeometry args={[100, 64]} />
                <meshBasicMaterial
                    color="#101520"
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Radial grid on the ground */}
            <gridHelper args={[200, 20, '#3a5a8a', '#1a2a4a']} position={[0, -0.45, 0]} rotation={[0, 0, 0]} />

            {/* Compass Points */}
            <CompassPoint label="NORD" position={[0, 0, -95]} color="#ff4444" />
            <CompassPoint label="SOUTH" position={[0, 0, 95]} color="#44aaff" />
            <CompassPoint label="EAST" position={[95, 0, 0]} color="#ffffff" />
            <CompassPoint label="WEST" position={[-95, 0, 0]} color="#ffffff" />
        </group>
    );
}

function CompassPoint({ label, position, color }: { label: string; position: [number, number, number]; color: string }) {
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[1, 0.1, 4]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            {/* Label would go here, optionally with Html from drei */}
        </group>
    );
}
