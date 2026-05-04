'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

const GRID_VERTEX_SHADER = `
    varying vec2 vUv;
    varying float vDistance;
    void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDistance = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const GRID_FRAGMENT_SHADER = `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uTime;
    varying float vDistance;

    void main() {
        // Efecto de pulso láser sutil
        float pulse = sin(uTime * 1.5) * 0.15 + 0.85;
        
        // Fade out por distancia para evitar moiré en el horizonte
        float distFade = smoothstep(120.0, 60.0, vDistance);
        
        gl_FragColor = vec4(uColor, uOpacity * pulse * distFade);
    }
`;

/**
 * Celestial Grid (RA/Dec) - "Laser HUD" Edition
 * Modern dashed/pulsing lines for a high-tech observatory feel.
 */
export default function CelestialGrid() {
    const RADIUS = 92;
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const lineGeometries = useMemo(() => {
        const results: THREE.BufferGeometry[] = [];

        // Circles of declination (every 15 degrees)
        for (let dec = -75; dec <= 75; dec += 15) {
            const pts: number[] = [];
            for (let ra = 0; ra <= 360; ra += 2) { // Mas resolución para curvas suaves
                const p = equatorialTo3D(ra, dec, RADIUS);
                pts.push(...p);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            results.push(geom);
        }

        // Meridians (every 15 degrees)
        for (let ra = 0; ra < 360; ra += 15) {
            const pts: number[] = [];
            for (let dec = -90; dec <= 90; dec += 2) {
                const p = equatorialTo3D(ra, dec, RADIUS);
                pts.push(...p);
            }
            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            results.push(geom);
        }

        return results;
    }, []);

    const nightMode = useAppStore((state) => state.settings.nightMode);
    const gridColor = useMemo(() => new THREE.Color(nightMode ? '#ff0000' : '#00f2ff'), [nightMode]);
    const gridOpacity = nightMode ? 0.15 : 0.25;

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    const uniforms = useMemo(() => ({
        uColor: { value: gridColor },
        uOpacity: { value: gridOpacity },
        uTime: { value: 0 }
    }), [gridColor, gridOpacity]);

    return (
        <group name="CelestialGrid">
            {lineGeometries.map((geom, i) => {
                const isEquator = i === 5; // Aproximadamente el ecuador
                return (
                    <line key={i}>
                        <primitive object={geom} attach="geometry" />
                        <shaderMaterial
                            ref={materialRef}
                            vertexShader={GRID_VERTEX_SHADER}
                            fragmentShader={GRID_FRAGMENT_SHADER}
                            uniforms={uniforms}
                            transparent
                            depthTest={true}
                            depthWrite={false}
                            linewidth={isEquator ? 2 : 1}
                        />
                    </line>
                );
            })}
        </group>
    );
}
