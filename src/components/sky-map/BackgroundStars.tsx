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
    gl_PointSize = size * (600.0 / -mvPosition.z);
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
        outColor = vec3(luminance * 1.2, 0.0, 0.0);
    }

    float core = exp(-r * 5.0);
    float alpha = clamp(core, 0.0, 0.8);
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

const TOTAL = 20000; // Reducido drásticamente para evitar el efecto de "ruido"
const RADIUS = 96;
const MAX_VISIBLE_STARS = 10000;

export default function BackgroundStars() {
    const pointsRef = useRef<THREE.Points>(null);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const viewMode = useAppStore((state) => state.viewMode);
    const { camera } = useThree();

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
            const galWeight = Math.exp(-sinB * sinB * 20.0);

            if (rng() > (0.3 + 0.7 * galWeight)) {
                i--; continue;
            }

            positions[i * 3] = px * RADIUS;
            positions[i * 3 + 1] = py * RADIUS;
            positions[i * 3 + 2] = pz * RADIUS;

            const mag = 7.0 + rng() * 4.0;
            magnitudes[i] = mag;

            const brightness = Math.pow(2.512, 7.0 - mag);
            sizes[i] = Math.max(0.04, brightness * 0.35);

            const t = rng();
            if (t < 0.6) { 
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.6;
            } else if (t < 0.85) {
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 0.9;
            } else {
                colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
            }
        }

        const tree = new StarOctree(positions, TOTAL);
        return [positions, colors, sizes, magnitudes, tree];
    }, []);

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

        materialRef.current = mat;
        return [geom, mat];
    }, []);

    useFrame(() => {
        if (!pointsRef.current) return;

        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        projScreenMatrix.multiply(pointsRef.current.matrixWorld);
        frustum.setFromProjectionMatrix(projScreenMatrix);

        const visibleIndices: number[] = [];
        octree.search(frustum, visibleIndices);

        // Limitar magnitud aún más en modo cámara para no ensuciar el sensor real
        const camFactor = viewMode === 'camera' ? 1.5 : 0;
        const limitingMag = 7.0 - (bortleScale - 1) * 0.6 - camFactor;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

        let count = 0;
        for (let i = 0; i < visibleIndices.length && count < MAX_VISIBLE_STARS; i++) {
            const idx = visibleIndices[i];
            if (allMagnitudes[idx] > limitingMag) continue;

            posAttr.setXYZ(count, allPositions[idx * 3], allPositions[idx * 3 + 1], allPositions[idx * 3 + 2]);
            colAttr.setXYZ(count, allColors[idx * 3], allColors[idx * 3 + 1], allColors[idx * 3 + 2]);

            // Reducción de tamaño en modo cámara para máxima fidelidad
            const sizeMult = viewMode === 'camera' ? 0.8 : 1.0;
            sizAttr.setX(count, allSizes[idx] * sizeMult);
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

    const frustum = useMemo(() => new THREE.Frustum(), []);
    const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

    return <points ref={pointsRef} geometry={geometry} material={material} renderOrder={0} />;
}
