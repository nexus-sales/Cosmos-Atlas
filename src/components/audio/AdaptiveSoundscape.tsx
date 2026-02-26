'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AdaptiveSoundscape: Motor de audio procedural que genera una atmósfera inmersiva.
 * Utiliza Web Audio API para no depender de archivos externos pesados.
 */
export default function AdaptiveSoundscape() {
    const audioEnabled = useAppStore((s) => s.settings.audioEnabled);
    const audioVolume = useAppStore((s) => s.settings.audioVolume);
    const targetedObject = useAppStore((s) => s.targetedObject);
    const camFov = useAppStore((s) => s.camFov);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);

    // Nodos para "Deep Space" (Hum constante)
    const spaceOscRef = useRef<OscillatorNode | null>(null);
    const spaceLfoRef = useRef<OscillatorNode | null>(null);
    const spaceGainRef = useRef<GainNode | null>(null);

    // Nodos para "Sun/Plasma" (Ruido filtrado)
    const sunNoiseRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
    const sunFilterRef = useRef<BiquadFilterNode | null>(null);
    const sunGainRef = useRef<GainNode | null>(null);

    const { camera } = useThree();

    // Inicialización del motor de audio
    useEffect(() => {
        if (!audioEnabled) {
            if (audioCtxRef.current) audioCtxRef.current.suspend();
            return;
        }

        if (!audioCtxRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;

            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // ── 1. DEEP SPACE HUM ──
            const osc = ctx.createOscillator();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            const spaceGain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = 55; // Sub-bajo (La 1)

            lfo.type = 'sine';
            lfo.frequency.value = 0.15; // Muy lento
            lfoGain.gain.value = 5; // Modulación de 5Hz

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            osc.connect(spaceGain);
            spaceGain.connect(masterGain);
            spaceGain.gain.value = 0.15;

            osc.start();
            lfo.start();

            spaceOscRef.current = osc;
            spaceLfoRef.current = lfo;
            spaceGainRef.current = spaceGain;

            // ── 2. SUN PLASMA (Noise) ──
            // Generamos ruido blanco simple usando un script processor (mantenemos compatibilidad)
            const bufferSize = 4096;
            const sunNoise = ctx.createScriptProcessor(bufferSize, 1, 1);
            sunNoise.onaudioprocess = (e) => {
                const output = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
            };

            const sunFilter = ctx.createBiquadFilter();
            const sunGain = ctx.createGain();

            sunFilter.type = 'lowpass';
            sunFilter.frequency.value = 200;
            sunFilter.Q.value = 1;

            sunNoise.connect(sunFilter);
            sunFilter.connect(sunGain);
            sunGain.connect(masterGain);
            sunGain.gain.value = 0; // Silencio por defecto

            sunNoiseRef.current = sunNoise;
            sunFilterRef.current = sunFilter;
            sunGainRef.current = sunGain;
        }

        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

    }, [audioEnabled]);

    // Actualización de volumen maestro
    useEffect(() => {
        if (masterGainRef.current && audioCtxRef.current) {
            masterGainRef.current.gain.setTargetAtTime(audioVolume, audioCtxRef.current.currentTime, 0.1);
        }
    }, [audioVolume]);

    // Lógica dinámica en cada frame
    useFrame(() => {
        if (!audioEnabled || !audioCtxRef.current || !sunGainRef.current || !sunFilterRef.current) return;

        const time = audioCtxRef.current.currentTime;

        // 1. Efecto Sol/Estrella
        const isSun = targetedObject?.name === 'Sol';
        const sunIntensity = isSun ? THREE.MathUtils.mapLinear(camFov, 60, 15, 0, 0.8) : 0;
        const clampedSun = THREE.MathUtils.clamp(sunIntensity, 0, 0.8);

        sunGainRef.current.gain.setTargetAtTime(clampedSun, time, 0.1);
        sunFilterRef.current.frequency.setTargetAtTime(200 + clampedSun * 1200, time, 0.1);

        // 2. Efecto Horizonte (Viento)
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const altitude = lookDir.y; // -1 a 1
        const horizonWind = THREE.MathUtils.smoothstep(altitude, 0.2, -1.0) * 0.15;

        // Usamos el mismo nodo de ruido para el viento pero con filtro diferente si quisiéramos, 
        // de momento el master Space reacciona sutilmente.
        if (spaceGainRef.current) {
            const baseSpace = 0.15 + horizonWind;
            spaceGainRef.current.gain.setTargetAtTime(baseSpace, time, 0.2);
        }
    });

    return null;
}
