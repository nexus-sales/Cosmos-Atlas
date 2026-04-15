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
    uniform float uSuppression;
    varying vec3 vWorldPosition;

    const vec3 EarthBlue  = vec3(0.04, 0.18, 0.52);
    const vec3 SpaceBlack = vec3(0.001, 0.002, 0.005);

    // Colores de contaminación lumínica reales:
    // Bortle 5-6: ámbar suave (alumbrado sodio)
    // Bortle 8-9: naranja-blanco intenso (LED moderno + sodio)
    const vec3 LightPollutionLow  = vec3(0.08, 0.04, 0.01);  // ámbar muy tenue
    const vec3 LightPollutionHigh = vec3(0.28, 0.14, 0.04);  // ámbar-naranja intenso

    void main() {
        vec3 viewDir = normalize(vWorldPosition);
        vec3 sunDir  = normalize(uSunPos);

        float cosTheta    = dot(viewDir, sunDir);
        float zenithAngle = viewDir.y;

        // Rayleigh + Mie (cielo diurno)
        float rPhase      = 0.75 * (1.0 + cosTheta * cosTheta);
        vec3  rayleighColor = EarthBlue * rPhase;
        float mPhase      = (1.0 - 0.49) / (pow(1.0 + 0.49 - 1.4 * cosTheta, 1.5) * 12.566);
        vec3  mieColor    = vec3(1.0, 0.95, 0.8) * mPhase * 0.15;

        float sunAltitude = sunDir.y;
        float dayFactor   = smoothstep(-0.25, 0.15, sunAltitude);

        // ── Contaminación lumínica nocturna (Bortle) ─────────────────────────
        // t = 0 en cielo primigenio (Bortle 1-3), t = 1 en ciudad intensa (Bortle 9)
        float pollutionT  = clamp((uBortle - 3.0) / 6.0, 0.0, 1.0);
        vec3  pollutionColor = mix(LightPollutionLow, LightPollutionHigh, pollutionT);

        // El glow se concentra en el horizonte (exp decay) pero a Bortle alto
        // se extiende hasta el cénit: horizonSpread aumenta con la contaminación.
        float horizonSpread = mix(8.0, 2.5, pollutionT);   // 8=concentrado, 2.5=difuso
        float horizonGlow   = exp(-max(0.0, zenithAngle) * horizonSpread);

        // Brillo base del cielo: en Bortle 8-9, incluso el cénit está iluminado
        float skyFloor    = pollutionT * pollutionT * 0.04; // cuadrático: muy lento hasta Bortle 6+

        vec3 nightSky = SpaceBlack
                      + pollutionColor * (horizonGlow * pollutionT + skyFloor);

        // Puesta de sol
        vec3 sunsetColor = vec3(1.0, 0.35, 0.12)
                         * pow(max(0.0, cosTheta), 8.0)
                         * smoothstep(-0.35, 0.1, sunAltitude)
                         * (1.0 - dayFactor);

        // Mezcla día/noche
        vec3 dayColor   = mix(nightSky, rayleighColor + mieColor, dayFactor);
        vec3 finalColor = mix(nightSky, dayColor, dayFactor);
        finalColor += sunsetColor;

        float alpha = clamp(uSuppression, 0.0, 1.0);
        if (zenithAngle < -0.05) alpha = 0.0;

        // Tonemapping suave
        finalColor = 1.0 - exp(-2.2 * finalColor);

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

export default function AtmosphericSky() {
    const meshRef = useRef<THREE.Mesh>(null);
    const bortleScale = useAppStore((s) => s.settings.bortleScale);
    const camFov = useAppStore((s) => s.camFov);
    const viewMode = useAppStore((s) => s.viewMode);
    const sunPos = useMemo(() => new THREE.Vector3(100, 0, 0), []);

    const uniforms = useMemo(() => ({
        uSunPos: { value: sunPos },
        uTime: { value: 0 },
        uBortle: { value: bortleScale },
        uSuppression: { value: 1.0 }
    }), [bortleScale, sunPos]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const suppression = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 35, 10, 1.0, 0.0),
            0.0, 1.0
        );
        // eslint-disable-next-line react-hooks/immutability
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

    if (viewMode === 'camera') return null;

    return (
        <mesh ref={meshRef} renderOrder={-5}>
            <sphereGeometry args={[115, 64, 64]} />
            <shaderMaterial
                vertexShader={SKY_VERTEX_SHADER}
                fragmentShader={SKY_FRAGMENT_SHADER}
                uniforms={uniforms}
                side={THREE.BackSide}
                depthWrite={false}
                transparent={true}
            />
        </mesh>
    );
}
