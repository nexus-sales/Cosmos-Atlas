'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';

const GC_DIR = new THREE.Vector3(0.344, 0.001, 0.939).normalize();
const GALACTIC_NORTH = new THREE.Vector3(0.8678, 0.4531, 0.1981).normalize();
const galacticRotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), GALACTIC_NORTH)
);

const SPIRAL_ARMS = {
    perseus: new THREE.Vector3(-0.65, 0.02, -0.76).normalize(),
    sagittarius: new THREE.Vector3(0.55, -0.03, 0.83).normalize(),
    scutumCentaurus: new THREE.Vector3(0.72, 0.01, -0.69).normalize(),
    norma: new THREE.Vector3(-0.88, 0.0, 0.47).normalize(),
};

const LMC_DIR = new THREE.Vector3(-0.52, -0.18, 0.83).normalize();
const SMC_DIR = new THREE.Vector3(-0.58, -0.22, 0.78).normalize();

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
uniform vec3  uLMCDir;
uniform vec3  uSMCDir;
uniform vec3  uPerseusDir;
uniform vec3  uSagittariusDir;
uniform vec3  uScutumDir;
uniform vec3  uNormaDir;

varying vec3 vLocalPos;

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
    float sinB = dir.y;
    float bDeg = degrees(asin(clamp(sinB, -1.0, 1.0)));
    float lRad = atan(dir.x, dir.z);

    float mainBand  = exp(-bDeg*bDeg / 36.0);
    float thickHalo = exp(-bDeg*bDeg / 260.0) * 0.08;

    float gcDot   = dot(dir, uGCDir);
    float bulgeMask = smoothstep(0.4, 0.98, gcDot);
    float coreBright = smoothstep(0.92, 1.0, gcDot) * 2.5;
    float bulge = (smoothstep(0.85, 1.0, gcDot) * 1.35 + smoothstep(0.5, 0.9, gcDot) * 0.55) * mainBand;

    float armPerseus = smoothstep(0.85, 0.98, dot(dir, uPerseusDir)) * 0.35;
    float armSagittarius = smoothstep(0.85, 0.98, dot(dir, uSagittariusDir)) * 0.4;
    float armScutum = smoothstep(0.85, 0.98, dot(dir, uScutumDir)) * 0.38;
    float armNorma = smoothstep(0.85, 0.98, dot(dir, uNormaDir)) * 0.3;
    float spiralArms = armPerseus + armSagittarius + armScutum + armNorma;

    float lmcDot = dot(dir, uLMCDir);
    float smcDot = dot(dir, uSMCDir);
    float lmc = smoothstep(0.95, 1.0, lmcDot) * 0.6;
    float smc = smoothstep(0.95, 1.0, smcDot) * 0.4;
    float lmcHalo = smoothstep(0.85, 0.98, lmcDot) * 0.25;
    float smcHalo = smoothstep(0.85, 0.98, smcDot) * 0.18;

    vec2 dustUV = vec2(lRad * 1.8, bDeg * 0.08);
    float dustNoise = fbm(dustUV);
    float rift = smoothstep(0.0, 0.5, gcDot) * exp(-abs(bDeg + dustNoise * 2.0) / 4.0);

    float cygnus = smoothstep(0.75, 0.95, dot(dir, normalize(vec3(-0.35, 0.05, -0.92)))) * 0.8;
    float carina = smoothstep(0.75, 0.95, dot(dir, normalize(vec3(0.5, -0.05, 0.4)))) * 0.6;

    // Regiones H-alpha: nebulosas de emisión rosadas/rojizas a lo largo del plano
    // Orienta los puntos clave: Carina (RA~160°), Cygnus (RA~310°), Scutum (RA~275°), Orion (RA~84°)
    float hAlphaCarina = smoothstep(0.82, 0.96, dot(dir, normalize(vec3(0.50, -0.05, 0.40))));
    float hAlphaCygnus = smoothstep(0.82, 0.96, dot(dir, normalize(vec3(-0.35, 0.05, -0.92))));
    float hAlphaScutum = smoothstep(0.82, 0.96, dot(dir, uScutumDir));
    float hAlphaOrion  = smoothstep(0.86, 0.97, dot(dir, normalize(vec3(0.50, -0.09, 0.86))));
    float hAlpha = (hAlphaCarina + hAlphaCygnus * 0.7 + hAlphaScutum * 0.6 + hAlphaOrion * 0.5)
                   * mainBand;

    vec3 colorCore       = vec3(1.0,  0.85, 0.60);
    vec3 colorArms       = vec3(0.75, 0.88, 1.0);
    vec3 colorGas        = vec3(1.0,  0.55, 0.65);
    vec3 colorLMC        = vec3(0.6,  0.75, 1.0);
    vec3 colorCoreBright = vec3(1.0,  0.95, 0.8);
    vec3 colorHAlpha     = vec3(1.0,  0.32, 0.45); // rosa/rojo de nebulosas HII

    vec3 finalColor = mix(colorArms, colorCore, bulgeMask);
    finalColor = mix(finalColor, colorCoreBright, coreBright * 0.4);
    finalColor = mix(finalColor, colorGas,    cygnus * 0.3 + carina * 0.2);
    finalColor = mix(finalColor, colorLMC,    lmc + smc);
    finalColor = mix(finalColor, colorHAlpha, clamp(hAlpha * 0.5, 0.0, 0.45));

    float bright = (mainBand * 0.70 + thickHalo * 1.2 + bulge * 0.90 + coreBright * 1.0);
    bright += spiralArms * 0.55;
    bright += (lmc + lmcHalo + smc + smcHalo) * 0.65;
    bright += cygnus * 0.45 + carina * 0.35;
    bright += hAlpha * 0.3;

    // Calles de polvo — sombra más dramática
    float shadow = smoothstep(0.1, 0.75, dustNoise) * 0.90 * (bulgeMask * 0.6 + 0.4);
    bright *= (1.0 - shadow * 1.25);
    bright -= rift * 0.70;
    bright = max(bright, 0.0);

    float alpha = clamp(bright * 0.115, 0.0, 0.38);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(finalColor, alpha);
}
`;

function createGlowTexture(): THREE.Texture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
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

const MW_PARTICLES_BY_QUALITY = { high: 22000, medium: 11000, low: 5000 } as const;

function MilkyWayParticles() {
    const pointsRef = useRef<THREE.Points>(null);
    const glowTexture = useMemo(() => createGlowTexture(), []);
    const deviceQuality = useAppStore(s => s.deviceQuality);

    const [positions, colors, sizes] = useMemo(() => {
        const count = MW_PARTICLES_BY_QUALITY[deviceQuality];
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        const coreColor = new THREE.Color('#ffcc77');
        const armColor = new THREE.Color('#99ccff');
        const halphaColor = new THREE.Color('#ff99bb');
        const dustExtColor = new THREE.Color('#aa7755');
        const rimColor = new THREE.Color('#ffffff');
        const SPHERE_R = 97;
        let rngSeed = 12345;
        // eslint-disable-next-line react-hooks/immutability
        const rng = () => { rngSeed = (Math.imul(1664525, rngSeed) + 1013904223) >>> 0; return rngSeed / 0x100000000; };

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const t = rng();
            const dist = Math.pow(t, 2.2);
            const arm = Math.floor(rng() * 2) * Math.PI;
            const angle = rng() * Math.PI * 2.0;
            const spiral = angle * 0.45 + arm;
            const bWidth = Math.PI * 0.04 * (1.0 + dist * 0.5);
            const latAngle = (rng() - 0.5) * 2.0 * bWidth;
            const cosLat = Math.cos(latAngle);
            const dx = Math.cos(spiral) * cosLat;
            const dy = Math.sin(latAngle);
            const dz = Math.sin(spiral) * cosLat;
            const r = SPHERE_R * (0.92 + rng() * 0.08);
            pos[i3] = dx * r; pos[i3 + 1] = dy * r; pos[i3 + 2] = dz * r;
            const coreFrac = Math.pow(1.0 - dist, 4.0);
            const rimFrac = dist * 0.3;
            const isHAlpha = rng() < 0.08 && dist > 0.3;
            const isDusty = rng() < 0.12 && dist > 0.2;
            const isHotBlue = rng() < 0.05 && dist > 0.4;
            const c = new THREE.Color().lerpColors(armColor, coreColor, coreFrac).lerp(rimColor, rimFrac);
            if (isHAlpha) c.lerp(halphaColor, 0.7);
            if (isDusty) c.lerp(dustExtColor, 0.6);
            if (isHotBlue) c.lerp(new THREE.Color('#4488ff'), 0.8);
            col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
            siz[i] = (0.15 + rng() * 0.4) * (1.0 + coreFrac * 0.5);
        }
        return [pos, col, siz];
    }, [deviceQuality]);

    return (
        <points ref={pointsRef} renderOrder={-1}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} args={[colors, 3]} />
                <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} args={[sizes, 1]} />
            </bufferGeometry>
            <pointsMaterial map={glowTexture} size={0.28} sizeAttenuation={true} vertexColors transparent opacity={0.3} alphaTest={0.001} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
        </points>
    );
}

export default function MilkyWay() {
    const meshRef = useRef<THREE.Mesh>(null);
    const viewMode = useAppStore(s => s.viewMode);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uGCDir: { value: GC_DIR },
        uLMCDir: { value: LMC_DIR },
        uSMCDir: { value: SMC_DIR },
        uPerseusDir: { value: SPIRAL_ARMS.perseus },
        uSagittariusDir: { value: SPIRAL_ARMS.sagittarius },
        uScutumDir: { value: SPIRAL_ARMS.scutumCentaurus },
        uNormaDir: { value: SPIRAL_ARMS.norma },
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    });

    if (viewMode === 'camera') return null;

    return (
        <group rotation={galacticRotation} renderOrder={-2}>
            <mesh ref={meshRef} renderOrder={-2}>
                <sphereGeometry args={[99, 96, 96]} />
                <shaderMaterial
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
            <MilkyWayParticles />
        </group>
    );
}
