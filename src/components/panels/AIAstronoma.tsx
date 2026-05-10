'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Volume2, VolumeX, Sparkles, MessageSquare, Eye, Telescope, Gauge, Send, Loader2, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getKidFact } from '@/data/kidFacts';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { getCelestialVisibility } from '@/lib/astronomy/celestialVisibility';
import type { DSO, Planet, Star } from '@/types/celestial';
import { useCatalog } from '@/stores/useCatalogStore';
import { getSolarSystemBodyByName } from '@/data/solarSystemCatalog';

type NarratableObject = Star | DSO | Planet;
type ObjectKind = 'star' | 'planet' | 'dso' | 'constellation';
type AstronomerMode = 'openai' | 'local';

interface NarrationBrief {
    title: string;
    subtitle: string;
    message: string;
    voice: string;
    tags: string[];
    visible: boolean;
    observing: string;
    events: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
    source?: 'openai' | 'local';
}

interface EnrichedObjectContext {
    objectId?: string;
    objectKind: ObjectKind;
    description?: string;
    longDescription?: string;
    mythology?: string;
    observationTips?: string;
    funFact?: string;
    catalogSource: 'supabase' | 'local';
}

const AU_TO_KM = 149_597_870.7;
const CONSTELLATION_SYMBOL = '\u2726';
const NARRATION_BRIEF_CACHE_LIMIT = 64;
const QUICK_QUESTIONS = [
    'Como lo observo mejor?',
    'Que significa su magnitud?',
    'Por que es importante?',
    'Cuando conviene verlo?',
];
const KIDS_QUICK_QUESTIONS = [
    'Explicamelo facil',
    'Que tiene de increible?',
    'Como lo encuentro en el cielo?',
    'Hazme un reto rapido',
];

const narrationBriefCache = new Map<string, NarrationBrief>();

function isDso(obj: NarratableObject): obj is DSO {
    return 'type' in obj;
}

function isPlanet(obj: NarratableObject): obj is Planet {
    return 'kind' in obj && obj.kind === 'planet';
}

function isStar(obj: NarratableObject): obj is Star {
    return 'constellation' in obj;
}

function isConstellationTarget(obj: NarratableObject): obj is Planet {
    return isPlanet(obj) && obj.symbol === CONSTELLATION_SYMBOL;
}

function getObjectKind(obj: NarratableObject): ObjectKind {
    if (isConstellationTarget(obj)) return 'constellation';
    if (isDso(obj)) return 'dso';
    if (isPlanet(obj)) return 'planet';
    return 'star';
}

function formatMagnitude(mag: number | undefined): string {
    if (mag == null || !Number.isFinite(mag)) return 'mag desconocida';
    const value = mag < 0 ? `-${Math.abs(mag).toFixed(1)}` : `+${mag.toFixed(1)}`;
    if (mag <= 0) return `${value}, extremadamente brillante`;
    if (mag <= 2) return `${value}, visible con contaminacion luminica`;
    if (mag <= 5.8) return `${value}, simple vista con buen cielo`;
    if (mag <= 9) return `${value}, mejor con prismaticos`;
    return `${value}, objetivo telescopico`;
}

function formatDistanceAu(dist: number | undefined): string | null {
    if (!dist || !Number.isFinite(dist)) return null;
    const km = dist * AU_TO_KM;
    if (km < 1_000_000) return `${Math.round(km / 100) * 100} km`;
    return `${(km / 1_000_000).toFixed(1)} millones de km`;
}

function cardinalFromAzimuth(az: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return directions[Math.round((((az % 360) + 360) % 360) / 45) % 8];
}

function visibilityText(alt: number): string {
    if (alt < 0) return `bajo el horizonte (${alt.toFixed(1)}°)`;
    if (alt < 12) return `muy bajo (${alt.toFixed(1)}°)`;
    if (alt < 30) return `observable bajo (${alt.toFixed(1)}°)`;
    if (alt < 65) return `bien situado (${alt.toFixed(1)}°)`;
    return `muy alto (${alt.toFixed(1)}°)`;
}

