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

const TEMP_COLOR = new THREE.Color();
const SHARED_OBSERVER = new Astronomy.Observer(0, 0, 0);

function getSkyColor(alt: number, target: THREE.Color): THREE.Color {
    if (alt < -18) {
        return target.copy(SKY_NIGHT);
    } else if (alt < -12) {
        const t = (alt + 18) / 6;
        return target.lerpColors(SKY_NIGHT, SKY_ASTRO, t);
    } else if (alt < -6) {
        const t = (alt + 12) / 6;
        return target.lerpColors(SKY_ASTRO, SKY_NAUTICAL, t);
    } else if (alt < 0) {
        const t = (alt + 6) / 6;
        return target.lerpColors(SKY_NAUTICAL, SKY_CIVIL, t);
    } else if (alt < 4) {
        const t = alt / 4;
        return target.lerpColors(SKY_CIVIL, SKY_TWILIGHT, t);
    } else if (alt < 10) {
        const t = (alt - 4) / 6;
        return target.lerpColors(SKY_TWILIGHT, SKY_SUNRISE, t);
    } else if (alt < 20) {
        const t = (alt - 10) / 10;
        return target.lerpColors(SKY_SUNRISE, SKY_DAY, t);
    } else {
        return target.copy(SKY_DAY);
    }
}

export default function CelestialSphere() {
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const currentColor = useRef(new THREE.Color('#04091a'));
    const viewMode = useAppStore(s => s.viewMode);

    useFrame(() => {
        if (!matRef.current) return;
        const { time, observer } = useAppStore.getState();
        try {
            // Reutilizamos el objeto Observer
            SHARED_OBSERVER.latitude = observer.lat;
            SHARED_OBSERVER.longitude = observer.lon;
            SHARED_OBSERVER.height = 0;

            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, SHARED_OBSERVER, true, true);
            const hor = Astronomy.Horizon(time, SHARED_OBSERVER, eq.ra, eq.dec, 'normal');
            
            getSkyColor(hor.altitude, TEMP_COLOR);
            currentColor.current.lerp(TEMP_COLOR, 0.02);
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
