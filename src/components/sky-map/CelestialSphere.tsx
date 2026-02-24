'use client';

import { BackSide } from 'three';

export default function CelestialSphere() {
    return (
        <mesh scale={[-100, 100, 100]}> {/* Inverted sphere */}
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial
                color="#040d1e"
                side={BackSide}
            />
        </mesh>
    );
}
