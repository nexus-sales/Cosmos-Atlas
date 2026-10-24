export interface TerrainSample {
    azimuth: number;
    distanceKm: number;
    elevationM: number;
}

export interface HorizonPoint {
    azimuth: number;
    altitude: number;
}

export interface HorizonBand {
    maxDistanceKm: number;
    profile: HorizonPoint[];
}

const EARTH_RADIUS_M = 6_371_000;
const EFFECTIVE_RADIUS_FACTOR = 7 / 6;

export function destinationPoint(latDeg: number, lonDeg: number, azimuthDeg: number, distanceKm: number) {
    const angularDistance = distanceKm / (EARTH_RADIUS_M / 1000);
    const lat1 = latDeg * Math.PI / 180;
    const lon1 = lonDeg * Math.PI / 180;
    const bearing = azimuthDeg * Math.PI / 180;
    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angularDistance)
        + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );
    const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );
    return { lat: lat2 * 180 / Math.PI, lon: ((lon2 * 180 / Math.PI + 540) % 360) - 180 };
}

export function buildHorizonProfile(observerElevationM: number, samples: TerrainSample[]): HorizonPoint[] {
    const byAzimuth = new Map<number, number>();
    for (const sample of samples) {
        const distanceM = sample.distanceKm * 1000;
        const curvatureDrop = distanceM * distanceM / (2 * EARTH_RADIUS_M * EFFECTIVE_RADIUS_FACTOR);
        const altitude = Math.atan2(
            sample.elevationM - observerElevationM - curvatureDrop,
            distanceM,
        ) * 180 / Math.PI;
        byAzimuth.set(sample.azimuth, Math.max(byAzimuth.get(sample.azimuth) ?? 0, altitude));
    }
    return [...byAzimuth.entries()]
        .sort(([a], [b]) => a - b)
        .map(([azimuth, altitude]) => ({ azimuth, altitude: Math.max(0, Math.min(60, altitude)) }));
}

export function buildHorizonBands(
    observerElevationM: number,
    samples: TerrainSample[],
    limitsKm: number[],
): HorizonBand[] {
    const sortedLimits = [...limitsKm].sort((a, b) => a - b);
    return sortedLimits.map((maxDistanceKm, index) => {
        const minDistanceKm = index === 0 ? 0 : sortedLimits[index - 1];
        return {
            maxDistanceKm,
            profile: buildHorizonProfile(
                observerElevationM,
                samples.filter((sample) => sample.distanceKm > minDistanceKm && sample.distanceKm <= maxDistanceKm),
            ),
        };
    });
}

export function horizonAltitudeAtAzimuth(profile: HorizonPoint[], azimuthDeg: number) {
    if (profile.length === 0) return 0;
    const azimuth = ((azimuthDeg % 360) + 360) % 360;
    const sorted = [...profile].sort((a, b) => a.azimuth - b.azimuth);
    const upperIndex = sorted.findIndex((point) => point.azimuth >= azimuth);
    const upper = upperIndex === -1 ? { ...sorted[0], azimuth: sorted[0].azimuth + 360 } : sorted[upperIndex];
    const lower = upperIndex === -1
        ? sorted[sorted.length - 1]
        : upperIndex === 0
            ? { ...sorted[sorted.length - 1], azimuth: sorted[sorted.length - 1].azimuth - 360 }
            : sorted[upperIndex - 1];
    const span = upper.azimuth - lower.azimuth;
    const t = span === 0 ? 0 : (azimuth - lower.azimuth) / span;
    return lower.altitude + (upper.altitude - lower.altitude) * t;
}
