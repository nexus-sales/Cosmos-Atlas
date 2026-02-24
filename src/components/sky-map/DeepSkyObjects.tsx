'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { DSOS } from '@/data/dsos';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';
import { DSOType } from '@/types/celestial';

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

export default function DeepSkyObjects() {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const DSO_RADIUS = 94;

    const dsoData = useMemo(() => {
        return DSOS.map((dso) => {
            const pos = equatorialTo3D(dso.ra, dso.dec, DSO_RADIUS);
            // Conversion arcmin to units on sphere (R=94)
            // circumference = 2 * PI * 94 = 590 units. 590 / (360 * 60) = 0.027 units per arcmin
            const visualSize = Math.max(0.4, (dso.sizeArcmin || 10) * 0.027 * 1.5);
            const texture = createDSOTexture(dso.type, dso.color);
            return { ...dso, pos, visualSize, texture };
        });
    }, []);

    return (
        <group>
            {dsoData.map((dso) => (
                <group key={dso.id} position={dso.pos}>
                    <mesh
                        onClick={(e) => { e.stopPropagation(); setSelectedObject(dso); }}
                        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { document.body.style.cursor = 'default'; }}
                    >
                        <planeGeometry args={[dso.visualSize, dso.visualSize]} />
                        <meshBasicMaterial
                            map={dso.texture}
                            transparent
                            opacity={0.7}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>

                    <Html distanceFactor={15} zIndexRange={[50, 0]}>
                        <div style={{
                            color: dso.color,
                            fontSize: '9px',
                            fontFamily: "'Courier New', monospace",
                            textShadow: '0 0 5px black',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            transform: 'translateY(12px) translateX(-50%)',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            border: `0.5px solid ${dso.color}44`
                        }}>
                            {dso.id} <span style={{ opacity: 0.6 }}>{dso.mag.toFixed(1)}</span>
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
