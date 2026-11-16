'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { lodForFov } from '@/lib/astronomy/skyZoom';
import { findNamedStarNear } from '@/lib/astronomy/starIdentification';

interface GaiaSource {
    sourceId: string;
    healpix8: number;
    ra: number;
    dec: number;
    mag: number;
    bpRp: number | null;
    pmRa: number | null;
    pmDec: number | null;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
const RADIUS = 97.8;

function gaiaColor(bpRp: number | null) {
    const value = THREE.MathUtils.clamp(bpRp ?? 0.8, -0.5, 3.5);
    if (value < 0) return '#a9c8ff';
    if (value < 0.8) return new THREE.Color('#dce8ff').lerp(new THREE.Color('#fff5dc'), value / 0.8).getStyle();
    return new THREE.Color('#fff5dc').lerp(new THREE.Color('#ff8d55'), (value - 0.8) / 2.7).getStyle();
}

function applyProperMotion(source: GaiaSource, date: Date) {
    const years = (date.getTime() - Date.UTC(2016, 0, 1, 12)) / 31_557_600_000;
    const cosDec = Math.max(0.05, Math.cos(THREE.MathUtils.degToRad(source.dec)));
    return {
        ra: source.ra + ((source.pmRa ?? 0) * years) / (3_600_000 * cosDec),
        dec: source.dec + ((source.pmDec ?? 0) * years) / 3_600_000,
    };
}

const gaiaVertexShader = `
    attribute float starSize;
    attribute float brightness;
    varying vec3 vColor;
    varying float vBrightness;
    uniform float uPixelRatio;
    void main() {
        vColor = color;
        vBrightness = brightness;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = starSize * uPixelRatio;
    }
`;

const gaiaFragmentShader = `
    varying vec3 vColor;
    varying float vBrightness;
    uniform float uOpacity;
    void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        if (radius > 0.5) discard;
        float core = 1.0 - smoothstep(0.05, 0.34, radius);
        float halo = 1.0 - smoothstep(0.16, 0.5, radius);
        float alpha = (core + halo * 0.32) * vBrightness * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
    }
`;

function angularDistance(a: { ra: number; dec: number }, b: { ra: number; dec: number }) {
    const av = new THREE.Vector3(...equatorialTo3D(a.ra, a.dec, 1));
    const bv = new THREE.Vector3(...equatorialTo3D(b.ra, b.dec, 1));
    return THREE.MathUtils.radToDeg(av.angleTo(bv));
}

export default function GaiaStars() {
    const camFov = useAppStore((state) => state.camFov);
    const quality = useAppStore((state) => state.deviceQuality);
    const date = useAppStore((state) => state.timeMinute);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const catalogStars = useCatalog((state) => state.stars);
    const { camera, raycaster, gl } = useThree();
    const pointsRef = useRef<THREE.Points>(null);
    const frameRef = useRef(0);
    const lastCenterRef = useRef<{ ra: number; dec: number } | null>(null);
    const [center, setCenter] = useState<{ ra: number; dec: number } | null>(null);
    const [sources, setSources] = useState<GaiaSource[]>([]);
    const [loadState, setLoadState] = useState<LoadState>('idle');
    const lod = useMemo(() => {
        const base = lodForFov(camFov, quality);
        if (!base) return null;
        const pollutionPenalty = (bortleScale - 1) * 0.55;
        const densityFactor = THREE.MathUtils.lerp(1, 0.28, (bortleScale - 1) / 8);
        return {
            ...base,
            mag: Math.max(8, base.mag - pollutionPenalty),
            limit: Math.max(100, Math.round(base.limit * densityFactor)),
        };
    }, [bortleScale, camFov, quality]);

    useFrame(() => {
        if (!lod || !pointsRef.current?.parent || frameRef.current++ % 20 !== 0) return;
        const direction = camera.getWorldDirection(new THREE.Vector3());
        const parentQuaternion = pointsRef.current.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        direction.applyQuaternion(parentQuaternion).normalize();
        const next = {
            ra: (THREE.MathUtils.radToDeg(Math.atan2(direction.x, direction.z)) + 360) % 360,
            dec: THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1))),
        };
        if (!lastCenterRef.current || angularDistance(lastCenterRef.current, next) > lod.radius * 0.28) {
            lastCenterRef.current = next;
            setCenter(next);
        }
        raycaster.params.Points = { threshold: THREE.MathUtils.clamp(camFov * 0.035, 0.08, 0.65) };
    });

    useEffect(() => {
        if (!lod || !center) {
            setSources([]);
            setLoadState('idle');
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoadState('loading');
            try {
                const query = new URLSearchParams({ rev: '3', ra: center.ra.toFixed(5), dec: center.dec.toFixed(5), radius: lod.radius.toFixed(3), mag: String(lod.mag), limit: String(lod.limit) });
                const response = await fetch(`/api/gaia?${query}`, { signal: controller.signal });
                const payload = await response.json() as { sources?: GaiaSource[] };
                if (!response.ok || !payload.sources) throw new Error('Gaia no disponible');
                setSources(payload.sources);
                setLoadState('ready');
            } catch (error) {
                if ((error as Error).name !== 'AbortError') setLoadState('error');
            }
        }, 450);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [center, lod]);

    const geometry = useMemo(() => {
        const positions = new Float32Array(sources.length * 3);
        const colors = new Float32Array(sources.length * 3);
        const sizes = new Float32Array(sources.length);
        const brightness = new Float32Array(sources.length);
        sources.forEach((source, index) => {
            const position = applyProperMotion(source, date);
            positions.set(equatorialTo3D(position.ra, position.dec, RADIUS), index * 3);
            const color = new THREE.Color(gaiaColor(source.bpRp));
            colors.set([color.r, color.g, color.b], index * 3);
            sizes[index] = THREE.MathUtils.clamp(3.4 - (source.mag - 7) * 0.31, 0.65, 3.4);
            brightness[index] = THREE.MathUtils.clamp(1.05 - (source.mag - 7) * 0.075, 0.28, 1);
        });
        const result = new THREE.BufferGeometry();
        result.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        result.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        result.setAttribute('starSize', new THREE.BufferAttribute(sizes, 1));
        result.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
        return result;
    }, [date, sources]);

    useEffect(() => () => geometry.dispose(), [geometry]);
    if (!lod) return <points ref={pointsRef} visible={false} />;

    const selectSource = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (event.index === undefined) return;
        const source = sources[event.index];
        if (!source) return;
        const position = applyProperMotion(source, date);
        const namedStar = findNamedStarNear(position, catalogStars);
        if (namedStar) {
            setSelectedObject(namedStar);
            return;
        }
        setSelectedObject({
            name: `Fuente DR3 ${source.sourceId}`,
            ra: position.ra, dec: position.dec, mag: source.mag,
            magnitudeBand: 'G',
            constellation: `Catálogo Gaia DR3 · HEALPix 8/${source.healpix8}`,
            desc: `Estrella sin nombre propio registrado en el catálogo nominal de la app. Magnitud G (banda ancha). Fuente astrométrica Gaia DR3, época 2016.0. BP−RP ${source.bpRp?.toFixed(2) ?? 'sin dato'}; movimiento propio aplicado a la fecha mostrada.`,
            color: gaiaColor(source.bpRp), baseSize: 1, kind: 'star',
        });
    };

    return (
        <group>
            <points ref={pointsRef} geometry={geometry} onClick={selectSource} renderOrder={0}>
                <shaderMaterial
                    vertexColors
                    vertexShader={gaiaVertexShader}
                    fragmentShader={gaiaFragmentShader}
                    uniforms={{
                        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
                        uOpacity: { value: nightMode ? 0.48 : 0.76 },
                    }}
                    transparent
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                />
            </points>
            <Html fullscreen zIndexRange={[5, 0]}>
                <div className="pointer-events-none absolute bottom-4 left-4 rounded border border-white/10 bg-black/55 px-2 py-1 font-mono text-[8px] text-white/40 backdrop-blur-sm">
                    {loadState === 'loading' ? 'GAIA DR3 · consultando ESA…' : loadState === 'error' ? 'GAIA DR3 no disponible · Hipparcos activo' : `GAIA DR3 · LOD ${lod.level} · ${sources.length.toLocaleString('es-ES')} fuentes`}
                </div>
            </Html>
        </group>
    );
}
