'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';
import { lunarSkyGlow } from '@/lib/astronomy/skyBrightness';
import { moonHorRef } from '@/lib/skyRefs';

const SKY_VERTEX_SHADER = `
    varying vec3 vWorldPosition;
    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const SKY_FRAGMENT_SHADER = `
    uniform vec3 uSunPos;
    uniform vec3 uMoonPos;
    uniform float uMoonGlow;
    uniform float uTime;
    uniform float uBortle;
    uniform float uSuppression;
    varying vec3 vWorldPosition;

    const vec3 EarthBlue  = vec3(0.04, 0.18, 0.52);
    const vec3 SpaceBlack = vec3(0.001, 0.002, 0.005);

    // Colores de contaminación lumínica reales:
    // Bortle 5-6: ámbar suave (alumbrado sodio)
    // Bortle 8-9: naranja-blanco intenso (LED moderno + sodio)
    const vec3 LightPollutionLow  = vec3(0.018, 0.014, 0.010);
    const vec3 LightPollutionHigh = vec3(0.14, 0.09, 0.045);

    void main() {
        vec3 viewDir = normalize(vWorldPosition);
        vec3 sunDir  = normalize(uSunPos);
        vec3 moonDir = normalize(uMoonPos);

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
        float horizonSpread = mix(8.0, 1.8, pollutionT);   // 8=concentrado, 1.8=difuso
        float horizonGlow   = exp(-max(0.0, zenithAngle) * horizonSpread);

        // Brillo base del cielo: en Bortle 8-9, incluso el cénit está iluminado
        float skyFloor    = pollutionT * pollutionT * 0.035;

        vec3 nightSky = SpaceBlack
                      + pollutionColor * (horizonGlow * pollutionT * 0.34 + skyFloor);

        // Puesta de sol
        vec3 sunsetColor = vec3(1.0, 0.35, 0.12)
                         * pow(max(0.0, cosTheta), 8.0)
                         * smoothstep(-0.35, 0.1, sunAltitude)
                         * (1.0 - dayFactor);

        // Mezcla día/noche
        vec3 dayColor   = mix(nightSky, rayleighColor + mieColor, dayFactor);
        vec3 finalColor = mix(nightSky, dayColor, dayFactor);
        finalColor += pollutionColor * pollutionT * (horizonGlow * 0.05 + skyFloor * 0.35) * (1.0 - dayFactor * 0.65);
        finalColor += sunsetColor;

        // Resplandor lunar atmosférico: depende de fase, altura real y
        // separación angular respecto a la Luna. No dibuja una Luna falsa.
        float moonSeparation = max(0.0, dot(viewDir, moonDir));
        float moonAureole = pow(moonSeparation, 42.0) * 0.12
                         + pow(moonSeparation, 260.0) * 0.22;
        finalColor += vec3(0.62, 0.72, 0.92) * moonAureole * uMoonGlow * (1.0 - dayFactor);

        // Transición hiper-suave en el horizonte (Simulación Rayleigh real)
        // Para evitar el "corte de cuchillo" con el suelo negro, la opacidad
        // debe caer a casi 0 justo en la línea del horizonte (y=0).
        float horizonFade = smoothstep(-0.02, 0.25, zenithAngle);
        float alpha = clamp(uSuppression * horizonFade, 0.0, 1.0);

        // Tonemapping suave
        finalColor = 1.0 - exp(-2.2 * finalColor);

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// Module-scope observer — avoids allocating a new Astronomy.Observer every frame.
// Same pattern as SunLight in SkyCanvas.tsx.
const _atmoObserver = new Astronomy.Observer(0, 0, 0);
let _lastAtmoMs = 0;
const _lastSunAltAz = { alt: 0, az: 0 };

export default function AtmosphericSky() {
    const meshRef = useRef<THREE.Mesh>(null);
    const camFov = useAppStore((s) => s.camFov);
    const viewMode = useAppStore((s) => s.viewMode);
    const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
    const setSelectedObject = useAppStore((s) => s.setSelectedObject);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);
    const sunPos = useMemo(() => new THREE.Vector3(100, 0, 0), []);
    const moonPos = useMemo(() => new THREE.Vector3(0, -1, 0), []);

    // Stable uniforms object — mutate values in useFrame, never recreate
    const uniforms = useMemo(() => ({
        uSunPos: { value: sunPos },
        uMoonPos: { value: moonPos },
        uMoonGlow: { value: 0 },
        uTime: { value: 0 },
        uBortle: { value: 4 },
        uSuppression: { value: 1.0 }
    }), [moonPos, sunPos]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const suppression = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 35, 10, 1.0, 0.0),
            0.0, 1.0
        );
        // eslint-disable-next-line react-hooks/immutability
        uniforms.uSuppression.value = suppression;

        const { time, observer, settings } = useAppStore.getState();
        uniforms.uBortle.value = settings.bortleScale;

        // Throttle: recalculate solar position at most 1×/second to avoid
        // 60 Astronomy.Observer allocations per second (GC pressure on low-end).
        const now = Date.now();
        if (now - _lastAtmoMs >= 1000) {
            try {
                _atmoObserver.latitude  = observer.lat;
                _atmoObserver.longitude = observer.lon;
                const eq  = Astronomy.Equator(Astronomy.Body.Sun, time, _atmoObserver, true, true);
                const hor = Astronomy.Horizon(time, _atmoObserver, eq.ra, eq.dec, 'normal');
                _lastSunAltAz.alt = hor.altitude;
                _lastSunAltAz.az  = hor.azimuth;

                const moonEq = Astronomy.Equator(Astronomy.Body.Moon, time, _atmoObserver, true, true);
                const moonHor = Astronomy.Horizon(time, _atmoObserver, moonEq.ra, moonEq.dec, 'normal');
                const moonIllumination = Astronomy.Illumination(Astronomy.Body.Moon, time).phase_fraction;
                moonHorRef.alt = moonHor.altitude;
                moonHorRef.az = moonHor.azimuth;
                moonHorRef.illuminatedFraction = moonIllumination;
                _lastAtmoMs = now;
            } catch { /* keep previous position on error */ }
        }

        const el = THREE.MathUtils.degToRad(_lastSunAltAz.alt);
        const az = THREE.MathUtils.degToRad(_lastSunAltAz.az);
        uniforms.uSunPos.value.set(
            Math.cos(el) * Math.sin(az),
            Math.sin(el),
            -Math.cos(el) * Math.cos(az)
        );

        const moonEl = THREE.MathUtils.degToRad(moonHorRef.alt);
        const moonAz = THREE.MathUtils.degToRad(moonHorRef.az);
        uniforms.uMoonPos.value.set(
            Math.cos(moonEl) * Math.sin(moonAz),
            Math.sin(moonEl),
            -Math.cos(moonEl) * Math.cos(moonAz),
        );
        uniforms.uMoonGlow.value = lunarSkyGlow(moonHorRef.alt, moonHorRef.illuminatedFraction);

        // These must stay every frame — uTime drives shader animation,
        // position.copy keeps the sky dome centered on the camera.
        uniforms.uTime.value = state.clock.getElapsedTime();
        meshRef.current.position.copy(state.camera.position);
    });

    if (viewMode === 'camera') return null;

    return (
        <mesh
            ref={meshRef}
            renderOrder={-5}
            onPointerDown={(e) => {
                pointerDownRef.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
            }}
            onClick={(e) => {
                e.stopPropagation();
                const start = pointerDownRef.current;
                pointerDownRef.current = null;
                if (!start || e.delta > 6 || Math.hypot(e.nativeEvent.clientX - start.x, e.nativeEvent.clientY - start.y) > 6) return;
                setSelectedObject(null);
                setTargetedObject(null);
            }}
        >
            {/* 32×32 = 1.056 vértices vs 64×64 = 4.096. The sky is a smooth color
                gradient — no banding visible at this tessellation. */}
            <sphereGeometry args={[115, 32, 32]} />
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
