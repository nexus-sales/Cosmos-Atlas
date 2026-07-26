'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

// ─── Galactic coordinate rotation ────────────────────────────────────────────
// Build a full RA/Dec basis so the texture follows the same equatorial frame as
// stars, constellations and deep-sky objects.
const GALACTIC_NORTH = new THREE.Vector3(...equatorialTo3D(192.85948, 27.12825, 1)).normalize();
const GALACTIC_CENTER = new THREE.Vector3(...equatorialTo3D(266.4051, -28.936175, 1)).normalize();
const GALACTIC_X = new THREE.Vector3().crossVectors(GALACTIC_NORTH, GALACTIC_CENTER).normalize();
const GALACTIC_Z = new THREE.Vector3().crossVectors(GALACTIC_X, GALACTIC_NORTH).normalize();
const galacticRotation = new THREE.Euler().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(GALACTIC_X, GALACTIC_NORTH, GALACTIC_Z)
);

// ─── Shaders ─────────────────────────────────────────────────────────────────
const vertexShader = `
varying vec2  vUv;
varying float vWorldY;

void main() {
    // Mirror U so the image reads correctly when viewed from inside (BackSide).
    vUv = vec2(1.0 - uv.x, uv.y);

    // World-space Y drives the horizon fade (Y=0 is horizon, Y+ is zenith).
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldY = worldPos.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float     uNightFactor;
uniform float     uBortle;
uniform float     uZoomFade;

varying vec2  vUv;
varying float vWorldY;

void main() {
    vec3 rgb = texture2D(uTexture, vUv).rgb;

    // Luminance mask: suppress the dark JPEG background, pass galactic nebulosity.
    // Values are in linear space (texture uses SRGBColorSpace auto-conversion).
    float lum  = dot(rgb, vec3(0.299, 0.587, 0.114));
    float mask = smoothstep(0.003, 0.055, lum);

    // Horizon fade: keep the opposite hemisphere dimly visible in atlas mode
    // instead of erasing the Milky Way entirely below the local horizon.
    float horizonFade = mix(0.22, 1.0, smoothstep(-8.0, 18.0, vWorldY));

    // Boost brightness so dim outer-galaxy regions are perceptible.
    vec3 color = rgb * 3.0;

    float pollutionT = clamp((uBortle - 1.0) / 8.0, 0.0, 1.0);
    float skyQuality = mix(1.0, 0.08, smoothstep(0.25, 1.0, pollutionT));
    // uZoomFade retira el fondo fotografico en zoom cercano: la textura
    // fija su resolucion al cielo completo y se pixela/difumina al ampliarla
    // sobre un parche pequeno; a esa escala manda el campo estelar real
    // (Stars.tsx / BackgroundStars.tsx / fotos reales de DSO).
    float alpha = mask * horizonFade * uNightFactor * skyQuality * uZoomFade;
    gl_FragColor = vec4(color, alpha);
}
`;

export default function MilkyWaySkyDome() {
    const viewMode = useAppStore(s => s.viewMode);

    const uniforms = useMemo(() => ({
        uTexture:     { value: null as THREE.Texture | null },
        uNightFactor: { value: 1.0 },
        uBortle:      { value: 4.0 },
        uZoomFade:    { value: 1.0 },
    }), []);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(
            '/textures/milkyway.jpg',
            (tex) => {
                tex.colorSpace      = THREE.SRGBColorSpace;
                tex.wrapS           = THREE.RepeatWrapping;
                tex.wrapT           = THREE.ClampToEdgeWrapping;
                tex.minFilter       = THREE.LinearMipmapLinearFilter;
                tex.magFilter       = THREE.LinearFilter;
                tex.generateMipmaps = true;
                uniforms.uTexture.value = tex;
            },
            undefined,
            () => {
                uniforms.uTexture.value = null;
            }
        );
    }, [uniforms]);

    useFrame(() => {
        const { time, observer, settings, camFov } = useAppStore.getState();
        // eslint-disable-next-line react-hooks/immutability
        uniforms.uBortle.value = settings.bortleScale;
        uniforms.uZoomFade.value = THREE.MathUtils.clamp(
            THREE.MathUtils.mapLinear(camFov, 18, 38, 0, 1), 0, 1
        );
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq  = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');
            uniforms.uNightFactor.value = 1.0 - THREE.MathUtils.smoothstep(-15, -5, hor.altitude);
        } catch {
            uniforms.uNightFactor.value = 1.0;
        }
    });

    if (viewMode === 'camera') return null;

    return (
        <group rotation={galacticRotation}>
            <mesh renderOrder={-4}>
                <sphereGeometry args={[190, 64, 64]} />
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    blending={THREE.NormalBlending}
                    toneMapped={false}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}
