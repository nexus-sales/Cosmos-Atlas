'use client';

import * as THREE from 'three';
import { Html } from '@react-three/drei';

import { useAppStore } from '@/stores/useAppStore';

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
                position={[0, -0.5, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={2}
            >
                <circleGeometry args={[120, 64]} />
                <meshBasicMaterial
                    color="#02040a"
                    side={THREE.FrontSide}
                    depthWrite={true}
                />
            </mesh>

            {/* ── Bruma de horizonte amplia: difumina la línea dura ─── */}
            <mesh
                position={[0, -0.3, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={3}
            >
                <ringGeometry args={[70, 118, 128]} />
                <meshBasicMaterial
                    color={nightMode ? '#0a0510' : '#1a3050'}
                    transparent
                    opacity={0.55}
                    side={THREE.DoubleSide}
                    blending={THREE.NormalBlending}
                    depthWrite={false}
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
                className="flex flex-col items-center pointer-events-none select-none transition-all duration-500"
                style={{
                    color,
                    opacity: isMain ? 0.9 : 0.4,
                    transform: `scale(${isMain ? 1 : 0.85})`,
                }}
            >
                <div style={{
                    fontSize: isMain ? '18px' : '11px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: isNorth ? '900' : '600',
                    letterSpacing: '0.1em',
                    textShadow: `0 0 15px ${color}66, 0 0 30px ${color}33`,
                }}>
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
