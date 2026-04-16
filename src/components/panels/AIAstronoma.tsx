'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Volume2, VolumeX, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getKidFact } from '@/data/kidFacts';

export default function AIAstronoma() {
    const selected = useAppStore((s) => s.selectedObject);
    const incrementMythologyBuff = useAppStore((s) => s.incrementMythologyBuff);
    const kidsMode = useAppStore((s) => s.settings.kidsMode);
    const sidebarOpen = useAppStore((s) => s.sidebarOpen);
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const [message, setMessage] = useState('');
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        const loadVoices = () => {
            if (synthRef.current) synthRef.current.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        return () => {
            synthRef.current?.cancel();
        };
    }, []);

    const speak = useCallback((text: string) => {
        if (!synthRef.current || muted) return;
        
        synthRef.current.cancel();
        
        // Algunos navegadores pausan el habla si no hay actividad, forzar resume
        if (synthRef.current.paused) {
            synthRef.current.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Buscar la mejor voz disponible en español
        const voices = synthRef.current.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) 
                          || voices.find(v => v.lang.startsWith('es') && v.name.includes('Helena'))
                          || voices.find(v => v.lang.startsWith('es'));
        
        if (spanishVoice) utterance.voice = spanishVoice;
        
        utterance.lang = 'es-ES';
        
        // Ajustes para que no dé miedo:
        // - Modo Kids: Tono más alto (1.4) y ritmo más alegre (1.0)
        // - Modo Normal: Tono cálido (1.1) y ritmo pausado (0.9)
        utterance.pitch = kidsMode ? 1.3 : 1.15;
        utterance.rate = kidsMode ? 1.05 : 0.95;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (text.length > 50) {
                incrementMythologyBuff();
            }
        };
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [incrementMythologyBuff, muted, kidsMode]);

    // Reaccionar a cambios de selección
    useEffect(() => {
        if (selected && !muted) {
            const isStar = 'constellation' in selected;
            const isPlanet = 'kind' in selected && selected.kind === 'planet';
            
            const kidFact = kidsMode ? getKidFact(selected.name, isStar, isPlanet) : null;
            const intro = kidFact 
                ? `¡Hola explorador! Has encontrado a ${selected.name}. ${kidFact}` 
                : `Has seleccionado ${selected.name}. ${selected.desc}`;
                
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessage(intro);
            setShowBubble(true);
            
            // Auto-speak after a small delay
            const timer = setTimeout(() => speak(intro), 800);
            return () => clearTimeout(timer);
        } else {
            setShowBubble(false);
            // SILENCIO DE SEGURIDAD: Si no hay selección, cortamos el habla
            synthRef.current?.cancel();
            setIsSpeaking(false);
        }
    }, [selected, muted, speak, kidsMode]);

    return (
        <div className={cn(
            "fixed z-[60] flex flex-col items-end gap-3 pointer-events-none",
            // Desktop: bottom-right corner
            "md:bottom-24 md:right-6",
            // Mobile: above the FAB (bottom-40), hidden when bottom sheet is open
            sidebarOpen ? "hidden md:flex" : "bottom-40 right-4"
        )}>
            {/* Bocadillo de texto */}
            <AnimatePresence>
                {showBubble && message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="pointer-events-auto max-w-[280px] bg-black/80 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl rounded-br-none shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex gap-2 items-start mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">Guía Galáctica</span>
                        </div>
                        <p className="text-[12px] text-white/80 leading-relaxed italic">
                            &laquo;{message}&raquo;
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón Flotante — wrapper relativo para que el botón de mute sea hermano */}
            <div className="pointer-events-auto relative">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (isSpeaking) {
                            synthRef.current?.cancel();
                            setIsSpeaking(false);
                        } else if (message) {
                            speak(message);
                        }
                        setMuted(false);
                    }}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500",
                        isSpeaking
                            ? "bg-blue-600 border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                            : "bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50"
                    )}
                >
                    {isSpeaking ? (
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [8, 20, 8] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    className="w-1 bg-white rounded-full"
                                />
                            ))}
                        </div>
                    ) : (
                        <MessageSquare className="w-6 h-6 text-white/40" />
                    )}
                </motion.button>

                {/* Indicador de Silencio — hermano del botón principal, no hijo */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMuted(!muted);
                        if (!muted) synthRef.current?.cancel();
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-black border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10"
                >
                    {muted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-white/50" />}
                </button>
            </div>
        </div>
    );
}
