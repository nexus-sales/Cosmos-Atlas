'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  
  void main() {
    vColor = color;
    vOpacity = 0.78 + 0.22 * sin(uTime * 1.8 + position.x * 8.0 + position.y * 4.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (480.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float strength = pow(1.0 - (r * 2.0), 1.1);
    float halo = pow(max(0.0, 1.0 - r * 1.4), 3.0) * 0.4;
    gl_FragColor = vec4(vColor, (strength + halo) * vOpacity);
  }
`;

const RADIUS = 98;
/** Radio de la esfera de detección de eventos para cada estrella. */
const HIT_RADIUS = 2.0;


/** Hitbox invisible que detecta click/hover para cada estrella nombrada */
function StarHitbox({ star, pos }: { star: typeof STARS[0]; pos: [number, number, number] }) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const [hovered, setHovered] = useState(false);

    return (
        <group position={pos}>
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(star); }}
            >
                <sphereGeometry args={[HIT_RADIUS, 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {hovered && (
                <Html distanceFactor={120} zIndexRange={[100, 0]}>
                    <div style={{
                        background: 'rgba(2,8,20,0.88)',
                        border: `1px solid ${star.color}55`,
                        borderRadius: '4px',
                        padding: '4px 10px',
                        color: star.color,
                        fontSize: '11px',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        letterSpacing: '1px',
                        pointerEvents: 'none',
                        textShadow: `0 0 10px ${star.color}`,
                        transform: 'translateX(-50%) translateY(-28px)',
                    }}>
                        {star.name}
                        <div style={{ fontSize: '9px', color: '#ffffff55', fontWeight: 'normal', letterSpacing: '0.5px' }}>
                            Mag {star.mag.toFixed(2)} · {star.constellation}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function Stars() {
    const pointsRef = useRef<THREE.Points>(null);

    const [geometry, material, starPositions] = useMemo(() => {
        const pos = new Float32Array(STARS.length * 3);
        const col = new Float32Array(STARS.length * 3);
        const sz  = new Float32Array(STARS.length);
        const positions3D: [number, number, number][] = [];

        STARS.forEach((star, i) => {
            const p = equatorialTo3D(star.ra, star.dec, RADIUS);
            pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
            positions3D.push(p);

            const color = new THREE.Color(star.color || '#ffffff');
            col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
            sz[i] = Math.max(1.5, (6.5 - star.mag) * 0.95);
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color',    new THREE.BufferAttribute(col, 3));
        geom.setAttribute('size',     new THREE.BufferAttribute(sz, 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            depthWrite: false,
        });

        return [geom, mat, positions3D];
    }, []);

    useFrame((state) => {
        (material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
    });

    return (
        <group>
            {/* Renderizado visual en shader */}
            <points ref={pointsRef} geometry={geometry} material={material} />

            {/* Hitboxes invisibles para click y hover */}
            {STARS.map((star, i) => (
                <StarHitbox key={star.name} star={star} pos={starPositions[i]} />
            ))}
        </group>
    );
}
