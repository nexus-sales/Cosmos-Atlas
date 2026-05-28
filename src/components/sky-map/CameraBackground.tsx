'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export default function CameraBackground() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const viewMode = useAppStore((s) => s.viewMode);
    const setCamFov = useAppStore((s) => s.setCamFov);
    const [streamActive, setStreamActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const overlayStyle = useMemo(() => ({
        background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)',
    }), []);

    useEffect(() => {
        const video = videoRef.current;
        const stopStream = (stream: MediaStream | null) => {
            stream?.getTracks().forEach(track => track.stop());
        };

        if (viewMode !== 'camera') {
            if (video?.srcObject) {
                const stream = video.srcObject as MediaStream;
                stopStream(stream);
                video.srcObject = null;
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStreamActive(false);
            setError(null);
            return;
        }

        let currentStream: MediaStream | null = null;
        let cancelled = false;

        async function startCamera() {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    setError('Camara no disponible');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });

                if (cancelled) {
                    stopStream(stream);
                    return;
                }

                if (video) {
                    video.srcObject = stream;
                    currentStream = stream;
                    
                    video.onloadedmetadata = () => {
                        setStreamActive(true);
                        const track = stream.getVideoTracks()[0];
                        const settings = track.getSettings();
                        if (settings.aspectRatio) {
                            const defaultHorizontalFov = 70; 
                            const verticalFov = defaultHorizontalFov / (settings.aspectRatio || 1.77);
                            setCamFov(verticalFov);
                        } else {
                            setCamFov(45);
                        }
                    };
                }
            } catch (err: unknown) {
                console.error('Error al acceder a la camara:', err);
                const name = err instanceof Error ? err.name : '';
                setError(name === 'NotAllowedError' ? 'Permiso denegado' : 'Camara no disponible');
            }
        }

        startCamera();

        return () => {
            cancelled = true;
            if (video) {
                video.onloadedmetadata = null;
                video.srcObject = null;
            }
            stopStream(currentStream);
        };
    }, [viewMode, setCamFov]);

    if (viewMode !== 'camera') return null;

    return (
        <div className="absolute inset-0 w-full h-full bg-black z-0 pointer-events-none overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-700",
                    streamActive ? "opacity-100 scale-105" : "opacity-0 scale-100"
                )}
            />
            <div 
                className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000"
                style={{
                    ...overlayStyle,
                    opacity: streamActive ? 1 : 0
                }}
            />

            {!streamActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-sm z-20">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400">INICIALIZANDO LENTE AR</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-950/40 backdrop-blur-md px-10 text-center z-20">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                        <span className="text-xl">!</span>
                    </div>
                    <p className="text-[11px] font-bold tracking-widest text-red-200 uppercase">{error}</p>
                    <p className="text-[9px] text-red-100/40">ASEGURATE DE DAR PERMISOS DE CAMARA EN TU NAVEGADOR</p>
                </div>
            )}

            {streamActive && (
                <div className="absolute inset-0 pointer-events-none border-[40px] border-black/5 opacity-50 z-10" />
            )}
        </div>
    );
}
