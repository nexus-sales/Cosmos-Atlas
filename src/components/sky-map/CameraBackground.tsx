'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

/**
 * Componente que gestiona el stream de video de la cámara trasera.
 * Se utiliza para el modo Realidad Aumentada (AR).
 */
export default function CameraBackground() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewMode = useAppStore((s) => s.viewMode);
    const [streamActive, setStreamActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Solo intentamos activar la cámara si estamos en modo 'camera'
        if (viewMode !== 'camera') {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStreamActive(false);
            return;
        }

        let currentStream: MediaStream | null = null;

        async function startCamera() {
            try {
                // Pedimos cámara trasera preferentemente (environment)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    currentStream = stream;
                    // El video puede tardar un poco en cargar los metadatos y empezar a reproducir
                    videoRef.current.onloadedmetadata = () => {
                        setStreamActive(true);
                    };
                }
            } catch (err: unknown) {
                console.error("Error al acceder a la cámara:", err);
                const name = err instanceof Error ? err.name : '';
                setError(name === 'NotAllowedError' ? 'Permiso denegado' : 'Cámara no disponible');
            }
        }

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [viewMode]);

    if (viewMode !== 'camera') return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-black z-0 pointer-events-none">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-1000",
                    streamActive ? "opacity-100" : "opacity-0"
                )}
            />
            
            {/* Overlay de carga o error */}
            {!streamActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400">INICIALIZANDO LENTE AR</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-950/40 backdrop-blur-md px-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <span className="text-xl">⚠️</span>
                    </div>
                    <p className="text-[11px] font-bold tracking-widest text-red-200 uppercase">{error}</p>
                    <p className="text-[9px] text-red-100/40">ASEGÚRATE DE DAR PERMISOS DE CÁMARA EN TU NAVEGADOR</p>
                </div>
            )}

            {/* Guía visual sutil para AR */}
            {streamActive && (
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/5 opacity-50" />
            )}
        </div>
    );
}
