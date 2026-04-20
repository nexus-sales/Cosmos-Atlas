'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import type { ThreeEvent } from '@react-three/fiber';

const starVertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float varAmp;
  attribute float varPer;
  attribute float varPha;
  attribute float distanceFactor;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  varying float vAirmass;
  uniform float uTime;
  uniform float uTimeSec;

  void main() {
    vColor = color;
    vSize = size;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    float altitude = worldPosition.y / length(worldPosition.xyz);
    float airmass = 1.0 / max(0.08, altitude);

    float varFactor = 1.0;
    if (varAmp > 0.0 && varPer > 0.0) {
      float phase = 6.2832 * uTimeSec / varPer + varPha;
      varFactor = 1.0 - varAmp * 0.4 * (1.0 - sin(phase));
    }

    float depthFactor = 1.0 - distanceFactor * 0.2;

    float twinkleSpeed = 1.5 + airmass * 0.2;
    float twinkleAmp = 0.05 + airmass * 0.03; // Much subtle twinkling
    float noise = sin(uTime * twinkleSpeed + position.x * 50.0) * 0.6
                + sin(uTime * twinkleSpeed * 0.7 + position.y * 50.0) * 0.4;
    vOpacity = varFactor * depthFactor * ((1.0 - twinkleAmp) + twinkleAmp * noise);
    vAirmass = airmass;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 0.9 * (vOpacity * 0.2 + 0.8) * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  varying float vAirmass;
  uniform bool uNightMode;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    vec3 baseColor = vColor;
    if (uNightMode) {
        float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
        baseColor = vec3(lum * 2.0, 0.0, 0.0);
    }

    // Realistic core and subtle halo, NO SPIKES
    float core = exp(-r * 8.0) * 1.5;
    float halo = exp(-r * 12.0) * 0.2;

    float finalAlpha = (core + halo) * vOpacity;
    vec3 finalColor = mix(baseColor, vec3(1.0), core * 0.4);

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

const RADIUS = 98;

// ── Umbral de raycasting adaptativo al FOV ───────────────────────────────────
// A FOV ancho (cielo completo) usamos un umbral grande para facilitar el click.
// A FOV estrecho (zoom) lo reducimos para evitar seleccionar la estrella equivocada.
function getRaycastThreshold(fov: number): number {
    // mapLinear: FOV 80° → threshold 4.0 | FOV 10° → threshold 0.8
    return THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(fov, 80, 10, 4.0, 0.8),
        0.8, 4.0
    );
}

function DynamicStarLabels({
    visibleStars,
    starPositions,
}: {
    visibleStars: typeof STARS;
    starPositions: [number, number, number][];
}) {
    const camFov   = useAppStore(s => s.camFov);
    const nightMode = useAppStore(s => s.settings.nightMode);

    const overallOpacity = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 80, 50, 0, 1), 0.1, 1
    );

    return (
        <group renderOrder={50}>
            {visibleStars.map((star, i) => {
                const magThreshold = THREE.MathUtils.mapLinear(camFov, 75, 20, 1.2, 5.0);
                if (star.mag > magThreshold) return null;

                const pos     = starPositions[i];
                const color   = nightMode ? '#ff4444' : '#e0e8ff';
                const opacity = THREE.MathUtils.clamp(
                    THREE.MathUtils.mapLinear(magThreshold - star.mag, 0, 1.0, 0, 1), 0, 1
                ) * overallOpacity;

                return (
                    <Html key={star.name} position={pos} center distanceFactor={15} zIndexRange={[150, 50]}>
                        <div
                            className="font-sans font-medium tracking-[0.05em] pointer-events-none select-none translate-y-3.5 text-center text-[10px] [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]"
                            style={{
                                color: color,
                                opacity: opacity,
                            }}
                        >
                            {star.name}
                        </div>
                    </Html>
                );
            })}
        </group>
    );
}

