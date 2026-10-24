'use client';

import { useEffect, useId, useState } from 'react';
import { ExternalLink, LoaderCircle, Telescope, WifiOff, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

const SCRIPT_URL = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/3.8.1/aladin.js';
const SCRIPT_ID = 'aladin-lite-3-8-1';

interface AladinApi {
    init: Promise<void>;
    aladin: (selector: string, options: Record<string, unknown>) => unknown;
}

declare global {
    interface Window { A?: AladinApi }
}

let scriptPromise: Promise<AladinApi> | null = null;

function loadAladin(): Promise<AladinApi> {
    if (window.A) return Promise.resolve(window.A);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<AladinApi>((resolve, reject) => {
        const finish = () => window.A
            ? resolve(window.A)
            : reject(new Error('Aladin Lite no expuso su API.'));
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', finish, { once: true });
            existing.addEventListener('error', () => reject(new Error('No se pudo cargar Aladin Lite.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.addEventListener('load', finish, { once: true });
        script.addEventListener('error', () => reject(new Error('No se pudo cargar Aladin Lite.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        scriptPromise = null;
        throw error;
    });

    return scriptPromise;
}

export default function ScientificSkyView({ onClose }: { onClose: () => void }) {
    const reactId = useId();
    const containerId = `aladin-scientific-${reactId.replace(/:/g, '')}`;
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const selectedObject = useAppStore((state) => state.targetedObject ?? state.selectedObject);
    const camFov = useAppStore((state) => state.camFov);
    const initialTarget = selectedObject
        ? `${selectedObject.ra.toFixed(6)} ${selectedObject.dec >= 0 ? '+' : ''}${selectedObject.dec.toFixed(6)}`
        : 'galactic center';
    const initialFov = selectedObject ? Math.max(0.2, Math.min(70, camFov)) : 70;

    useEffect(() => {
        let cancelled = false;

        async function initialise() {
            try {
                const api = await loadAladin();
                await api.init;
                if (cancelled) return;
                api.aladin(`#${containerId}`, {
                    survey: 'P/2MASS/color', target: initialTarget, fov: initialFov,
                    projection: selectedObject ? 'SIN' : 'AIT', cooFrame: selectedObject ? 'ICRS' : 'galactic', showCooGrid: true,
                    showCooGridControl: true, showSimbadPointerControl: true,
                    showLayersControl: true, showGotoControl: true,
                    showFullscreenControl: false, showShareControl: false,
                    showContextMenu: true,
                });
                setStatus('ready');
            } catch (error) {
                if (cancelled) return;
                setErrorMessage(error instanceof Error ? error.message : 'No se pudo abrir el mosaico HiPS.');
                setStatus('error');
            }
        }

        void initialise();
        return () => {
            cancelled = true;
            document.getElementById(containerId)?.replaceChildren();
        };
    }, [containerId, initialFov, initialTarget, selectedObject]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#020610]" role="dialog" aria-modal="true" aria-label="Explorador científico HiPS">
            <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-blue-400/15 bg-[#050b18]/95 px-3 py-2 md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><Telescope className="h-5 w-5" /></div>
                    <div className="min-w-0">
                        <h2 className="truncate text-xs font-bold uppercase tracking-[0.2em] text-blue-100 md:text-sm">Vía Láctea científica · HiPS</h2>
                        <p className="truncate text-[9px] uppercase tracking-wider text-white/45 md:text-[10px]">
                            2MASS color · infrarrojo J/H/K · {selectedObject ? `${selectedObject.name} · ${initialFov.toFixed(1)}°` : 'centro galáctico'}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar explorador HiPS">
                    <X className="h-4 w-4" /><span className="hidden sm:inline">Cerrar</span>
                </button>
            </header>

            <main className="relative min-h-0 flex-1">
                <div id={containerId} className="h-full w-full" />
                {status === 'loading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#020610] text-blue-100">
                        <LoaderCircle className="h-8 w-8 animate-spin text-cyan-300" />
                        <p className="text-xs font-bold uppercase tracking-[0.18em]">Cargando teselas astronómicas</p>
                        <p className="text-[10px] text-white/45">La primera apertura necesita conexión a CDS.</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#020610] px-6 text-center">
                        <WifiOff className="h-9 w-9 text-amber-300" />
                        <div><p className="text-sm font-bold text-white">No se ha podido cargar la vista científica</p><p className="mt-2 max-w-lg text-xs leading-relaxed text-white/55">{errorMessage} Comprueba la conexión y vuelve a abrirla. La bóveda normal continúa disponible.</p></div>
                        <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/10">Volver a la bóveda</button>
                    </div>
                )}
            </main>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#050b18] px-3 py-2 text-[9px] leading-relaxed text-white/45 md:px-5">
                <span>Datos reales multirresolución; el color representa bandas infrarrojas, no la visión humana.</span>
                <div className="flex items-center gap-3">
                    <a className="inline-flex items-center gap-1 text-cyan-200/70 hover:text-cyan-100" href="https://alasky.cds.unistra.fr/2MASS/Color" target="_blank" rel="noreferrer">2MASS / CDS <ExternalLink className="h-3 w-3" /></a>
                    <a className="inline-flex items-center gap-1 text-cyan-200/70 hover:text-cyan-100" href="https://aladin.cds.unistra.fr/AladinLite/" target="_blank" rel="noreferrer">Aladin Lite <ExternalLink className="h-3 w-3" /></a>
                </div>
            </footer>
        </div>
    );
}
