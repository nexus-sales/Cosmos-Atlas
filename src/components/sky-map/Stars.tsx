'use client';

import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { STARS } from '@/data/stars';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

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

    float depthFactor = 1.0 - distanceFactor * 0.4;

    // Twinkle más dinámico
    float twinkleSpeed = 3.2 + airmass * 0.5;
    float twinkleAmp = 0.28 + airmass * 0.15; // Aumentado ligeramente para más vida
    float noise = sin(uTime * twinkleSpeed + position.x * 100.0) * 0.6 + sin(uTime * twinkleSpeed * 0.8 + position.y * 100.0) * 0.4;
    vOpacity = varFactor * depthFactor * ((1.0 - twinkleAmp) + twinkleAmp * noise);
    vAirmass = airmass;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Tamaño base aumentado para que las estrellas principales resalten
    gl_PointSize = size * 1.8 * (vOpacity * 0.5 + 0.5) * (1000.0 / -mvPosition.z);
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
    } else {
        float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
        baseColor = mix(vec3(lum), vColor, 1.8);
        
        // --- EXTINCIÓN ATMOSFÉRICA ---
        // A mayor airmass, la luz se dispersa más (especialmente la azul)
        // Coeficientes de extinción: B=0.35, G=0.20, R=0.12 (aprox. cielos medios)
        vec3 extinction = exp(-vAirmass * vec3(0.08, 0.15, 0.28) * 0.15);
        baseColor *= extinction;
    }

    // --- EFECTO ESTRELLA DIAMANTE (Star Walk 2 Style) ---
    
    // 1. Núcleo híper-brillante
    float core = pow(max(0.0, 1.0 - r * 2.8), 2.5) * 2.0;
    
    // 2. Halo atmosférico suave
    float halo = exp(-r * 8.0) * 0.6;
    
    // 3. Spikes de difracción (Cruz de cristal)
    // Más rotación para que no sean solo + o x perfecta
    vec2 centered = gl_PointCoord - vec2(0.5);
    float angle = 0.3; // Rotación ligera
    float co = cos(angle);
    float si = sin(angle);
    vec2 p = vec2(centered.x * co - centered.y * si, centered.x * si + centered.y * co);
    
    float spikeX = exp(-abs(p.x) * 45.0) * exp(-abs(p.y) * 2.5);
    float spikeY = exp(-abs(p.y) * 45.0) * exp(-abs(p.x) * 2.5);
    
    // Spikes secundarios (forma de diamante) para estrellas muy brillantes
    float spikeSize = smoothstep(3.0, 8.0, vSize); 
    float spikes = (spikeX + spikeY) * (0.4 + spikeSize * 0.8);

    float finalAlpha = (core + halo + spikes) * vOpacity;
    
    // Boost del color en el centro
    vec3 finalColor = mix(baseColor, vec3(1.0), core * 0.7);
    
    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

const RADIUS = 98;
/** Radio de la esfera de detección de eventos para cada estrella. */
const HIT_RADIUS = 2.0;

/**
 * Estrellas variables conocidas con sus parámetros de variabilidad.
 */
const VARIABLE_STARS: Record<string, { period: number; amp: number; phase: number }> = {
    'Algol': { period: 247_814, amp: 0.48, phase: 0.0 },
    'Mira': { period: 28_681_000, amp: 0.82, phase: 1.8 },
    'Betelgeuse': { period: 36_288_000, amp: 0.22, phase: 3.1 },
    'Eta Car': { period: 480_000_000, amp: 0.55, phase: 0.0 }, // Añadida Eta Carinae
};


