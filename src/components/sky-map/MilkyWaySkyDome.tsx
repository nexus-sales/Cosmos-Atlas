'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

// ─── Shader mínimo de diagnóstico ────────────────────────────────────────────
// Sin filtros, sin rotación extra — solo textura pura para verificar renderizado.
const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float     uNightFactor;

varying vec2 vUv;

void main() {
    vec2 uv  = vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = texture2D(uTexture, uv);
    // Textura cruda × 2 para ver si el domo renderiza (habrá fondo marrón).
    gl_FragColor = vec4(tex.rgb * uNightFactor * 2.0, 1.0);
}
`;

export default function MilkyWaySkyDome() {
    const viewMode = useAppStore(s => s.viewMode);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

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
                setTexture(tex);
            },
            undefined,
            (err) => { console.error('[MilkyWaySkyDome] Error cargando textura:', err); }
        );
    }, []);

    const uniforms = useMemo(() => ({
        uTexture:     { value: null as THREE.Texture | null },
        uNightFactor: { value: 1.0 },
    }), []);

    useEffect(() => {
        uniforms.uTexture.value = texture;
        if (texture) console.log('[MilkyWaySkyDome] Textura cargada OK');
    }, [texture, uniforms]);

    useFrame(() => {
        if (!texture) return;
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

    if (!texture || viewMode === 'camera') return null;

    return (
        <group renderOrder={-3}>
            <mesh renderOrder={-3}>
                <sphereGeometry args={[190, 64, 64]} />
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}
