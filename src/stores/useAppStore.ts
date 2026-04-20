import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Star, DSO, Observer, Planet } from '../types/celestial';

interface AppState {
    observer: Observer;
    setObserver: (observer: Observer) => void;
    geolocation: {
        status: 'idle' | 'granted' | 'denied' | 'error';
        source: 'gps' | 'fallback';
        accuracyM: number | null;
        message: string | null;
        updatedAt: number | null;
    };
    setGeolocation: (patch: Partial<AppState['geolocation']>) => void;
    arHealthHistory: Array<{
        timestamp: number;
        success: boolean;
        jitterDeg: number;
        stableRatio: number;
    }>;
    addArHealthSample: (sample: { timestamp: number; success: boolean; jitterDeg: number; stableRatio: number }) => void;
    clearArHealthHistory: () => void;
    selectedObject: Star | DSO | Planet | null;
    setSelectedObject: (obj: Star | DSO | Planet | null) => void;
    targetedObject: Star | DSO | Planet | null;
    setTargetedObject: (obj: Star | DSO | Planet | null) => void;
    time: Date;
    /** Igual que `time` pero solo cambia cuando cambia el MINUTO.
     *  Usar en componentes 3D (Planets, Comets...) para evitar re-renders cada segundo. */
    timeMinute: Date;
    setTime: (date: Date) => void;
    isLive: boolean;
    setIsLive: (v: boolean) => void;
    settings: {
        showConstellations: boolean;
        showConstellationArt: boolean;
        showGrid: boolean;
        showMilkyWay: boolean;
        showEcliptic: boolean;
        nightMode: boolean;
        bortleScale: number;
        showFOV: boolean;
        showSatellites: boolean;
        showStarlink: boolean;
        showDiagnostics: boolean;
        focalLength: number;
        sensorWidth: number;
        sensorHeight: number;
        telescopeMode: boolean;
        followTarget: boolean;
        kidsMode: boolean;
    };
    toggleSetting: (key: keyof AppState['settings']) => void;
    setBortleScale: (scale: number) => void;
    setFOVParams: (params: Partial<{ focalLength: number; sensorWidth: number; sensorHeight: number }>) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (v: boolean) => void;
    foundChallenges: string[];
    addFoundChallenge: (name: string) => void;
    camFov: number;
    setCamFov: (v: number) => void;
    satelliteInfo: {
        loadedSpecial: number;
        loadedStarlink: number;
        visibleSpecial: number;
        visibleStarlink: number;
        starlinkStatus: 'idle' | 'loading' | 'ok' | 'error';
    };
    setSatelliteInfo: (patch: Partial<AppState['satelliteInfo']>) => void;
    viewMode: 'vault' | 'camera';
    setViewMode: (mode: 'vault' | 'camera') => void;
    followOrientation: boolean;
    setFollowOrientation: (v: boolean) => void;
    compassCalibrationOffset: number;
    setCompassCalibrationOffset: (v: number) => void;
    zeroCompassCalibrationOffset: () => void;
    focusedConstellation: string | null;
    setFocusedConstellation: (name: string | null) => void;
    simbadObjects: Star[];
    addSimbadObject: (obj: Star) => void;
    clearSimbadObjects: () => void;
    /** Tier de rendimiento detectado al inicio: high/medium/low.
     *  No persiste — se detecta en cada sesión. */
    deviceQuality: 'high' | 'medium' | 'low';
    setDeviceQuality: (q: 'high' | 'medium' | 'low') => void;
    /** true si el usuario ya completó (o saltó) el onboarding */
    hasSeenOnboarding: boolean;
    setHasSeenOnboarding: (v: boolean) => void;
    isTourActive: boolean;
    setIsTourActive: (v: boolean) => void;
    // --- STELLAR PASSPORT ---
    favorites: string[];
    visited: string[];
    achievements: {
        messierMarathon: number;
        planetHunter: boolean;
        mythologyBuff: number;
    };
    renderErrors: Array<{
        label: string;
        message: string;
        timestamp: number;
    }>;
    toggleFavorite: (id: string) => void;
    markAsVisited: (id: string) => void;
    updateAchievement: (key: 'messierMarathon' | 'planetHunter' | 'mythologyBuff', value: number | boolean) => void;
    incrementMythologyBuff: () => void;
    reportRenderError: (label: string, message: string) => void;
    clearRenderErrors: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            observer: { lat: 28.3, lon: -16.3 },
            setObserver: (observer) => set({ observer }),
            geolocation: {
                status: 'idle',
                source: 'fallback',
                accuracyM: null,
                message: null,
                updatedAt: null,
            },
            setGeolocation: (patch) =>
                set((state) => ({
                    geolocation: { ...state.geolocation, ...patch },
                })),
            arHealthHistory: [],
            addArHealthSample: (sample) =>
                set((state) => ({
                    arHealthHistory: [sample, ...state.arHealthHistory].slice(0, 5),
                })),
            clearArHealthHistory: () => set({ arHealthHistory: [] }),
            selectedObject: null,
            setSelectedObject: (obj) => set({ selectedObject: obj }),
            targetedObject: null,
            setTargetedObject: (obj) => set((state) => ({
                targetedObject: obj,
                // Si seleccionamos un objetivo desde la guía/busqueda, desactivamos el seguimiento de brújula
                // para que la cámara pueda "volar" hacia el objeto automáticamente.
                followOrientation: obj ? false : state.followOrientation
            })),
            time: new Date(),
            timeMinute: new Date(),
            setTime: (time) => set((state) => {
                const prevMin = Math.floor(state.time.getTime() / 60000);
                const newMin  = Math.floor(time.getTime() / 60000);
                const timeMinute = prevMin === newMin ? state.timeMinute : new Date(newMin * 60000);
                return { time, timeMinute };
            }),
            isLive: true,
            setIsLive: (isLive) => set({ isLive }),
            viewMode: 'vault',
            setViewMode: (viewMode) => set((state) => {
                if (viewMode === 'camera') {
                    return {
                        viewMode,
                        camFov: 15,
                        settings: { ...state.settings, telescopeMode: true, showFOV: true }
                    };
                } else {
                    return {
                        viewMode,
                        camFov: 60,
                        settings: { ...state.settings, telescopeMode: false, showFOV: false }
                    };
                }
            }),
            settings: {
                showConstellations: true,
                showConstellationArt: false,
                showGrid: false,
                showMilkyWay: true,
                showEcliptic: false,
                nightMode: false,
                bortleScale: 4,
                showFOV: false,
                showSatellites: true,
                showStarlink: false,
                showDiagnostics: false,
                focalLength: 1000,
                sensorWidth: 36,
                sensorHeight: 24,
                telescopeMode: false,
                followTarget: true,
                kidsMode: false,
            },
            toggleSetting: (key) =>
                set((state) => ({
                    settings: { ...state.settings, [key]: !state.settings[key] },
                })),
            setBortleScale: (bortleScale) =>
                set((state) => ({
                    settings: { ...state.settings, bortleScale },
                })),
            setFOVParams: (params) =>
                set((state) => ({
                    settings: { ...state.settings, ...params },
                })),
            sidebarOpen: true,
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
            foundChallenges: [],
            addFoundChallenge: (name) =>
                set((state) => ({
                    foundChallenges: state.foundChallenges.includes(name)
                        ? state.foundChallenges
                        : [...state.foundChallenges, name],
                })),
            camFov: 60,
            setCamFov: (camFov) => set({ camFov }),
            satelliteInfo: {
                loadedSpecial: 0,
                loadedStarlink: 0,
                visibleSpecial: 0,
                visibleStarlink: 0,
                starlinkStatus: 'idle',
            },
            setSatelliteInfo: (patch) =>
                set((state) => ({
                    satelliteInfo: { ...state.satelliteInfo, ...patch },
                })),
            followOrientation: false,
            setFollowOrientation: (followOrientation) => set({ followOrientation }),
            compassCalibrationOffset: 0,
            setCompassCalibrationOffset: (compassCalibrationOffset) => set({
                compassCalibrationOffset: ((compassCalibrationOffset % 360) + 360) % 360,
            }),
            zeroCompassCalibrationOffset: () => set({ compassCalibrationOffset: 0 }),
            focusedConstellation: null,
            setFocusedConstellation: (focusedConstellation) => set({ focusedConstellation }),
            simbadObjects: [],
            addSimbadObject: (obj) => set((state) => ({
                simbadObjects: state.simbadObjects.some(s => s.name === obj.name)
                    ? state.simbadObjects
                    : [...state.simbadObjects, obj]
            })),
            clearSimbadObjects: () => set({ simbadObjects: [] }),
            deviceQuality: 'high',
            setDeviceQuality: (deviceQuality) => set({ deviceQuality }),
            hasSeenOnboarding: false,
            setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
            isTourActive: false,
            setIsTourActive: (isTourActive) => set({ isTourActive }),

