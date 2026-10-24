'use client';

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { parseIauBoundaries, type BoundaryPath } from '@/lib/astronomy/iauBoundaries';

const RADIUS = 91.5;

function buildBoundaryGeometry(paths: BoundaryPath[]) {
    const vertices: number[] = [];
    for (const path of paths) {
        for (let index = 1; index < path.length; index++) {
            vertices.push(
                ...equatorialTo3D(path[index - 1][0], path[index - 1][1], RADIUS),
                ...equatorialTo3D(path[index][0], path[index][1], RADIUS),
            );
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
}

export default function ConstellationBoundaries() {
    const visible = useAppStore((state) => state.settings.showConstellationBoundaries);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const camFov = useAppStore((state) => state.camFov);
    const [paths, setPaths] = useState<BoundaryPath[]>([]);

    useEffect(() => {
        if (!visible || paths.length > 0) return;
        const controller = new AbortController();
        void fetch('/iau-boundaries.bin', { signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.arrayBuffer();
            })
            .then((buffer) => setPaths(parseIauBoundaries(buffer)))
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                console.warn('[IAU boundaries] No se pudo cargar la capa:', error);
            });
        return () => controller.abort();
    }, [paths.length, visible]);

    const geometry = useMemo(() => buildBoundaryGeometry(paths), [paths]);
    useEffect(() => () => geometry.dispose(), [geometry]);

    if (!visible || paths.length === 0) return null;

    const zoomOpacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 95, 35, 0.08, 0.30), 0.08, 0.30);
    return (
        <lineSegments geometry={geometry} renderOrder={2}>
            <lineBasicMaterial
                color={nightMode ? '#7f1d1d' : '#7899c5'}
                transparent
                opacity={zoomOpacity}
                depthTest={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </lineSegments>
    );
}
