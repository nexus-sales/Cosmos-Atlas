'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, FastForward } from 'lucide-react';
import * as Astronomy from 'astronomy-engine';

const TOUR_STOPS = [
    { id: 'sun', name: 'Sol', body: Astronomy.Body.Sun, intro: 'Comencemos nuestro viaje por el centro de todo: El Sol.' },
    { id: 'venus', name: 'Venus', body: Astronomy.Body.Venus, intro: 'Nuestro vecino más brillante, a menudo llamado el gemelo malvado de la Tierra por su atmósfera infernal.' },
    { id: 'mars', name: 'Marte', body: Astronomy.Body.Mars, intro: 'El planeta rojo, destino de nuestras futuras misiones de colonización.' },
    { id: 'jupiter', name: 'Júpiter', body: Astronomy.Body.Jupiter, intro: 'El rey de los planetas, un gigante gaseoso tan grande que podría albergar a todos los demás planetas dentro.' },
    { id: 'saturn', name: 'Saturno', body: Astronomy.Body.Saturn, intro: 'Famoso por sus majestuosos anillos de hielo y roca.' },
    { id: 'M42', name: 'Nebulosa de Orión', ra: 83.82, dec: -5.39, kind: 'dso', intro: 'Y finalmente, salimos del sistema solar para ver una cuna de estrellas, donde nacen nuevos soles.' },
];

export default function AIAstronoma() {
    const selectedObject = useAppStore((state) => state.selectedObject);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    const [msg, setMsg] = useState<string>('');
    const [isTalking, setIsTalking] = useState(false);
    const [tourIndex, setTourIndex] = useState(-1);

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

    const speak = (text: string, onEnd?: () => void) => {
        if (!synth) return;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        utterance.onstart = () => setIsTalking(true);
        utterance.onend = () => {
            setIsTalking(false);
            if (onEnd) onEnd();
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
    };

    const startTour = () => {
        setTourIndex(0);
    };

    const nextTourStop = () => {
        if (tourIndex < TOUR_STOPS.length - 1) {
            setTourIndex(prev => prev + 1);
        } else {
            setTourIndex(-1);
            setMsg('Espero que hayas disfrutado de este tour estelar. ¡Sigue explorando!');
        }
    };

    useEffect(() => {
        if (tourIndex >= 0) {
            const stop = TOUR_STOPS[tourIndex] as any;
            setMsg(stop.intro);

            let ra = stop.ra || 0;
            let dec = stop.dec || 0;

            if (stop.body !== undefined) {
                const { time, observer } = useAppStore.getState();
                const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
                const eq = Astronomy.Equator(stop.body, time, obs, true, true);
                ra = eq.ra;
                dec = eq.dec;
            }

            // Trigger flight to target
            const virtualObj = {
                id: stop.id,
                name: stop.name,
                ra,
                dec,
                kind: (stop.body !== undefined ? 'planet' : 'dso') as any,
                desc: stop.intro
            };

            setTargetedObject(virtualObj as any);
            setSelectedObject(virtualObj as any);

            speak(stop.intro, () => {
                setTimeout(nextTourStop, 4000);
            });
        }
    }, [tourIndex]);

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
                        <p className="text-white/90 text-sm leading-relaxed font-secondary italic mb-4">
                            "{msg}"
                        </p>

                        {/* Tour Controls */}
                        <div className="flex justify-center pt-2 border-t border-white/5">
                            {tourIndex === -1 ? (
                                <button
                                    onClick={startTour}
                                    className="px-4 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full text-[10px] font-bold tracking-[0.2em] transition-all flex items-center gap-2"
                                >
                                    <Play className="w-3 h-3" /> INICIAR TOUR ESTELAR
                                </button>
                            ) : (
                                <div className="flex items-center gap-4 text-white/40 text-[9px] font-bold tracking-widest">
                                    <span className="text-blue-400">PASO {tourIndex + 1}/{TOUR_STOPS.length}</span>
                                    <button
                                        onClick={() => setTourIndex(-1)}
                                        className="hover:text-red-400 transition-colors uppercase"
                                    >Detener</button>
                                </div>
                            )}
                        </div>

                        {/* Decoration */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
