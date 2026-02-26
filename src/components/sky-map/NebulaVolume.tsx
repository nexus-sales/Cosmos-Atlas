'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NEBULA_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const NEBULA_FRAGMENT_SHADER = `
    uniform float iTime;
    uniform vec3 iColor;
    uniform float iOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;

    // Simplex noise 3D
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857; 
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
        // Distancia radial al centro del objeto
        float dist = length(vUv - 0.5);
        if (dist > 0.5) discard;

        // FBM Simple para nubes
        float n = snoise(vec3(vUv * 3.5, iTime * 0.05)) * 0.5 + 0.5;
        n += snoise(vec3(vUv * 7.0, iTime * 0.1)) * 0.25;
        n = clamp(n, 0.0, 1.0);

        // Atenuación suave por radio
        float edge = smoothstep(0.5, 0.2, dist);
        
        // Color base nebuloso con variaciones
        vec3 finalColor = iColor * n * 1.5;
        // Añadir toque de H-Alpha (rojizo) sutil si el color base es frío
        finalColor += vec3(0.2, 0.05, 0.1) * (1.0 - n) * edge;

        float alpha = n * edge * iOpacity;
        gl_FragColor = vec4(finalColor, alpha);
    }
`;

export default function NebulaVolume({ color, size, opacity }: { color: string; size: number; opacity: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const uniforms = useMemo(() => ({
        iTime: { value: 0 },
        iColor: { value: new THREE.Color(color) },
        iOpacity: { value: opacity }
    }), [color, opacity]);

    useFrame((state) => {
        if (meshRef.current) {
            uniforms.iTime.value = state.clock.getElapsedTime();
            // Billboard effect: que mire siempre a cámara
            meshRef.current.quaternion.copy(state.camera.quaternion);
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[size, size]} />
            <shaderMaterial
                vertexShader={NEBULA_VERTEX_SHADER}
                fragmentShader={NEBULA_FRAGMENT_SHADER}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}