/** Hitbox invisible que detecta click/hover para cada estrella nombrada */
function StarHitbox({ star, pos }: { star: typeof STARS[0]; pos: [number, number, number] }) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const [hovered, setHovered] = useState(false);

    const displayColor = nightMode ? '#ff3333' : star.color;

    return (
        <group position={pos}>
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(star); }}
            >
                <sphereGeometry args={[HIT_RADIUS, 6, 6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {hovered && (
                <Html distanceFactor={120} zIndexRange={[100, 0]}>
                    <div 
                        className="bg-[#020814]/88 rounded px-2.5 py-1 text-[11px] font-mono font-bold whitespace-nowrap tracking-wide pointer-events-none -translate-x-1/2 -translate-y-7 z-[1000] border"
                        style={{
                            borderColor: `${displayColor}55`,
                            color: displayColor,
                            textShadow: `0 0 10px ${displayColor}`,
                        }}
                    >
                        {star.name}
                        <div className="text-[9px] text-white/30 font-normal tracking-[0.5px]">
                            Mag {star.mag.toFixed(2)} · {star.constellation}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/** 
 * Etiquetas automáticas que aparecen al hacer zoom.
 * Estilo Star Walk 2: nombre de estrella con glow sutil.
 */
function DynamicStarLabels({ visibleStars, starPositions }: { visibleStars: typeof STARS; starPositions: [number, number, number][] }) {
    const camFov = useAppStore((state) => state.camFov);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    // Comenzar a mostrar etiquetas mucho antes (FOV 75 es casi el inicio)
    const overallOpacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 80, 50, 0, 1), 0.1, 1);

    return (
        <group renderOrder={50}>
            {visibleStars.map((star, i) => {
                // Lógica de visibilidad por magnitud más generosa:
                // A FOV 60 (inicio) ya muestra estrellas de mag < 1.5
                // A FOV 30 ya muestra casi todas (mag < 4.5)
                const magThreshold = THREE.MathUtils.mapLinear(camFov, 75, 20, 1.2, 5.0);
                if (star.mag > magThreshold) return null;

                const pos = starPositions[i];
                const color = nightMode ? '#ff4444' : '#e0e8ff';
                const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(magThreshold - star.mag, 0, 1.0, 0, 1), 0, 1) * overallOpacity;

                const scale = THREE.MathUtils.mapLinear(camFov, 90, 10, 0.8, 1.3);

                return (
                    <Html key={star.name} position={pos} center distanceFactor={15} zIndexRange={[150, 50]}>
                        <div 
                            className="font-sans font-medium tracking-[0.05em] pointer-events-none select-none translate-y-3.5 text-center"
                            style={{
                                color: color,
                                opacity: opacity,
                                fontSize: `${Math.round(10 * scale)}px`,
                                textShadow: `0 0 8px ${nightMode ? 'rgba(255,0,0,0.6)' : 'rgba(59,130,246,0.4)'}`,
                            }}
                        >
                            {star.name}
                            {camFov < 35 && (
                                <div className="font-normal" style={{ fontSize: `${Math.round(8 * scale)}px`, opacity: 0.6 * opacity }}>
                                    {star.constellation}
                                </div>
                            )}
                        </div>
                    </Html>
                );
            })}
        </group>
    );
}

export default function Stars() {
    const pointsRef = useRef<THREE.Points>(null);
    const bortleScale = useAppStore((state) => state.settings.bortleScale);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    // Mapeo Bortle -> Magnitud Límite (ajustado para que el catálogo de ~9k estrellas tenga sentido)
    const limitingMag = 5.5 - (bortleScale - 1) * 0.45;

    const [geometry, material, visibleStars, starPositions] = useMemo(() => {
        const filteredStars = STARS.filter(s => s.mag <= limitingMag);

        const pos = new Float32Array(filteredStars.length * 3);
        const col = new Float32Array(filteredStars.length * 3);
        const sz = new Float32Array(filteredStars.length);
        const varAmpArr = new Float32Array(filteredStars.length);
        const varPerArr = new Float32Array(filteredStars.length);
        const varPhaArr = new Float32Array(filteredStars.length);
        const distFactorArr = new Float32Array(filteredStars.length); // Profundidad de campo
        const positions3D: [number, number, number][] = [];

        filteredStars.forEach((star, i) => {
            const p = equatorialTo3D(star.ra, star.dec, RADIUS);
            pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
            positions3D.push(p);

            const color = new THREE.Color(star.color || '#ffffff');
            col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;

            // ── Escala Logarítmica Agresiva (estilo Sky Map) ─────────────────
            const refMag = -1.5;
            const brightness = Math.pow(2.512, refMag - star.mag);
            const normB = Math.min(1.0, brightness);
            sz[i] = 0.18 + Math.pow(normB, 0.50) * 7.2;

            distFactorArr[i] = Math.min(1.0, Math.max(0.0, (star.mag + 1.5) / 7.5));

            const varInfo = VARIABLE_STARS[star.name];
            if (varInfo) {
                varAmpArr[i] = varInfo.amp;
                varPerArr[i] = varInfo.period;
                varPhaArr[i] = varInfo.phase;
            }
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geom.setAttribute('size', new THREE.BufferAttribute(sz, 1));
        geom.setAttribute('varAmp', new THREE.BufferAttribute(varAmpArr, 1));
        geom.setAttribute('varPer', new THREE.BufferAttribute(varPerArr, 1));
        geom.setAttribute('varPha', new THREE.BufferAttribute(varPhaArr, 1));
        geom.setAttribute('distanceFactor', new THREE.BufferAttribute(distFactorArr, 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uTimeSec: { value: 0 },
                uNightMode: { value: nightMode }
            },
            transparent: true,
            depthWrite: false,
        });

        return [geom, mat, filteredStars, positions3D];
    }, [limitingMag, nightMode]); // Re-calcular si cambia Bortle o NightMode

    useFrame((state) => {
        const mat = material as THREE.ShaderMaterial;
        // eslint-disable-next-line react-hooks/immutability
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uTimeSec.value = useAppStore.getState().time.getTime() / 1000;
        mat.uniforms.uNightMode.value = nightMode;
    });

    return (
        <group renderOrder={1}>
            {/* Renderizado visual en shader */}
            <points ref={pointsRef} geometry={geometry} material={material} renderOrder={1} />

            {/* Etiquetas dinámicas basadas en zoom */}
            <DynamicStarLabels visibleStars={visibleStars} starPositions={starPositions} />

            {/* Hitboxes invisibles para click y hover */}
            {visibleStars
                .map((star, originalIdx) => ({ star, pos: starPositions[originalIdx] }))
                .filter(({ star }) => star.mag <= 5.5)
                .map(({ star, pos }) => (
                    <StarHitbox key={star.name} star={star} pos={pos} />
                ))
            }
        </group>
    );
}
