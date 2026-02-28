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

    const vec3 EarthBlue = vec3(0.04, 0.18, 0.52);
    const vec3 SpaceBlack = vec3(0.001, 0.002, 0.005);

    void main() {
        vec3 viewDir = normalize(vWorldPosition);
        vec3 sunDir = normalize(uSunPos);
        
        float cosTheta = dot(viewDir, sunDir);
        float zenithAngle = viewDir.y; 
        
        // Rayleigh Scattering
        float rPhase = 0.75 * (1.0 + cosTheta * cosTheta);
        vec3 rayleighColor = EarthBlue * rPhase;

        // Mie Scattering (Haze)
        float mPhase = (1.0 - 0.7 * 0.7) / (pow(1.0 + 0.7 * 0.7 - 2.0 * 0.7 * cosTheta, 1.5) * 4.0 * 3.1415);
        vec3 mieColor = vec3(1.0, 0.95, 0.8) * mPhase * 0.15;

        float sunAltitude = sunDir.y;
        float dayFactor = smoothstep(-0.25, 0.15, sunAltitude);
        
        // Gradiente de horizonte (bruma nocturna)
        float horizonGlow = exp(-max(0.0, zenithAngle) * 6.5);
        vec3 nightGlow = mix(SpaceBlack, vec3(0.015, 0.04, 0.12), horizonGlow * (uBortle / 4.0));
        
        // Puesta de sol más estrecha y concentrada
        vec3 sunsetColor = vec3(1.0, 0.35, 0.12) * pow(max(0.0, cosTheta), 8.0) * smoothstep(-0.35, 0.1, sunAltitude) * (1.0 - dayFactor);
        
        // Mezcla día/noche
        vec3 dayColor = mix(nightGlow, rayleighColor + mieColor, dayFactor);
        vec3 finalColor = mix(nightGlow, dayColor, dayFactor);
        finalColor += sunsetColor;

        // Space Mode: Limpieza total al hacer zoom en planetas
        // Bajamos el alpha para que la esfera atmosférica no tape nada
        float alpha = clamp(uSuppression, 0.0, 1.0);

        // Bloqueo total bajo el horizonte (para no ver glow desde abajo)
        if (zenithAngle < -0.05) {
            alpha = 0.0;
        }

        // Tonemapping
        finalColor = 1.0 - exp(-2.2 * finalColor);
        
        gl_FragColor = vec4(finalColor, alpha);
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

        // Suprimir atmósfera si estamos haciendo zoom agresivo (FOV < 30)
        // El factor baja a 0 cuando el FOV es pequeño (zoom a planetas)
        const suppression = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 35, 10, 1.0, 0.0),
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
