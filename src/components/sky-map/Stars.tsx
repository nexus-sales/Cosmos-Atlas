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
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  uniform float uTimeSec;
  
  void main() {
    vColor = color;

    // Variabilidad estelar: modula brillo según período real
    float varFactor = 1.0;
    if (varAmp > 0.0 && varPer > 0.0) {
      float phase = 6.2832 * uTimeSec / varPer + varPha;
      varFactor = 1.0 - varAmp * 0.5 * (1.0 - sin(phase));
    }

    vOpacity = varFactor * (0.78 + 0.22 * sin(uTime * 1.8 + position.x * 8.0 + position.y * 4.0));
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * varFactor * (480.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float strength = pow(1.0 - (r * 2.0), 1.1);
    float halo = pow(max(0.0, 1.0 - r * 1.4), 3.0) * 0.4;
    gl_FragColor = vec4(vColor, (strength + halo) * vOpacity);
  }
`;

const RADIUS = 98;
/** Radio de la esfera de detección de eventos para cada estrella. */
const HIT_RADIUS = 2.0;

/**
 * Estrellas variables conocidas con sus parámetros de variabilidad.
 * period: período en segundos.
 * amp: amplitud de modulación [0-1]. 1.0 = apagado completo en mínimo.
 * phase: desfase inicial en radianes.
 */
const VARIABLE_STARS: Record<string, { period: number; amp: number; phase: number }> = {
    // Algol (β Persei): binaria eclipsante, período 2.867 días. Rango mag 2.12–3.39
    'Algol':      { period: 247_814, amp: 0.48, phase: 0.0 },
    // Mira (ο Ceti): variable de largo período, 331.96 días. Rango mag 2.0–10.1
    'Mira':       { period: 28_681_000, amp: 0.82, phase: 1.8 },
    // Betelgeuse (α Ori): semirregular, período ~420 días. Rango mag 0.0–1.3
    'Betelgeuse': { period: 36_288_000, amp: 0.22, phase: 3.1 },
};


/** Hitbox invisible que detecta click/hover para cada estrella nombrada */
function StarHitbox({ star, pos }: { star: typeof STARS[0]; pos: [number, number, number] }) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const [hovered, setHovered] = useState(false);

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
                    <div style={{
                        background: 'rgba(2,8,20,0.88)',
                        border: `1px solid ${star.color}55`,
                        borderRadius: '4px',
                        padding: '4px 10px',
                        color: star.color,
                        fontSize: '11px',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        letterSpacing: '1px',
                        pointerEvents: 'none',
                        textShadow: `0 0 10px ${star.color}`,
                        transform: 'translateX(-50%) translateY(-28px)',
                    }}>
                        {star.name}
                        <div style={{ fontSize: '9px', color: '#ffffff55', fontWeight: 'normal', letterSpacing: '0.5px' }}>
                            Mag {star.mag.toFixed(2)} · {star.constellation}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

export default function Stars() {
    const pointsRef = useRef<THREE.Points>(null);

    const [geometry, material, starPositions] = useMemo(() => {
        const pos = new Float32Array(STARS.length * 3);
        const col = new Float32Array(STARS.length * 3);
        const sz  = new Float32Array(STARS.length);
        const varAmpArr = new Float32Array(STARS.length);
        const varPerArr = new Float32Array(STARS.length);
        const varPhaArr = new Float32Array(STARS.length);
        const positions3D: [number, number, number][] = [];

        STARS.forEach((star, i) => {
            const p = equatorialTo3D(star.ra, star.dec, RADIUS);
            pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
            positions3D.push(p);

            const color = new THREE.Color(star.color || '#ffffff');
            col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b;
            sz[i] = Math.max(1.5, (6.5 - star.mag) * 0.95);

            // Atributos de variabilidad
            const varInfo = VARIABLE_STARS[star.name];
            if (varInfo) {
                varAmpArr[i] = varInfo.amp;
                varPerArr[i] = varInfo.period;
                varPhaArr[i] = varInfo.phase;
            }
        });

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geom.setAttribute('color',    new THREE.BufferAttribute(col, 3));
        geom.setAttribute('size',     new THREE.BufferAttribute(sz, 1));
        geom.setAttribute('varAmp',   new THREE.BufferAttribute(varAmpArr, 1));
        geom.setAttribute('varPer',   new THREE.BufferAttribute(varPerArr, 1));
        geom.setAttribute('varPha',   new THREE.BufferAttribute(varPhaArr, 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: { uTime: { value: 0 }, uTimeSec: { value: Date.now() / 1000 } },
            transparent: true,
            depthWrite: false,
        });

        return [geom, mat, positions3D];
    }, []);

    useFrame((state) => {
        const mat = material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        // uTimeSec usa el tiempo del store para que las variables respondan al Time Travel
        mat.uniforms.uTimeSec.value = useAppStore.getState().time.getTime() / 1000;
    });

    return (
        <group>
            {/* Renderizado visual en shader */}
            <points ref={pointsRef} geometry={geometry} material={material} />

            {/* Hitboxes invisibles para click y hover */}
            {STARS.map((star, i) => (
                <StarHitbox key={star.name} star={star} pos={starPositions[i]} />
            ))}
        </group>
    );
}
