'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, LoaderCircle, Telescope, WifiOff, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

const SCRIPT_URL = 'https://aladin.cds.unistra.fr/AladinLite/api/v3/3.8.1/aladin.js';
const SCRIPT_ID = 'aladin-lite-3-8-1';

const SURVEYS = [
    { id: 'P/2MASS/color', label: '2MASS J/H/K', description: 'Bandas infrarrojas J/H/K.', url: 'https://alasky.cds.unistra.fr/2MASS/Color' },
    { id: 'P/DSS2/color', label: 'DSS2 color', description: 'Placas fotográficas en bandas ópticas.', url: 'https://alasky.cds.unistra.fr/DSS/DSSColor' },
    { id: 'P/PanSTARRS/DR1/color-z-zg-g', label: 'Pan-STARRS DR1', description: 'Bandas g/z. Cobertura parcial del cielo. Profundidad variable por banda y zona.', url: 'https://alasky.cds.unistra.fr/Pan-STARRS/DR1/color-z-zg-g' },
];
interface AladinView {
    setBaseImageLayer: (survey: string) => unknown;
    gotoRaDec: (ra: number, dec: number) => void;
    setFoV: (fov: number) => void;
}
interface AladinApi {
    init: Promise<void>;
    aladin: (selector: string, options: Record<string, unknown>) => AladinView;
}

declare global {
    interface Window { A?: AladinApi }
}

let scriptPromise: Promise<AladinApi> | null = null;

function loadAladin(): Promise<AladinApi> {
    if (window.A) return Promise.resolve(window.A);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise<AladinApi>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado cargando Aladin Lite.')), 15_000);
        script.addEventListener('load', () => {
            clearTimeout(timer);
            if (window.A) resolve(window.A);
            else reject(new Error('Aladin Lite no expuso su API.'));
        }, { once: true });
        script.addEventListener('error', () => {
            clearTimeout(timer);
            reject(new Error('No se pudo cargar Aladin Lite.'));
        }, { once: true });
        document.getElementById(SCRIPT_ID)?.remove();
        document.head.appendChild(script);
    }).catch((error) => {
        document.getElementById(SCRIPT_ID)?.remove();
        scriptPromise = null;
        throw error;
    });

    return scriptPromise;
}

export default function ScientificSkyView({ onClose }: { onClose: () => void }) {
    const reactId = useId();
    const containerId = `aladin-scientific-${reactId.replace(/:/g, '')}`;
    const viewRef = useRef<AladinView | null>(null);
    const [surveyId, setSurveyId] = useState(SURVEYS[0].id);
    const survey = SURVEYS.find(item => item.id === surveyId)!;
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const selectedObject = useAppStore((state) => state.targetedObject ?? state.selectedObject);
    const camFov = useAppStore((state) => state.camFov);
    const initialTarget = selectedObject
        ? `${selectedObject.ra.toFixed(6)} ${selectedObject.dec >= 0 ? '+' : ''}${selectedObject.dec.toFixed(6)}`
        : 'galactic center';
    const initialFov = selectedObject ? Math.max(0.2, Math.min(70, camFov)) : 70;

    useEffect(() => {
        let cancelled = false;
        let initTimer: ReturnType<typeof setTimeout> | undefined;

        async function initialise() {
            try {
                setStatus('loading');
                setErrorMessage('');
                const api = await loadAladin();
                await Promise.race([
                    api.init,
                    new Promise<never>((_, reject) => {
                        initTimer = setTimeout(() => reject(new Error('Tiempo de espera agotado preparando la vista HiPS.')), 20_000);
                    }),
                ]);
                if (cancelled) return;
                viewRef.current = api.aladin(`#${containerId}`, {
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
                delete window.A;
                scriptPromise = null;
                document.getElementById(SCRIPT_ID)?.remove();
            } finally {
                clearTimeout(initTimer);
            }
        }

        void initialise();
        return () => {
            cancelled = true;
            clearTimeout(initTimer);
            viewRef.current = null;
            document.getElementById(containerId)?.replaceChildren();
        };
    // The instance is retained while switching survey or navigating in the atlas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerId, attempt]);

    useEffect(() => {
        if (status !== 'ready' || !viewRef.current) return;
        viewRef.current.setBaseImageLayer(surveyId);
    }, [status, surveyId]);

    useEffect(() => {
        if (status !== 'ready' || !viewRef.current || !selectedObject) return;
        viewRef.current.gotoRaDec(selectedObject.ra, selectedObject.dec);
        viewRef.current.setFoV(initialFov);
    }, [status, initialFov, selectedObject]);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#020610]" role="dialog" aria-modal="true" aria-label="Explorador científico HiPS">
            <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-blue-400/15 bg-[#050b18]/95 px-3 py-2 md:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200"><Telescope className="h-5 w-5" /></div>
                    <div className="min-w-0">
                        <h2 className="truncate text-xs font-bold uppercase tracking-[0.2em] text-blue-100 md:text-sm">Vía Láctea científica · HiPS</h2>
                        <p className="truncate text-[9px] uppercase tracking-wider text-white/45 md:text-[10px]">
                            {survey.label} · {selectedObject ? `${selectedObject.name} · ${initialFov.toFixed(1)}°` : 'centro galáctico'}
                        </p>
                    </div>
                </div>
                <select aria-label="Survey astronómico" value={surveyId} onChange={event => setSurveyId(event.target.value)} className="max-w-40 rounded border border-white/20 bg-slate-950 p-2 text-xs text-white">
                    {SURVEYS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
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
                        <div><p className="text-sm font-bold text-white">No se ha podido cargar la vista científica</p><p className="mt-2 max-w-lg text-xs leading-relaxed text-white/55">{errorMessage} Puedes reintentar la conexión o volver a la bóveda.</p></div>
                        <button type="button" onClick={() => setAttempt(value => value + 1)} className="rounded-lg border border-cyan-300/40 px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-400/10">Reintentar HiPS</button>
                        <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/10">Volver a la bóveda</button>
                    </div>
                )}
            </main>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#050b18] px-3 py-2 text-[9px] leading-relaxed text-white/45 md:px-5">
                <span>{survey.description}</span>
                <div className="flex items-center gap-3">
                    <a className="inline-flex items-center gap-1 text-cyan-200/70 hover:text-cyan-100" href={survey.url} target="_blank" rel="noreferrer">{survey.label} / CDS <ExternalLink className="h-3 w-3" /></a>
                    <a className="inline-flex items-center gap-1 text-cyan-200/70 hover:text-cyan-100" href="https://aladin.cds.unistra.fr/AladinLite/" target="_blank" rel="noreferrer">Aladin Lite <ExternalLink className="h-3 w-3" /></a>
                </div>
            </footer>
        </div>
    );
}
