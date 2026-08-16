'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';
import { sunHorRef } from '@/lib/skyRefs';

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
        const visible = alt > -18 && alt < 12;

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
            {/* ── Suelo Profundo ─── */}
            <mesh
                position={[0, -0.05, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={2}
            >
                <circleGeometry args={[120, 64]} />
                <meshBasicMaterial
                    color="#010205"
                    side={THREE.FrontSide}
                    depthWrite={true}
                    transparent
                    opacity={0.98}
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
    const r = 92;
    const x = r * Math.sin(rad);
    const z = -r * Math.cos(rad);
    const isMain = label.length === 1;
    
    return (
        <Html position={[x, isMain ? 1.8 : 0.8, z]} center zIndexRange={[10, 0]}>
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
