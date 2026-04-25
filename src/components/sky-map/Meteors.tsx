'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import * as Astronomy from 'astronomy-engine';
import { useAppStore } from '@/stores/useAppStore';
import { getBestShower, getShowerActivity } from '@/data/meteorShowers';
import { useCatalog } from '@/stores/useCatalogStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const METEOR_COUNT = 8;

type MeteorState = {
    active: boolean;
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    progress: number;
    speed: number;
    length: number;
    waitDelay: number;
};

type ShowerCache = {
    radiantDir: THREE.Vector3 | null;
    color: string;
    activityFactor: number;
    lastUpdateMs: number;
};

function pseudoRandom(seed: number) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

function createInitialMeteors(): MeteorState[] {
    return Array.from({ length: METEOR_COUNT }, (_, index) => ({
        active: false,
        startPos: new THREE.Vector3(),
        endPos: new THREE.Vector3(),
        progress: 0,
        speed: 0,
        length: 0,
        waitDelay: pseudoRandom(index + 1) * 8 + 2,
    }));
}

const vertexShader = `
    attribute float instanceOpacity;
    varying float vOpacity;
    varying vec2 vUv;

    void main() {
        vOpacity = instanceOpacity;
        vUv = uv;
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying float vOpacity;
    varying vec2 vUv;
    uniform vec3 uColor;

    void main() {
        float tailFade = smoothstep(0.0, 0.3, vUv.y);
        float headFade = smoothstep(1.0, 0.75, vUv.y);
        float edgeFade = smoothstep(0.0, 0.5, 0.5 - abs(vUv.x - 0.5));
        float headGlow = smoothstep(0.6, 1.0, vUv.y) * 0.6;
        float alpha = tailFade * headFade * edgeFade * vOpacity;
        gl_FragColor = vec4(uColor + headGlow, alpha * 0.85);
    }
`;

// Reusable vectors — module-level to avoid per-frame allocations
const _perpA = new THREE.Vector3();
const _perpB = new THREE.Vector3();
const _startDir = new THREE.Vector3();
const _awayDir = new THREE.Vector3();
const _perturbation = new THREE.Vector3();