function observingAdvice(kind: ObjectKind, obj: NarratableObject, alt: number, bortleScale: number): string {
    if (alt < 0) return 'No es observable ahora desde tu ubicación; espera a que ascienda o cambia la hora.';
    if (alt < 12) return 'Está demasiado cerca del horizonte: la atmósfera introduce extinción, turbulencia y color.';

    if (kind === 'planet') {
        if (obj.name === 'Luna') return 'Usa aumentos moderados: el terminador lunar revela relieve, crateres y sombras con mucho contraste.';
        if (obj.name === 'Saturno') return 'Prioriza noches estables; los anillos sufren mucho con turbulencia atmosferica.';
        if (obj.name === 'Jupiter' || obj.name === 'Júpiter') return 'Busca bandas ecuatoriales y satélites galileanos; la escena cambia en minutos.';
        if (obj.name === 'Venus') return 'Observa su fase: es brillante, pero su atmosfera oculta la superficie.';
        return 'Buen objetivo planetario: sube aumentos solo si la imagen permanece estable.';
    }

    if (kind === 'dso' && isDso(obj)) {
        if (bortleScale >= 7) return 'Con este Bortle, conviene un cielo más oscuro: la luz urbana borra contraste en objetos difusos.';
        if (obj.type === 'galaxy') return 'Las galaxias premian la vision lateral y cielos oscuros; busca nucleo, orientacion y forma.';
        if (obj.type === 'nebula') return 'En nebulosas, un filtro UHC u OIII puede marcar una diferencia enorme con telescopio.';
        return 'En cumulos, prueba aumentos medios para separar estrellas sin perder el campo completo.';
    }

    if (kind === 'star') return 'En estrellas, compara color, estabilidad y brillo; ahi aparecen temperatura, multiplicidad y evolucion.';
    return 'Usa la figura como mapa: identifica primero estrellas guía y después salta a objetos profundos cercanos.';
}

function scienceContext(kind: ObjectKind, obj: NarratableObject): string {
    if (kind === 'constellation') {
        return 'No es un objeto fisico unico: es una region aparente del cielo. Sus estrellas pueden estar a distancias muy distintas.';
    }
    if (kind === 'planet') {
        const dist = formatDistanceAu((obj as Planet).dist);
        return dist
            ? `Es un cuerpo del Sistema Solar; hoy lo tienes a unos ${dist} de distancia.`
            : 'Es un cuerpo del Sistema Solar, asi que su posicion cambia noche a noche frente al fondo de estrellas.';
    }
    if (kind === 'dso' && isDso(obj)) {
        if (obj.type === 'galaxy') return 'Estas mirando una estructura extragalactica: miles de millones de estrellas fuera de la Via Lactea.';
        if (obj.type === 'nebula') return 'Es gas y polvo interestelar: una region de formacion estelar, un remanente o material expulsado por una estrella.';
        return 'Es una agrupacion estelar: sus estrellas comparten origen o quedan ligadas por gravedad.';
    }
    if (isStar(obj)) {
        return `Es una estrella de ${getConstellationDisplayName(obj.constellation)}; su color aparente da pistas sobre temperatura superficial. ${obj.desc}`;
    }
    return obj.desc;
}

function buildNarrationBriefCacheKey(
    obj: NarratableObject,
    observer: { lat: number; lon: number },
    time: Date,
    bortleScale: number,
) {
    const objectId = isDso(obj) ? obj.id : obj.name;
    return [
        objectId,
        obj.ra.toFixed(4),
        obj.dec.toFixed(4),
        observer.lat.toFixed(3),
        observer.lon.toFixed(3),
        time.getTime(),
        bortleScale,
    ].join(':');
}

function buildKidNarration(
    obj: NarratableObject,
    brief: NarrationBrief,
    enrichment: EnrichedObjectContext | null,
) {
    const kind = getObjectKind(obj);
    const title = kind === 'constellation' ? getConstellationDisplayName(obj.name) : obj.name;
    const surprise = enrichment?.funFact || getKidFact(obj.name, isStar(obj), isPlanet(obj));
    const simpleContext = enrichment?.longDescription || enrichment?.description || scienceContext(kind, obj);
    const visibleLine = brief.visible
        ? `Ahora mismo esta en el cielo: mira hacia donde marca el atlas y fijate en su brillo.`
        : `Ahora esta bajo el horizonte desde tu ubicacion, pero puedes viajar en el tiempo del atlas para verlo aparecer.`;

    return [
        `${title}: ${surprise}`,
        `Piensalo asi: ${simpleContext}`,
        visibleLine,
        `Reto rapido: intenta explicar en una frase si es una estrella, un planeta, una nube de gas o una galaxia. Esa es la llave para entenderlo.`,
    ].join(' ');
}

