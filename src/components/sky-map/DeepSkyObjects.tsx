'use client';

import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useCatalog } from '@/stores/useCatalogStore';
import { equatorialTo3D, equToHor } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { horizonAltitudeAtAzimuth } from '@/lib/astronomy/horizonProfile';
import { terrainHorizonRef } from '@/lib/skyRefs';
import { Billboard, Html } from '@react-three/drei';
import { DSOType, DSO } from '@/types/celestial';
import { getDSOImage, preloadDSOImage } from '@/data/dsoImages';
import NebulaVolume from '@/components/sky-map/NebulaVolume';
import { DETAIL_LABEL_FOV, dsoSpriteVisibility, dsoVisualSize, selectWideFieldLabelIds, shouldShowDsoLabel } from '@/lib/astronomy/dsoVisibility';

// Cache global: clave = "tipo:color". Las texturas procedurales son idénticas para
// el mismo tipo+color, así que no tiene sentido crearlas N veces con Math.random().
// Se reutiliza la misma CanvasTexture en todos los DSOs del mismo tipo.
const _dsoTextureCache = new Map<string, THREE.CanvasTexture>();
const _dsoRealTextureCache = new Map<string, THREE.Texture>();
const _dsoRealTexturePromiseCache = new Map<string, Promise<THREE.Texture | null>>();

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

function loadDSORealTexture(dso: DSO): Promise<THREE.Texture | null> {
    const cached = _dsoRealTextureCache.get(dso.id);
    if (cached) return Promise.resolve(cached);

    const pending = _dsoRealTexturePromiseCache.get(dso.id);
    if (pending) return pending;

    const promise = preloadDSOImage(dso.id).then((img) => {
        if (!img) return null;

        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 512, 512);

        const scale = Math.min(512 / img.width, 512 / img.height) * 0.9;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        _dsoRealTextureCache.set(dso.id, texture);
        _dsoRealTexturePromiseCache.delete(dso.id);
        return texture;
    }).catch(() => {
        _dsoRealTexturePromiseCache.delete(dso.id);
        return null;
    });

    _dsoRealTexturePromiseCache.set(dso.id, promise);
    return promise;
}

/**
 * Carga textura de imagen real o fallback procedimental
 */
