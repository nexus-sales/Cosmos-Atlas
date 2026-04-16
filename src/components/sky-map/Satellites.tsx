'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as satellite from 'satellite.js';
import { useAppStore } from '@/stores/useAppStore';

interface SatelliteData {
    name: string;
    tle1: string;
    tle2: string;
    color: string;
    size: number;
}

type RenderKind = 'special' | 'starlink';
type SatellitePoint = {
    name: string;
    satrec: satellite.SatRec;
    color: string;
    size: number;
    kind: RenderKind;
};

const SATELLITES_TLE: SatelliteData[] = [
    {
        name: 'ISS (Zarya)',
        tle1: '1 25544U 98067A   26054.56458333  .00015000  00000-0  25000-3 0  9999',
        tle2: '2 25544  51.6400 123.4500 0005000 270.0000 180.0000 15.5000000000001',
        color: '#ffffff',
        size: 3.5
    },
    {
        name: 'Hubble Space Telescope',
        tle1: '1 20580U 90037B   26054.50000000  .00001000  00000-0  10000-3 0  9999',
        tle2: '2 20580  28.4700 250.1200 0003000 150.0000 210.0000 15.1000000000001',
        color: '#aaddff',
        size: 2.0
    }
];

const RADIUS = 95;
const MAX_SATS = 6000;
const STARLINK_CAP_BY_QUALITY = {
    high: 2000,
    medium: 900,
    low: 350,
} as const;
const UPDATE_SKIP_BY_QUALITY = {
    high: 0,
    medium: 1,
    low: 2,
} as const;

