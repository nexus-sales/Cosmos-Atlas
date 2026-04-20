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

    const normalizeTextForSpeech = (text: string) => {
        return text
            .replace(/\bal\./gi, 'años luz')
            .replace(/\bal\b/gi, 'años luz')
            .replace(/\bmag\b/gi, 'magnitud')
            .replace(/\bkm\/h\b/gi, 'kilómetros por hora')
            .replace(/\bkm\b/gi, 'kilómetros')
            .replace(/\bms\b/gi, 'milisegundos')
            .replace(/\bau\b/gi, 'unidades astronómicas')
            .replace(/\bua\b/gi, 'unidades astronómicas')
            .replace(/&middot;/g, 'punto')
            .replace(/&deg;/g, 'grados')
            .replace(/\bh\b/gi, 'horas');
    };

    const speak = useCallback((text: string) => {
        if (!synthRef.current || muted) return;
        
        synthRef.current.cancel();
        
        if (synthRef.current.paused) {
            synthRef.current.resume();
        }

        // Normalizamos el texto para que la voz no diga "al" o "mag"
        const cleanText = normalizeTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        const voices = synthRef.current.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) 
                          || voices.find(v => v.lang.startsWith('es') && v.name.includes('Helena'))
                          || voices.find(v => v.lang.startsWith('es'));
        
        if (spanishVoice) utterance.voice = spanishVoice;
        utterance.lang = 'es-ES';
        
        utterance.pitch = kidsMode ? 1.25 : 1.1;
        utterance.rate = kidsMode ? 1.0 : 0.92;

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

    const targetedObject = useAppStore((s) => s.targetedObject);
    const focusedConstellation = useAppStore((s) => s.focusedConstellation);
    const lastMessageRef = useRef<string>('');

    const formatNarration = (obj: any) => {
        const isPlanet = 'kind' in obj && obj.kind === 'planet';
        const isDSO = 'type' in obj;
        
        let text = `Estás viendo ${obj.name}. `;
        
        // Humanizar descripción técnica
        if (isPlanet) {
            let desc = obj.desc || '';
            desc = desc.replace(/—/g, ', con un');
            desc = desc.replace(/(\d+)%/g, '$1 por ciento');
            text = `Observas ${obj.name}. ${desc}`;

            if (obj.dist) {
                const auToKm = 149597870.7;
                const km = obj.dist * auToKm;
                if (obj.name === 'Luna') {
                    text += ` Se encuentra a unos ${Math.round(km / 100) * 100} kilómetros de nosotros.`;
                } else if (km > 1000000) {
                    text += ` Está a una distancia de ${(km / 1000000).toFixed(1)} millones de kilómetros.`;
                } else {
                    text += ` Se encuentra a ${(obj.dist).toFixed(3)} unidades astronómicas.`;
                }
            }

            if (obj.mag) {
                const magVal = obj.mag < 0 ? `menos ${Math.abs(obj.mag).toFixed(1)}` : obj.mag.toFixed(1);
                text += ` Actualmente brilla con una magnitud de ${magVal}.`;
            }
        } else if (isDSO) {
            text = `Has localizado ${obj.name}, un objeto de tipo ${obj.type}. ${obj.desc}`;
        } else {
            text = `Has centrado tu visor en ${obj.name}. ${obj.desc || ''}`;
        }

        return text;
    };

    const achievements = useAppStore((s) => s.achievements);
    const prevAchievementsRef = useRef(achievements);

    // Celebrar logros
    useEffect(() => {
        const prev = prevAchievementsRef.current;
        let celebration = '';

        if (achievements.planetHunter && !prev.planetHunter) {
            celebration = "¡Increíble! Te has convertido en un verdadero Explorador de Planetas. Has visitado todos los mundos de nuestro sistema.";
        } else if (achievements.messierMarathon > prev.messierMarathon) {
            celebration = `¡Buen trabajo! Has registrado un nuevo objeto Messier. Llevas ${achievements.messierMarathon} de ciento diez.`;
        } else if (achievements.mythologyBuff > prev.mythologyBuff) {
            celebration = "Tu conocimiento de la mitología estelar está creciendo. ¡Sigue escuchando las historias del cosmos!";
        }

        if (celebration) {
            setMessage(celebration);
            setShowBubble(true);
            speak(celebration);
        }
        
        prevAchievementsRef.current = achievements;
    }, [achievements, speak]);

    // Reaccionar a cambios de selección, objetivos o enfoque de constelaciones
    useEffect(() => {
        const currentSelection = selected || targetedObject;
        let newIntro = '';

        if (currentSelection && !muted) {
            const isStar = 'constellation' in currentSelection;
            const isPlanet = 'kind' in currentSelection && currentSelection.kind === 'planet';
            
            const kidFact = kidsMode ? getKidFact(currentSelection.name, isStar, isPlanet) : null;
            if (kidFact) {
                newIntro = `¡Hola explorador! Has encontrado a ${currentSelection.name}. ${kidFact}`;
            } else {
                newIntro = formatNarration(currentSelection);
            }
        } else if (focusedConstellation && !muted) {
            const name = focusedConstellation;
            const kidFact = kidsMode ? getKidFact(name, false, false) : null;
            newIntro = kidFact
                ? `Mira esa figura: es la constelación de ${name}. ${kidFact}`
                : `La constelación de ${name} está ahora centrada en tu visor nocturno.`;
        }

        if (newIntro && newIntro !== lastMessageRef.current) {
            lastMessageRef.current = newIntro;
            setMessage(newIntro);
            setShowBubble(true);
            const timer = setTimeout(() => speak(newIntro), 1000);
            return () => clearTimeout(timer);
        } else if (!newIntro) {
            setShowBubble(false);
            lastMessageRef.current = '';
            synthRef.current?.cancel();
            setIsSpeaking(false);
        }
    }, [selected, targetedObject, focusedConstellation, muted, speak, kidsMode]);

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
