'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_SEQUENCE = [
    { text: 'SYSTEM INITIALIZATION v3.0.4', delay: 100 },
    { text: 'MOUNTING NEURAL SYNC MODULE...', delay: 600 },
    { text: 'NEURAL UPLINK ESTABLISHED. [OK]', delay: 1200 },
    { text: 'CALIBRATING OPTICAL SENSORS...', delay: 1800 },
    { text: 'CHROMATIC ABERRATION: DISABLED', delay: 2200 },
    { text: 'HDR BLOOM: NOMINAL', delay: 2400 },
    { text: 'ENGAGING WARP DRIVE INTERFACE...', delay: 3000 },
    { text: 'CYBER-OBSERVATORY READY.', delay: 3500 },
];

export default function BootSequence() {
    const [isBooting, setIsBooting] = useState(true);
    const [lines, setLines] = useState<string[]>([]);
    const [glitch, setGlitch] = useState(false);

    useEffect(() => {
        // Prevent boot sequence from running more than once per session
        if (sessionStorage.getItem('cosmos_booted')) {
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
        }, 4500);
        timeouts.push(endTimeout);

        return () => timeouts.forEach(clearTimeout);
    }, []);

    if (!isBooting) return null;

    return (
        <AnimatePresence>
            {isBooting && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
                    
                    {/* Subtle Scanline Overlay for Boot Screen */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

                    <motion.div 
                        animate={glitch ? { x: [-2, 2, -1, 1, 0], opacity: [0.8, 1, 0.5, 1] } : {}}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 font-mono text-left w-full max-w-md p-8"
                    >
                        <div className="text-blue-500 mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            </div>
                            <span className="font-display text-2xl font-bold tracking-[0.3em] uppercase">Cosmos Atlas</span>
                        </div>

                        <div className="space-y-2 text-[11px] tracking-widest text-emerald-400/80 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                            {lines.map((line, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2"
                                >
                                    <span className="opacity-50">{'>'}</span>
                                    <span>{line}</span>
                                </motion.div>
                            ))}
                            {lines.length < BOOT_SEQUENCE.length && (
                                <motion.div
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="w-2 h-3 bg-emerald-400/80 ml-4 mt-2"
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
