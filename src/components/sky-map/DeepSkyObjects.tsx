'use client';

import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { DSOS } from '@/data/dsos';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';
import { DSOType, DSO } from '@/types/celestial';
import { getDSOImage, preloadDSOImage } from '@/data/dsoImages';
import NebulaVolume from '@/components/sky-map/NebulaVolume';

// Cache global: clave = "tipo:color". Las texturas procedurales son idénticas para
// el mismo tipo+color, así que no tiene sentido crearlas N veces con Math.random().
// Se reutiliza la misma CanvasTexture en todos los DSOs del mismo tipo.
const _dsoTextureCache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function createDSOTexture(type: DSOType, color: string): THREE.CanvasTexture {
    const cacheKey = `${type}:${color}`;
    const cached = _dsoTextureCache.get(cacheKey);
    if (cached) return cached;

    const size = 256; // Increased resolution for better noise
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const c = size / 2;
    ctx.clearRect(0, 0, size, size);

    let rgb: [number, number, number] = [200, 200, 255];
    try { rgb = hexToRgb(color.length === 7 ? color : '#aaaaff'); } catch { /* ignore */ }
    const [r, g, b] = rgb;

    if (type === 'galaxy') {
        // High-fidelity procedural galaxy: Bulge + Disk + Spiral Dust
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(Math.PI / 6);
        ctx.scale(1.8, 0.7);

        // 1. Halo/Disk
        const gDisk = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.9);
        gDisk.addColorStop(0.0, `rgba(${r},${g},${b},0.3)`);
        gDisk.addColorStop(1.0, `rgba(${r},${g},${b},0.0)`);
        ctx.fillStyle = gDisk;
        ctx.fillRect(-c, -c, size, size);

        // 2. Central Bulge (Hot & Dense)
        const gBulge = ctx.createRadialGradient(0, 0, 0, 0, 0, c * 0.3);
        gBulge.addColorStop(0.0, `rgba(255, 255, 240, 0.9)`);
        gBulge.addColorStop(0.4, `rgba(${r},${g},${b},0.6)`);
        gBulge.addColorStop(1.0, `rgba(${r},${g},${b},0.0)`);
        ctx.fillStyle = gBulge;
        ctx.beginPath();
        ctx.arc(0, 0, c * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 3. Simulated Spiral Dust (Noise)
        ctx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 400; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * c * 0.8;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    } else if (type === 'nebula') {
        // Complex Gaseous Nebula
        for (let i = 0; i < 15; i++) {
            const ox = (Math.random() - 0.5) * c * 0.4;
            const oy = (Math.random() - 0.5) * c * 0.4;
            const rPart = c * (0.3 + Math.random() * 0.4);
            const gn = ctx.createRadialGradient(c + ox, c + oy, 0, c + ox, c + oy, rPart);
            const alpha = 0.1 + Math.random() * 0.2;
            gn.addColorStop(0.0, `rgba(${r},${g},${b},${alpha})`);
            gn.addColorStop(1.0, `rgba(${r},${g},${b},0.0)`);
            ctx.fillStyle = gn;
            ctx.beginPath();
            ctx.arc(c + ox, c + oy, rPart, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Globular/Open Cluster (Point cloud look)
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.pow(Math.random(), 1.5) * c * 0.7;
            const x = c + Math.cos(angle) * dist;
            const y = c + Math.sin(angle) * dist;
            const s = 0.5 + Math.random() * 1.5;
            ctx.fillStyle = `rgba(${r + 20},${g + 20},${b + 30},${0.4 + Math.random() * 0.6})`;
            ctx.fillRect(x, y, s, s);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    _dsoTextureCache.set(cacheKey, tex);
    return tex;
}

/**
 * Carga textura de imagen real o fallback procedimental
 */
function useDSOTexture(dso: DSO): THREE.Texture {
    // La textura procedural viene del caché global — sin refs ni allocaciones extra
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        const dsoImage = getDSOImage(dso.id);
        if (!dsoImage) return; // El fallback del cache se devuelve al renderizar

        preloadDSOImage(dso.id).then((img) => {
            if (!img) return;

            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 512;
            const ctx = canvas.getContext('2d')!;

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, 512, 512);

            const scale = Math.min(512 / img.width, 512 / img.height) * 0.9;
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);

            const tex = new THREE.CanvasTexture(canvas);
            tex.needsUpdate = true;
            setTexture(tex);
        });

        return () => {
            setTexture(prev => { prev?.dispose(); return null; });
        };
    }, [dso.id, dso.type, dso.color]);

    // Fallback: textura procedural del caché global (O(1), sin new canvas)
    return texture ?? createDSOTexture(dso.type, dso.color);
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
                    <div 
                        className="text-[11px] font-mono pointer-events-none whitespace-nowrap bg-black/60 px-2 py-0.5 rounded border -translate-y-5 font-bold"
                        style={{
                            color: displayColor,
                            textShadow: `0 0 8px ${displayColor}, 0 0 3px black`,
                            borderColor: `${displayColor}66`,
                        }}
                    >
                        {dso.id}
                        <div className="text-[9px] opacity-70 mt-0.5">
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