export default function Satellites() {
    const pointsRef = useRef<THREE.Points>(null);
    const renderedSatsRef = useRef<SatellitePoint[]>([]);
    const prevVisibleRef = useRef({ special: -1, starlink: -1 });
    const frameCounterRef = useRef(0);
    // showSatellites/showStarlink drive JSX conditionals → subscribe normally
    const showSatellites = useAppStore((state) => state.settings.showSatellites);
    const showStarlink = useAppStore((state) => state.settings.showStarlink);
    const deviceQuality = useAppStore((state) => state.deviceQuality);
    const setSatelliteInfo = useAppStore((state) => state.setSatelliteInfo);
    const [hoveredSat, setHoveredSat] = useState<{
        name: string;
        color: string;
        position: [number, number, number];
    } | null>(null);

    const [specialSats, setSpecialSats] = useState<SatellitePoint[]>([]);
    const [starlinkSats, setStarlinkSats] = useState<SatellitePoint[]>([]);

    // Pre-cached RGB values to avoid new THREE.Color() allocations every frame
    const satColorsRef = useRef<{ r: number; g: number; b: number }[]>([]);
    const nightColorsRef = useRef<{ r: number; g: number; b: number }[]>([]);
    const colorCache = useRef(new THREE.Color());

    // ── GMST cache: recalcular máximo 1 vez/segundo, no 60 veces/segundo ───
    const gmstCacheRef = useRef<{ value: number; ts: number }>({ value: 0, ts: 0 });

    function getCachedGmst(time: Date): number {
        const now = time.getTime();
        if (now - gmstCacheRef.current.ts > 1000) {
            gmstCacheRef.current.value = satellite.gstime(time);
            gmstCacheRef.current.ts = now;
        }
        return gmstCacheRef.current.value;
    }

    // ── Fetch robusto: timeout 8s + 2 reintentos con backoff ────────────────
    async function fetchWithTimeout(url: string, timeoutMs = 8000, retries = 2): Promise<string> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timer);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.text();
            } catch (err) {
                clearTimeout(timer);
                if (attempt === retries) throw err;
                // Backoff exponencial: 1s, 2s
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
        throw new Error('fetchWithTimeout: agotados los reintentos');
    }

    // ── 1. Carga de TLEs ────────────────────────────────────────────────────
    useEffect(() => {
        // ISS y Hubble desde TLEs hardcodeados como fallback inmediato
        const initial = SATELLITES_TLE.map(s => ({
            name: s.name,
            satrec: satellite.twoline2satrec(s.tle1, s.tle2),
            color: s.color,
            size: s.size,
            kind: 'special' as const
        }));
        setSpecialSats(initial);
        setSatelliteInfo({ loadedSpecial: initial.length });

        // Intentar actualizar ISS con TLE real via proxy interno (evita 403 de Celestrak)
        const issUrl = '/api/tle/iss';
        fetchWithTimeout(issUrl)
            .then(t => {
                const lines = t.split('\n').filter(l => l.trim().length > 0);
                if (lines.length >= 3) {
                    setSpecialSats(prev => [
                        {
                            name: lines[0].trim(),
                            satrec: satellite.twoline2satrec(lines[1], lines[2]),
                            color: '#ffffff',
                            size: 4.0,
                            kind: 'special'
                        },
                        ...prev.filter(s => !s.name.includes('ISS'))
                    ]);
                }
            })
            .catch(() => {
                // Sin red: los TLEs de fallback ya están cargados, no se hace nada
            });
    }, [setSatelliteInfo]);

    useEffect(() => {
        setSatelliteInfo({ loadedSpecial: specialSats.length });
    }, [setSatelliteInfo, specialSats.length]);

    // Rebuild color cache whenever satellite lists change (avoid per-frame allocations)
    useEffect(() => {
        const allSats = [...specialSats, ...starlinkSats];
        satColorsRef.current = allSats.map(sat => {
            const c = colorCache.current.set(sat.color);
            return { r: c.r, g: c.g, b: c.b };
        });
        nightColorsRef.current = allSats.map(() => {
            const c = colorCache.current.set('#ff0000');
            return { r: c.r, g: c.g, b: c.b };
        });
    }, [specialSats, starlinkSats]);

    const allSats = useMemo(() => [...specialSats, ...starlinkSats], [specialSats, starlinkSats]);

    useEffect(() => {
        if (!showStarlink) {
            setStarlinkSats([]);
            setSatelliteInfo({ loadedStarlink: 0, visibleStarlink: 0, starlinkStatus: 'idle' });
            return;
        }
        setSatelliteInfo({ starlinkStatus: 'loading' });

        // Fetch Starlink via proxy interno (evita 403 de Celestrak desde el browser)
        const starlinkUrl = '/api/tle/starlink';
        fetchWithTimeout(starlinkUrl)
            .then(text => {
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                const records = [];
                for (let i = 0; i < lines.length; i += 3) {
                    if (lines[i + 1] && lines[i + 2]) {
                        records.push({
                            name: lines[i].trim(),
                            satrec: satellite.twoline2satrec(lines[i + 1], lines[i + 2]),
                            color: '#88aaff',
                            size: 1.2,
                            kind: 'starlink' as const
                        });
                    }
                }
                // Limitar por calidad de dispositivo para reducir calor/jank en móviles
                const cap = STARLINK_CAP_BY_QUALITY[useAppStore.getState().deviceQuality];
                const capped = records.slice(0, cap);
                setStarlinkSats(capped);
                setSatelliteInfo({ loadedStarlink: capped.length, starlinkStatus: 'ok' });
            })
            .catch(() => {
                setStarlinkSats([]);
                setSatelliteInfo({ loadedStarlink: 0, visibleStarlink: 0, starlinkStatus: 'error' });
            });
    }, [setSatelliteInfo, showStarlink]);

    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SATS * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SATS * 3), 3));
        geom.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_SATS), 1));

        const mat = new THREE.PointsMaterial({
            size: 3.2,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            sizeAttenuation: false,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
            blending: THREE.AdditiveBlending
        });

        return [geom, mat];
    }, []);

    // ── 2. Loop de Propagación y Culling ────────────────────────────────────
    useFrame(() => {
        if (!pointsRef.current || !showSatellites) {
            if (pointsRef.current) pointsRef.current.visible = false;
            return;
        }
        pointsRef.current.visible = true;
        frameCounterRef.current += 1;
        const skip = UPDATE_SKIP_BY_QUALITY[deviceQuality];
        if (skip > 0 && frameCounterRef.current % (skip + 1) !== 0) return;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

        let count = 0;
        let visibleSpecial = 0;
        let visibleStarlink = 0;
        // Read time/observer/nightMode from store without subscribing to re-renders
        const { time: currentTime, observer: currentObserver, settings } = useAppStore.getState();
        const isNight = settings.nightMode;
        // GMST cacheado: se recalcula 1 vez/segundo, no 60 veces/segundo
        const gmst = getCachedGmst(currentTime);
        const observerGd = {
            longitude: satellite.degreesToRadians(currentObserver.lon),
            latitude: satellite.degreesToRadians(currentObserver.lat),
            height: 0
        };

        const cachedColors = isNight ? nightColorsRef.current : satColorsRef.current;
        renderedSatsRef.current.length = 0;

        allSats.forEach((sat, satIdx) => {
            if (count >= MAX_SATS) return;

            const pv = satellite.propagate(sat.satrec, currentTime);
            if (!pv || !pv.position) return;

            const posEci = pv.position as satellite.EciVec3<number>;
            const posEcf = satellite.eciToEcf(posEci, gmst);
            const look = satellite.ecfToLookAngles(observerGd, posEcf);

            // Solo si está por encima del horizonte
            if (look.elevation > THREE.MathUtils.degToRad(-5)) {
                // Convertir Alt/Az a coordenadas 3D en el espacio horizontal local.
                // Sistema de la escena (sin CelestialGroup):
                //   +Y = cénit, +X = Este, -Z = Norte (frente del observador)
                // Acimut: 0=Norte, 90=Este, 180=Sur, 270=Oeste (en radianes)
                const el = look.elevation; // radianes
                const az = look.azimuth;   // radianes, 0=N, π/2=E
                const cosEl = Math.cos(el);
                // X = Este, Y = Cénit, Z = Norte (negativo porque -Z es Norte en R3F)
                const x3 = cosEl * Math.sin(az) * RADIUS; // Este
                const y3 = Math.sin(el) * RADIUS; // Cénit
                const z3 = -cosEl * Math.cos(az) * RADIUS; // Norte → -Z
                posAttr.setXYZ(count, x3, y3, z3);

                // Use pre-cached colors — no new THREE.Color() per frame
                const cachedColor = cachedColors[satIdx];
                if (cachedColor) {
                    colAttr.setXYZ(count, cachedColor.r, cachedColor.g, cachedColor.b);
                }
                sizAttr.setX(count, sat.size);
                renderedSatsRef.current[count] = sat;
                if (sat.kind === 'special') visibleSpecial++;
                else visibleStarlink++;
                count++;
            }
        });

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;

        if (
            visibleSpecial !== prevVisibleRef.current.special ||
            visibleStarlink !== prevVisibleRef.current.starlink
        ) {
            prevVisibleRef.current.special = visibleSpecial;
            prevVisibleRef.current.starlink = visibleStarlink;
            useAppStore.getState().setSatelliteInfo({
                visibleSpecial,
                visibleStarlink,
            });
        }
    });

    return (
        <>
            <points
                ref={pointsRef}
                geometry={geometry}
                material={material}
                renderOrder={6}
                onPointerMove={(e) => {
                    if (e.index === undefined) return;
                    const sat = renderedSatsRef.current[e.index];
                    if (!sat) return;
                    setHoveredSat({
                        name: sat.name,
                        color: sat.color,
                        position: [e.point.x, e.point.y, e.point.z],
                    });
                }}
                onPointerOut={() => setHoveredSat(null)}
            />
            {hoveredSat && (
                <Html position={hoveredSat.position} distanceFactor={120} zIndexRange={[90, 0]}>
                    <div
                        className="accent-label pointer-events-none whitespace-nowrap rounded border bg-[#020814]/90 px-2 py-1 text-[10px] font-bold font-mono tracking-[0.6px] -translate-x-1/2 -translate-y-5"
                        style={{
                            '--accent-color': hoveredSat.color,
                            '--accent-border': `${hoveredSat.color}66`,
                        } as CSSProperties}
                    >
                        {hoveredSat.name}
                    </div>
                </Html>
            )}
        </>
    );
}