export default function Stars() {
    const pointsRef = useRef<THREE.Points>(null);
    const bortleScale = useAppStore(s => s.settings.bortleScale);
    const nightMode   = useAppStore(s => s.settings.nightMode);
    const camFov      = useAppStore(s => s.camFov);
    const setSelectedObject = useAppStore(s => s.setSelectedObject);
    const { raycaster } = useThree();

    // Zona de fade: 0.8 mag por encima del límite las estrellas empiezan a desaparecer
    const FADE_RANGE = 0.8;
    const limitingMag = 8.0 - (bortleScale - 1) * 0.55;

    // Estado del tooltip hover — una sola instancia para toda la nube de puntos
    const [hovered, setHovered] = useState<{
        star: typeof STARS[0];
        pos: [number, number, number];
    } | null>(null);

    const [geometry, material, visibleStars, starPositions] = useMemo(() => {
        // Incluir estrellas hasta limitingMag (zona de fade ya manejada por tamaño)
        const filteredStars = STARS.filter(s => s.mag <= limitingMag);

        const pos         = new Float32Array(filteredStars.length * 3);
        const col         = new Float32Array(filteredStars.length * 3);
        const sz          = new Float32Array(filteredStars.length);
        const varAmpArr   = new Float32Array(filteredStars.length);
        const varPerArr   = new Float32Array(filteredStars.length);
        const varPhaArr   = new Float32Array(filteredStars.length);
        const distFactArr = new Float32Array(filteredStars.length);
        const positions3D: [number, number, number][] = [];

        filteredStars.forEach((star, i) => {
            const p = equatorialTo3D(star.ra, star.dec, RADIUS);
            pos[i * 3]     = p[0];
            pos[i * 3 + 1] = p[1];
            pos[i * 3 + 2] = p[2];
            positions3D.push(p);

            const color = new THREE.Color(star.color || '#ffffff');
            col[i * 3]     = color.r;
            col[i * 3 + 1] = color.g;
            col[i * 3 + 2] = color.b;

            const refMag    = -1.5;
            const brightness = Math.pow(2.512, refMag - star.mag);
            const normB     = Math.min(1.0, brightness);
            // Fade suave: estrellas cercanas al límite se achican progresivamente
            const fadeFactor = star.mag > (limitingMag - FADE_RANGE)
                ? Math.max(0, (limitingMag - star.mag) / FADE_RANGE)
                : 1.0;
            sz[i]          = (0.8 + Math.pow(normB, 0.4) * 7.0) * fadeFactor;
            distFactArr[i] = Math.min(1.0, Math.max(0.0, (star.mag + 1.5) / 7.5));
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position',      new THREE.BufferAttribute(pos,         3));
        geom.setAttribute('color',         new THREE.BufferAttribute(col,         3));
        geom.setAttribute('size',          new THREE.BufferAttribute(sz,          1));
        geom.setAttribute('varAmp',        new THREE.BufferAttribute(varAmpArr,   1));
        geom.setAttribute('varPer',        new THREE.BufferAttribute(varPerArr,   1));
        geom.setAttribute('varPha',        new THREE.BufferAttribute(varPhaArr,   1));
        geom.setAttribute('distanceFactor', new THREE.BufferAttribute(distFactArr, 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader:   starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: {
                uTime:      { value: 0 },
                uTimeSec:   { value: 0 },
                uNightMode: { value: false },
            },
            transparent: true,
            depthWrite:  false,
        });

        return [geom, mat, filteredStars, positions3D];
    }, [limitingMag]);

    useFrame((state) => {
        const mat     = material as THREE.ShaderMaterial;
        const elapsed = state.clock.elapsedTime;
        // eslint-disable-next-line react-hooks/immutability
        mat.uniforms.uTime.value      = elapsed;
        mat.uniforms.uTimeSec.value   = elapsed;
        mat.uniforms.uNightMode.value = nightMode;

        // Actualizar umbral de raycasting según FOV actual
        // eslint-disable-next-line react-hooks/immutability
        raycaster.params.Points = { threshold: getRaycastThreshold(camFov) };
    });

    // ── Handlers de interacción directa sobre la nube de puntos ─────────────
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (e.index === undefined || e.index >= visibleStars.length) return;
        const star = visibleStars[e.index];
        const pos  = starPositions[e.index];
        setHovered({ star, pos });
        document.body.style.cursor = 'pointer';
    };

    const handlePointerOut = () => {
        setHovered(null);
        document.body.style.cursor = 'default';
    };

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.index === undefined || e.index >= visibleStars.length) return;
        setSelectedObject(visibleStars[e.index]);
    };

    const tooltipColor = nightMode
        ? '#ff3333'
        : (hovered?.star.color ?? '#ffffff');

    return (
        <group renderOrder={1}>
            <points
                ref={pointsRef}
                geometry={geometry}
                material={material}
                renderOrder={1}
                onPointerMove={handlePointerMove}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            />

            {/* Tooltip hover — un solo nodo HTML, sin meshes invisibles */}
            {hovered && (
                <Html
                    position={hovered.pos}
                    distanceFactor={120}
                    zIndexRange={[100, 0]}
                >
                    <div
                        className="bg-[#020814]/90 rounded px-2.5 py-1 text-[11px] font-mono font-bold
                                   whitespace-nowrap tracking-wide pointer-events-none
                                   -translate-x-1/2 -translate-y-7 border border-white/10"
                        style={{ color: tooltipColor }}
                    >
                        {hovered.star.name}
                        <div className="text-[9px] text-white/30 font-normal tracking-[0.5px]">
                            Mag {hovered.star.mag.toFixed(2)} · {hovered.star.constellation}
                        </div>
                    </div>
                </Html>
            )}

            <DynamicStarLabels visibleStars={visibleStars} starPositions={starPositions} />
        </group>
    );
}
