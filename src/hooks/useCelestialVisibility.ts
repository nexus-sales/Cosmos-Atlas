'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { equToHor } from '@/lib/astronomy/transforms';

export function useCelestialVisibility(ra: number, dec: number) {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);

    const coords = useMemo(() => {
        return equToHor(ra, dec, observer.lat, observer.lon, time);
    }, [ra, dec, observer, time]);

    return coords;
}
