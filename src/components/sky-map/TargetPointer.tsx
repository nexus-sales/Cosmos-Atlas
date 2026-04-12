'use client';

import { useRef, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const RADIUS = 88;

/** Crosshair + anillos pulsantes que señalan el objeto objetivo en la bóveda celeste */
export default function TargetPointer() {
    const targetedObject = useAppStore((s) => s.targetedObject);

    const groupRef = useRef<THREE.Group>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const ring3Ref = useRef<THREE.Mesh>(null);

    // Posición 3D del objetivo en el espacio equatorial (dentro de CelestialGroup)
    const position = useMemo<[number, number, number] | null>(() => {
        if (!targetedObject) return null;
        return equatorialTo3D(targetedObject.ra, targetedObject.dec, RADIUS);
    }, [targetedObject]);

    // Orientar el grupo para que los anillos (en el plano XY) miren al centro (0,0,0)
    useEffect(() => {
        if (!groupRef.current || !position) return;
        const dir = new THREE.Vector3(-position[0], -position[1], -position[2]).normalize();
        groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    }, [position]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        if (ring1Ref.current) {
            const p = (Math.sin(t * 2.5) * 0.5 + 0.5);
            ring1Ref.current.scale.setScalar(1 + p * 0.5);
            (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.9 - p * 0.6;
        }
        if (ring2Ref.current) {
            const p = (Math.sin(t * 2.5 - Math.PI * 0.6) * 0.5 + 0.5);
            ring2Ref.current.scale.setScalar(1 + p * 0.5);
            (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.65 - p * 0.45;
        }
        if (ring3Ref.current) {
            const p = (Math.sin(t * 2.5 - Math.PI * 1.2) * 0.5 + 0.5);
            ring3Ref.current.scale.setScalar(1 + p * 0.5);
            (ring3Ref.current.material as THREE.MeshBasicMaterial).opacity = 0.40 - p * 0.30;
        }
    });

    if (!targetedObject || !position) return null;

    const isGalaxy = 'type' in targetedObject && (targetedObject as { type: string }).type === 'galaxy';
    const isNebula = 'type' in targetedObject && (targetedObject as { type: string }).type === 'nebula';
    const isPlanet = 'kind' in targetedObject && (targetedObject as { kind: string }).kind === 'planet';
    const isConstellation = isPlanet && (targetedObject as { symbol: string }).symbol === '\u2736';



    const accentColor = isGalaxy ? '#f59e0b'
        : isNebula ? '#34d399'
            : isConstellation ? '#818cf8'
                : isPlanet ? '#00f2ff' // Usar cyan tecnológico siempre para planetas
                    : '#60a5fa';

    return (
        <group position={position}>
            {/* Grupo orientado para que los elementos 2D miren al centro de la esfera */}
            <group ref={groupRef}>

                {/* Anillo fijo (crosshair base) */}
                <mesh renderOrder={10}>
                    <ringGeometry args={[0.90, 1.05, 64]} />
                    <meshBasicMaterial
                        color={accentColor}
                        transparent opacity={0.9}
                        side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>

                {/* Cruces del crosshair */}
                {([0, 90, 180, 270] as const).map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    const ix = Math.cos(rad) * 1.5;
                    const iy = Math.sin(rad) * 1.5;
                    return (
                        <mesh key={angle} position={[ix, iy, 0]} renderOrder={10}>
                            <planeGeometry args={[0.08, 0.45]} />
                            <meshBasicMaterial
                                color={accentColor}
                                transparent opacity={0.7}
                                side={THREE.DoubleSide} depthWrite={false}
                                rotation-z={rad}
                            />
                        </mesh>
                    );
                })}

                {/* Onda 1 */}
                <mesh ref={ring1Ref} renderOrder={9}>
                    <ringGeometry args={[1.10, 1.22, 64]} />
                    <meshBasicMaterial
                        color={accentColor}
                        transparent opacity={0.9}
                        side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>

                {/* Onda 2 */}
                <mesh ref={ring2Ref} renderOrder={8}>
                    <ringGeometry args={[1.10, 1.20, 64]} />
                    <meshBasicMaterial
                        color={accentColor}
                        transparent opacity={0.65}
                        side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>

                {/* Onda 3 */}
                <mesh ref={ring3Ref} renderOrder={7}>
                    <ringGeometry args={[1.10, 1.18, 64]} />
                    <meshBasicMaterial
                        color={accentColor}
                        transparent opacity={0.40}
                        side={THREE.DoubleSide} depthWrite={false}
                    />
                </mesh>
            </group>

            {/* Etiqueta HTML — no rota con el grupo */}
            <Html
                distanceFactor={9}
                className="pointer-events-none select-none"
                center
            >
                <div
                    className="accent-label-strong mt-10 font-mono text-[14px] font-black tracking-widest uppercase whitespace-nowrap bg-[#020617] px-3 py-1.5 rounded-lg border-2"
                    style={{
                        '--accent-color': accentColor,
                        '--accent-border': `${accentColor}88`,
                        color: accentColor,
                    } as CSSProperties}
                >
                    {targetedObject.name}
                </div>
            </Html>
        </group>
    );
}