function useDSOTexture(dso: DSO, shouldLoadRealImage: boolean): THREE.Texture {
    // La textura procedural viene del caché global — sin refs ni allocaciones extra
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const cachedTexture = shouldLoadRealImage ? (_dsoRealTextureCache.get(dso.id) ?? null) : null;

    useEffect(() => {
        const dsoImage = getDSOImage(dso.id);
        if (!dsoImage || !shouldLoadRealImage) return;

        if (cachedTexture) return;

        let cancelled = false;
        loadDSORealTexture(dso).then((loadedTexture) => {
            if (!cancelled && loadedTexture) {
                setTexture(loadedTexture);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [cachedTexture, dso, shouldLoadRealImage]);

    // Fallback: textura procedural del caché global (O(1), sin new canvas)
    return cachedTexture ?? texture ?? createDSOTexture(dso.type, dso.color);
}

// ── Componente individual de DSO con hover ─────────────────────────────────────
interface DSOData extends DSO {
    pos: [number, number, number];
    visualSize: number;
}

function DSOItem({ dso, wideFieldLabel, aboveHorizon }: { dso: DSOData; wideFieldLabel: boolean; aboveHorizon: boolean }) {
    const [hovered, setHovered] = useState(false);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const markAsVisited = useAppStore((state) => state.markAsVisited);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const exploreDeepSky = useAppStore((state) => state.settings.exploreDeepSky ?? false);
    const camFov = useAppStore((state) => state.camFov);
    const shouldLoadRealImage = hovered || camFov < 20;
    const texture = useDSOTexture(dso, shouldLoadRealImage);

    const displayColor = nightMode ? '#ff4444' : dso.color;
    const visibility = dsoSpriteVisibility(dso.mag, bortleScale, camFov, hovered, exploreDeepSky);

    // Transición suave: a medida que bajamos el FOV (< 35), aparece el volumen.
    const volumeIntensity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 45, 20, 0, 1), 0, 1);
    const spriteIntensity = (1.0 - volumeIntensity * 0.25) * visibility;

    if (visibility < 0.02 && camFov > DETAIL_LABEL_FOV) return null;

    return (
        <group position={dso.pos}>
            {/* Hitbox invisible para hover */}
            <mesh
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setTargetedObject(dso); 
                    markAsVisited(dso.id);
                }}
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
                    opacity={volumeIntensity * 0.45 * visibility}
                />
            )}

            {/* Textura visual del DSO (Sprite clásico) */}
            <Billboard>
                <mesh>
                    <planeGeometry args={[dso.visualSize, dso.visualSize]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        opacity={(exploreDeepSky ? 0.85 : 0.6) * spriteIntensity}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </Billboard>

            {/* Label progresivo: hover, detalle (FOV < 35) o DSO de simple vista a campo amplio */}
            {shouldShowDsoLabel(dso, bortleScale, camFov, hovered, wideFieldLabel, aboveHorizon, exploreDeepSky) && (
                <Html zIndexRange={[100, 0]}>
                    <div 
                        className="pointer-events-none whitespace-nowrap flex flex-col items-center -translate-y-6 transition-opacity duration-300"
                        style={{
                            opacity: hovered ? 1 : 0.6
                        }}
                    >
                        <span className="text-[13px] font-semibold tracking-wider" style={{
                            color: nightMode ? '#fca5a5' : '#e2e8f0',
                            textShadow: nightMode ? '0 0 4px #000, 0 0 2px #000' : '0 0 4px #000, 0 0 2px #000'
                        }}>
                            {dso.name}
                        </span>
                        <span className="text-[10px] font-mono mt-0.5" style={{
                            color: nightMode ? '#ef4444' : displayColor,
                            textShadow: '0 0 4px #000, 0 0 2px #000'
                        }}>
                            {dso.id}
                        </span>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function DeepSkyObjects() {
    const DSO_RADIUS = 94;
    const dsos = useCatalog(s => s.dsos);

    const dsoData = useMemo(() => {
        return dsos.map((dso) => {
            const pos = equatorialTo3D(dso.ra, dso.dec, DSO_RADIUS) as [number, number, number];
            return { ...dso, pos, visualSize: dsoVisualSize(dso.sizeArcmin, dso.type) };
        });
    }, [dsos]);
    // timeMinute solo cambia 1x/min: basta para saber qué hay sobre el horizonte.
    const time = useAppStore((state) => state.timeMinute);
    const observer = useAppStore((state) => state.observer);
    const aboveHorizonIds = useMemo(() => new Set(
        dsos
            .filter((dso) => {
                // Cuenta el relieve real: un objeto tras la montaña tampoco se nombra.
                const { alt, az } = equToHor(dso.ra, dso.dec, observer.lat, observer.lon, time);
                return alt > Math.max(0, horizonAltitudeAtAzimuth(terrainHorizonRef.current, az));
            })
            .map((dso) => dso.id),
    ), [dsos, observer.lat, observer.lon, time]);
    // El tope de etiquetas se reparte solo entre lo que está sobre el horizonte.
    const wideFieldLabelIds = useMemo(
        () => selectWideFieldLabelIds(dsos.filter((dso) => aboveHorizonIds.has(dso.id))),
        [dsos, aboveHorizonIds],
    );

    return (
        <group>
            {dsoData.map((dso) => (
                <DSOItem
                    key={dso.id}
                    dso={dso}
                    wideFieldLabel={wideFieldLabelIds.has(dso.id)}
                    aboveHorizon={aboveHorizonIds.has(dso.id)}
                />
            ))}
        </group>
    );
}
