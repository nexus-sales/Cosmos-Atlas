'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { StarOctree } from '@/lib/astronomy/Octree';
import { useAppStore } from '@/stores/useAppStore';

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (400.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  uniform bool uNightMode;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv) * 2.0;
    if (r > 1.0) discard;
    
    vec3 outColor = vColor;
    if (uNightMode) {
        float luminance = dot(vColor, vec3(0.299, 0.587, 0.114));
        outColor = vec3(luminance * 1.5, 0.0, 0.0);
    }

    // Perfil de brillo: núcleo brillante + caída suave
    float core  = pow(max(0.0, 1.0 - r), 2.2);    // Núcleo compacto
    float halo  = pow(max(0.0, 1.0 - r * 0.7), 5.0) * 0.25; // Halo suave
    float alpha = core + halo;
    gl_FragColor = vec4(outColor, alpha);
  }
`;

function makeRNG(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

function sinGalLat(x: number, y: number, z: number): number {
    return -0.86766615 * x - 0.19807637 * y + 0.45598379 * z;
}

const TOTAL = 60000;            // Menos ruido de fondo
const RADIUS = 96;
const MAX_VISIBLE_STARS = 10000; // Máximo que enviamos al GPU por frame

export default function BackgroundStars() {
    const pointsRef = useRef<THREE.Points>(null);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const { camera } = useThree();

    // ── 1. Generar Catálogo Sintético Hipparcos ─────────────────────────────
    const [allPositions, allColors, allSizes, allMagnitudes, octree] = useMemo(() => {
        const positions = new Float32Array(TOTAL * 3);
        const colors = new Float32Array(TOTAL * 3);
        const sizes = new Float32Array(TOTAL);
        const magnitudes = new Float32Array(TOTAL);
        const rng = makeRNG(12345);

        for (let i = 0; i < TOTAL; i++) {
            const u = rng() * 2 - 1;
            const theta = rng() * Math.PI * 2;
            const sinPhi = Math.sqrt(Math.max(0, 1 - u * u));
            const px = sinPhi * Math.cos(theta);
            const py = u;
            const pz = sinPhi * Math.sin(theta);

            const sinB = sinGalLat(px, py, pz);
            const galWeight = Math.exp(-sinB * sinB * 12.0);

            // Densidad galáctica
            if (rng() > (0.15 + 0.85 * galWeight)) {
                i--; continue; // Re-intentar para mantener TOTAL
            }

            positions[i * 3] = px * RADIUS;
            positions[i * 3 + 1] = py * RADIUS;
            positions[i * 3 + 2] = pz * RADIUS;

            // Distribución de magnitudes: pocas brillantes, muchas tenues
            // Se simula la función de luminosidad estelar real
            const mag = 5.0 + Math.pow(rng(), 0.7) * 4.0; // Mag 5–9, sesgado a tenues
            magnitudes[i] = mag;
            // ESCALA EXPONENCIAL: la diferencia visual entre mag 5 y mag 9 es enorme
            // pow(0.55, mag) da una curva similar a la escala Pogson real
            const brightness = Math.pow(0.55, mag - 5.0); // 1.0 en mag5, ~0.04 en mag9
            sizes[i] = Math.max(0.1, brightness * 1.2);   // 0.1–1.2 px en unidades de escena

            const t = rng();
            if (t < 0.6) { // M/K
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.5;
            } else if (t < 0.85) { // G/F
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.8;
            } else { // B/A
                colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
            }
        }

        const tree = new StarOctree(positions, TOTAL);
        return [positions, colors, sizes, magnitudes, tree];
    }, []);

    // ── 2. Preparar Geometría Dinámica para GPU ─────────────────────────────
    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS * 3), 3));
        geom.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE_STARS), 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: { uNightMode: { value: nightMode } },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        return [geom, mat];
    }, []);

    // ── 3. Loop de Culling & Rendering ──────────────────────────────────────
    const frustum = useMemo(() => new THREE.Frustum(), []);
    const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

    useFrame(() => {
        if (!pointsRef.current) return;

        // Actualizar frustum
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        // Búsqueda en Octree
        const visibleIndices: number[] = [];
        octree.search(frustum, visibleIndices);

        // Filtrado por magnitud (Bortle)
        // Bortle 1 (cielo oscuro) → hasta mag 9.0
        // Bortle 9 (ciudad densa)  → hasta mag 4.5
        const limitingMag = 9.0 - (bortleScale - 1) * 0.55;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

        let count = 0;
        for (let i = 0; i < visibleIndices.length && count < MAX_VISIBLE_STARS; i++) {
            const idx = visibleIndices[i];
            if (allMagnitudes[idx] > limitingMag) continue;

            posAttr.setXYZ(count, allPositions[idx * 3], allPositions[idx * 3 + 1], allPositions[idx * 3 + 2]);
            colAttr.setXYZ(count, allColors[idx * 3], allColors[idx * 3 + 1], allColors[idx * 3 + 2]);
            sizAttr.setX(count, allSizes[idx]);
            count++;
        }

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;

        material.uniforms.uNightMode.value = nightMode;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}

