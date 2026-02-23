'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vSize;

  void main() {
    vColor = color;
    vSize = size;
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vSize;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv) * 2.0;
    if (r > 1.0) discard;
    float alpha = smoothstep(1.0, 0.05, r);
    gl_FragColor = vec4(vColor, alpha * 0.90);
  }
`;

// Generador pseudo-aleatorio (LCG) — mismo campo de estrellas en cada render
function makeRNG(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

/**
 * Calcula el seno de la latitud galáctica para un punto de la esfera
 * en coordenadas cartesianas ecuatoriales (J2000).
 * Fila 3 de la matriz ecuatorial→galáctica (IAU, J2000):
 *   M3 = [ -0.86766615, -0.19807637, 0.45598379 ]
 */
function sinGalLat(x: number, y: number, z: number): number {
    return -0.86766615 * x - 0.19807637 * y + 0.45598379 * z;
}

const TOTAL  = 18000;  // estrellas de fondo
const RADIUS = 97;

export default function BackgroundStars() {
    const [geometry, material] = useMemo(() => {
        const rng  = makeRNG(0xdeadbeef);
        const pos  = new Float32Array(TOTAL * 3);
        const col  = new Float32Array(TOTAL * 3);
        const sz   = new Float32Array(TOTAL);

        for (let i = 0; i < TOTAL; i++) {
            // ── Posición aleatoria uniforme en la esfera ─────────────────
            const u     = rng() * 2 - 1;
            const theta = rng() * Math.PI * 2;
            const sinPhi = Math.sqrt(Math.max(0, 1 - u * u));
            const px = sinPhi * Math.cos(theta);
            const py = u;
            const pz = sinPhi * Math.sin(theta);

            // ── Potenciación de densidad en el plano galáctico ───────────
            const sinB = sinGalLat(px, py, pz);
            const galWeight = Math.exp(-sinB * sinB * 8.0); // Gauss: σ ≈ 20°

            // Descartar con probabilidad para que la densidad refleje la galaxia
            // ~30% base + 70% concentrado en el plano
            const accept = 0.30 + 0.70 * galWeight;
            if (rng() > accept) {
                // Estrella descartada: posición al origen y tamaño 0 (shader discard)
                pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
                sz[i] = 0;
                col[i * 3] = 0; col[i * 3 + 1] = 0; col[i * 3 + 2] = 0;
                continue;
            }

            pos[i * 3]     = RADIUS * px;
            pos[i * 3 + 1] = RADIUS * py;
            pos[i * 3 + 2] = RADIUS * pz;

            // ── Magnitud y tamaño ────────────────────────────────────────
            // Más brillo en el plano galáctico (más estrellas brillantes)
            const brighterInPlane = rng() < galWeight * 0.3;
            const mag = brighterInPlane
                ? 2.5 + rng() * 2.0  // 2.5–4.5 (más visible)
                : 3.5 + rng() * 3.0; // 3.5–6.5 (fondo tenue)
            sz[i] = Math.max(0.6, (7.0 - mag) * 0.45);

            // ── Color espectral ──────────────────────────────────────────
            const t = rng();
            if (t < 0.48) {
                // K/M → naranja-roja (las más comunes)
                const k = 0.80 + rng() * 0.15;
                col[i * 3] = k; col[i * 3 + 1] = k * 0.72 + rng() * 0.10; col[i * 3 + 2] = k * 0.5 + rng() * 0.08;
            } else if (t < 0.72) {
                // G  → blanco-amarillo
                const k = 0.85 + rng() * 0.15;
                col[i * 3] = k; col[i * 3 + 1] = k * 0.92 + rng() * 0.05; col[i * 3 + 2] = k * 0.68 + rng() * 0.12;
            } else if (t < 0.88) {
                // A/F → blanco
                const k = 0.88 + rng() * 0.12;
                col[i * 3] = k * 0.92; col[i * 3 + 1] = k * 0.94; col[i * 3 + 2] = k;
            } else {
                // O/B → azul-blanco (las más calientes y raras)
                const k = 0.85 + rng() * 0.15;
                col[i * 3] = k * 0.70; col[i * 3 + 1] = k * 0.82; col[i * 3 + 2] = k;
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color',    new THREE.BufferAttribute(col, 3));
        geom.setAttribute('size',     new THREE.BufferAttribute(sz, 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {},
            transparent: true,
            depthWrite: false,
        });

        return [geom, mat];
    }, []);

    return <points geometry={geometry} material={material} renderOrder={0} />;
}

