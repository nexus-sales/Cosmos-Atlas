'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        if (process.env.NODE_ENV === 'development') {
            // Un SW de producción puede seguir controlando localhost y ocultar HMR.
            void navigator.serviceWorker.getRegistrations()
                .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
                .then(() => ('caches' in window ? caches.keys() : []))
                .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                .catch(() => undefined);
            return;
        }

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .catch(() => {
                // SW registration failed silently — app still works online
            });
    }, []);

    return null;
}
