import { create } from 'zustand';
import { Star, DSO, Observer, Planet } from '../types/celestial';

interface AppState {
    observer: Observer;
    setObserver: (observer: Observer) => void;
    selectedObject: Star | DSO | Planet | null;
    setSelectedObject: (obj: Star | DSO | Planet | null) => void;
    targetedObject: Star | DSO | Planet | null;
    setTargetedObject: (obj: Star | DSO | Planet | null) => void;
    time: Date;
    setTime: (date: Date) => void;
    isLive: boolean;
    setIsLive: (v: boolean) => void;
    settings: {
        showConstellations: boolean;
        showGrid: boolean;
        showMilkyWay: boolean;
        showEcliptic: boolean;
        nightMode: boolean;
        bortleScale: number; // 1 to 9
        showFOV: boolean;
        showSatellites: boolean;
        showStarlink: boolean;
        focalLength: number;
        sensorWidth: number;
        sensorHeight: number;
        audioEnabled: boolean;
        audioVolume: number;
        telescopeMode: boolean;
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
    followOrientation: boolean;
    setFollowOrientation: (v: boolean) => void;
    focusedConstellation: string | null;
    setFocusedConstellation: (name: string | null) => void;

    // God Mode: Flight System
    viewMode: 'observatory' | 'orbital';
    setViewMode: (mode: 'observatory' | 'orbital') => void;
    flightTarget: string | null;
    startFlight: (targetName: string) => void;
    endFlight: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    observer: { lat: 28.3, lon: -16.3 }, // Default Tenerife
    setObserver: (observer) => set({ observer }),
    selectedObject: null,
    setSelectedObject: (obj) => set({ selectedObject: obj }),
    targetedObject: null,
    setTargetedObject: (obj) => set({ targetedObject: obj }),
    time: new Date(),
    setTime: (time) => set({ time }),
    isLive: true,
    setIsLive: (isLive) => set({ isLive }),
    settings: {
        showConstellations: true,
        showGrid: true,
        showMilkyWay: false,
        showEcliptic: false,
        nightMode: false,
        bortleScale: 4,
        showFOV: false,
        showSatellites: true,
        showStarlink: false,
        focalLength: 1000,
        sensorWidth: 36, // Full Frame
        sensorHeight: 24,
        audioEnabled: false,
        audioVolume: 0.5,
        telescopeMode: false,
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
    focusedConstellation: null,
    setFocusedConstellation: (focusedConstellation) => set({ focusedConstellation }),
    
    // God Mode: Flight System
    viewMode: 'observatory',
    setViewMode: (mode: 'observatory' | 'orbital') => set({ viewMode: mode }),
    flightTarget: null,
    startFlight: (targetName) => set({ flightTarget: targetName, viewMode: 'orbital' }),
    endFlight: () => set({ flightTarget: null, viewMode: 'observatory' }),
}));
