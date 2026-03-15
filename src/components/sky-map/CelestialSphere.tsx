'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

// Sky color states by sun altitude (degrees)
// All colors kept below luminance ~0.18 so they don't trigger bloom
// Night < -18°, Astronomical -18 to -12, Nautical -12 to -6,
// Civil twilight -6 to 0, Sunrise/Sunset 0 to 8, Day > 8
const SKY_NIGHT      = new THREE.Color('#04091a');  // near-black deep navy
const SKY_ASTRO      = new THREE.Color('#060c20');
const SKY_NAUTICAL   = new THREE.Color('#08102a');
const SKY_CIVIL      = new THREE.Color('#0c1838');
const SKY_TWILIGHT   = new THREE.Color('#150d30');  // dark purple
const SKY_SUNRISE    = new THREE.Color('#3c1408');  // very dark burnt orange
const SKY_DAY        = new THREE.Color('#183c70');  // deep blue sky (daytime)

/**
 * Returns sky base color for the given sun altitude in degrees.
 * Smooth interpolation between states.
 */
function getSkyColor(alt: number): THREE.Color {
    const c = new THREE.Color();
    if (alt < -18) {
        return SKY_NIGHT.clone();
    } else if (alt < -12) {
        const t = (alt + 18) / 6; // 0..1
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

    if (viewMode === 'camera') return null;

    useFrame(() => {
        if (!matRef.current) return;
        const { time, observer } = useAppStore.getState();
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');
            const targetColor = getSkyColor(hor.altitude);
            // Smooth lerp to avoid sudden jumps
            currentColor.current.lerp(targetColor, 0.02);
            matRef.current.color.copy(currentColor.current);
        } catch {
            // If calculation fails, keep current color
        }
    });

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
