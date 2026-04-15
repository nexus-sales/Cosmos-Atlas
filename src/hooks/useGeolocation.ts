'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useGeolocation() {
    const [error, setError] = useState<string | null>(null);
    const setObserver = useAppStore((state) => state.setObserver);
    const setGeolocation = useAppStore((state) => state.setGeolocation);

    useEffect(() => {
        if (!navigator.geolocation) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError('Geolocation not supported');
            setGeolocation({
                status: 'error',
                source: 'fallback',
                message: 'Geolocation not supported',
            });
            return;
        }

        let watcherId: number | null = null;

        const success = (pos: GeolocationPosition) => {
            setObserver({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
            });
            setGeolocation({
                status: 'granted',
                source: 'gps',
                accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
                message: null,
                updatedAt: pos.timestamp,
            });
            setError(null);
        };

        const failure = (err: GeolocationPositionError) => {
            setError(err.message);
            setGeolocation({
                status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
                source: 'fallback',
                message: err.message,
            });
            // Fallback already set in store (Tenerife)
        };

        // Primer fix rápido de posición.
        navigator.geolocation.getCurrentPosition(
            success,
            failure,
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 30000,
            }
        );

        // Seguimiento para mantener el cielo real si el usuario se mueve.
        watcherId = navigator.geolocation.watchPosition(
            success,
            failure,
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 45000,
            }
        );

        return () => {
            if (watcherId !== null) {
                navigator.geolocation.clearWatch(watcherId);
            }
        };
    }, [setObserver, setGeolocation]);

    useEffect(() => {
        if (!navigator.permissions?.query) return;

        let mounted = true;
        navigator.permissions
            .query({ name: 'geolocation' })
            .then((result) => {
                if (!mounted) return;
                if (result.state === 'denied') {
                    setGeolocation({
                        status: 'denied',
                        source: 'fallback',
                        message: 'Permiso de ubicación denegado',
                    });
                }
            })
            .catch(() => {
                // Silencioso: permisos no soportados en algunos navegadores
            });

        return () => {
            mounted = false;
        };
    }, [setGeolocation]);

    return { error };
}
