'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

const SKY_NIGHT      = new THREE.Color('#04091a');
const SKY_ASTRO      = new THREE.Color('#060c20');
const SKY_NAUTICAL   = new THREE.Color('#08102a');
const SKY_CIVIL      = new THREE.Color('#0c1838');
const SKY_TWILIGHT   = new THREE.Color('#150d30');
const SKY_SUNRISE    = new THREE.Color('#3c1408');
const SKY_DAY        = new THREE.Color('#183c70');

function getSkyColor(alt: number): THREE.Color {
    const c = new THREE.Color();
    if (alt < -18) {
        return SKY_NIGHT.clone();
    } else if (alt < -12) {
        const t = (alt + 18) / 6;
        return c.lerpColors(SKY_NIGHT, SKY_ASTRO, t);
    } else if (alt < -6) {
        const t = (alt + 12) / 6;
        return c.lerpColors(SKY_ASTRO, SKY_NAUTICAL, t);
    } else if (alt < 0) {
        const t = (alt + 6) / 6;
        return c.lerpColors(SKY_NAUTICAL, SKY_CIVIL, t);
    } else if (alt < 4) {
        const t = alt / 4;
        return c.lerpColors(SKY_CIVIL, SKY_TWILIGHT, t);
    } else if (alt < 10) {
        const t = (alt - 4) / 6;
        return c.lerpColors(SKY_TWILIGHT, SKY_SUNRISE, t);
    } else if (alt < 20) {
        const t = (alt - 10) / 10;
        return c.lerpColors(SKY_SUNRISE, SKY_DAY, t);
    } else {
        return SKY_DAY.clone();
    }
}

export default function CelestialSphere() {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const currentColor = useRef(SKY_NIGHT.clone());
    const viewMode = useAppStore(s => s.viewMode);

    useFrame(() => {
        if (!matRef.current) return;
        const { time, observer } = useAppStore.getState();
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');
            const targetColor = getSkyColor(hor.altitude);
            currentColor.current.lerp(targetColor, 0.02);
            matRef.current.color.copy(currentColor.current);
        } catch { }
    });

    if (viewMode === 'camera') return null;

    return (
        <mesh scale={[-100, 100, 100]}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial
                ref={matRef}
                color="#04091a"
                side={THREE.BackSide}
            />
        </mesh>
    );
}
