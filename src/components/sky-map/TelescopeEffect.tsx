'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame, useThree } from '@react-three/fiber';
import {
    Bloom,
    ChromaticAberration,
    EffectComposer,
    Noise,
    Vignette,
    Scanline
} from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * TelescopeEffect: Aplica filtros visuales para simular un ocular de telescopio.
 * Solo se activa cuando telescopeMode en el store es true.
 */
export default function TelescopeEffect() {
    const telescopeMode = useAppStore((s) => s.settings.telescopeMode);
    const nightMode = useAppStore((s) => s.settings.nightMode);
    const camFov = useAppStore((s) => s.camFov);

    if (!telescopeMode) return (
        <EffectComposer enableNormalPass={false}>
            <Bloom
                intensity={1.8}
                luminanceThreshold={0.22}
                mipmapBlur
                radius={0.65}
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.08} darkness={1.35} />
        </EffectComposer>
    );

    return (
        <EffectComposer enableNormalPass={false}>
            {/* Bloom más contenido — la óptica concentra la luz */}
            <Bloom
                intensity={1.2}
                luminanceThreshold={0.15}
                mipmapBlur
                radius={0.4}
            />

            {/* Aberración cromática sutil en los bordes — típico de oculares no apocromáticos */}
            <ChromaticAberration
                offset={new THREE.Vector2(0.002, 0.002)}
            />

            {/* Ruido que simula el "grano" de la luz baja o turbulencia sutil */}
            <Noise opacity={0.05} />

            {/* Escaneo horizontal muy tenue para dar textura "mecánica/digital" si se desea, 
                         o simplemente un viñeteado circular agresivo */}
            <Vignette
                eskil={false}
                offset={0.4}
                darkness={2.5} // Casi negro en los bordes para cerrar el círculo
            />

            {camFov < 30 ? <Scanline opacity={0.05} density={1.5} /> : <></>}
        </EffectComposer>
    );
}
