'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../../stores/useAppStore';
import { Star, DSO, Planet } from '../../types/celestial';
import * as THREE from 'three';

// --- Tipos ---
type SoundProfile = 'deep_space' | 'sun' | 'planet' | 'horizon_wind' | 'constellation';

interface AudioNodes {
    ctx: AudioContext;
    masterGain: GainNode;
    lowPass: BiquadFilterNode;
    noiseNode: AudioBufferSourceNode | null;
    noiseGain: GainNode | null;
    oscillators: OscillatorNode[];
    oscGains: GainNode[];
    lfo: OscillatorNode | null;
    lfoGain: GainNode | null;
}

// --- Configuración de perfiles de audio ---
const SOUND_PROFILES: Record<SoundProfile, {
    masterVolume: number;
    lowPassFreq: number;
    noiseVolume: number;
    oscConfig: { freq: number; type: OscillatorType; gain: number }[];
    lfoFreq: number;
    lfoDepth: number;
}> = {
    deep_space: {
        masterVolume: 0.08,
        lowPassFreq: 400,
        noiseVolume: 0.03,
        oscConfig: [
            { freq: 60, type: 'sine', gain: 0.02 },
            { freq: 80, type: 'sine', gain: 0.015 },
        ],
        lfoFreq: 0.1,
        lfoDepth: 0.005,
    },
    sun: {
        masterVolume: 0.15,
        lowPassFreq: 800,
        noiseVolume: 0.06,
        oscConfig: [
            { freq: 100, type: 'sawtooth', gain: 0.03 },
            { freq: 150, type: 'sine', gain: 0.04 },
            { freq: 200, type: 'triangle', gain: 0.02 },
        ],
        lfoFreq: 0.3,
        lfoDepth: 0.015,
    },
    planet: {
        masterVolume: 0.1,
        lowPassFreq: 600,
        noiseVolume: 0.04,
        oscConfig: [
            { freq: 80, type: 'sine', gain: 0.025 },
            { freq: 120, type: 'triangle', gain: 0.02 },
        ],
        lfoFreq: 0.2,
        lfoDepth: 0.01,
    },
    horizon_wind: {
        masterVolume: 0.12,
        lowPassFreq: 1200,
        noiseVolume: 0.1,
        oscConfig: [
            { freq: 200, type: 'sine', gain: 0.01 },
        ],
        lfoFreq: 0.5,
        lfoDepth: 0.02,
    },
    constellation: {
        masterVolume: 0.09,
        lowPassFreq: 500,
        noiseVolume: 0.035,
        oscConfig: [
            { freq: 220, type: 'sine', gain: 0.015 },
            { freq: 330, type: 'sine', gain: 0.01 },
        ],
        lfoFreq: 0.15,
        lfoDepth: 0.008,
    },
};

/**
 * Genera un buffer de ruido browniano (más suave que white noise)
 */
function createBrownianNoise(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
    }

    return buffer;
}

/**
 * Determina el perfil de audio según el objeto seleccionado
 */
function getSoundProfile(targetedObject: Star | DSO | Planet | null): SoundProfile {
    if (!targetedObject) {
        return 'deep_space';
    }

    // Sol
    if (targetedObject.name === 'Sun') {
        return 'sun';
    }

    // Planetas y Luna
    const planetNames = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon'];
    if (planetNames.includes(targetedObject.name)) {
        return 'planet';
    }

    // Estrellas brillantes
    if ((targetedObject as Star).constellation !== undefined) {
        return 'constellation';
    }

    // DSOs
    if ((targetedObject as DSO).type !== undefined) {
        return 'constellation';
    }

    return 'deep_space';
}

/**
 * AdaptiveSoundscape - Genera un ambiente sonoro reactivo al contexto:
 * - Objeto seleccionado (Sol, planetas, estrellas, espacio profundo)
 * - Dirección de mirada (horizonte = viento)
 * - Modo nocturno (reduce volumen general)
 * - Bortle scale (más ruido en cielos contaminados)
 */
