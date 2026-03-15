'use client';

import * as THREE from 'three';
import { Html } from '@react-three/drei';

import { useAppStore } from '@/stores/useAppStore';

/**
 * Horizonte en espacio MUNDO (sin rotación con el cielo).
 */
export default function Horizon() {
    const viewMode = useAppStore(s => s.viewMode);

    if (viewMode === 'camera') return null;

    return (
        <group>
            {/* ── Suelo opaco — oculta estrellas bajo el horizonte ─── */}
            <mesh
                position={[0, -0.3, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={2}
            >
                <circleGeometry args={[110, 72]} />
                <meshBasicMaterial
                    color="#04091a"
                    side={THREE.FrontSide}
                    depthWrite={true}
                />
            </mesh>

            {/* ── Línea del horizonte ───────────────────────────────── */}
            <mesh
                position={[0, -0.25, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={3}
            >
                <ringGeometry args={[89.5, 90.5, 128]} />
                <meshBasicMaterial color="#1a3a5a" transparent opacity={0.5} />
            </mesh>

            {/* ── Puntos cardinales (espacio mundo: N = −Z) ────────── */}
            <CardinalPoint label="N" az={0} color="#ff5555" />
            <CardinalPoint label="NE" az={45} color="#7799cc" />
            <CardinalPoint label="E" az={90} color="#99bbff" />
            <CardinalPoint label="SE" az={135} color="#7799cc" />
            <CardinalPoint label="S" az={180} color="#8888ff" />
            <CardinalPoint label="SO" az={225} color="#7799cc" />
            <CardinalPoint label="O" az={270} color="#99bbff" />
            <CardinalPoint label="NO" az={315} color="#7799cc" />
        </group>
    );
}

/**
 * Punto cardinal: az en grados (0=Norte, 90=Este, sentido horario).
 * En espacio mundo, Norte geográfico = −Z.
 */
function CardinalPoint({ label, az, color }: { label: string; az: number; color: string }) {
    const rad = THREE.MathUtils.degToRad(az);
    const r = 90;
    const x = r * Math.sin(rad);
    const z = -r * Math.cos(rad);
    const isMain = label.length === 1;
    return (
        <Html position={[x, isMain ? 2.5 : 1.2, z]} zIndexRange={[10, 0]}>
            <div style={{
                color,
                fontSize: isMain ? '14px' : '10px',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                letterSpacing: isMain ? '2px' : '1px',
                textShadow: `0 0 10px ${color}`,
                pointerEvents: 'none',
                userSelect: 'none',
                transform: 'translateX(-50%)',
                opacity: isMain ? 0.9 : 0.55,
            }}>
                {label}
            </div>
        </Html>
    );
}
