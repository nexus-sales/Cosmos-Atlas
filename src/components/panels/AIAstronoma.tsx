'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Volume2, VolumeX, Sparkles, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getKidFact } from '@/data/kidFacts';

export default function AIAstronoma() {
    const selected = useAppStore((s) => s.selectedObject);
    const updateAchievement = useAppStore((s) => s.updateAchievement);
    const mythologyBuff = useAppStore((s) => s.achievements.mythologyBuff);
    const kidsMode = useAppStore((s) => s.settings.kidsMode);
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const [message, setMessage] = useState('');
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        return () => synthRef.current?.cancel();
    }, []);

    const speak = useCallback((text: string) => {
        if (!synthRef.current || muted) return;
        
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.pitch = 1.1;
        utterance.rate = 0.95;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            // Increment mythology buff if it was a significant length text
            if (text.length > 50) {
                updateAchievement('mythologyBuff', mythologyBuff + 1);
            }
        };
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [muted, mythologyBuff, updateAchievement]);

    // Reaccionar a cambios de selección
    useEffect(() => {
        if (selected && !muted) {
            const kidFact = kidsMode ? getKidFact(selected.name) : null;
            const intro = kidFact 
                ? `¡Hola explorador! Has encontrado ${selected.name}. ${kidFact}` 
                : `Has seleccionado ${selected.name}. ${selected.desc}`;
                
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMessage(intro);
            setShowBubble(true);
            
            // Auto-speak after a small delay
            const timer = setTimeout(() => speak(intro), 800);
            return () => clearTimeout(timer);
        } else {
            setShowBubble(false);
        }
    }, [selected, muted, speak, kidsMode]);

    return (
        <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
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
