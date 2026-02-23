'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export default function MilkyWay() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#3a5a8a') },
    uGlowColor: { value: new THREE.Color('#102040') },
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI * 0.35, 0, Math.PI * 0.1]}>
      <sphereGeometry args={[99.5, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uGlowColor;
          varying vec2 vUv;
          varying vec3 vPosition;

          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
              dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 a0 = x - floor(x + 0.5);
            vec3 g = a0.xyw * x.x + h.xyw * x.y;
            vec3 t = 1.79284291400159 - 0.85373472095314 * ( g*g + h*h );
            vec3 gr = vec3(0.0);
            gr.x = g.x * x0.x + h.x * x0.y;
            gr.yz = g.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, gr);
          }

          void main() {
            float dist = abs(vPosition.y / 100.0);
            float band = smoothstep(0.18, 0.0, dist);
            
            // Fix: Cast uTime to vec2 for addition
            float n1 = snoise(vUv * 6.0 + vec2(uTime * 0.005));
            float n2 = snoise(vUv * 12.0 - vec2(uTime * 0.01));
            float noiseVal = (n1 * 0.6 + n2 * 0.4);
            
            float alpha = band * (0.12 + noiseVal * 0.08);
            float core = smoothstep(0.05, 0.0, dist) * 0.1;
            
            vec3 finalColor = mix(uColor, uGlowColor, noiseVal);
            gl_FragColor = vec4(finalColor + core, alpha);
          }
        `}
      />
    </mesh>
  );
}
