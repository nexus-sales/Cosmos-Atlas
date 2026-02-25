'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));

/**
 * Etiquetas de constelación al estilo Sky Map:
 * - Letras espaciadas en MAYÚSCULAS con brillo sutil
 * - Opacidad moderada para no competir con las estrellas
 * - zIndexRange alto para superponerse siempre al canvas 3D
 */
export default function ConstellationLabels() {
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const labels = useMemo(() => {
        return Object.entries(CONSTELLATIONS).flatMap(([name, pairs]) => {
            const starNames = new Set<string>();
            pairs.forEach(([a, b]) => { starNames.add(a); starNames.add(b); });

            const sum = new THREE.Vector3();
            let count = 0;
            starNames.forEach((sName) => {
                const star = STAR_MAP.get(sName);
                if (!star) return;
                const [x, y, z] = equatorialTo3D(star.ra, star.dec, 1);
                sum.add(new THREE.Vector3(x, y, z));
                count++;
            });

            if (count === 0) return [];

            const centroid = sum.divideScalar(count).normalize();
            const pos = centroid.multiplyScalar(85).toArray() as [number, number, number];
            return [{ name, label: getConstellationDisplayName(name), pos }];
        });
    }, []);

    // En modo noche las letras son rojizas tenues
    const textColor = nightMode
        ? 'rgba(200,80,80,0.5)'
        : 'rgba(190,215,255,0.65)';
    const glowColor = nightMode
        ? 'rgba(160,40,40,0.35)'
        : 'rgba(100,160,255,0.30)';

    return (
        <>
            {labels.map(({ name, label, pos }) => (
                <Html
                    key={name}
                    position={pos}
                    center
                    distanceFactor={12}
                    zIndexRange={[200, 100]}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    <span style={{
                        color: textColor,
                        fontFamily: "system-ui, -apple-system, 'Helvetica Neue', sans-serif",
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.20em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        textShadow: `0 0 12px ${glowColor}, 0 0 4px ${glowColor}`,
                    }}>
                        {label.toUpperCase()}
                    </span>
                </Html>
            ))}
        </>
    );
}
