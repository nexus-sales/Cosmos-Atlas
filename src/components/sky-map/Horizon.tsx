'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { sunHorRef, terrainHorizonRef } from '@/lib/skyRefs';
import type { HorizonBand, HorizonPoint } from '@/lib/astronomy/horizonProfile';

const DEFAULT_FLAT_PROFILE: HorizonPoint[] = Array.from({ length: 72 }, (_, index) => ({
    azimuth: index * 5,
    altitude: 0,
}));

function terrainGeometry(profile: HorizonPoint[], radius: number) {
    const result = new THREE.BufferGeometry();
    const effectiveProfile = profile.length >= 3 ? profile : DEFAULT_FLAT_PROFILE;
    const positions: number[] = [];
    const indices: number[] = [];
    const closed = [...effectiveProfile, { ...effectiveProfile[0], azimuth: 360 }];
    closed.forEach((point) => {
        const az = THREE.MathUtils.degToRad(point.azimuth);
        const topAlt = THREE.MathUtils.degToRad(point.altitude);
        for (const altitude of [-89 * Math.PI / 180, topAlt]) {
            positions.push(
                radius * Math.cos(altitude) * Math.sin(az),
                radius * Math.sin(altitude),
                -radius * Math.cos(altitude) * Math.cos(az),
            );
        }
    });
    for (let index = 0; index < closed.length - 1; index++) {
        const base = index * 2;
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
    // Cierre inferior en el nadir (altitud -90°)
    const nadirIndex = positions.length / 3;
    positions.push(0, -radius, 0);
    for (let index = 0; index < closed.length - 1; index++) {
        const base = index * 2;
        indices.push(nadirIndex, base, base + 2);
    }

    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
}

function TerrainBandMesh({ band, index, nightMode }: { band: HorizonBand; index: number; nightMode: boolean }) {
    // Radio menor que la bóveda celeste (91-99) para que el relieve ocluya físicamente objetos
    const radius = 78.0 + index * 0.6;
    const geometry = useMemo(() => terrainGeometry(band.profile, radius), [band.profile, radius]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    const dayColors = ['#071019', '#0a1620', '#10202a', '#172b35'];
    const nightColors = ['#050000', '#080101', '#0c0202', '#120303'];
    return (
        <mesh geometry={geometry} renderOrder={200 + index}>
            <meshBasicMaterial
                color={(nightMode ? nightColors : dayColors)[index] ?? '#08111a'}
                side={THREE.DoubleSide}
                depthWrite
                depthTest
            />
        </mesh>
    );
}

function TerrainHorizon() {
    const observer = useAppStore((state) => state.observer);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const [profile, setProfile] = useState<HorizonPoint[]>([]);
    const [bands, setBands] = useState<HorizonBand[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                // GLO-90 no aporta precision util por debajo de ~90 m.
                const query = new URLSearchParams({ lat: observer.lat.toFixed(3), lon: observer.lon.toFixed(3) });
                const response = await fetch(`/api/horizon-profile?${query}`, { signal: controller.signal });
                const payload = await response.json() as { profile?: HorizonPoint[]; bands?: HorizonBand[] };
                if (!response.ok || !payload.profile) throw new Error('Relieve no disponible');
                setProfile(payload.profile);
                setBands(payload.bands ?? []);
                terrainHorizonRef.current = payload.profile;
                setLoaded(true);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setProfile([]);
                    setBands([]);
                    terrainHorizonRef.current = [];
                    setLoaded(false);
                }
            }
        }, 700);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [observer.lat, observer.lon]);

    const activeProfile = profile.length >= 3 ? profile : DEFAULT_FLAT_PROFILE;
    const fallbackGeometry = useMemo(() => terrainGeometry(activeProfile, 78.0), [activeProfile]);

    useEffect(() => () => fallbackGeometry.dispose(), [fallbackGeometry]);

    return (
        <>
            {bands.length > 0 && profile.length >= 3
                ? bands.map((band, index) => (
                    <TerrainBandMesh key={band.maxDistanceKm} band={band} index={index} nightMode={nightMode} />
                ))
                : (
                    <mesh geometry={fallbackGeometry} renderOrder={200}>
                        <meshBasicMaterial
                            color={nightMode ? '#070000' : '#07101a'}
                            side={THREE.DoubleSide}
                            depthWrite
                            depthTest
                        />
                    </mesh>
                )
            }
            {loaded && (
                <Html fullscreen zIndexRange={[6, 0]}>
                    <div className="pointer-events-none absolute left-3 top-9 rounded border border-white/10 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55 backdrop-blur-sm">
                        Relieve real · Copernicus DEM 90 m
                    </div>
                </Html>
            )}
        </>
    );
}

/**
 * Resplandor direccional en el horizonte durante el crepúsculo.
 * Visible cuando el Sol está entre −18° y +12° de altitud.
 * El abanico de luz apunta hacia el azimut solar.
 */
