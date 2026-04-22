'use client';

import { useAppStore } from '@/stores/useAppStore';
import {
    Bloom,
    ChromaticAberration,
    EffectComposer,
    Vignette,
} from '@react-three/postprocessing';
import * as THREE from 'three';

/**
 * TelescopeEffect: Aplica filtros visuales mínimos para mejorar la fidelidad.
 */
export default function TelescopeEffect() {
    const telescopeMode = useAppStore((s) => s.settings.telescopeMode);
    const viewMode = useAppStore((s) => s.viewMode);

    if (viewMode === 'camera') {
        return (
            <EffectComposer enableNormalPass={false}>
                <Bloom
                    intensity={0.3} 
                    luminanceThreshold={0.8}
                    mipmapBlur
                    radius={0.2}
                />
            </EffectComposer>
        );
    }

    return (
        <EffectComposer enableNormalPass={false}>
            {/* Bloom calibrado: solo objetos muy brillantes (Sol, Venus, Sirio).
                threshold alto evita el efecto "filtro Instagram" en estrellas tenues. */}
            <Bloom
                intensity={0.15}
                luminanceThreshold={0.85}
                mipmapBlur
                radius={0.1}
            />
            {telescopeMode ? (
                <>
                    <ChromaticAberration
                        offset={new THREE.Vector2(0.0003, 0.0003)}
                    />
                    {/* Viñeta reducida: un telescopio real tiene viñetado suave, no al 80% */}
                    <Vignette
                        eskil={false}
                        offset={0.15}
                        darkness={0.4}
                    />
                </>
            ) : (
                <></>
            )}
        </EffectComposer>
    );
}
