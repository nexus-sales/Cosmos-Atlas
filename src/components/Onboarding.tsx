'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { ChevronRight, X, Star, Search, Layers, Clock, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    icon: React.ReactNode;
    title: string;
    body: string;
    hint: string;
    accent: string; // Tailwind text color class
    bg: string;     // Tailwind/CSS gradient class
}

const STEPS: Step[] = [
    {
        icon: <Star className="w-8 h-8" />,
        title: 'Bienvenido a Cosmos Atlas',
        body: 'Tu observatorio virtual 3D. Explora el cielo nocturno con la precisión de un astrónomo profesional y la belleza de una experiencia premium.',
        hint: 'Arrastra el cielo para rotar · Pincha/rueda para hacer zoom',
        accent: 'text-blue-400',
        bg: 'from-blue-900/30 to-transparent',
    },
    {
        icon: <Search className="w-8 h-8" />,
        title: 'Descubre el Universo',
        body: 'Toca cualquier estrella, planeta o nebulosa para obtener información detallada. Usa la barra de búsqueda para encontrar cualquier objeto celeste por nombre.',
        hint: 'Prueba buscar "M42" o "Andrómeda"',
        accent: 'text-purple-400',
        bg: 'from-purple-900/30 to-transparent',
    },
    {
        icon: <Layers className="w-8 h-8" />,
        title: 'Capas y Ajustes',
        body: 'Activa constelaciones, la Vía Láctea, satélites en tiempo real y el modo nocturno. Ajusta la contaminación lumínica con la escala Bortle para simular tu cielo local.',
        hint: 'Abre el panel lateral → "Capas del Cielo"',
        accent: 'text-emerald-400',
        bg: 'from-emerald-900/30 to-transparent',
    },
    {
        icon: <Clock className="w-8 h-8" />,
        title: 'Viaja en el Tiempo',
        body: 'Usa el control de tiempo para ver el cielo de cualquier fecha: pasado o futuro. Observa eclipses, lluvias de meteoros y posiciones planetarias históricas.',
        hint: 'Pulsa el botón "Tiempo Real" en la parte inferior',
        accent: 'text-amber-400',
        bg: 'from-amber-900/30 to-transparent',
    },
    {
        icon: <Camera className="w-8 h-8" />,
        title: 'Modo Cámara AR',
        body: 'Activa la cámara trasera y apunta tu teléfono al cielo. Cosmos Atlas superpone en tiempo real constelaciones, planetas y satélites sobre lo que ves, con precisión de brújula y giroscopio.',
        hint: 'Botón AR (escudo) en la cabecera, o el selector BÓVEDA · CÁMARA en la esquina inferior derecha',
        accent: 'text-sky-400',
        bg: 'from-sky-900/30 to-transparent',
    },
];

export default function Onboarding() {
    const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
    const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
    const [step, setStep] = useState(0);

    if (hasSeenOnboarding) return null;

    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const finish = () => setHasSeenOnboarding(true);
    const next = () => (isLast ? finish() : setStep((s) => s + 1));

    return (
        <AnimatePresence>
            <motion.div
                key="onboarding-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            >
                {/* Card */}
                <motion.div
                    key={`step-${step}`}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    className="relative w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
                    style={{ background: 'linear-gradient(160deg, rgba(4,12,28,0.98) 0%, rgba(2,6,18,1) 100%)' }}
                >
                    {/* Accent glow */}
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30', current.bg)} aria-hidden="true" />

                    {/* Skip button */}
                    <button
                        onClick={finish}
                        aria-label="Saltar introducción"
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors z-10 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10 p-8 pt-10">
                        {/* Step indicators */}
                        <div className="flex gap-1.5 mb-8" role="tablist" aria-label="Pasos de introducción">
                            {STEPS.map((_, i) => (
                                <button
                                    key={i}
                                    role="tab"
                                    aria-selected={i === step}
                                    aria-label={`Paso ${i + 1} de ${STEPS.length}`}
                                    onClick={() => setStep(i)}
                                    className={cn(
                                        'h-1 rounded-full transition-all duration-300 cursor-pointer',
                                        i === step ? 'flex-1 bg-blue-500' : 'w-4 bg-white/15 hover:bg-white/30'
                                    )}
                                />
                            ))}
                        </div>

                        {/* Icon */}
                        <div className={cn('mb-5 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10', current.accent, 'bg-white/5')}>
                            {current.icon}
                        </div>

                        {/* Text */}
                        <h2 className="text-xl font-bold text-white mb-3 tracking-tight leading-snug">
                            {current.title}
                        </h2>
                        <p className="text-[14px] text-white/60 leading-relaxed mb-6">
                            {current.body}
                        </p>

                        {/* Hint */}
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-8">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/25">Tip</span>
                            <span className="text-[11px] text-white/50 font-mono">{current.hint}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] text-white/20 font-mono tabular-nums">
                                {step + 1} / {STEPS.length}
                            </span>
                            <button
                                onClick={next}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] tracking-wide transition-all cursor-pointer',
                                    isLast
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]'
                                        : 'bg-white/8 hover:bg-white/15 text-white border border-white/10'
                                )}
                                aria-label={isLast ? 'Comenzar a explorar' : 'Siguiente paso'}
                            >
                                {isLast ? 'Explorar' : 'Siguiente'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
