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
            <Bloom
                intensity={1.0}
                luminanceThreshold={0.3}
                mipmapBlur
                radius={0.5}
            />
            {telescopeMode ? (
                <>
                    <ChromaticAberration
                        offset={new THREE.Vector2(0.0005, 0.0005)}
                    />
                    <Vignette
                        eskil={false}
                        offset={0.1}
                        darkness={0.8}
                    />
                </>
            ) : (
                <></>
            )}
        </EffectComposer>
    );
}
