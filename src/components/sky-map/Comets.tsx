'use client';

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COMETS, getCometPosition, getCometInfo } from '@/data/comets';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';

const cometVertexShader = `
    attribute vec3 color;
    varying vec3 vWorldPosition;
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float uTime;
    
    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vColor = color;
        
        // Animación de parpadeo en la cola
        float flicker = 0.7 + 0.3 * sin(uTime * 3.0 + position.x * 10.0);
        vAlpha = flicker * (1.0 - length(position.xy) / 10.0);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const cometFragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
        // Forma de la cola (gradiente suave)
        float alpha = vAlpha * 0.6;
        gl_FragColor = vec4(vColor, alpha);
    }
`;

function CometTail({ comet, position }: { comet: typeof COMETS[0]; position: [number, number, number] }) {
    const tailRef = useRef<THREE.Points>(null);
    const timeRef = useRef(0);

    const { geometry, material } = useMemo(() => {
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const tailColor = new THREE.Color(comet.color);

        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            
            // Cola cónica que se ensancha
            const spread = t * 2.5;
            const x = (Math.random() - 0.5) * spread;
            const y = (Math.random() - 0.5) * spread;
            const z = -t * comet.tailLength * 0.5; // Cola hacia atrás

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color渐变: núcleo blanco, cola del color del cometa
            const colorMix = t;
            const r = THREE.MathUtils.lerp(1.0, tailColor.r, colorMix);
            const g = THREE.MathUtils.lerp(1.0, tailColor.g, colorMix);
            const b = THREE.MathUtils.lerp(1.0, tailColor.b, colorMix);

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.ShaderMaterial({
            vertexShader: cometVertexShader,
            fragmentShader: cometFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uTime: { value: 0 }
            }
        });

        return { geometry: geom, material: mat };
    }, [comet.color, comet.tailLength]);

    useFrame((state) => {
        if (tailRef.current) {
            timeRef.current = state.clock.elapsedTime;
            (tailRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = timeRef.current;
            
            // Rotación suave de la cola
            tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group position={position}>
            {/* Núcleo del cometa */}
            <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            
            {/* Coma (atmósfera del cometa) */}
            <mesh>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color={comet.color} transparent opacity={0.3} />
            </mesh>

            {/* Cola iónica */}
            <points ref={tailRef} geometry={geometry} material={material} />
        </group>
    );
}

interface CometData {
    id: string;
    name: string;
    designation: string;
    pos: [number, number, number];
    magnitude: number;
    visible: boolean;
    tailAngle: number;
    description: string;
    color: string;
}

function CometItem({ comet }: { comet: CometData }) {
    const [hovered, setHovered] = useState(false);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const displayColor = nightMode ? '#ff4444' : comet.color;

    return (
        <group position={comet.pos}>
            {/* Hitbox invisible */}
            <mesh
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedObject({
                        name: comet.name,
                        ra: 0,
                        dec: 0,
                        mag: comet.magnitude,
                        desc: comet.description,
                        color: comet.color,
                        kind: 'planet' as const,
                        symbol: '☄️'
                    });
                }}
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[1.5, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Cometa con cola */}
            <CometTail 
                comet={{ ...COMETS.find(c => c.id === comet.id)!, color: comet.color, tailLength: comet.tailAngle }}
                position={[0, 0, 0]}
            />

            {/* Label en hover */}
            {hovered && (
                <Html distanceFactor={15} zIndexRange={[100, 0]}>
                    <div
                        className="accent-label pointer-events-none whitespace-nowrap -translate-y-5 rounded border bg-black/60 px-2 py-[3px] text-[11px] font-bold font-mono"
                        style={{
                            '--accent-color': displayColor,
                            '--accent-border': `${displayColor}66`,
                        } as CSSProperties}
                    >
                        ☄️ {comet.name}
                        <div className="mt-0.5 text-[9px] opacity-70">
                            Mag {comet.magnitude.toFixed(1)} · {comet.visible ? '✓ Visible' : '⚠ Débil'}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function Comets() {
    const COMET_RADIUS = 92;
    const time = useAppStore((state) => state.time);

    const cometData = useMemo(() => {
        return COMETS
            .filter(c => c.active)
            .map((comet) => {
                const pos = getCometPosition(comet, time);
                const info = getCometInfo(comet, time);
                const spherePos = equatorialTo3D(pos.ra, pos.dec, COMET_RADIUS) as [number, number, number];
                
                return {
                    ...comet,
                    pos: spherePos,
                    magnitude: info.magnitude,
                    visible: info.visible,
                    tailAngle: info.tailAngle,
                    description: info.description
                };
            });
    }, [time]);

    return (
        <group>
            {cometData.map((comet) => (
                <CometItem key={comet.id} comet={comet} />
            ))}
        </group>
    );
}