export function AdaptiveSoundscape() {
    const targetedObject = useAppStore((s) => s.targetedObject);
    const settings = useAppStore((s) => s.settings);
    const audioRef = useRef<AudioNodes | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const isInitializedRef = useRef(false);
    const currentProfile = useRef<SoundProfile>('deep_space');
    const lastTimeRef = useRef(0);
    const targetParams = useRef({
        masterVolume: 0.08,
        lowPassFreq: 400,
        noiseVolume: 0.03,
    });

    // Callback para inicializar audio (requiere interacción del usuario)
    const initAudio = useCallback(async () => {
        if (isInitializedRef.current) return;

        try {
            const ctx = new AudioContext();
            await ctx.resume();

            // Master gain
            const masterGain = ctx.createGain();
            masterGain.gain.value = 0.08;

            // Low-pass filter
            const lowPass = ctx.createBiquadFilter();
            lowPass.type = 'lowpass';
            lowPass.frequency.value = 400;
            lowPass.Q.value = 0.5;

            // Ruido de fondo browniano
            const noiseBuffer = createBrownianNoise(ctx);
            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = noiseBuffer;
            noiseNode.loop = true;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0.03;

            noiseNode.connect(noiseGain);
            noiseGain.connect(lowPass);

            // Osciladores para tonos ambientales
            const oscillators: OscillatorNode[] = [];
            const oscGains: GainNode[] = [];
            const oscConfig = SOUND_PROFILES.deep_space.oscConfig;
            for (const cfg of oscConfig) {
                const osc = ctx.createOscillator();
                osc.type = cfg.type;
                osc.frequency.value = cfg.freq;
                const oscGain = ctx.createGain();
                oscGain.gain.value = cfg.gain;
                osc.connect(oscGain);
                oscGain.connect(lowPass);
                osc.start();
                oscillators.push(osc);
                oscGains.push(oscGain);
            }

            // LFO para modulación sutil
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.005;
            lfo.connect(lfoGain);
            lfoGain.connect(masterGain.gain);
            lfo.start();

            // Chain final
            lowPass.connect(masterGain);
            masterGain.connect(ctx.destination);

            noiseNode.start();

            audioRef.current = {
                ctx,
                masterGain,
                lowPass,
                noiseNode,
                noiseGain,
                oscillators,
                oscGains,
                lfo,
                lfoGain,
            };

            isInitializedRef.current = true;
            setIsInitialized(true);
        } catch (err) {
            console.warn('[AdaptiveSoundscape] Failed to initialize audio:', err);
        }
    }, []);

    // Actualizar perfil cuando cambia el objeto seleccionado
    useEffect(() => {
        if (!audioRef.current || !isInitializedRef.current) return;

        const profile = getSoundProfile(targetedObject);
        if (profile === currentProfile.current) return;
        currentProfile.current = profile;

        const params = SOUND_PROFILES[profile];
        targetParams.current = {
            masterVolume: params.masterVolume,
            lowPassFreq: params.lowPassFreq,
            noiseVolume: params.noiseVolume,
        };
    }, [targetedObject]);

    // Ajuste por modo nocturno
    useEffect(() => {
        if (!audioRef.current || !isInitializedRef.current) return;
        const profile = SOUND_PROFILES[currentProfile.current];
        const reduction = settings.nightMode ? 0.5 : 1.0;
        targetParams.current = {
            masterVolume: profile.masterVolume * reduction,
            lowPassFreq: profile.lowPassFreq,
            noiseVolume: profile.noiseVolume * reduction,
        };
    }, [settings.nightMode]);

    // Ajuste por Bortle scale
    useEffect(() => {
        if (!audioRef.current || !isInitializedRef.current) return;
        const profile = SOUND_PROFILES[currentProfile.current];
        const bortleFactor = (settings.bortleScale - 1) / 8;
        targetParams.current = {
            masterVolume: profile.masterVolume,
            lowPassFreq: profile.lowPassFreq,
            noiseVolume: profile.noiseVolume * (1 + bortleFactor * 0.5),
        };
    }, [settings.bortleScale]);

    // Smooth parameter transitions cada frame
    useFrame((state) => {
        if (!audioRef.current || !isInitializedRef.current) return;

        const { lowPass, masterGain, noiseGain, oscillators, oscGains, lfo, lfoGain } = audioRef.current;
        const target = targetParams.current;
        const profile = SOUND_PROFILES[currentProfile.current];

        // Detectar dirección de cámara para horizonte
        const camDir = new THREE.Vector3(0, 0, -1);
        camDir.applyQuaternion(state.camera.quaternion);

        if (!targetedObject && camDir.y < -0.3 && currentProfile.current !== 'horizon_wind') {
            currentProfile.current = 'horizon_wind';
            const p = SOUND_PROFILES.horizon_wind;
            targetParams.current = { masterVolume: p.masterVolume, lowPassFreq: p.lowPassFreq, noiseVolume: p.noiseVolume };
        } else if (!targetedObject && camDir.y >= -0.3 && currentProfile.current === 'horizon_wind') {
            currentProfile.current = 'deep_space';
            const p = SOUND_PROFILES.deep_space;
            targetParams.current = { masterVolume: p.masterVolume, lowPassFreq: p.lowPassFreq, noiseVolume: p.noiseVolume };
        }

        const elapsed = state.clock.getElapsedTime();
        const dt = lastTimeRef.current ? Math.min(elapsed - lastTimeRef.current, 0.1) : 0.016;
        lastTimeRef.current = elapsed;
        const smoothing = Math.min(dt * 2, 1);

        // Interpolar parámetros suavemente
        lowPass.frequency.value += (target.lowPassFreq - lowPass.frequency.value) * smoothing;
        masterGain.gain.value += (target.masterVolume - masterGain.gain.value) * smoothing;
        if (noiseGain) {
            noiseGain.gain.value += (target.noiseVolume - noiseGain.gain.value) * smoothing;
        }

        // LFO
        if (lfo && lfoGain) {
            lfo.frequency.value += (profile.lfoFreq - lfo.frequency.value) * smoothing;
            lfoGain.gain.value += (profile.lfoDepth - lfoGain.gain.value) * smoothing;
        }

        // Osciladores
        const currentProfile_ = SOUND_PROFILES[currentProfile.current];
        oscillators.forEach((osc, i) => {
            if (i < currentProfile_.oscConfig.length) {
                const cfg = currentProfile_.oscConfig[i];
                osc.frequency.value += (cfg.freq - osc.frequency.value) * smoothing;
                if (oscGains[i]) {
                    oscGains[i].gain.value += (cfg.gain - oscGains[i].gain.value) * smoothing;
                }
            }
        });
    });

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                const { oscillators, lfo, noiseNode, ctx } = audioRef.current;
                oscillators.forEach((osc) => { try { osc.stop(); } catch (e) {} });
                if (lfo) { try { lfo.stop(); } catch (e) {} }
                if (noiseNode) { try { noiseNode.stop(); } catch (e) {} }
                
                if (ctx.state !== 'closed') {
                    ctx.close().catch(() => {});
                }
                audioRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []);

    // Auto-init on first user interaction anywhere (browser autoplay policy)
    useEffect(() => {
        if (isInitializedRef.current) return;

        const handler = () => {
            initAudio();
        };

        // Try on first click/touch
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('touchend', handler, { once: true });

        return () => {
            document.removeEventListener('click', handler);
            document.removeEventListener('touchend', handler);
        };
    }, [initAudio, isInitialized]);

    // This component renders nothing — audio runs in background
    return null;
}
