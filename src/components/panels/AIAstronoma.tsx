'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAstronoma() {
    const selectedObject = useAppStore((state) => state.selectedObject);
    const [msg, setMsg] = useState<string>('');
    const [isTalking, setIsTalking] = useState(false);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (!selectedObject) {
            setMsg('¡Hola! Soy tu guía estelar. Selecciona cualquier astro para conocer sus secretos.');
            return;
        }

        const intro = `Has seleccionado ${selectedObject.name}. `;
        const detail = selectedObject.desc || 'Es un objeto fascinante en la inmensidad del cosmos.';
        const fullMsg = intro + detail;

        setMsg(fullMsg);
        speak(fullMsg);

        return () => {
            if (synth) synth.cancel();
        };
    }, [selectedObject]);

    const speak = (text: string) => {
        if (!synth) return;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        utterance.onstart = () => setIsTalking(true);
        utterance.onend = () => setIsTalking(false);

        utteranceRef.current = utterance;
        synth.speak(utterance);
    };

    return (
        <AnimatePresence>
            {msg && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="absolute bottom-24 right-6 z-50 max-w-sm"
                >
                    <div className="relative p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl overflow-hidden group">
                        {/* Avatar Pulsing */}
                        <div className="flex items-center gap-4 mb-3">
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <div className={`absolute inset-0 bg-blue-500/20 rounded-full ${isTalking ? 'animate-ping' : ''}`} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        {isTalking && (
                                            <motion.path
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                d="M8 9h8M8 13h5"
                                            />
                                        )}
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest">IA Astrónoma</h3>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={isTalking ? { height: [4, 12, 4] } : { height: 4 }}
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                            className="w-0.5 bg-blue-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Speech Bubble text */}
                        <p className="text-white/90 text-sm leading-relaxed font-medium italic">
                            "{msg}"
                        </p>

                        {/* Decoration */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
