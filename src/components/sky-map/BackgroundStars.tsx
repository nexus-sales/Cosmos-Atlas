'use client';

import { useMemo, useRef } from 'react';
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

const TOTAL = 40000;            // 40k — fondo estelar sin abrumar al catálogo
const RADIUS = 96;
const MAX_VISIBLE_STARS = 8000; // Máximo que enviamos al GPU por frame

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
            // Concentración galáctica más fuerte: 25× hacia el plano vs. polos
            const galWeight = Math.exp(-sinB * sinB * 25.0);

            // Densidad galáctica: mínimo 8% isotrópico + 92% concentrado
            if (rng() > (0.08 + 0.92 * galWeight)) {
                i--; continue; // Re-intentar para mantener TOTAL
            }

            positions[i * 3] = px * RADIUS;
            positions[i * 3 + 1] = py * RADIUS;
            positions[i * 3 + 2] = pz * RADIUS;

            // Magnitudes: sesgado fuertemente a tenues (mag 6·5–9)
            // Para que no compitan con el catálogo (Stars.tsx cubre mag <8)
            const mag = 6.5 + Math.pow(rng(), 0.55) * 2.5; // Mag 6.5–9
            magnitudes[i] = mag;
            // Pogson: cada mag es 2.512× más oscuro. Ref en mag 6.5
            const brightness = Math.pow(2.512, 6.5 - mag); // 1.0 en mag6.5, ~0.02 en mag9
            // Tamaño muy pequeño: 0.08–0.55 px para que sean "polvo estelar"
            sizes[i] = Math.max(0.08, brightness * 0.55);

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
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
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

        // eslint-disable-next-line react-hooks/refs
        materialRef.current = mat;
        return [geom, mat];
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        const limitingMag = 7.5 - (bortleScale - 1) * 0.65;

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

        if (materialRef.current) {
            materialRef.current.uniforms.uNightMode.value = nightMode;
        }
    });

    // renderOrder=0 → siempre bajo las estrellas del catálogo (order 1) y constelaciones (order 3)
    return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={0} />;
}

