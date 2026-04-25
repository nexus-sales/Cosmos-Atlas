import { equToHor } from '@/lib/astronomy/transforms';
import { calculateVisibilityEvents, formatVisibilityEvents, type VisibilityEvents } from '@/lib/astronomy/visibilityEvents';

const CELESTIAL_VISIBILITY_CACHE_LIMIT = 128;

interface ObserverLike {
    lat: number;
    lon: number;
}

interface CachedCelestialVisibility {
    alt: number;
    az: number;
    events: VisibilityEvents;
    eventsLabel: string;
}

const celestialVisibilityCache = new Map<string, CachedCelestialVisibility>();

function buildCelestialVisibilityKey(
    ra: number,
    dec: number,
    observer: ObserverLike,
    time: Date,
) {
    return [
        ra.toFixed(4),
        dec.toFixed(4),
        observer.lat.toFixed(3),
        observer.lon.toFixed(3),
        time.getTime(),
    ].join(':');
}

function rememberCelestialVisibility(key: string, value: CachedCelestialVisibility) {
    celestialVisibilityCache.delete(key);
    celestialVisibilityCache.set(key, value);

    if (celestialVisibilityCache.size > CELESTIAL_VISIBILITY_CACHE_LIMIT) {
        const oldestKey = celestialVisibilityCache.keys().next().value;
        if (oldestKey) celestialVisibilityCache.delete(oldestKey);
    }

    return value;
}

export function getCelestialVisibility(
    ra: number,
    dec: number,
    observer: ObserverLike,
    time: Date,
): CachedCelestialVisibility {
    const cacheKey = buildCelestialVisibilityKey(ra, dec, observer, time);
    const cached = celestialVisibilityCache.get(cacheKey);
    if (cached) return cached;

    const coords = equToHor(ra, dec, observer.lat, observer.lon, time);
    const events = calculateVisibilityEvents(ra, dec, observer, time);

    return rememberCelestialVisibility(cacheKey, {
        alt: coords.alt,
        az: coords.az,
        events,
        eventsLabel: formatVisibilityEvents(events),
    });
}