function rememberNarrationBrief(key: string, brief: NarrationBrief) {
    narrationBriefCache.delete(key);
    narrationBriefCache.set(key, brief);

    if (narrationBriefCache.size > NARRATION_BRIEF_CACHE_LIMIT) {
        const oldestKey = narrationBriefCache.keys().next().value;
        if (oldestKey) narrationBriefCache.delete(oldestKey);
    }

    return brief;
}

function buildNarrationBrief(
    obj: NarratableObject,
    observer: { lat: number; lon: number },
    time: Date,
    bortleScale: number,
): NarrationBrief {
    const cacheKey = buildNarrationBriefCacheKey(obj, observer, time, bortleScale);
    const cached = narrationBriefCache.get(cacheKey);
    if (cached) return cached;

    const kind = getObjectKind(obj);
    const visibility = getCelestialVisibility(obj.ra, obj.dec, observer, time);
    const coords = { alt: visibility.alt, az: visibility.az };
    const events = visibility.eventsLabel;
    const visible = coords.alt > 0;
    const azCardinal = cardinalFromAzimuth(coords.az);
    const magnitude = formatMagnitude(obj.mag);
    const observing = observingAdvice(kind, obj, coords.alt, bortleScale);
    const context = scienceContext(kind, obj);
    const title = kind === 'constellation' ? getConstellationDisplayName(obj.name) : obj.name;
    const typeLabel =
        kind === 'planet' ? 'Sistema Solar'
            : kind === 'star' ? 'Estrella'
                : kind === 'constellation' ? 'Constelacion'
                    : isDso(obj) ? obj.type.toUpperCase() : 'Objeto';

    const subtitle = `${typeLabel} | ${visibilityText(coords.alt)} | Az ${coords.az.toFixed(0)}° ${azCardinal}`;
    const tags = [
        magnitude,
        `RA ${(obj.ra / 15).toFixed(2)} h`,
        `Dec ${obj.dec >= 0 ? '+' : ''}${obj.dec.toFixed(1)}°`,
        `Bortle ${bortleScale}`,
    ];

    const message = [
        context,
        visible
            ? `Ahora esta a ${coords.alt.toFixed(1)} grados de altura, hacia ${azCardinal}; es una posicion ${coords.alt > 30 ? 'comoda' : 'exigente'} para observar.`
            : `Desde tu posicion aun no ha salido: su altura es ${coords.alt.toFixed(1)} grados.`,
        `Ventana aproximada: ${events}.`,
        observing,
    ].join(' ');

    return rememberNarrationBrief(cacheKey, {
        title,
        subtitle,
        message,
        voice: `${title}. ${message}`,
        tags,
        visible,
        observing,
        events,
    });
}

function normalizeTextForSpeech(text: string) {
    return text
        .replace(/\bal\./gi, 'años luz')
        .replace(/\bal\b/gi, 'años luz')
        .replace(/\bmag\b/gi, 'magnitud')
        .replace(/\bkm\/h\b/gi, 'kilometros por hora')
        .replace(/\bkm\b/gi, 'kilometros')
        .replace(/\bms\b/gi, 'milisegundos')
        .replace(/\bau\b/gi, 'unidades astronómicas')
        .replace(/\bua\b/gi, 'unidades astronómicas')
        .replace(/&middot;/g, 'punto')
        .replace(/&deg;/g, 'grados')
        .replace(/\bmessier\b/gi, 'Messier')
        .replace(/\bh\b/gi, 'horas');
}

function selectSpanishSpainVoice(voices: SpeechSynthesisVoice[]) {
    const hasNameToken = (voice: SpeechSynthesisVoice, tokens: string[]) => {
        const name = voice.name.toLowerCase();
        return tokens.some((token) => name.includes(token));
    };

    const esEsVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es-es'));
    const esVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));

    return (
        esEsVoices.find((voice) => hasNameToken(voice, ['elvira', 'alvaro', 'helena', 'monica', 'jorge'])) ||
        esEsVoices.find((voice) => hasNameToken(voice, ['natural', 'microsoft', 'google'])) ||
        esEsVoices[0] ||
        esVoices.find((voice) => hasNameToken(voice, ['natural', 'google'])) ||
        esVoices[0]
    );
}

