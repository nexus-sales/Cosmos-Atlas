'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_SEQUENCE = [
    { text: 'Cielo sincronizado', delay: 120 },
    { text: 'Catalogo listo', delay: 360 },
    { text: 'Boveda preparada', delay: 640 },
];

export default function BootSequence() {
    const [isBooting, setIsBooting] = useState(true);
    const [lines, setLines] = useState<string[]>([]);
    const [glitch, setGlitch] = useState(false);

    useEffect(() => {
        // Prevent boot sequence from running more than once per session
        if (
            sessionStorage.getItem('cosmos_booted') ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            Promise.resolve().then(() => setIsBooting(false));
            return;
        }

        const timeouts: NodeJS.Timeout[] = [];

        BOOT_SEQUENCE.forEach(({ text, delay }, index) => {
            const timeout = setTimeout(() => {
                setLines(prev => [...prev, text]);
                
                // Add a small glitch effect on important steps
                if (index === 2 || index === 7) {
                    setGlitch(true);
                    setTimeout(() => setGlitch(false), 150);
                }
            }, delay);
            timeouts.push(timeout);
        });

        // End sequence
        const endTimeout = setTimeout(() => {
            setIsBooting(false);
            sessionStorage.setItem('cosmos_booted', 'true');
        }, 1150);
        timeouts.push(endTimeout);

        return () => timeouts.forEach(clearTimeout);
    }, []);

    if (!isBooting) return null;

    return (
        <AnimatePresence>
            {isBooting && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.02, filter: 'blur(6px)' }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] bg-black/88 flex flex-col items-center justify-center"
                    onClick={() => {
                        setIsBooting(false);
                        sessionStorage.setItem('cosmos_booted', 'true');
                    }}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        setIsBooting(false);
                        sessionStorage.setItem('cosmos_booted', 'true');
                    }}
                    role="button"
                    aria-label="Saltar inicio"
                    tabIndex={0}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/12 via-black/90 to-black" />
                    
                    {/* Subtle Scanline Overlay for Boot Screen */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

                    <motion.div 
                        animate={glitch ? { x: [-2, 2, -1, 1, 0], opacity: [0.8, 1, 0.5, 1] } : {}}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-full max-w-sm p-8 text-center font-mono"
                    >
                        <div className="mb-5 flex flex-col items-center gap-3 text-blue-400">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/50 shadow-[0_0_26px_rgba(96,165,250,0.35)]">
                                <div className="h-2.5 w-2.5 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.9)]" />
                            </div>
                            <span className="font-display text-2xl font-bold tracking-[0.22em] uppercase">Cosmos Atlas</span>
                        </div>

                        <div className="space-y-1.5 text-[11px] tracking-widest text-emerald-300/80 drop-shadow-[0_0_5px_rgba(52,211,153,0.35)]">
                            {lines.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-center"
                                >
                                    <span>{line}</span>
                                </motion.div>
                            ))}
                            {lines.length < BOOT_SEQUENCE.length && (
                                <motion.div
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="mx-auto mt-3 h-1 w-12 rounded-full bg-emerald-300/70"
                                />
                            )}
                        </div>
                        <div className="mt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/24">
                            Toca para entrar
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
