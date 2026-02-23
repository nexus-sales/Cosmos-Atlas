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
    };
    toggleSetting: (key: keyof AppState['settings']) => void;
    foundChallenges: string[];
    addFoundChallenge: (name: string) => void;
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
    },
    toggleSetting: (key) =>
        set((state) => ({
            settings: { ...state.settings, [key]: !state.settings[key] },
        })),
    foundChallenges: [],
    addFoundChallenge: (name) =>
        set((state) => ({
            foundChallenges: state.foundChallenges.includes(name)
                ? state.foundChallenges
                : [...state.foundChallenges, name],
        })),
}));