export default function Meteors() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const meteorsRef = useRef<MeteorState[]>(createInitialMeteors());

    const uniforms = useMemo(() => ({
        uColor: { value: new THREE.Color('#e0f2fe') }
    }), []);

    const opacityArray = useMemo(() => new Float32Array(METEOR_COUNT), []);

    // Cached shower state — refreshed at most every 30 real-time seconds
    const showerCacheRef = useRef<ShowerCache>({
        radiantDir: null,
        color: '#e0f2fe',
        activityFactor: 1.0,
        lastUpdateMs: 0,
    });

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        const { time, observer, settings } = useAppStore.getState();
        const isNight = settings.nightMode;

        // Refresh shower cache every 30 real seconds
        const nowMs = Date.now();
        const cache = showerCacheRef.current;
        if (nowMs - cache.lastUpdateMs > 30_000) {
            cache.lastUpdateMs = nowMs;
            const shower = getBestShower(useCatalog.getState().meteorShowers, time);
            if (shower) {
                const activity = getShowerActivity(shower, time);
                if (activity > 0.03) {
                    try {
                        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
                        const hor = Astronomy.Horizon(time, obs, shower.radiant.ra / 15.0, shower.radiant.dec, 'normal');
                        if (hor.altitude > -15) {
                            const [rx, ry, rz] = equatorialTo3D(shower.radiant.ra, shower.radiant.dec, 1.0);
                            cache.radiantDir = new THREE.Vector3(rx, ry, rz).normalize();
                            cache.color = shower.color;
                            cache.activityFactor = activity;
                        } else {
                            cache.radiantDir = null;
                            cache.color = '#e0f2fe';
                            cache.activityFactor = 1.0;
                        }
                    } catch {
                        cache.radiantDir = null;
                    }
                } else {
                    cache.radiantDir = null;
                    cache.color = '#e0f2fe';
                    cache.activityFactor = 1.0;
                }
            } else {
                cache.radiantDir = null;
                cache.color = '#e0f2fe';
                cache.activityFactor = 1.0;
            }
        }

        // Update color uniform (shower color in night mode becomes deep red tint)
        uniforms.uColor.value.set(isNight ? '#ff4444' : cache.color);

        let needUpdate = false;
        const meteors = meteorsRef.current;

        for (let i = 0; i < METEOR_COUNT; i++) {
            const m = meteors[i];

            if (!m.active) {
                m.waitDelay -= delta;
                if (m.waitDelay <= 0) {
                    m.active = true;
                    m.progress = 0;
                    m.speed = 1.5 + Math.random() * 2.0;
                    m.length = 15 + Math.random() * 25;

                    const radiantDir = cache.radiantDir;

                    if (radiantDir) {
                        // SHOWER MODE — meteors radiate from the shower's radiant point
                        // Build an orthonormal basis around the radiant direction
                        _perpA.set(1, 0, 0);
                        if (Math.abs(radiantDir.dot(_perpA)) > 0.9) _perpA.set(0, 1, 0);
                        _perpB.crossVectors(radiantDir, _perpA).normalize();
                        _perpA.crossVectors(_perpB, radiantDir).normalize();

                        // Random start position 23°–52° from the radiant
                        const spreadAngle = 0.4 + Math.random() * 0.5;
                        const rotAngle = Math.random() * Math.PI * 2;

                        _startDir
                            .copy(radiantDir)
                            .addScaledVector(_perpA, Math.sin(spreadAngle) * Math.cos(rotAngle))
                            .addScaledVector(_perpB, Math.sin(spreadAngle) * Math.sin(rotAngle))
                            .normalize();

                        m.startPos.copy(_startDir).multiplyScalar(90);

                        // Direction: away from radiant with a small angular spread
                        _awayDir.copy(_startDir).sub(radiantDir).normalize();
                        _perturbation.set(
                            (Math.random() - 0.5) * 0.12,
                            (Math.random() - 0.5) * 0.12,
                            (Math.random() - 0.5) * 0.12,
                        );
                        _awayDir.add(_perturbation).normalize();
                        m.endPos.copy(m.startPos).add(_awayDir.multiplyScalar(m.length));

                        // Higher shower activity → shorter wait between meteors
                        m.waitDelay = (Math.random() * 12 + 3) / Math.max(0.3, cache.activityFactor);
                    } else {
                        // RANDOM MODE — generic sporadic meteors
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI * 0.4;
                        m.startPos.setFromSphericalCoords(90, phi, theta);

                        const dir = new THREE.Vector3(
                            (Math.random() - 0.5) * 0.5,
                            -1 - Math.random(),
                            (Math.random() - 0.5) * 0.5,
                        ).normalize();
                        m.endPos.copy(m.startPos).add(dir.multiplyScalar(m.length));

                        m.waitDelay = Math.random() * 15 + 5;
                    }

                    // eslint-disable-next-line react-hooks/immutability
                    opacityArray[i] = 0;
                    needUpdate = true;
                }
            } else {
                m.progress += delta * m.speed;

                if (m.progress > 1.0) {
                    m.active = false;
                    dummy.scale.setScalar(0);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                    opacityArray[i] = 0;
                    needUpdate = true;
                } else {
                    const currentPos = new THREE.Vector3().lerpVectors(m.startPos, m.endPos, m.progress);
                    dummy.position.copy(currentPos);
                    dummy.lookAt(m.endPos);
                    dummy.scale.set(0.15, 0.15, m.length);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);

                    // Fast fade-in (first 10%), slow fade-out (remaining 90%)
                    const op = m.progress < 0.1
                        ? m.progress * 10
                        : 1.0 - (m.progress - 0.1) / 0.9;

                    opacityArray[i] = op;
                    needUpdate = true;
                }
            }
        }

        if (needUpdate) {
            meshRef.current.instanceMatrix.needsUpdate = true;
            meshRef.current.geometry.attributes.instanceOpacity.needsUpdate = true;
        }
    });

    const geomRef = useRef<THREE.CylinderGeometry>(null);
    useEffect(() => {
        if (geomRef.current) {
            geomRef.current.rotateX(Math.PI / 2);
        }
    }, []);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, METEOR_COUNT]} renderOrder={80}>
            <cylinderGeometry ref={geomRef} args={[1, 1, 1, 8, 1, true]}>
                <instancedBufferAttribute attach="attributes-instanceOpacity" args={[opacityArray, 1]} />
            </cylinderGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
}