            // --- PASSPORT ACTIONS ---
            favorites: [],
            visited: [],
            achievements: {
                messierMarathon: 0,
                planetHunter: false,
                mythologyBuff: 0,
            },
            renderErrors: [],
            toggleFavorite: (id) => set((s) => ({
                favorites: s.favorites.includes(id) 
                    ? s.favorites.filter(x => x !== id) 
                    : [...s.favorites, id]
            })),
            markAsVisited: (id) => set((s) => {
                const nextVisited = s.visited.includes(id) ? s.visited : [...s.visited, id];
                
                // --- Logro: Explorador de Planetas ---
                const planets = ['Mercurio', 'Venus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno', 'Luna'];
                const visitedPlanets = planets.filter(p => nextVisited.includes(p));
                const planetHunter = visitedPlanets.length >= 8;

                // --- Logro: Maratón Messier ---
                // Si el ID empieza por 'M' y tiene un número después, es un Messier.
                const messierCount = nextVisited.filter(v => /^M\d+/.test(v)).length;

                return { 
                    visited: nextVisited,
                    achievements: {
                        ...s.achievements,
                        planetHunter: planetHunter || s.achievements.planetHunter,
                        messierMarathon: messierCount
                    }
                };
            }),
            updateAchievement: (key, value) => set((s) => ({
                achievements: { ...s.achievements, [key]: value }
            })),
            incrementMythologyBuff: () => set((s) => ({
                achievements: {
                    ...s.achievements,
                    mythologyBuff: s.achievements.mythologyBuff + 1,
                }
            })),
            reportRenderError: (label, message) =>
                set((s) => {
                    const next = [{ label, message, timestamp: Date.now() }, ...s.renderErrors]
                        .filter((item, idx, arr) => idx === arr.findIndex((x) => x.label === item.label))
                        .slice(0, 3);
                    return { renderErrors: next };
                }),
            clearRenderErrors: () => set({ renderErrors: [] }),
        }),
        {
            name: 'cosmos-atlas-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                settings: state.settings,
                observer: state.observer,
                geolocation: state.geolocation,
                arHealthHistory: state.arHealthHistory,
                compassCalibrationOffset: state.compassCalibrationOffset,
                foundChallenges: state.foundChallenges,
                hasSeenOnboarding: state.hasSeenOnboarding,
                favorites: state.favorites,
                visited: state.visited,
                achievements: state.achievements,
                // deviceQuality excluido — se detecta en cada sesión
            }),
        }
    )
);
