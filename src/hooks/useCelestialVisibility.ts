'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getCelestialVisibility } from '@/lib/astronomy/celestialVisibility';

export function useCelestialVisibility(ra: number, dec: number) {
    const time = useAppStore((state) => state.timeMinute);
    const observer = useAppStore((state) => state.observer);

    const coords = useMemo(() => {
        return getCelestialVisibility(ra, dec, observer, time);
    }, [ra, dec, observer, time]);

    return coords;
}
