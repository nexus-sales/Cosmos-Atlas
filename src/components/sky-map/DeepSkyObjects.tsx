'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DSOS } from '@/data/dsos';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';
import { DSOType, DSO } from '@/types/celestial';
import { getDSOImage, preloadDSOImage } from '@/data/dsoImages';
import NebulaVolume from '@/components/sky-map/NebulaVolume';

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function createDSOTexture(type: DSOType, color: string): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const c = size / 2;
    ctx.clearRect(0, 0, size, size);

    // Parse color for rgba stops
    let rgb: [number, number, number] = [200, 200, 255];
    try { rgb = hexToRgb(color.length === 7 ? color : '#aaaaff'); } catch { /* ignore */ }
    const [r, g, b] = rgb;

    if (type === 'galaxy') {
        // Soft elliptical glow — core bright, edges completely transparent
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(Math.PI / 5);
        ctx.scale(1.6, 0.55);
        const gx = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.85);
        gx.addColorStop(0.0, `rgba(${r},${g},${b},0.90)`);
        gx.addColorStop(0.15, `rgba(${r},${g},${b},0.55)`);
        gx.addColorStop(0.45, `rgba(${r},${g},${b},0.18)`);
        gx.addColorStop(0.75, `rgba(${r},${g},${b},0.04)`);
        gx.addColorStop(1.0, `rgba(${r},${g},${b},0.00)`);
        ctx.fillStyle = gx;
        ctx.beginPath();
        ctx.arc(0, 0, c * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else if (type === 'nebula') {
        // Diffuse amorphous cloud — never opaque, always soft
        const gn = ctx.createRadialGradient(c, c, 0, c, c, c * 0.9);
        gn.addColorStop(0.0, `rgba(${r},${g},${b},0.55)`);
        gn.addColorStop(0.35, `rgba(${r},${g},${b},0.22)`);
        gn.addColorStop(0.70, `rgba(${r},${g},${b},0.06)`);
        gn.addColorStop(1.0, `rgba(${r},${g},${b},0.00)`);
        ctx.fillStyle = gn;
        ctx.beginPath();
        ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Open/globular cluster — tight central glow with very faint haze
        const gc = ctx.createRadialGradient(c, c, 0, c, c, c * 0.7);
        gc.addColorStop(0.0, `rgba(${r},${g},${b},0.80)`);
        gc.addColorStop(0.20, `rgba(${r},${g},${b},0.40)`);
        gc.addColorStop(0.55, `rgba(${r},${g},${b},0.10)`);
        gc.addColorStop(1.0, `rgba(${r},${g},${b},0.00)`);
        ctx.fillStyle = gc;
        ctx.beginPath();
        ctx.arc(c, c, c * 0.7, 0, Math.PI * 2);
        ctx.fill();
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
    const camFov = useAppStore((state) => state.camFov);
    const texture = useDSOTexture(dso);

    const displayColor = nightMode ? '#ff4444' : dso.color;

    // Transición suave: a medida que bajamos el FOV (< 35), aparece el volumen.
    const volumeIntensity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 45, 20, 0, 1), 0, 1);
    const spriteIntensity = 1.0 - volumeIntensity * 0.7; // El sprite no desaparece del todo, sirve de centro brillante.

    return (
        <group position={dso.pos}>
            {/* Hitbox invisible para hover */}
            <mesh
                onClick={(e) => { e.stopPropagation(); setSelectedObject(dso); }}
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[Math.max(1.0, dso.visualSize * 0.7), 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* VOLUMEN PROCEDURAL (Solo para Nebulosas y Galaxias enfocadas) */}
            {(dso.type === 'nebula' || dso.type === 'galaxy') && (
                <NebulaVolume
                    color={displayColor}
                    size={dso.visualSize * 1.5}
                    opacity={volumeIntensity * 0.45}
                />
            )}

            {/* Textura visual del DSO (Sprite clásico) */}
            <mesh>
                <planeGeometry args={[dso.visualSize, dso.visualSize]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={0.35 * spriteIntensity}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Label solo en hover o foco (opcional) */}
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
            // visualSize: representative size, capped so even M31/LMC don't flood the screen
            const visualSize = Math.max(0.12, Math.min(2.2, (dso.sizeArcmin || 5) * 0.027));
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
