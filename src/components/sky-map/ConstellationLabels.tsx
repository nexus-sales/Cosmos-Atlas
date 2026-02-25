'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { CONSTELLATIONS } from '@/data/constellations';
import { getConstellationDisplayName } from '@/data/constellationNames';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { useFrame } from '@react-three/fiber';

const STAR_MAP = new Map(STARS.map((s) => [s.name, s]));

/**
 * Etiquetas de constelación al estilo Sky Map:
 * - Dinámicas: Escalan y cambian opacidad según el zoom (FOV)
 * - Perspicaces: Identifican la constelación que el usuario está mirando
 * - Estética: Tipografía premium con espaciado amplio
 */
export default function ConstellationLabels() {
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const camFov = useAppStore((state) => state.camFov);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const setFocusedConstellation = useAppStore((state) => state.setFocusedConstellation);

    const labels = useMemo(() => {
        return Object.entries(CONSTELLATIONS).flatMap(([name, pairs]) => {
            const starNames = new Set<string>();
            pairs.forEach(([a, b]) => { starNames.add(a); starNames.add(b); });

            const sum = new THREE.Vector3();
            let count = 0;
            starNames.forEach((sName) => {
                const star = STAR_MAP.get(sName);
                if (!star) return;
                const [x, y, z] = equatorialTo3D(star.ra, star.dec, 1.0);
                sum.add(new THREE.Vector3(x, y, z));
                count++;
            });

            if (count === 0) return [];

            const centroid = sum.divideScalar(count).normalize();
            // Colocamos las etiquetas en un radio ligeramente menor a las estrellas para asegurar visibilidad
            const pos = centroid.clone().multiplyScalar(88).toArray() as [number, number, number];
            return [{ name, label: getConstellationDisplayName(name).toUpperCase(), pos, vector: centroid }];
        });
    }, []);

    // Identificar constelación en el centro de la pantalla
    useFrame(({ camera }) => {
        // Obtenemos el vector "atrás" de la cámara (hacia donde mira)
        // En nuestro sistema, el centro de la esfera es [0,0,0]
        const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

        let bestName = null;
        let bestDot = -1;

        labels.forEach(({ name, vector }) => {
            // Producto punto para ver afinidad angular
            // Como ambos son normalizados, dot = cos(ángulo)
            const dot = lookDir.dot(vector);
            if (dot > 0.85 && dot > bestDot) { // ~30 grados de tolerancia
                bestDot = dot;
                bestName = name;
            }
        });

        if (bestName !== focusedConstellation) {
            setFocusedConstellation(bestName);
        }
    });

    const scaleFactor = THREE.MathUtils.mapLinear(camFov, 90, 10, 0.9, 2.5);

    return (
        <group renderOrder={100}>
            {labels.map(({ name, label, pos }) => {
                const isFocused = name === focusedConstellation;

                // Opacidad dinámica:
                // - Constelaciones enfocadas: 100%
                // - Resto: según zoom, o muy bajas si hay otra enfocada cerca
                let baseOpacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 90, 30, 0.3, 0.8), 0.1, 0.8);
                if (isFocused) baseOpacity = 1.0;

                const fontSize = `${Math.round((isFocused ? 13 : 10) * scaleFactor)}px`;
                const letterSpacing = `${isFocused ? 0.35 : 0.2}em`;

                const textColor = nightMode
                    ? `rgba(255, 60, 60, ${baseOpacity})`
                    : isFocused ? `rgba(255, 255, 255, ${baseOpacity})` : `rgba(180, 210, 255, ${baseOpacity * 0.7})`;

                const glowColor = nightMode
                    ? `rgba(180, 0, 0, ${baseOpacity * 0.5})`
                    : isFocused ? `rgba(59, 130, 246, 0.6)` : `rgba(100, 160, 255, ${baseOpacity * 0.3})`;

                return (
                    <Html
                        key={name}
                        position={pos}
                        center
                        distanceFactor={18} // He aumentado esto para que no se vuelvan minúsculas tan rápido
                        zIndexRange={[200, 100]}
                        style={{
                            pointerEvents: 'none',
                            userSelect: 'none',
                            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                        }}
                    >
                        <span style={{
                            color: textColor,
                            fontFamily: "'Inter', 'Sf Pro Display', system-ui, sans-serif",
                            fontSize: fontSize,
                            fontWeight: isFocused ? 800 : 600,
                            letterSpacing: letterSpacing,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            textShadow: isFocused
                                ? `0 0 15px ${glowColor}, 0 0 5px ${glowColor}`
                                : `0 0 8px ${glowColor}`,
                            display: 'block',
                            opacity: 1,
                            transform: isFocused ? 'scale(1.1)' : 'scale(1)',
                        }}>
                            {label}
                        </span>
                    </Html>
                );
            })}
        </group>
    );
}
