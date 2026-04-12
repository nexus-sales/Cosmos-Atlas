'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import { METEOR_SHOWERS, getActiveShowers } from '@/data/meteorShowers';
import type { MeteorShower } from '@/data/meteorShowers';


const meteorVertexShader = `
    attribute float size;
    attribute vec3 color;
    attribute float alpha;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (400.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const meteorFragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv) * 2.0;
        if (r > 1.0) discard;

        // Estela del meteoro (gradiente)
        float gradient = 1.0 - r;
        gradient = pow(gradient, 1.5);

        // Núcleo brillante
        float core = pow(max(0.0, 1.0 - r * 1.5), 2.0);

        float alpha = (gradient + core) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
    }
`;

const METEOR_COUNT = 100;
const RADIUS = 95;

/** LCG determinista — igual que BackgroundStars, evita Math.random en useMemo */
function makeLCG(seed: number) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

export default function MeteorShower() {
    const pointsRef = useRef<THREE.Points>(null);
    const timeRef = useRef(0);
    const [isMounted, setIsMounted] = useState(false);

    // timeMinute solo cambia 1x/min — las lluvias de meteoros activas cambian como máximo 1x/día
    const time = useAppStore((state) => state.timeMinute);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const activeShowersRef = useRef<MeteorShower[]>([]);
    const lastCheckRef = useRef(0);
    const lastDayRef = useRef(-1);
    const hasActiveShowersRef = useRef(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    // Inicializar partículas de meteoros
    const [positions, colors, sizes, alphas, velocities, , isBolides] = useMemo(() => {
        const pos = new Float32Array(METEOR_COUNT * 3);
        const col = new Float32Array(METEOR_COUNT * 3);
        const siz = new Float32Array(METEOR_COUNT);
        const alp = new Float32Array(METEOR_COUNT);
        const vel = new Float32Array(METEOR_COUNT * 3);
        const ids = new Array(METEOR_COUNT);
        const bolides = new Array(METEOR_COUNT);

        const activeShowers = isMounted ? getActiveShowers(new Date(time)) : METEOR_SHOWERS;
        // Semilla derivada del minuto — reproducible para este tick de tiempo
        const rng = makeLCG(Math.floor(time.getTime() / 60000) ^ 0xdeadbeef);

        for (let i = 0; i < METEOR_COUNT; i++) {
            // Asignar a una lluvia activa (o aleatoria si no hay activas)
            const shower = activeShowers.length > 0
                ? activeShowers[Math.floor(rng() * activeShowers.length)]
                : METEOR_SHOWERS[Math.floor(rng() * METEOR_SHOWERS.length)];

            ids[i] = shower.id;

            // Posición inicial aleatoria en la bóveda
            const theta = rng() * Math.PI * 2;
            const phi = Math.acos(2 * rng() - 1);
            pos[i * 3] = RADIUS * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = RADIUS * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = RADIUS * Math.cos(phi);

            // Velocidad hacia el radiante (simplificado: hacia abajo)
            vel[i * 3] = (rng() - 0.5) * 0.5;
            vel[i * 3 + 1] = -0.3 - rng() * 0.5;
            vel[i * 3 + 2] = (rng() - 0.5) * 0.5;

            // Color según la lluvia
            const color = new THREE.Color(shower.color);
            col[i * 3] = color.r;
            col[i * 3 + 1] = color.g;
            col[i * 3 + 2] = color.b;

            // Tamaño y brillo — 5% de probabilidad de bólido
            const isBolide = rng() < 0.05;
            bolides[i] = isBolide;
            siz[i] = isBolide ? 8 + rng() * 4 : 2 + rng() * 3;

            alp[i] = 0;
        }

        return [pos, col, siz, alp, vel, ids, bolides];
    }, [time, isMounted]);

    // Estado de cada meteoro (life, maxLife)
    const lifeRef = useRef<Float32Array>(new Float32Array(METEOR_COUNT));
    const maxLifeRef = useRef<Float32Array>(new Float32Array(METEOR_COUNT));
    const activeRef = useRef<Uint8Array>(new Uint8Array(METEOR_COUNT));

    useFrame((state, delta) => {
        if (!pointsRef.current || !isMounted) return;

        timeRef.current += delta;

        const now = new Date(useAppStore.getState().time);
        const nowMs = now.getTime();
        const dayKey = now.getDate();

        if (dayKey !== lastDayRef.current || nowMs - lastCheckRef.current > 5 * 60 * 1000) {
            const active = getActiveShowers(now);
            activeShowersRef.current = active;
            hasActiveShowersRef.current = active.length > 0;
            lastCheckRef.current = nowMs;
            lastDayRef.current = dayKey;
        }

        const activeShowers = activeShowersRef.current;

        // If no active showers and no active particles, skip all updates
        if (!hasActiveShowersRef.current) {
            let anyActive = false;
            for (let i = 0; i < METEOR_COUNT; i++) {
                if (activeRef.current[i] === 1) { anyActive = true; break; }
            }
            if (!anyActive) {
                pointsRef.current.visible = false;
                return;
            }
        }

        pointsRef.current.visible = true;

        // Si no hay lluvias activas, reducir actividad
        const baseRate = activeShowers.length > 0 ? 0.02 : 0.0;

        const positionsAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
        const alphasAttr = pointsRef.current.geometry.getAttribute('alpha') as THREE.BufferAttribute;

        // Activar nuevos meteoros
        for (let i = 0; i < METEOR_COUNT; i++) {
            if (activeRef.current[i] === 0 && Math.random() < baseRate) {
                // Activar meteoro
                activeRef.current[i] = 1;
                lifeRef.current[i] = 0;
                maxLifeRef.current[i] = 0.5 + Math.random() * 1.0; // 0.5-1.5 segundos
                alphasAttr.setX(i, 0);

                // Nueva posición aleatoria
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positionsAttr.setXYZ(i,
                    RADIUS * Math.sin(phi) * Math.cos(theta),
                    RADIUS * Math.sin(phi) * Math.sin(theta),
                    RADIUS * Math.cos(phi)
                );
            }
        }

        // Actualizar meteoros activos
        for (let i = 0; i < METEOR_COUNT; i++) {
            if (activeRef.current[i] === 1) {
                lifeRef.current[i] += delta;
                const life = lifeRef.current[i] / maxLifeRef.current[i];

                // Fade in/out
                let alpha = 0;
                if (life < 0.2) {
                    alpha = life / 0.2; // Fade in
                } else if (life > 0.7) {
                    alpha = (1 - life) / 0.3; // Fade out
                } else {
                    alpha = 1;
                }

                // Mover meteoro
                const currentPos = new THREE.Vector3(
                    positionsAttr.getX(i),
                    positionsAttr.getY(i),
                    positionsAttr.getZ(i)
                );

                const speed = isBolides[i] ? 80 : 40; // Bólidos más rápidos
                currentPos.add(new THREE.Vector3(
                    velocities[i * 3] * speed * delta,
                    velocities[i * 3 + 1] * speed * delta,
                    velocities[i * 3 + 2] * speed * delta
                ));

                positionsAttr.setXYZ(i, currentPos.x, currentPos.y, currentPos.z);
                alphasAttr.setX(i, alpha * (nightMode ? 0.7 : 1.0));

                // Desactivar si terminó
                if (life >= 1 || currentPos.length() < 50) {
                    activeRef.current[i] = 0;
                    alphasAttr.setX(i, 0);
                }
            }
        }

        positionsAttr.needsUpdate = true;
        alphasAttr.needsUpdate = true;
    });

    if (!isMounted) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[sizes, 1]}
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-alpha"
                    args={[alphas, 1]}
                    count={alphas.length}
                    array={alphas}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={meteorVertexShader}
                fragmentShader={meteorFragmentShader}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}