export default function AIAstronoma() {
    const selected = useAppStore((s) => s.selectedObject);
    const incrementMythologyBuff = useAppStore((s) => s.incrementMythologyBuff);
    const kidsMode = useAppStore((s) => s.settings.kidsMode);
    const bortleScale = useAppStore((s) => s.settings.bortleScale);
    const sidebarOpen = useAppStore((s) => s.sidebarOpen);
    const observer = useAppStore((s) => s.observer);
    const time = useAppStore((s) => s.timeMinute);
    const targetedObject = useAppStore((s) => s.targetedObject);
    const focusedConstellation = useAppStore((s) => s.focusedConstellation);
    const globalAiMessage = useAppStore((s) => s.aiMessage);
    const setAiMessage = useAppStore((s) => s.setAiMessage);
    const solarSystemBodies = useCatalog((s) => s.solarSystemBodies);
    const supabaseLoaded = useCatalog((s) => s.supabaseLoaded);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showBubble, setShowBubble] = useState(false);
    const [message, setMessage] = useState('');
    const [brief, setBrief] = useState<NarrationBrief | null>(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [astronomerMode, setAstronomerMode] = useState<AstronomerMode>('openai');

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const lastMessageRef = useRef<string>('');
    const narratorReadyRef = useRef(false);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const currentSelection = selected || targetedObject;

    useEffect(() => {
        const openFromHeader = () => {
            setChatOpen(true);
            setShowBubble(false);
        };

        window.addEventListener('cosmos:open-ai-astronomer', openFromHeader);
        return () => window.removeEventListener('cosmos:open-ai-astronomer', openFromHeader);
    }, []);

    const objectEnrichment = useMemo<EnrichedObjectContext | null>(() => {
        if (!currentSelection) return null;

        const kind = getObjectKind(currentSelection);
        const objectId = isDso(currentSelection) ? currentSelection.id : currentSelection.name;
        const solarInfo = (kind === 'planet' || currentSelection.name === 'Luna')
            ? getSolarSystemBodyByName(currentSelection.name, solarSystemBodies)
            : undefined;

        return {
            objectId,
            objectKind: kind,
            description: solarInfo?.shortDesc || currentSelection.desc,
            longDescription: solarInfo?.longDesc,
            mythology: solarInfo?.mythology,
            observationTips: solarInfo?.observationTips,
            funFact: solarInfo?.funFact,
            catalogSource: supabaseLoaded ? 'supabase' : 'local',
        };
    }, [currentSelection, solarSystemBodies, supabaseLoaded]);

    const currentBrief = useMemo(() => {
        if (!currentSelection) return null;
        return buildNarrationBrief(currentSelection, observer, time, bortleScale);
    }, [currentSelection, observer, time, bortleScale]);

    useEffect(() => {
        synthRef.current = window.speechSynthesis;
        const loadVoices = () => {
            synthRef.current?.getVoices();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        return () => {
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { narratorReadyRef.current = true; }, 4000);
        return () => clearTimeout(timer);
    }, []);

    const speak = useCallback((text: string) => {
        if (!synthRef.current || muted) return;

        synthRef.current.cancel();
        if (synthRef.current.paused) synthRef.current.resume();

        const utterance = new SpeechSynthesisUtterance(normalizeTextForSpeech(text));
        const voices = synthRef.current.getVoices();
        // Priorizar voces "Natural" o "Google" que suenan mucho más humanas
        const spanishVoice = selectSpanishSpainVoice(voices);

        if (spanishVoice) utterance.voice = spanishVoice;
        utterance.lang = 'es-ES';
        utterance.pitch = kidsMode ? 1.1 : 1.0; 
        utterance.rate = kidsMode ? 1.0 : 0.95; // Un poco más lento para que sea más elegante

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (text.toLowerCase().includes('mitolog')) {
                incrementMythologyBuff();
            }
        };
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [incrementMythologyBuff, muted, kidsMode]);

    useEffect(() => {
        if (!chatOpen) return;
        chatEndRef.current?.scrollIntoView({ block: 'end' });
    }, [chatOpen, chatMessages, chatLoading]);

    const buildChatContext = useCallback(() => {
        const computedBrief = currentBrief ?? brief;

        return {
            objectId: objectEnrichment?.objectId,
            objectKind: objectEnrichment?.objectKind,
            objectName: computedBrief?.title,
            objectType: computedBrief?.subtitle.split('|')[0]?.trim(),
            visibility: computedBrief?.subtitle,
            magnitude: computedBrief?.tags.find((tag) => tag.includes('+') || tag.includes('-') || tag.includes('mag')),
            coordinates: computedBrief?.tags.filter((tag) => tag.startsWith('RA') || tag.startsWith('Dec')).join(' | '),
            bortleScale,
            observer,
            time: time.toISOString(),
            summary: computedBrief?.message,
            observingAdvice: computedBrief?.observing,
            visibilityWindow: computedBrief?.events,
            description: objectEnrichment?.description,
            longDescription: objectEnrichment?.longDescription,
            mythology: objectEnrichment?.mythology,
            observationTips: objectEnrichment?.observationTips,
            funFact: objectEnrichment?.funFact,
            catalogSource: objectEnrichment?.catalogSource,
            kidsMode,
        };
    }, [currentBrief, brief, objectEnrichment, bortleScale, observer, time, kidsMode]);

    const askAstronomer = useCallback(async (rawQuestion?: string) => {
        const text = (rawQuestion ?? question).trim();
        if (!text || chatLoading) return;

        setQuestion('');
        setChatError(null);
        setChatOpen(true);
        setChatMessages((prev) => [...prev, { role: 'user', text }]);
        setChatLoading(true);

        try {
            const res = await fetch('/api/astronomer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    context: buildChatContext(),
                    mode: astronomerMode,
                }),
            });
            const data = await res.json() as {
                answer?: string;
                source?: 'openai' | 'local';
                error?: string;
            };
            if (!res.ok || !data.answer) {
                throw new Error(data.error || 'No se pudo consultar la IA astronómica');
            }
            setChatMessages((prev) => [...prev, {
                role: 'assistant',
                text: data.answer ?? '',
                source: data.source,
            }]);
            setMessage(data.answer);
            setBrief(null);
            setShowBubble(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'No se pudo consultar la IA astronómica';
            setChatError(msg);
            setChatMessages((prev) => [...prev, {
                role: 'assistant',
                text: 'No he podido consultar el asistente remoto. Cambio mentalmente a modo local: puedo seguir con tecnica de observacion, magnitud y contexto basico sin gastar API.',
                source: 'local',
            }]);
        } finally {
            setChatLoading(false);
        }
    }, [question, chatLoading, buildChatContext, astronomerMode]);

    const achievements = useAppStore((s) => s.achievements);
    const prevAchievementsRef = useRef(achievements);

    useEffect(() => {
        const prev = prevAchievementsRef.current;
        let celebration = '';

        if (achievements.planetHunter && !prev.planetHunter) {
            celebration = 'Logro desbloqueado: Explorador de Planetas. Has visitado todos los mundos principales del Sistema Solar disponibles en el atlas.';
        } else if (achievements.messierMarathon > prev.messierMarathon) {
            celebration = `Nuevo objeto Messier registrado. Llevas ${achievements.messierMarathon} de 110; estas construyendo una ruta de cielo profundo muy seria.`;
        } else if (achievements.mythologyBuff > prev.mythologyBuff) {
            celebration = 'Archivo de mitologia ampliado. Las constelaciones son historia cultural proyectada sobre fisica estelar real.';
        }

        if (celebration) setAiMessage(celebration);
        prevAchievementsRef.current = achievements;
    }, [achievements, setAiMessage]);

    useEffect(() => {
        if (globalAiMessage) {
            const msg = globalAiMessage;
            setAiMessage('');
            const timer = setTimeout(() => {
                setBrief(null);
                setMessage(msg);
                setShowBubble(true);
                speak(msg);
                lastMessageRef.current = '';
            }, 0);
            const hideTimer = setTimeout(() => setShowBubble(false), Math.max(8000, (msg.length / 15) * 1000));
            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        }

        if (!narratorReadyRef.current) return;

        let nextMessage = '';
        let nextBrief: NarrationBrief | null = null;

        if (currentSelection && !muted) {
            if (kidsMode && currentBrief) {
                nextBrief = currentBrief;
                nextMessage = buildKidNarration(currentSelection, currentBrief, objectEnrichment);
            } else if (currentBrief) {
                nextBrief = currentBrief;
                nextMessage = nextBrief.voice;
            }
        } else if (focusedConstellation && !muted) {
            const name = getConstellationDisplayName(focusedConstellation);
            const kidFact = kidsMode ? getKidFact(focusedConstellation, false, false) : null;
            nextMessage = kidFact
                ? `Mira esa figura: es la constelacion de ${name}. ${kidFact}`
                : `Constelación de ${name}. No es un objeto físico único: es una región aparente del cielo, útil para orientarse y saltar a objetos profundos cercanos.`;
        }

        if (nextMessage && nextMessage !== lastMessageRef.current) {
            lastMessageRef.current = nextMessage;
            const timer = setTimeout(() => {
                setBrief(nextBrief);
                setMessage(nextBrief ? nextBrief.message : nextMessage);
                setShowBubble(true);
                speak(nextMessage);
            }, 800);
            return () => clearTimeout(timer);
        }

        if (!nextMessage && lastMessageRef.current) {
            const timer = setTimeout(() => {
                setShowBubble(false);
                setBrief(null);
                lastMessageRef.current = '';
                synthRef.current?.cancel();
                setIsSpeaking(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [
        selected,
        targetedObject,
        focusedConstellation,
        muted,
        speak,
        kidsMode,
        globalAiMessage,
        setAiMessage,
        currentSelection,
        currentBrief,
        objectEnrichment,
    ]);

    return (
        <div className={cn(
            'fixed z-[60] flex flex-col items-end gap-3 pointer-events-none',
            'md:bottom-24 md:right-6',
            sidebarOpen && !chatOpen ? 'hidden md:flex' : 'bottom-24 right-4'
        )}>
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        className="pointer-events-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-cyan-400/20 bg-black/90 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
                    >
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                    Consulta Astronomica
                                </div>
                                <div className="truncate font-mono text-[9px] text-white/35">
                                    {brief?.title || selected?.name || targetedObject?.name || 'Contexto del cielo actual'}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                                {(['openai', 'local'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setAstronomerMode(mode)}
                                        className={cn(
                                            'rounded-full px-2 py-1 text-[8px] font-bold uppercase tracking-widest transition-colors',
                                            astronomerMode === mode
                                                ? 'bg-cyan-400/18 text-cyan-100'
                                                : 'text-white/30 hover:text-white/60'
                                        )}
                                        {...(astronomerMode === mode ? { 'aria-pressed': true } : { 'aria-pressed': false })}
                                    >
                                        {mode === 'openai' ? 'IA real' : 'Local'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/35 hover:bg-white/10 hover:text-white/70"
                                aria-label="Cerrar consulta astronómica"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>

                        <div className="mb-3 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
                            {chatMessages.length === 0 && (
                                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-relaxed text-white/55">
                                    {astronomerMode === 'openai'
                                        ? 'Modo IA real: razonamiento remoto con el contexto actual del cielo, más rico y flexible.'
                                        : 'Modo local: respuestas instantaneas sin gastar API, utiles si hay limite, cortes o quieres ahorrar credito.'}
                                </div>
                            )}
                            {chatMessages.map((item, idx) => (
                                <div
                                    key={`${item.role}-${idx}`}
                                    className={cn(
                                        'rounded-xl px-3 py-2 text-[11px] leading-relaxed',
                                        item.role === 'user'
                                            ? 'ml-8 bg-cyan-600/18 text-cyan-50 border border-cyan-500/20'
                                            : 'mr-8 bg-white/[0.05] text-white/78 border border-white/10'
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{item.text}</p>
                                    {item.role === 'assistant' && item.source && (
                                        <div className="mt-2 border-t border-white/5 pt-1.5 font-mono text-[8px] uppercase tracking-widest text-white/25">
                                            {item.source === 'openai' ? 'Respuesta IA' : 'Respuesta local'}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div className="mr-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] text-white/50">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                                    Analizando contexto astronomico...
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {(kidsMode ? KIDS_QUICK_QUESTIONS : QUICK_QUESTIONS).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => { void askAstronomer(item); }}
                                    disabled={chatLoading}
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white/45 transition-colors hover:border-cyan-400/30 hover:text-cyan-200 disabled:opacity-50"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void askAstronomer();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                maxLength={600}
                                placeholder={kidsMode ? 'Pregunta como si tuvieras entre 8 y 14...' : 'Pregunta sobre el objeto o la observacion...'}
                                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] text-white/80 outline-none placeholder:text-white/25 focus:border-cyan-400/35"
                            />
                            <button
                                type="submit"
                                disabled={chatLoading || question.trim().length < 2}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 transition-colors hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label="Enviar pregunta"
                            >
                                {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </form>
                        {chatError && (
                            <div className="mt-2 text-[9px] text-red-300/70">{chatError}</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showBubble && message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        onClick={() => {
                            setShowBubble(false);
                            setAiMessage('');
                            synthRef.current?.cancel();
                            setIsSpeaking(false);
                        }}
                        className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] cursor-pointer rounded-2xl rounded-br-none border border-cyan-500/30 bg-black/85 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] glass-blur transition-transform active:scale-95"
                    >
                        <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                            <div className="flex-1">
                                <span className="block text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                                    Asistente Astronomico
                                </span>
                                {brief && (
                                    <span className="mt-1 block truncate font-mono text-[9px] text-white/35">
                                        {brief.subtitle}
                                    </span>
                                )}
                            </div>
                        </div>

                        {brief && (
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                <BriefMetric
                                    icon={<Eye className="h-3 w-3" />}
                                    label="Visibilidad"
                                    value={brief.visible ? 'Visible' : 'No visible'}
                                    tone={brief.visible ? 'good' : 'bad'}
                                />
                                <BriefMetric
                                    icon={<Gauge className="h-3 w-3" />}
                                    label="Lectura"
                                    value={brief.title}
                                />
                                <div className="col-span-2">
                                    <BriefMetric
                                        icon={<Clock className="h-3 w-3" />}
                                        label="Ventana"
                                        value={brief.events}
                                    />
                                </div>
                            </div>
                        )}

                        <p className="text-[12px] leading-relaxed text-white/82">
                            {message}
                        </p>

                        {brief && (
                            <>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {brief.tags.map((tag) => (
                                        <span key={tag} className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] text-white/50">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-3 flex gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/10 px-3 py-2">
                                    <Telescope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
                                    <p className="text-[10px] leading-relaxed text-cyan-50/65">{brief.observing}</p>
                                </div>
                            </>
                        )}

                        <div className="mt-2 flex justify-end border-t border-white/5 pt-2">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Cerrar</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pointer-events-auto relative hidden md:block">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        if (isSpeaking) {
                            synthRef.current?.cancel();
                            setIsSpeaking(false);
                        } else if (!chatOpen) {
                            setChatOpen(true);
                        } else if (brief) {
                            speak(brief.voice);
                        } else if (message) {
                            speak(message);
                        }
                        setMuted(false);
                    }}
                    className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-500',
                        isSpeaking
                            ? 'border-blue-400 bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.6)]'
                            : 'border-white/10 bg-black/40 backdrop-blur-md hover:border-blue-500/50'
                    )}
                    aria-label={isSpeaking ? 'Detener narración' : 'Repetir narración astronómica'}
                >
                    {isSpeaking ? (
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [8, 20, 8] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    className="w-1 rounded-full bg-white"
                                />
                            ))}
                        </div>
                    ) : (
                        <MessageSquare className="h-6 w-6 text-white/40" />
                    )}
                </motion.button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setMuted(!muted);
                        if (!muted) synthRef.current?.cancel();
                    }}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black hover:bg-white/10"
                    aria-label={muted ? 'Activar voz' : 'Silenciar voz'}
                >
                    {muted ? <VolumeX className="h-3 w-3 text-red-400" /> : <Volume2 className="h-3 w-3 text-white/50" />}
                </button>
            </div>
        </div>
    );
}

function BriefMetric({
    icon,
    label,
    value,
    tone = 'neutral',
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: 'good' | 'bad' | 'neutral';
}) {
    return (
        <div className={cn(
            'rounded-lg border px-2.5 py-2',
            tone === 'good' && 'border-emerald-400/20 bg-emerald-400/10',
            tone === 'bad' && 'border-red-400/20 bg-red-400/10',
            tone === 'neutral' && 'border-white/10 bg-white/5'
        )}>
            <div className="mb-1 flex items-center gap-1.5 text-white/35">
                {icon}
                <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-[11px] font-bold leading-snug text-white/80">{value}</div>
        </div>
    );
}
