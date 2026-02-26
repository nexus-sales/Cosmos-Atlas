'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, FastForward, Sparkles } from 'lucide-react';
import * as Astronomy from 'astronomy-engine';

const TOUR_STOPS = [
    { id: 'sun', name: 'Sol', body: Astronomy.Body.Sun, intro: 'Comencemos nuestro viaje por el centro de todo: El Sol.' },
    { id: 'venus', name: 'Venus', body: Astronomy.Body.Venus, intro: 'Nuestro vecino más brillante. En la antigüedad era conocido como el Lucero del Alba, portador de la luz.' },
    { id: 'mars', name: 'Marte', body: Astronomy.Body.Mars, intro: 'El planeta rojo. Los antiguos romanos lo veían como su dios de la guerra por su color similar a la sangre.' },
    { id: 'jupiter', name: 'Júpiter', body: Astronomy.Body.Jupiter, intro: 'El gigante que protege a la Tierra. Su inmensa gravedad desvía cometas que de otro modo podrían impactar con nosotros.' },
    { id: 'saturn', name: 'Saturno', body: Astronomy.Body.Saturn, intro: 'El señor de los anillos. Si encontraras un océano lo suficientemente grande, ¡Saturno flotaría en él!' },
];

const MYTH_DATA: Record<string, string> = {
    'Sirius': 'Sirio es la estrella perro. Los antiguos egipcios la usaban para predecir las inundaciones del Nilo.',
    'Betelgeuse': 'Esta supergigante roja está al final de su vida. Un día explotará como una supernova visible incluso de día.',
    'M31': 'Andrómeda es nuestra galaxia vecina. En unos 4 mil millones de años, chocará con la Vía Láctea para formar Lactómeda.',
    'Polaris': 'La Estrella del Norte. Ha guiado a navegantes durante siglos, indicando siempre el polo norte celeste.',
    'M42': 'En el corazón de la espada de Orión, esta nebulosa es una guardería donde están naciendo cientos de estrellas ahora mismo.',
};

export default function AIAstronoma() {
    const selectedObject = useAppStore((state) => state.selectedObject);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);

    const [msg, setMsg] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);
    const [isTalking, setIsTalking] = useState(false);
    const [tourIndex, setTourIndex] = useState(-1);
    const [showHistory, setShowHistory] = useState(false);

    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (!selectedObject) {
            const initialMsg = '¡Hola! Soy tu guía estelar. Selecciona cualquier astro o pídeme una sugerencia.';
            setMsg(initialMsg);
            setHistory(prev => [initialMsg, ...prev].slice(0, 5));
            return;
        }

        let detail = selectedObject.desc || 'Es un objeto fascinante en la inmensidad del cosmos.';

        // Enrich with myths if available
        if (MYTH_DATA[selectedObject.name]) {
            detail += ` Sabías que... ${MYTH_DATA[selectedObject.name]}`;
        }

        const fullMsg = `Has seleccionado ${selectedObject.name}. ${detail}`;

        setMsg(fullMsg);
        setHistory(prev => [fullMsg, ...prev].slice(0, 10));
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

    const getSmartSuggestion = () => {
        const { time, observer } = useAppStore.getState();
        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);

        // Find a visible planet or prominent object
        const candidates = [
            { body: Astronomy.Body.Jupiter, name: 'Júpiter' },
            { body: Astronomy.Body.Mars, name: 'Marte' },
            { body: Astronomy.Body.Venus, name: 'Venus' },
            { body: Astronomy.Body.Saturn, name: 'Saturno' },
            { body: Astronomy.Body.Moon, name: 'Luna' }
        ];

        let best = null;
        let maxAlt = -1;

        for (const c of candidates) {
            const eq = Astronomy.Equator(c.body, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');
            if (hor.altitude > 15 && hor.altitude > maxAlt) {
                maxAlt = hor.altitude;
                best = { ...c, ra: eq.ra, dec: eq.dec };
            }
        }

        if (best) {
            const suggestion = `Te sugiero mirar hacia ${best.name}. Está a una excelente altitud de ${maxAlt.toFixed(0)} grados ahora mismo.`;
            setMsg(suggestion);
            setHistory(prev => [suggestion, ...prev].slice(0, 10));
            speak(suggestion);

            const virtualObj = {
                id: best.name.toLowerCase(),
                name: best.name,
                ra: best.ra,
                dec: best.dec,
                kind: 'planet' as const,
                desc: 'Sugerencia de observación.'
            };
            setTargetedObject(virtualObj as any);
            setSelectedObject(virtualObj as any);
        } else {
            const fallback = "Ahora mismo el cielo está en una fase tranquila, pero siempre puedes explorar las estrellas de la Vía Láctea.";
            setMsg(fallback);
            speak(fallback);
        }
    };

    useEffect(() => {
        if (tourIndex >= 0) {
            const stop = TOUR_STOPS[tourIndex] as any;
            const fullIntro = `Paso ${tourIndex + 1}: ${stop.intro}`;
            setMsg(fullIntro);
            setHistory(prev => [fullIntro, ...prev].slice(0, 10));

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
                setTimeout(nextTourStop, 5000);
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
                        <div className="relative mb-4">
                            <p className="text-white/90 text-sm leading-relaxed font-secondary italic line-clamp-4 group-hover:line-clamp-none transition-all">
                                "{msg}"
                            </p>
                        </div>

                        {/* Smart Suggestion & History Button */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={getSmartSuggestion}
                                className="flex-1 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[9px] font-bold text-cyan-300 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-3 h-3" /> ¿QUÉ VER HOY?
                            </button>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/50 transition-all"
                            >
                                HISTORIAL
                            </button>
                        </div>

                        {/* History Overlay */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar"
                                >
                                    {history.slice(1).map((h, i) => (
                                        <div key={i} className="p-2 bg-white/5 rounded-lg text-[10px] text-white/40 italic border-l-2 border-blue-500/30">
                                            {h}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tour Controls */}
                        <div className="flex justify-center pt-2 border-t border-white/5">
                            {tourIndex === -1 ? (
                                <button
                                    onClick={startTour}
                                    className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-blue-500/10 shadow-inner"
                                >
                                    <Play className="w-3 h-3 fill-current" /> INICIAR TOUR ESTELAR
                                </button>
                            ) : (
                                <div className="flex items-center justify-between w-full text-white/40 text-[9px] font-bold tracking-widest px-2">
                                    <span className="text-blue-400 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                        MISION {tourIndex + 1}/{TOUR_STOPS.length}
                                    </span>
                                    <button
                                        onClick={() => setTourIndex(-1)}
                                        className="hover:text-red-400 transition-colors uppercase border-b border-red-500/20"
                                    >Abortar</button>
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
