'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

// ─── Galactic coordinate rotation ────────────────────────────────────────────
// Identical constants to MilkyWay.tsx — rotates the sphere's Y+ pole to align
// with the galactic north pole in equatorial space so the texture maps correctly.
const GALACTIC_NORTH = new THREE.Vector3(0.8678, 0.4531, 0.1981).normalize();
const galacticRotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), GALACTIC_NORTH)
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

varying vec2  vUv;
varying float vWorldY;

void main() {
    vec3 rgb = texture2D(uTexture, vUv).rgb;

    // Luminance mask: suppress the dark JPEG background, pass galactic nebulosity.
    // Values are in linear space (texture uses SRGBColorSpace auto-conversion).
    float lum  = dot(rgb, vec3(0.299, 0.587, 0.114));
    float mask = smoothstep(0.003, 0.055, lum);

    // Horizon fade: blend out 8 world-units below horizon, full opacity by 18 above.
    float horizonFade = smoothstep(-8.0, 18.0, vWorldY);

    // Boost brightness so dim outer-galaxy regions are perceptible.
    vec3 color = rgb * 3.0;

    float alpha = mask * horizonFade * uNightFactor;
    gl_FragColor = vec4(color, alpha);
}
`;

export default function MilkyWaySkyDome() {
    const viewMode = useAppStore(s => s.viewMode);

    const uniforms = useMemo(() => ({
        uTexture:     { value: null as THREE.Texture | null },
        uNightFactor: { value: 1.0 },
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
                console.log('[MilkyWaySkyDome] Textura cargada OK');
            },
            undefined,
            (err) => { console.error('[MilkyWaySkyDome] Error cargando textura:', err); }
        );
    }, [uniforms]);

    useFrame(() => {
        const { time, observer } = useAppStore.getState();
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
