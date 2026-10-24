'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { getSkyCulture } from '@/data/skyCultures';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const RADIUS = 92.3;

export default function Asterisms() {
    const visible = useAppStore((state) => state.settings.showAsterisms);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const skyCultureId = useAppStore((state) => state.skyCultureId);
    const stars = useCatalog((state) => state.stars);

    const paths = useMemo(() => {
        const starMap = new Map(stars.map((star) => [star.name, star]));
        return getSkyCulture(skyCultureId).asterisms.map((asterism) => ({
            ...asterism,
            points: asterism.starNames
                .map((name) => starMap.get(name))
                .filter((star) => star !== undefined)
                .map((star) => equatorialTo3D(star.ra, star.dec, RADIUS)),
        })).filter((asterism) => asterism.points.length === asterism.starNames.length);
    }, [skyCultureId, stars]);

    if (!visible) return null;

    return (
        <group renderOrder={4}>
            {paths.map((asterism) => (
                <Line
                    key={asterism.id}
                    points={asterism.points}
                    color={nightMode ? '#8f2020' : '#f5c96a'}
                    lineWidth={1.15}
                    transparent
                    opacity={0.72}
                    dashed
                    dashScale={32}
                    dashSize={1.1}
                    gapSize={0.8}
                    depthTest={false}
                    depthWrite={false}
                />
            ))}
        </group>
    );
}
