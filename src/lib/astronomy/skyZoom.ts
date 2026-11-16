import type { DSO, Planet, Star } from '@/types/celestial';

export const SKY_FOV_MIN = 1.5;
export const SKY_FOV_MAX = 90;

export function clampSkyFov(fov: number): number {
    return Math.min(SKY_FOV_MAX, Math.max(SKY_FOV_MIN, fov));
}

export function wheelZoomFov(fov: number, delta: number, mode = 0): number {
    const pixels = delta * (mode === 1 ? 16 : mode === 2 ? 800 : 1);
    return clampSkyFov(fov * Math.exp(Math.max(-0.25, Math.min(0.25, pixels * 0.002))));
}

export function targetSkyFov(target: Star | DSO | Planet): number {
    if ('symbol' in target && target.symbol === '\u2726') {
        return clampSkyFov('angularSize' in target && typeof target.angularSize === 'number' ? target.angularSize : 45);
    }
    if ('sizeArcmin' in target && typeof target.sizeArcmin === 'number' && target.sizeArcmin > 0) {
        return clampSkyFov(Math.min(30, 4 * target.sizeArcmin / 60));
    }
    return 'type' in target || target.kind === 'planet' ? 22 : 36;
}

export function lodForFov(fov: number, quality: 'high' | 'medium' | 'low') {
    const cap = quality === 'low' ? 700 : quality === 'medium' ? 1400 : 6000;
    if (fov >= 18) return null;
    if (fov >= 8) return { mag: 10.5, limit: Math.min(cap, 650), radius: Math.min(8, fov * 0.58), level: 1 };
    if (fov >= 3) return { mag: 13, limit: Math.min(cap, 1400), radius: Math.max(0.8, fov * 0.62), level: 2 };
    return { mag: 17, limit: cap, radius: Math.max(0.3, fov * 0.68), level: 3 };
}
