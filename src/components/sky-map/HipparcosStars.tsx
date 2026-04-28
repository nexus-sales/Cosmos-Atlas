'use client';

/**
 * HipparcosStars.tsx
 * Renderiza el catálogo Hipparcos completo (~15.000 estrellas hasta mag 7).
 *
 * Arquitectura:
 * - Carga /hipparcos.bin de forma asíncrona al montar el componente
 * - Usa el mismo shader que Stars.tsx (twinkle, airmass, color espectral)
 * - SIN hitboxes ni labels: son estrellas de fondo, no interactivas
 * - El catálogo de 355 estrellas nombradas (Stars.tsx) sigue siendo el
 *   sistema de interacción. Este componente añade la densidad visual correcta.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { loadHipparcos, bvToHex, type HipStar } from '@/lib/astronomy/hipparcos';
import { StarOctree } from '@/lib/astronomy/Octree';
import { useAppStore } from '@/stores/useAppStore';

const RADIUS = 98; 
const MAX_VISIBLE_STARS = 10000;

// ── Shaders (idénticos a Stars.tsx para consistencia visual) ────────────────
const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float distanceFactor;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  uniform float uTime;

  void main() {
    vColor = color;
    vSize = size;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    float altitude = worldPosition.y / length(worldPosition.xyz);
    float airmass = 1.0 / max(0.08, altitude);

    float depthFactor = 1.0 - distanceFactor * 0.2;

    float twinkleSpeed = 1.2 + airmass * 0.15;
    float twinkleAmp = 0.04 + airmass * 0.02; // Very subtle for background stars
    float noise = sin(uTime * twinkleSpeed + position.x * 47.0) * 0.6
                + sin(uTime * twinkleSpeed * 0.71 + position.y * 53.0) * 0.4;
    vOpacity = depthFactor * ((1.0 - twinkleAmp) + twinkleAmp * noise);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 0.8 * (vOpacity * 0.2 + 0.8) * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  uniform bool uNightMode;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    vec3 baseColor = vColor;
    if (uNightMode) {
        float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
        baseColor = vec3(lum * 1.8, 0.0, 0.0);
    }

    float core = exp(-r * 18.0) * 1.5;
    float halo = exp(-r * 25.0) * 0.1;
    float finalAlpha = (core + halo) * vOpacity;
    vec3 finalColor = mix(baseColor, vec3(1.0), core * 0.4);

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

export default function HipparcosStars() {
    const bortleScale = useAppStore(s => s.settings.bortleScale);
    const nightMode   = useAppStore(s => s.settings.nightMode);
    const { camera }  = useThree();

    const [allStars, setAllStars] = useState<HipStar[]>([]);
    const pointsRef   = useRef<THREE.Points>(null);
    const frustum     = useMemo(() => new THREE.Frustum(), []);
    const projMatrix  = useMemo(() => new THREE.Matrix4(), []);

    // Cargar catálogo una sola vez
    useEffect(() => {
        loadHipparcos().then(setAllStars);
    }, []);

    // 1. Datos estáticos de todo el catálogo + Octree
    const [positions, colors, sizes, magnitudes, distFactors, octree] = useMemo(() => {
        if (allStars.length === 0) return [null, null, null, null, null, null];
        
        const count = allStars.length;
        const pos     = new Float32Array(count * 3);
        const col     = new Float32Array(count * 3);
        const sz      = new Float32Array(count);
        const mags    = new Float32Array(count);
        const dFac    = new Float32Array(count);
        
        const tmpColor = new THREE.Color();
        const refMag   = -1.5;

        for (let i = 0; i < count; i++) {
            const s = allStars[i];
            const p = equatorialTo3D(s.ra, s.dec, RADIUS);
            pos[i * 3]     = p[0];
            pos[i * 3 + 1] = p[1];
            pos[i * 3 + 2] = p[2];

            tmpColor.set(bvToHex(s.bv));
            col[i * 3]     = tmpColor.r;
            col[i * 3 + 1] = tmpColor.g;
            col[i * 3 + 2] = tmpColor.b;

            const brightness = Math.pow(2.512, refMag - s.mag);
            const normB      = Math.min(1.0, brightness);
            sz[i]            = 0.4 + Math.pow(normB, 0.45) * 4.2;
            mags[i]          = s.mag;
            dFac[i]          = Math.min(1.0, Math.max(0.0, (s.mag + 1.5) / 8.5));
        }

        const tree = new StarOctree(pos, count);
        return [pos, col, sz, mags, dFac, tree];
    }, [allStars]);

    // 2. Buffer para los puntos visibles (Instanced-like behavior manually via drawRange)
    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position',       new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS * 3), 3));
        geom.setAttribute('color',          new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS * 3), 3));
        geom.setAttribute('size',           new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS), 1));
        geom.setAttribute('distanceFactor', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS), 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime:      { value: 0 },
                uNightMode: { value: false },
            },
            transparent: true,
            depthWrite:  false,
            blending:    THREE.AdditiveBlending
        });

        return [geom, mat];
    }, []);

    useFrame((state) => {
        if (!octree || !pointsRef.current) return;

        // Frustum Culling Manual vía Octree
        projMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        projMatrix.multiply(pointsRef.current.matrixWorld);
        frustum.setFromProjectionMatrix(projMatrix);

        const visibleIndices: number[] = [];
        octree.search(frustum, visibleIndices);

        const limitingMag = 8.0 - (bortleScale - 1) * 0.72;
        const FADE_RANGE  = 1.2; // mag: zona de transición suave

        const posAttr  = geometry.getAttribute('position')       as THREE.BufferAttribute;
        const colAttr  = geometry.getAttribute('color')          as THREE.BufferAttribute;
        const sizAttr  = geometry.getAttribute('size')           as THREE.BufferAttribute;
        const distAttr = geometry.getAttribute('distanceFactor') as THREE.BufferAttribute;

        let count = 0;
        for (let i = 0; i < visibleIndices.length && count < MAX_VISIBLE_STARS; i++) {
            const idx = visibleIndices[i];
            const mag = magnitudes![idx];
            if (mag > limitingMag) continue;

            // Fade suave para estrellas cercanas al límite de magnitud
            const fadeFactor = mag > (limitingMag - FADE_RANGE)
                ? Math.max(0, (limitingMag - mag) / FADE_RANGE)
                : 1.0;

            posAttr.setXYZ(count, positions![idx * 3], positions![idx * 3 + 1], positions![idx * 3 + 2]);
            colAttr.setXYZ(count, colors![idx * 3], colors![idx * 3 + 1], colors![idx * 3 + 2]);
            sizAttr.setX(count, sizes![idx] * fadeFactor);
            distAttr.setX(count, distFactors![idx]);
            count++;
        }

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;
        distAttr.needsUpdate = true;

        // eslint-disable-next-line react-hooks/immutability
        material.uniforms.uTime.value      = state.clock.elapsedTime;
        material.uniforms.uNightMode.value = nightMode;
    });

    if (!geometry || !material) return null;

    return (
        <points
            ref={pointsRef}
            geometry={geometry}
            material={material}
            renderOrder={0}
        />
    );
}
