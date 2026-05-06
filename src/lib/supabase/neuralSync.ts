import { supabase } from '../supabase';
import { useAppStore } from '@/stores/useAppStore';

/**
 * NeuralSync: El motor de persistencia inteligente de la Fase 3.
 * Sincroniza el estado local de Zustand con Supabase de forma asíncrona.
 */

const GUEST_ID_KEY = 'cosmos_atlas_neural_id';

function getOrCreateGuestId() {
    if (typeof window === 'undefined') return null;
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
        id = `guest_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
}

export async function syncPassportToCloud() {
    if (!supabase) return;

    const guestId = getOrCreateGuestId();
    if (!guestId) return;

    const { favorites, visited, achievements, settings } = useAppStore.getState();

    try {
        // En Modo Diablo, usamos una sola tabla de perfiles para todo el estado persistente
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: guestId,
                favorites,
                visited,
                achievements,
                settings,
                last_uplink: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) throw error;
        // console.log('Neural Uplink Successful'); // Silent success for immersion
    } catch (err: any) {
        // Fallback elegante si la tabla no existe o no hay conexión
        const errorMsg = err?.message || err?.details || 'Schema missing or connection failed';
        console.warn(`[Neural Uplink] Modo Local: ${errorMsg}. Asegúrate de crear la tabla 'profiles' en Supabase.`);
    }
}

/**
 * Hook para inicializar la sincronización automática
 */
export function useNeuralUplink() {
    // Escuchar cambios en el store y sincronizar (debounced)
    // Esto se podría llamar desde un componente raíz
}
