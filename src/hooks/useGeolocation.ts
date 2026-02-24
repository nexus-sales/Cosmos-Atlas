'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useGeolocation() {
    const [error, setError] = useState<string | null>(null);
    const setObserver = useAppStore((state) => state.setObserver);

    useEffect(() => {
        if (!navigator.geolocation) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setObserver({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                });
            },
            (err) => {
                setError(err.message);
                // Fallback already set in store (Tenerife)
            }
        );
    }, [setObserver]);

    return { error };
}
