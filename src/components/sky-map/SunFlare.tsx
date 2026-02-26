'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

export default function SunFlare() {
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);

    const flareTextures = useMemo(() => {
        const createFlare = (s: number, color: string, glow: boolean) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = s;
            const ctx = canvas.getContext('2d')!;
            const c = s / 2;
            const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
            if (glow) {
                grad.addColorStop(0, color);
                grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
                grad.addColorStop(1, 'transparent');
            } else {
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(0.8, 'transparent');
                grad.addColorStop(0.85, color);
                grad.addColorStop(0.95, 'transparent');
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, s, s);
            return new THREE.CanvasTexture(canvas);
        };

        return [
            createFlare(128, 'rgba(255, 230, 180, 0.4)', true),
            createFlare(64, 'rgba(200, 220, 255, 0.1)', false),
            createFlare(32, 'rgba(255, 200, 200, 0.08)', true),
        ];
    }, []);

    useFrame(() => {
        if (!groupRef.current) return;

        const { time, observer } = useAppStore.getState();
        try {
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const hor = Astronomy.Horizon(time, obs, eq.ra, eq.dec, 'normal');

            if (hor.altitude < -1) {
                groupRef.current.visible = false;
                return;
            }

            const el = THREE.MathUtils.degToRad(hor.altitude);
            const az = THREE.MathUtils.degToRad(hor.azimuth);
            const sunVec = new THREE.Vector3(
                Math.cos(el) * Math.sin(az),
                Math.sin(el),
                -Math.cos(el) * Math.cos(az)
            ).multiplyScalar(100);

            const screenPos = sunVec.clone().project(camera);

            if (screenPos.z > 1) {
                groupRef.current.visible = false;
                return;
            }

            groupRef.current.visible = true;

            const distFromCenter = Math.sqrt(screenPos.x * screenPos.x + screenPos.y * screenPos.y);
            const globalOpacity = THREE.MathUtils.clamp(1.0 - distFromCenter * 0.9, 0, 1) * 0.65;

            const elements = groupRef.current.children as THREE.Sprite[];
            elements.forEach((sprite, i) => {
                const offset = (i + 1) * 0.45;
                const flareX = screenPos.x * (1 - offset);
                const flareY = screenPos.y * (1 - offset);

                const pos = new THREE.Vector3(flareX, flareY, 0.5);
                pos.unproject(camera);
                sprite.position.copy(pos);

                sprite.material.opacity = globalOpacity * (1.0 - i * 0.25);
                sprite.scale.setScalar(0.04 + i * 0.03);
            });

        } catch { if (groupRef.current) groupRef.current.visible = false; }
    });

    return (
        <group ref={groupRef}>
            {flareTextures.map((tex, i) => (
                <sprite key={i}>
                    <spriteMaterial
                        map={tex}
                        transparent
                        depthTest={false}
                        blending={THREE.AdditiveBlending}
                    />
                </sprite>
            ))}
        </group>
    );
}
