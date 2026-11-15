import { create } from 'zustand';

// Pasos reales del arranque. La portada (BootScreen) se retira cuando todos
// están hechos; cada componente marca el suyo al terminar de verdad.
export type BootStep = 'catalog' | 'stars' | 'scene';

export const BOOT_STEPS: ReadonlyArray<{ id: BootStep; label: string }> = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'stars', label: 'Estrellas' },
    { id: 'scene', label: 'Bóveda celeste' },
];

interface BootState {
    done: Record<BootStep, boolean>;
    markDone: (step: BootStep) => void;
}

export const useBootStore = create<BootState>((set) => ({
    done: { catalog: false, stars: false, scene: false },
    markDone: (step) => set((state) => (state.done[step] ? state : { done: { ...state.done, [step]: true } })),
}));

export const isBootComplete = (done: Record<BootStep, boolean>) => BOOT_STEPS.every((step) => done[step.id]);
