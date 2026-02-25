'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getSolarActivity, isAuroraVisible, AURORA_COLORS } from '@/lib/solarActivity';
import { useAppStore } from '@/stores/useAppStore';

const auroraVertexShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uKPIndex;
    
    // Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x * x0.x  + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }
    
    void main() {
        vUv = uv;
        
        // Ondulación de aurora (múltiples capas de noise)
        float noise1 = snoise(vec2(uv.x * 3.0 + uTime * 0.1, uv.y * 2.0));
        float noise2 = snoise(vec2(uv.x * 6.0 - uTime * 0.15, uv.y * 4.0));
        float noise3 = snoise(vec2(uv.x * 12.0 + uTime * 0.2, uv.y * 8.0));
        
        // Desplazamiento vertical basado en KP index
        float displacement = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * (0.5 + uKPIndex * 0.15);
        
        vec3 newPosition = position;
        newPosition.y += displacement * 5.0;
        newPosition.z += displacement * 2.0;
        
        vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const auroraFragmentShader = `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    uniform vec3 uColor;
    uniform float uKPIndex;
    uniform float uOpacity;
    
    void main() {
        // Gradiente vertical (más brillante abajo)
        float gradient = 1.0 - smoothstep(0.0, 1.0, vUv.y);
        
        // Bandas horizontales (rayos de aurora)
        float bands = sin(vUv.y * 20.0 + vUv.x * 5.0) * 0.5 + 0.5;
        bands = smoothstep(0.3, 0.7, bands);
        
        // Bordes difusos
        float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(0.9, 1.0, vUv.x);
        edgeFade *= smoothstep(0.0, 0.1, vUv.y);
        
        // Intensidad basada en KP
        float intensity = gradient * bands * edgeFade * (0.3 + uKPIndex * 0.1);
        
        // Mezcla de colores (verde dominante, rojo arriba, azul abajo)
        vec3 color = uColor;
        if (vUv.y > 0.7) {
            color = mix(color, vec3(1.0, 0.0, 0.0), (vUv.y - 0.7) * 3.0); // Rojo oxígeno
        }
        if (vUv.y < 0.3) {
            color = mix(color, vec3(0.0, 0.5, 1.0), (0.3 - vUv.y) * 3.0); // Azul nitrógeno
        }
        
        float alpha = intensity * uOpacity * 0.8;
        gl_FragColor = vec4(color, alpha);
    }
`;

function AuroraCurtain({ 
    position, 
    rotation, 
    scale,
    color,
    kpIndex 
}: { 
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    color: string;
    kpIndex: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);

    const { geometry, material } = useMemo(() => {
        const geom = new THREE.PlaneGeometry(100, 50, 64, 32);
        
        const mat = new THREE.ShaderMaterial({
            vertexShader: auroraVertexShader,
            fragmentShader: auroraFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uKPIndex: { value: kpIndex },
                uColor: { value: new THREE.Color(color) },
                uOpacity: { value: 0.6 }
            }
        });

        return { geometry: geom, material: mat };
    }, [color, kpIndex]);

    useFrame((state) => {
        if (meshRef.current && material) {
            timeRef.current = state.clock.elapsedTime;
            (material as THREE.ShaderMaterial).uniforms.uTime.value = timeRef.current;
            (material as THREE.ShaderMaterial).uniforms.uKPIndex.value = kpIndex;
            
            // Movimiento suave de la cortina
            meshRef.current.rotation.z = Math.sin(timeRef.current * 0.2) * 0.05;
        }
    });

    return (
        <mesh 
            ref={meshRef} 
            position={position} 
            rotation={rotation} 
            scale={scale}
            geometry={geometry}
            material={material}
        />
    );
}

export default function AuroraBorealis() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const { solarActivity, isVisible, auroraType } = useMemo(() => {
        const activity = getSolarActivity(time);
        const visible = isAuroraVisible(activity.kpIndex, observer.lat);
        const type = observer.lat >= 0 ? 'boreal' : 'austral';
        return { solarActivity: activity, isVisible: visible, auroraType: type };
    }, [time, observer.lat]);

    if (!isVisible) return null;

    // Posición: horizonte norte (boreal) o sur (austral)
    const direction = auroraType === 'boreal' ? 1 : -1;
    const baseY = 10;
    const baseZ = direction * 80;

    return (
        <group>
            {/* Múltiples cortinas de aurora para efecto de profundidad */}
            <AuroraCurtain
                position={[0, baseY, baseZ]}
                rotation={[0.3, 0, 0]}
                scale={[1, 1, 1]}
                color={solarActivity.color}
                kpIndex={solarActivity.kpIndex}
            />
            <AuroraCurtain
                position={[-30, baseY + 5, baseZ - 20]}
                rotation={[0.4, 0.1, 0]}
                scale={[0.8, 1.2, 1]}
                color={AURORA_COLORS.oxygen630}
                kpIndex={solarActivity.kpIndex}
            />
            <AuroraCurtain
                position={[30, baseY + 3, baseZ - 40]}
                rotation={[0.35, -0.1, 0]}
                scale={[0.9, 1.1, 1]}
                color={AURORA_COLORS.nitrogen427}
                kpIndex={solarActivity.kpIndex}
            />

            {/* Glow en el horizonte */}
            <mesh position={[0, baseY * 0.5, baseZ * 0.8]} rotation={[0.5, 0, 0]}>
                <planeGeometry args={[200, 100]} />
                <meshBasicMaterial 
                    color={solarActivity.color}
                    transparent
                    opacity={0.15 * (solarActivity.kpIndex / 9)}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}
