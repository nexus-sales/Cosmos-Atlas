'use client';

import { useState } from 'react';
import { Camera, Download, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SnapshotButton() {
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const targetedObject = useAppStore(s => s.targetedObject);
    const time = useAppStore(s => s.time);
    const observer = useAppStore(s => s.observer);
    const bortleScale = useAppStore(s => s.settings.bortleScale);

    const takeSnapshot = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Se asume que el canvas preserva su buffer o se captura justo después del render (R3F por defecto lo limpia,
            // pero si disparamos toDataURL aquí a menudo funciona si no hay interacción pesada. 
            // Para asegurar, se puede añadir gl={{ preserveDrawingBuffer: true }} en SkyCanvas)
            const dataUrl = canvas.toDataURL('image/png');
            setSnapshot(dataUrl);
        }
    };

    const handleDownload = () => {
        if (!snapshot) return;
        const a = document.createElement('a');
        a.href = snapshot;
        a.download = `cosmos-atlas-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSnapshot(null); // Cerrar tras descargar
    };

    const lst = getLST(time, observer.lon);
    const targetName = targetedObject ? targetedObject.name : 'Espacio Profundo';

    return (
        <>
            {/* Botón Flotante */}
            <div className="absolute top-6 right-6 z-30 pointer-events-auto">
                <button
                    onClick={takeSnapshot}
                    className="flex items-center justify-center w-11 h-11 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-lg"
                    title="Tomar Polaroid Estelar"
                >
                    <Camera className="w-5 h-5" />
                </button>
            </div>

            {/* Modal de Polaroid */}
            <AnimatePresence>
                {snapshot && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#f0f0f0] p-4 pb-12 rounded shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-lg w-full relative"
                        >
                            <button 
                                onClick={() => setSnapshot(null)}
                                className="absolute -top-4 -right-4 w-10 h-10 bg-black/50 hover:bg-red-500 rounded-full text-white flex items-center justify-center transition-colors shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="aspect-[4/3] bg-black overflow-hidden shadow-inner border border-black/10">
                                <img src={snapshot} alt="Astro Polaroid" className="w-full h-full object-cover" />
                            </div>

                            <div className="mt-6 flex flex-col font-mono text-black/80 px-2">
                                <div className="text-2xl font-bold uppercase tracking-widest border-b border-black/20 pb-2 mb-2">
                                    {targetName}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                                    <div>Fecha: {time.toLocaleDateString()}</div>
                                    <div>Hora: {time.toLocaleTimeString()}</div>
                                    <div>Lat: {observer.lat.toFixed(2)}°</div>
                                    <div>Lon: {observer.lon.toFixed(2)}°</div>
                                    <div>LST: {lst.toFixed(2)}h</div>
                                    <div>Bortle: Clase {bortleScale}</div>
                                </div>
                                
                                <button 
                                    onClick={handleDownload}
                                    className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-black text-white font-bold tracking-widest uppercase rounded hover:bg-blue-600 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Guardar en Diario
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
