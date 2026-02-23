'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  
  void main() {
    vColor = color;
    vOpacity = 0.6 + 0.4 * sin(uTime * 2.0 + position.x * 10.0 + position.y * 5.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    float strength = 1.0 - (r * 2.0);
    strength = pow(strength, 1.5);
    
    gl_FragColor = vec4(vColor, strength * vOpacity);
  }
`;

export default function Stars() {
    const meshRef = useRef<THREE.Points>(null);
    const RADIUS = 98;

    const [positions, colors, sizes] = useMemo(() => {
        const pos = new Float32Array(STARS.length * 3);
        const col = new Float32Array(STARS.length * 3);
        const sz = new Float32Array(STARS.length);

        STARS.forEach((star, i) => {
            const p = equatorialTo3D(star.ra, star.dec, RADIUS);
            pos[i * 3] = p[0];
            pos[i * 3 + 1] = p[1];
            pos[i * 3 + 2] = p[2];

            const color = new THREE.Color(star.color || '#ffffff');
            col[i * 3] = color.r;
            col[i * 3 + 1] = color.g;
            col[i * 3 + 2] = color.b;

            sz[i] = Math.max(0.5, (6 - star.mag) * 0.4);
        });

        return [pos, col, sz];
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={starVertexShader}
                fragmentShader={starFragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
            />
        </points>
    );
}