function SunriseGlow() {
    const meshRef  = useRef<THREE.Mesh>(null);
    const mesh2Ref = useRef<THREE.Mesh>(null);

    // Abanico horizontal (fan en el plano XZ) — 120° de apertura
    const fanGeom = useMemo(() => {
        const segments = 24;
        const halfAngle = Math.PI * (60 / 180); // 60° a cada lado
        const r = 92;
        const verts: number[] = [];
        const idx: number[] = [];

        verts.push(0, 1, 0); // apex ligeramente sobre el horizonte
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const a = -halfAngle + t * 2 * halfAngle;
            verts.push(Math.sin(a) * r, 0, -Math.cos(a) * r);
        }
        for (let i = 0; i < segments; i++) idx.push(0, i + 1, i + 2);

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        g.setIndex(idx);
        return g;
    }, []);

    // Haz vertical más estrecho — efecto columna de luz
    const beamGeom = useMemo(() => {
        const r = 88;
        const halfW = Math.PI * (18 / 180);
        const h = 30;
        const verts = [
            0, h, 0,
            Math.sin(-halfW) * r, 0, -Math.cos(-halfW) * r,
            Math.sin(halfW) * r, 0, -Math.cos(halfW) * r,
        ];
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        g.setIndex([0, 1, 2]);
        return g;
    }, []);

    useFrame(() => {
        const { alt, az } = sunHorRef;
        // Este abanico aditivo producía grandes triángulos naranjas. El
        // crepúsculo continuo se calcula ahora dentro de AtmosphericSky.
        const visible = false;

        [meshRef.current, mesh2Ref.current].forEach(m => {
            if (m) m.visible = visible;
        });
        if (!visible) return;

        // Intensidad: máxima en alt=0, cero en los extremos
        const t = alt < 0 ? 1 + alt / 18 : 1 - alt / 12;
        const intensity = Math.max(0, Math.pow(t, 1.4));

        const azRad = -THREE.MathUtils.degToRad(az);
        if (meshRef.current) {
            meshRef.current.rotation.y = azRad;
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = intensity * 0.28;
        }
        if (mesh2Ref.current) {
            mesh2Ref.current.rotation.y = azRad;
            (mesh2Ref.current.material as THREE.MeshBasicMaterial).opacity = intensity * 0.40;
        }
    });

    return (
        <>
            {/* Abanico amplio */}
            <mesh ref={meshRef} geometry={fanGeom} renderOrder={3}>
                <meshBasicMaterial
                    color="#ff6622"
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            {/* Haz central más brillante */}
            <mesh ref={mesh2Ref} geometry={beamGeom} renderOrder={4}>
                <meshBasicMaterial
                    color="#ffaa44"
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </>
    );
}

/**
 * Horizonte en espacio MUNDO (sin rotación con el cielo).
 */
/**
 * Horizonte Premium: 
 * Reemplaza la línea simple por un gradiente atmosférico y un suelo con más estilo.
 */
export default function Horizon() {
    const viewMode = useAppStore(s => s.viewMode);
    const nightMode = useAppStore(s => s.settings.nightMode);

    if (viewMode === 'camera') return null;

    const accentColor = nightMode ? '#ff3333' : '#1a3a5a';

    return (
        <group>
            <SunriseGlow />
            <TerrainHorizon />
            {/* ── Suelo Profundo ─── */}
            <mesh
                position={[0, -0.05, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={199}
            >
                <circleGeometry args={[77, 64]} />
                <meshBasicMaterial
                    color="#010205"
                    side={THREE.FrontSide}
                    depthWrite={true}
                    depthTest={true}
                />
            </mesh>

            {/* ── Extinción Atmosférica / Gradiente de Horizonte ─── */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} renderOrder={1}>
                <ringGeometry args={[99, 105, 128]} />
                <meshBasicMaterial
                    color={nightMode ? '#220000' : '#1e3a5a'}
                    transparent
                    opacity={0.8}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                />
            </mesh>

            {/* ── Calima / Haze Atmosférico (borde del horizonte) ─── */}
            <mesh
                position={[0, -0.2, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={4}
            >
                <ringGeometry args={[85, 115, 128]} />
                <meshBasicMaterial 
                    color={accentColor} 
                    transparent 
                    opacity={0.3} 
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* ── Capa de dispersión secundaria (Rayleigh) ─── */}
            <mesh
                position={[0, -0.1, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={5}
            >
                <ringGeometry args={[90, 105, 128]} />
                <meshBasicMaterial 
                    color={nightMode ? '#ff1111' : '#4ba3e3'} 
                    transparent 
                    opacity={0.25} 
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* ── Puntos cardinales mejorados ────────── */}
            <CardinalPoint label="N" az={0} color={nightMode ? "#ff4444" : "#ff5555"} isNorth />
            <CardinalPoint label="NE" az={45} color="#6688aa" />
            <CardinalPoint label="E" az={90} color="#88aaee" />
            <CardinalPoint label="SE" az={135} color="#6688aa" />
            <CardinalPoint label="S" az={180} color="#7777ee" />
            <CardinalPoint label="SO" az={225} color="#6688aa" />
            <CardinalPoint label="O" az={270} color="#88aaee" />
            <CardinalPoint label="NO" az={315} color="#6688aa" />
        </group>
    );
}

function CardinalPoint({ label, az, color, isNorth }: { label: string; az: number; color: string; isNorth?: boolean }) {
    const rad = THREE.MathUtils.degToRad(az);
    const r = 77;
    const x = r * Math.sin(rad);
    const z = -r * Math.cos(rad);
    const isMain = label.length === 1;
    
    return (
        <Html position={[x, isMain ? 1.5 : 0.6, z]} center zIndexRange={[10, 0]}>
            <div 
                className={cn(
                    "flex flex-col items-center pointer-events-none select-none transition-all duration-500",
                    isMain ? "opacity-90 scale-100" : "opacity-40 scale-[0.85]"
                )}
                style={{ color }}
            >
                <div 
                    className={cn(
                        "font-sans tracking-widest",
                        isNorth ? "font-[900]" : "font-[600]"
                    )}
                    style={{
                        fontSize: isMain ? '18px' : '11px',
                        textShadow: `0 0 15px ${color}66, 0 0 30px ${color}33`,
                    }}
                >
                    {label}
                </div>
                {isMain && (
                    <div 
                        className="w-1 h-1 rounded-full mt-1" 
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} 
                    />
                )}
            </div>
        </Html>
    );
}
