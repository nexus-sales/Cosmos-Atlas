'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { loadNGC, type NGCObject } from '@/lib/astronomy/ngc';
import { useAppStore } from '@/stores/useAppStore';

const RADIUS = 94;
const MAX_VISIBLE = 2000;

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uFOV;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float fovFactor = clamp(60.0 / uFOV, 1.0, 4.0);
    gl_PointSize = size * fovFactor * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  uniform bool uNightMode;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    vec3 baseColor = vColor;
    if (uNightMode) baseColor = vec3(1.0, 0.0, 0.0);

    float alpha = exp(-r * 8.0) * 0.4;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

interface PrecomputedNGCObject {
    mag: number;
    pos: [number, number, number];
    color: readonly [number, number, number];
    size: number;
}

export default function NGCObjects() {
    const bortleScale = useAppStore((s) => s.settings.bortleScale);
    const nightMode = useAppStore((s) => s.settings.nightMode);
    const camFov = useAppStore((s) => s.camFov);
    const [objects, setObjects] = useState<NGCObject[]>([]);
    const pointsRef = useRef<THREE.Points>(null);
    const lastLimitingMagRef = useRef<number | null>(null);
    const lastUpdateTimeRef = useRef(-Infinity);

    useEffect(() => {
        loadNGC().then(setObjects);
    }, []);

    const precomputedObjects = useMemo<PrecomputedNGCObject[]>(() => {
        return objects
            .map((obj) => {
                const pos = equatorialTo3D(obj.ra, obj.dec, RADIUS) as [number, number, number];
                const color = obj.type === 1
                    ? [0.6, 0.8, 1.0] as const
                    : obj.type === 2
                        ? [1.0, 0.5, 0.5] as const
                        : [1.0, 1.0, 0.7] as const;
                const size = Math.min(3.5, Math.max(0.8, obj.size / 20.0));

                return {
                    mag: obj.mag,
                    pos,
                    color,
                    size,
                };
            })
            .sort((a, b) => a.mag - b.mag);
    }, [objects]);

    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE * 3), 3));
        geom.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE), 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uNightMode: { value: false },
                uFOV: { value: 60 },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        return [geom, mat] as const;
    }, []);

    useFrame((state) => {
        if (precomputedObjects.length === 0 || !pointsRef.current) return;

        const shaderMaterial = pointsRef.current.material as THREE.ShaderMaterial;
        shaderMaterial.uniforms.uNightMode.value = nightMode;
        shaderMaterial.uniforms.uFOV.value = camFov;

        const limitingMag = (60 / camFov) * 2.5 + (10.0 - bortleScale);
        const now = state.clock.elapsedTime;
        const dueForRefresh = now - lastUpdateTimeRef.current > 1 / 18;
        const thresholdChanged =
            lastLimitingMagRef.current === null ||
            Math.abs(lastLimitingMagRef.current - limitingMag) > 0.05;

        if (!dueForRefresh && !thresholdChanged) return;

        lastUpdateTimeRef.current = now;
        lastLimitingMagRef.current = limitingMag;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

        let count = 0;
        for (let i = 0; i < precomputedObjects.length && count < MAX_VISIBLE; i++) {
            const obj = precomputedObjects[i];
            if (obj.mag > limitingMag) break;

            posAttr.setXYZ(count, obj.pos[0], obj.pos[1], obj.pos[2]);
            colAttr.setXYZ(count, obj.color[0], obj.color[1], obj.color[2]);
            sizAttr.setX(count, obj.size);
            count++;
        }

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}
