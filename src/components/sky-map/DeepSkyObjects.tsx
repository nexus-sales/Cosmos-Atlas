'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DSOS } from '@/data/dsos';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';
import { DSOType, DSO } from '@/types/celestial';
import { getDSOImage, preloadDSOImage } from '@/data/dsoImages';

function createDSOTexture(type: DSOType, color: string): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const c = size / 2;

    ctx.clearRect(0, 0, size, size);

    if (type === 'galaxy') {
        // Spiral galaxy look
        const g = ctx.createRadialGradient(c, c, 0, c, c, size / 2);
        g.addColorStop(0, color);
        g.addColorStop(0.2, color + 'aa');
        g.addColorStop(0.5, color + '22');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;

        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(Math.PI / 4);
        ctx.scale(1.8, 0.6); // Elliptical inclination
        ctx.beginPath();
        ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (type === 'nebula') {
        // Cloud-like amorphous look
        for (let i = 0; i < 6; i++) {
            const r = (Math.random() * 0.2 + 0.2) * size;
            const ox = (Math.random() - 0.5) * size * 0.4;
            const oy = (Math.random() - 0.5) * size * 0.4;
            const g = ctx.createRadialGradient(c + ox, c + oy, 0, c + ox, c + oy, r);
            g.addColorStop(0, color + '88');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(c + ox, c + oy, r, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Cluster: group of dots
        for (let i = 0; i < 40; i++) {
            const r = Math.sqrt(Math.random()) * size * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const px = c + Math.cos(angle) * r;
            const py = c + Math.sin(angle) * r;
            const s = Math.random() * 2 + 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px, py, s, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

/**
 * Carga textura de imagen real o fallback procedimental
 */
function useDSOTexture(dso: DSO): THREE.Texture {
    const [texture, setTexture] = useState<THREE.CanvasTexture | THREE.Texture | null>(null);
    const fallbackRef = useRef<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        // Crear fallback procedimental
        fallbackRef.current = createDSOTexture(dso.type, dso.color);

        // Intentar cargar imagen real
        const dsoImage = getDSOImage(dso.id);
        if (!dsoImage) {
            setTexture(fallbackRef.current);
            return;
        }

        preloadDSOImage(dso.id).then((img) => {
            if (img) {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 512;
                const ctx = canvas.getContext('2d')!;
                
                // Dibujar imagen centrada
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 512, 512);
                
                // Escalar y centrar imagen
                const scale = Math.min(512 / img.width, 512 / img.height) * 0.9;
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (512 - w) / 2;
                const y = (512 - h) / 2;
                
                ctx.drawImage(img, x, y, w, h);
                
                const tex = new THREE.CanvasTexture(canvas);
                tex.needsUpdate = true;
                setTexture(tex);
            } else {
                setTexture(fallbackRef.current);
            }
        });

        return () => {
            if (texture && texture !== fallbackRef.current) {
                texture.dispose();
            }
        };
    }, [dso.id, dso.type, dso.color]);

    return texture || fallbackRef.current || createDSOTexture(dso.type, dso.color);
}

// ── Componente individual de DSO con hover ─────────────────────────────────────
interface DSOData extends DSO {
    pos: [number, number, number];
    visualSize: number;
}

function DSOItem({ dso }: { dso: DSOData }) {
    const [hovered, setHovered] = useState(false);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const texture = useDSOTexture(dso);

    const displayColor = nightMode ? '#ff4444' : dso.color;

    return (
        <group position={dso.pos}>
            {/* Hitbox invisible para hover */}
            <mesh
                onClick={(e) => { e.stopPropagation(); setSelectedObject(dso); }}
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[Math.max(1.5, dso.visualSize), 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Halo de profundidad (glow exterior) */}
            <mesh>
                <sphereGeometry args={[dso.visualSize * 1.8, 16, 16]} />
                <meshBasicMaterial
                    color={dso.color}
                    transparent
                    opacity={0.08}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Textura visual del DSO */}
            <mesh>
                <planeGeometry args={[dso.visualSize, dso.visualSize]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={0.75}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Label solo en hover */}
            {hovered && (
                <Html distanceFactor={15} zIndexRange={[100, 0]}>
                    <div style={{
                        color: displayColor,
                        fontSize: '11px',
                        fontFamily: "'Courier New', monospace",
                        textShadow: `0 0 8px ${displayColor}, 0 0 3px black`,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        transform: 'translateY(-20px)',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${displayColor}66`,
                        fontWeight: 'bold',
                    }}>
                        {dso.id}
                        <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                            {dso.name} · mag {dso.mag.toFixed(1)}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function DeepSkyObjects() {
    const DSO_RADIUS = 94;

    const dsoData = useMemo(() => {
        return DSOS.map((dso) => {
            const pos = equatorialTo3D(dso.ra, dso.dec, DSO_RADIUS) as [number, number, number];
            const visualSize = Math.max(0.4, (dso.sizeArcmin || 10) * 0.027 * 1.5);
            return { ...dso, pos, visualSize };
        });
    }, []);

    return (
        <group>
            {dsoData.map((dso) => (
                <DSOItem key={dso.id} dso={dso} />
            ))}
        </group>
    );
}
