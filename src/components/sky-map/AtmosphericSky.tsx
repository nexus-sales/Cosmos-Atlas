'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

const SKY_VERTEX_SHADER = `
    varying vec3 vWorldPosition;
    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const SKY_FRAGMENT_SHADER = `
    uniform vec3 uSunPos;
    uniform float uTime;
    uniform float uBortle;
    uniform float uSuppression; // 1.0 = normal, 0.0 = dark (space mode)
    varying vec3 vWorldPosition;

    const vec3 EarthBlue = vec3(0.05, 0.21, 0.55); 
    const vec3 SpaceBlack = vec3(0.002, 0.005, 0.012);

    void main() {
        vec3 viewDir = normalize(vWorldPosition);
        vec3 sunDir = normalize(uSunPos);
        
        float cosTheta = dot(viewDir, sunDir);
        float zenithAngle = viewDir.y; 
        
        float rPhase = 0.75 * (1.0 + cosTheta * cosTheta);
        vec3 rayleighColor = EarthBlue * rPhase;

        float mPhase = (1.0 - 0.7 * 0.7) / (pow(1.0 + 0.7 * 0.7 - 2.0 * 0.7 * cosTheta, 1.5) * 4.0 * 3.1415);
        vec3 mieColor = vec3(1.0, 0.8, 0.4) * mPhase * 0.2;

        float sunAltitude = sunDir.y;
        float dayFactor = smoothstep(-0.2, 0.2, sunAltitude);
        
        // Gradiente de horizonte
        float horizonGlow = exp(-max(0.0, zenithAngle) * 5.0);
        vec3 nightColor = mix(SpaceBlack, vec3(0.03, 0.08, 0.18), horizonGlow * (uBortle / 4.0));
        
        vec3 sunsetColor = vec3(1.0, 0.3, 0.1) * pow(max(0.0, cosTheta), 3.0) * (1.0 - dayFactor);
        
        // Aplicar supresión atmosférica (Space Mode)
        vec3 dayColor = mix(nightColor, rayleighColor + mieColor, dayFactor);
        vec3 finalColor = mix(nightColor, dayColor, uSuppression);
        
        finalColor += sunsetColor * smoothstep(-0.3, 0.0, sunAltitude) * uSuppression;

        finalColor = 1.0 - exp(-2.0 * finalColor);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export default function AtmosphericSky() {
    const meshRef = useRef<THREE.Mesh>(null);
    const bortleScale = useAppStore((s) => s.settings.bortleScale);
    const camFov = useAppStore((s) => s.camFov);
    const sunPos = useMemo(() => new THREE.Vector3(100, 0, 0), []);

    const uniforms = useMemo(() => ({
        uSunPos: { value: sunPos },
        uTime: { value: 0 },
        uBortle: { value: bortleScale },
        uSuppression: { value: 1.0 }
    }), [bortleScale, sunPos]);

    useFrame((state) => {
        if (!meshRef.current) return;

        // Suprimir atmósfera si estamos haciendo zoom (FOV < 45)
        const suppression = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 45, 20, 1.0, 0.0),
            0.0, 1.0
        );
        uniforms.uSuppression.value = suppression;

        const { time, observer } = useAppStore.getState();
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');

            const el = THREE.MathUtils.degToRad(hor.altitude);
            const az = THREE.MathUtils.degToRad(hor.azimuth);

            uniforms.uSunPos.value.set(
                Math.cos(el) * Math.sin(az),
                Math.sin(el),
                -Math.cos(el) * Math.cos(az)
            );
        } catch { /* ignore error, keep previous sun pos */ }

        uniforms.uTime.value = state.clock.getElapsedTime();
        meshRef.current.position.copy(state.camera.position);
    });

    return (
        <mesh ref={meshRef} renderOrder={-5}>
            <sphereGeometry args={[115, 64, 64]} />
            <shaderMaterial
                vertexShader={SKY_VERTEX_SHADER}
                fragmentShader={SKY_FRAGMENT_SHADER}
                uniforms={uniforms}
                side={THREE.BackSide}
                depthWrite={false}
                transparent={true} // Cambiado a true para permitir fade a negro/espacio
            />
        </mesh>
    );
}
