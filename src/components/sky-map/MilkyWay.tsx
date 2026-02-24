'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * La esfera está rotada para que su eje +Y apunte al polo norte galáctico
 * (RA=192.86°, Dec=+27.13°). En este espacio LOCAL:
 *   - sinB = normalize(vPos).y  ← latitud galáctica exacta
 *
 * El centro galáctico (RA=266.405°, Dec=-28.936°) en espacio LOCAL
 * (aplicando Q^−1 a la posición ecuatorial):
 *   gc_local ≈ (0.344, 0.001, 0.939)
 * Se pasa como uniform uGCDir para calcular la asimetría centro/anticéntro.
 */

const GC_DIR = new THREE.Vector3(0.344, 0.001, 0.939).normalize();

const GALACTIC_NORTH = new THREE.Vector3(0.8678, 0.4531, 0.1981).normalize();
const galacticRotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), GALACTIC_NORTH)
);

const vertexShader = `
varying vec3 vLocalPos;
void main() {
    vLocalPos   = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3  uGCDir;

varying vec3 vLocalPos;

// ── Simplex noise 2D/3D Helpers ──────────────────────────────────────────────
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x  + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal Brownian Motion (FBM) for Dust Lanes
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for(int i=0; i<4; i++) {
        v += a * snoise(p);
        p = m * p * 2.02;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec3 dir = normalize(vLocalPos);

    // 1. Coordenadas Galácticas
    float sinB = dir.y;
    float bDeg = degrees(asin(clamp(sinB, -1.0, 1.0)));
    float lRad = atan(dir.x, dir.z);

    // 2. Estructura de la Banda
    float mainBand  = exp(-bDeg*bDeg / 36.0); // Banda central más nítida
    float thickHalo = exp(-bDeg*bDeg / 260.0) * 0.08;

    // 3. Bulbo Galáctico (Sagitario A*)
    float gcDot   = dot(dir, uGCDir);
    float bulgeMask = smoothstep(0.4, 0.98, gcDot);
    // Bulbo nítido y bulbo difuso
    float bulge = (smoothstep(0.85, 1.0, gcDot) * 1.35 + smoothstep(0.5, 0.9, gcDot) * 0.55) * mainBand;

    // 4. Polvo Estelar (Dust Lanes / Great Rift)
    // Usamos FBM para crear el surco irregular y fracturado
    vec2 dustUV = vec2(lRad * 1.8, bDeg * 0.08);
    float dustNoise = fbm(dustUV + vec2(uTime * 0.005, 0.0));
    float dustMask = smoothstep(0.1, 0.5, dustNoise * bulgeMask + 0.1); 
    
    // Grieta central (Great Rift)
    float rift = smoothstep(0.0, 0.5, gcDot) * exp(-abs(bDeg + dustNoise * 2.0) / 4.0);

    // 5. Nubes de Gas y Variaciones Regionales
    float cygnus = smoothstep(0.75, 0.95, dot(dir, normalize(vec3(-0.35, 0.05, -0.92)))) * 0.8;
    float carina = smoothstep(0.75, 0.95, dot(dir, normalize(vec3(0.5, -0.05, 0.4)))) * 0.6;

    // 6. Cromatismo (Colores NatGeo)
    vec3 colorCore   = vec3(1.0, 0.8, 0.55); // Bulbo amarillento/naranja
    vec3 colorArms   = vec3(0.8, 0.9, 1.0);  // Brazos blanco-azulados
    vec3 colorGas    = vec3(1.0, 0.6, 0.7);  // Nebulosidad H-Alpha rosada
    
    vec3 finalColor = mix(colorArms, colorCore, bulgeMask);
    finalColor = mix(finalColor, colorGas, cygnus * 0.3 + carina * 0.2);

    // 7. Brillo Final
    float bright = (mainBand * 0.55 + thickHalo + bulge * 0.75 + cygnus * 0.35 + carina * 0.25);
    
    // Aplicar máscara de polvo oscuro
    float shadow = smoothstep(0.2, 0.8, dustNoise) * 0.85 * (bulgeMask * 0.5 + 0.5);
    bright *= (1.0 - shadow * 1.1);
    bright -= rift * 0.55;
    bright = max(bright, 0.0);

    // Alpha cinemático – ajustado para mejor visibilidad
    float alpha = clamp(bright * 0.075, 0.0, 0.22);
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

// ── Textura de punto difuso generada en canvas ─────────────────────────────
function createGlowTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Gradiente radial: blanco en el centro → transparente en el borde
    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// ── Componente de Partículas Estelares (Estructura Gaia) ───────────────────────
function MilkyWayParticles() {
    const pointsRef = useRef<THREE.Points>(null);

    // Crear textura de glow una sola vez
    const glowTexture = useMemo(() => createGlowTexture(), []);

    const [positions, colors] = useMemo(() => {
        const count = 14000;
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);

        const coreColor = new THREE.Color('#ffdd99');  // Bulbo dorado cálido
        const armColor = new THREE.Color('#aaccff');  // Brazos azul-blanco
        const rimColor = new THREE.Color('#ffffff');  // Estrellas lejanas blancas

        const SPHERE_R = 97; // Radio ligeramente menor que la esfera de fondo (99)

        // RNG seeded for purity
        let rngSeed = 12345;
        const rng = () => {
            rngSeed = (Math.imul(1664525, rngSeed) + 1013904223) >>> 0;
            return rngSeed / 0x100000000;
        };

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Distribución física: Núcleo denso + Brazos espirales
            const t = rng();
            const dist = Math.pow(t, 2.2); // 0..1, concentrado cerca del centro

            const arm = Math.floor(rng() * 2) * Math.PI; // 2 brazos (0 y π)
            const angle = rng() * Math.PI * 2.0;
            const spiral = angle * 0.45 + arm;

            // Latitud galáctica: distribución gaussiana estrecha
            // más delgada alejándose del centro
            const bWidth = Math.PI * 0.04 * (1.0 + dist * 0.5); // ±~7° cerca, ±~11° lejos
            const latAngle = (rng() - 0.5) * 2.0 * bWidth;

            // Dirección en plano galáctico
            const cosLat = Math.cos(latAngle);
            const dx = Math.cos(spiral) * cosLat;
            const dy = Math.sin(latAngle);
            const dz = Math.sin(spiral) * cosLat;

            // Proyectar sobre la esfera con radio SPHERE_R,
            // añadiendo algo de profundidad aleatoria para variedad
            const r = SPHERE_R * (0.92 + rng() * 0.08);
            pos[i3] = dx * r;
            pos[i3 + 1] = dy * r;
            pos[i3 + 2] = dz * r;

            // Color: más cálido en el centro, más azul/blanco en los brazos
            const coreFrac = Math.pow(1.0 - dist, 3.0);
            const rimFrac = dist * 0.4;
            const c = new THREE.Color()
                .lerpColors(armColor, coreColor, coreFrac)
                .lerp(rimColor, rimFrac);

            col[i3] = c.r;
            col[i3 + 1] = c.g;
            col[i3 + 2] = c.b;
        }
        return [pos, col];
    }, []);

    return (
        <points ref={pointsRef} renderOrder={-1}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                    args={[colors, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                map={glowTexture}          // ← textura difusa: elimina los cuadrados
                size={0.32}                 // tamaño sutil
                sizeAttenuation={true}     // se hace menor con la distancia
                vertexColors               // usa el array de colores personalizados
                transparent={true}
                opacity={0.22}             // ajustado para mejor visibilidad
                alphaTest={0.01}           // descarta píxeles casi transparentes
                blending={THREE.NormalBlending}
                depthWrite={false}
                depthTest={false}
                toneMapped={false}
            />
        </points>
    );
}

export default function MilkyWay() {
    const meshRef = useRef<THREE.Mesh>(null);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uGCDir: { value: GC_DIR },
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
            state.clock.getElapsedTime();
    });

    return (
        <group rotation={galacticRotation} renderOrder={-2}>
            {/* 1. Fondo Nebuloso (Shader GLSL Pro) */}
            <mesh ref={meshRef} renderOrder={-2}>
                <sphereGeometry args={[99, 96, 96]} />
                <shaderMaterial
                    key="milkyway-pro-v3"
                    transparent
                    side={THREE.BackSide}
                    depthWrite={false}
                    depthTest={false}
                    blending={THREE.NormalBlending}
                    toneMapped={false}
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                />
            </mesh>

            {/* 2. Granulado Estelar (Gaia Point Cloud) */}
            <MilkyWayParticles />
        </group>
    );
}

