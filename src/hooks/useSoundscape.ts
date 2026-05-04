'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Motor de audio procedural para el "Cyber-Observatorio".
 * Genera un zumbido de baja frecuencia (drone) que reacciona a la telemetría del viaje (warpFactor).
 * ¡No necesita archivos MP3!
 */
export function useSoundscape() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const filterRef = useRef<BiquadFilterNode | null>(null);
    const lfoRef = useRef<OscillatorNode | null>(null);

    const isFlying = useAppStore(s => s.isFlying);
    const warpFactor = useAppStore(s => s.warpFactor);

    // Inicializar el motor de audio en la primera interacción del usuario
    useEffect(() => {
        const initAudio = () => {
            if (audioCtxRef.current) return;
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;

            // Oscilador Principal (Zumbido base)
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 55; // Frecuencia muy baja (A1)

            // Filtro Lowpass (para oscurecer el sonido y que parezca un motor/nave)
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            filter.Q.value = 2;

            // LFO (Oscilador de baja frecuencia para modular el filtro y dar efecto pulsante)
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.5; // Pulso lento
            
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 100; // Cuánto mueve la frecuencia del filtro

            // Control de volumen general
            const gainNode = ctx.createGain();
            gainNode.gain.value = 0; // Empieza en silencio

            // Conexiones
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            lfo.start();

            oscRef.current = osc;
            filterRef.current = filter;
            gainRef.current = gainNode;
            lfoRef.current = lfo;

            // Limpiar eventos
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };

        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);

        return () => {
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
        };
    }, []);

    // Bucle de reactividad: El audio responde al estado de la nave
    useEffect(() => {
        if (!audioCtxRef.current || !gainRef.current || !filterRef.current || !oscRef.current || !lfoRef.current) return;

        const ctx = audioCtxRef.current;
        const gain = gainRef.current;
        const filter = filterRef.current;
        const lfo = lfoRef.current;

        const now = ctx.currentTime;

        if (isFlying) {
            // Entrando en WARP
            gain.gain.setTargetAtTime(0.15 + (warpFactor * 0.2), now, 0.5); // Sube el volumen con el warp
            filter.frequency.setTargetAtTime(300 + (warpFactor * 800), now, 0.2); // El sonido se hace más agudo/agresivo
            lfo.frequency.setTargetAtTime(2 + (warpFactor * 10), now, 0.5); // El pulso se acelera
        } else {
            // Navegación en reposo (Observatorio quieto)
            gain.gain.setTargetAtTime(0.02, now, 2.0); // Zumbido de fondo casi inaudible
            filter.frequency.setTargetAtTime(150, now, 1.0);
            lfo.frequency.setTargetAtTime(0.2, now, 1.0);
        }
    }, [isFlying, warpFactor]);

    return null;
}
