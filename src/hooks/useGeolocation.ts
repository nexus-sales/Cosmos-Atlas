'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useGeolocation() {
    const [error, setError] = useState<string | null>(null);
    const watcherIdRef = useRef<number | null>(null);
    const setObserver = useAppStore((state) => state.setObserver);
    const setGeolocation = useAppStore((state) => state.setGeolocation);

    const stopWatching = useCallback(() => {
        if (watcherIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watcherIdRef.current);
            watcherIdRef.current = null;
        }
    }, []);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            setGeolocation({
                status: 'error',
                source: 'fallback',
                message: 'Geolocation not supported',
            });
            return;
        }

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
        };

        stopWatching();
        setGeolocation({
            status: 'idle',
            source: 'fallback',
            message: 'Solicitando ubicacion precisa',
        });

        navigator.geolocation.getCurrentPosition(success, failure, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 30000,
        });

        watcherIdRef.current = navigator.geolocation.watchPosition(success, failure, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 45000,
        });
    }, [setGeolocation, setObserver, stopWatching]);

    useEffect(() => {
        if (!navigator.geolocation) {
            const timer = setTimeout(() => {
                setError('Geolocation not supported');
                setGeolocation({
                    status: 'error',
                    source: 'fallback',
                    message: 'Geolocation not supported',
                });
            }, 0);
            return () => clearTimeout(timer);
        }

        if (!navigator.permissions?.query) {
            const timer = setTimeout(() => {
                setGeolocation({
                    status: 'idle',
                    source: 'fallback',
                    message: 'Ubicacion precisa disponible bajo solicitud',
                });
            }, 0);
            return () => clearTimeout(timer);
        }

        let mounted = true;
        navigator.permissions
            .query({ name: 'geolocation' })
            .then((result) => {
                if (!mounted) return;

                if (result.state === 'granted') {
                    requestLocation();
                } else if (result.state === 'denied') {
                    setGeolocation({
                        status: 'denied',
                        source: 'fallback',
                        message: 'Permiso de ubicacion denegado',
                    });
                } else {
                    setGeolocation({
                        status: 'idle',
                        source: 'fallback',
                        message: 'Pulsa activar GPS para alinear el cielo real',
                    });
                }
            })
            .catch(() => {
                setGeolocation({
                    status: 'idle',
                    source: 'fallback',
                    message: 'Ubicacion precisa disponible bajo solicitud',
                });
            });

        return () => {
            mounted = false;
            stopWatching();
        };
    }, [requestLocation, setGeolocation, stopWatching]);

    return { error, requestLocation };
}
