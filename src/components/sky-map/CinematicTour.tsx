'use client';

/**
 * CinematicTour — automated sky tour
 *
 * Cycles through a curated list of notable celestial objects, pointing the
 * camera at each one for DWELL_SEC seconds before moving to the next.
 * The flight between objects uses the Bézier arc in CameraNavigator.
 *
 * Activation: isTourActive in the store.
 * Deactivation: any user drag, or clicking the Tour button again.
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import type { DSO, Star } from '@/types/celestial';

const DWELL_SEC = 7; // seconds to dwell at each target

// Curated tour stops — mix of DSOs, stars, and nebulae
const TOUR_OBJECTS: Array<DSO | Star> = [
    // Orion Nebula
    { id: 'M42', name: 'Nebulosa de Orión', ra: 83.82, dec: -5.39, type: 'nebula', mag: 4.0, desc: 'Gran vivero estelar en la espada de Orión. 1344 al.', color: '#88ffcc', sizeArcmin: 60, kind: 'dso' },
    // Andromeda Galaxy
    { id: 'M31', name: 'Galaxia de Andrómeda', ra: 10.68, dec: 41.27, type: 'galaxy', mag: 3.4, desc: 'La gran espiral vecina. 2.5 millones de años luz.', color: '#ffcc88', sizeArcmin: 190, kind: 'dso' },
    // Pleiades
    { id: 'M45', name: 'Pléyades', ra: 56.75, dec: 24.11, type: 'cluster', mag: 1.6, desc: 'Las Siete Hermanas. Cúmulo abierto en Tauro.', color: '#aaccff', sizeArcmin: 110, kind: 'dso' },
    // Hercules Cluster
    { id: 'M13', name: 'Cúmulo de Hércules', ra: 250.42, dec: 36.46, type: 'cluster', mag: 5.8, desc: '300 000 estrellas en un globular del norte.', color: '#ffffaa', sizeArcmin: 20, kind: 'dso' },
    // Whirlpool Galaxy
    { id: 'M51', name: 'Galaxia del Remolino', ra: 202.47, dec: 47.20, type: 'galaxy', mag: 8.4, desc: 'Espiral interactuando con NGC 5195.', color: '#ffbb88', sizeArcmin: 11, kind: 'dso' },
    // Ring Nebula
    { id: 'M57', name: 'Nebulosa del Anillo', ra: 283.40, dec: 33.03, type: 'nebula', mag: 8.8, desc: 'Nebulosa planetaria icónica en Lyra.', color: '#88ffcc', sizeArcmin: 1.5, kind: 'dso' },
    // Omega Centauri (always visible from south)
    { id: 'NGC5139', name: 'Omega Centauri', ra: 201.70, dec: -47.48, type: 'cluster', mag: 3.9, desc: 'El globular más grande de la Vía Láctea.', color: '#ffffaa', sizeArcmin: 55, kind: 'dso' },
    // Sombrero Galaxy
    { id: 'M104', name: 'Galaxia Sombrero', ra: 189.99, dec: -11.62, type: 'galaxy', mag: 8.0, desc: 'Famosa banda de polvo y brillante núcleo.', color: '#ffcc88', sizeArcmin: 9, kind: 'dso' },
    // Lagoon Nebula
    { id: 'M8', name: 'Nebulosa de la Laguna', ra: 270.92, dec: -24.38, type: 'nebula', mag: 6.0, desc: 'Enorme región HII en Sagitario.', color: '#ff88aa', sizeArcmin: 90, kind: 'dso' },
    // Sirius
    {
        name: 'Sirius', ra: 101.29, dec: -16.72, mag: -1.46,
        constellation: 'Canis Major',
        desc: 'La estrella más brillante del cielo nocturno. 8.6 al.',
        color: '#cceeff', baseSize: 6, kind: 'star' as const
    },
];

export default function CinematicTour() {
    const isTourActive   = useAppStore((s) => s.isTourActive);
    const setIsTourActive = useAppStore((s) => s.setIsTourActive);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);
    const setSelectedObject = useAppStore((s) => s.setSelectedObject);

    const indexRef   = useRef(0);
    const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!isTourActive) {
            // Stop tour
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            startedRef.current = false;
            return;
        }

        // Start tour from the beginning
        indexRef.current = 0;
        startedRef.current = true;

        const visitNext = () => {
            if (!startedRef.current) return;
            const obj = TOUR_OBJECTS[indexRef.current % TOUR_OBJECTS.length];
            setTargetedObject(obj);
            setSelectedObject(obj);
            indexRef.current++;
        };

        // Visit first object immediately
        visitNext();

        // Then advance every DWELL_SEC seconds
        timerRef.current = setInterval(visitNext, DWELL_SEC * 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [isTourActive, setTargetedObject, setSelectedObject]);

    // Cancel tour on any user drag (OrbitControls fires onStart → setTargetedObject(null))
    useEffect(() => {
        const unsub = useAppStore.subscribe((state) => {
            // If targetedObject becomes null while tour is active → user cancelled
            if (state.targetedObject === null && startedRef.current) {
                setIsTourActive(false);
            }
        });
        return unsub;
    }, [setIsTourActive]);

    return null;
}
