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

// ── Simplex noise 2D ──────────────────────────────────────────────────────────
vec3 mod289v3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289v2(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute3(vec3 x){ return mod289v3(((x*34.0)+1.0)*x); }
float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i  = floor(v + dot(v,C.yy));
    vec2 x0 = v - i + dot(i,C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1,0) : vec2(0,1);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute3(permute3(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
    vec3 m = max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m = m*m; m = m*m;
    vec3 x  = 2.0*fract(p*C.www)-1.0;
    vec3 h  = abs(x)-0.5;
    vec3 ox = floor(x+0.5);
    vec3 a0 = x-ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x*x0.x  + h.x*x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0*dot(m,g);
}
// ─────────────────────────────────────────────────────────────────────────────

void main() {
    vec3 dir = normalize(vLocalPos);

    // Latitud galáctica exacta ─────────────────────────────────────────────────
    float sinB = dir.y;
    float bDeg = degrees(asin(clamp(sinB, -1.0, 1.0)));

    // Banda principal (σ ≈ 6°) + halo difuso (σ ≈ 14°) ───────────────────────
    float mainBand  = exp(-bDeg*bDeg / 72.0);
    float thickHalo = exp(-bDeg*bDeg / 392.0) * 0.15;

    // Centro galáctico (Sagitario) ─────────────────────────────────────────────
    float gcDot   = dot(dir,  uGCDir);
    float acDot   = dot(dir, -uGCDir);
    float gcCore  = smoothstep(0.84, 1.00, gcDot) * 2.5;
    float gcBulge = smoothstep(0.50, 0.90, gcDot) * 0.65;
    float acDim   = 1.0 - smoothstep(0.60, 0.96, acDot) * 0.50;

    // Nubes estelares regionales ───────────────────────────────────────────────
    // Cygnus X (opuesto al centro, banda norte)
    float cygnus   = smoothstep(0.72, 0.92, dot(dir, normalize(vec3(-0.344, 0.035, -0.939))));
    cygnus        *= 0.50 * exp(-bDeg*bDeg / 24.0);

    // Escorpio-Centauro (entre GC y anticéntro sur)
    float scorpius = smoothstep(0.76, 0.94, dot(dir, normalize(vec3(0.20, -0.05, 0.98))));
    scorpius      *= 0.40 * exp(-bDeg*bDeg / 18.0);

    // Nubes de Perseo / Auriga (anticéntro tenue)
    float perseus  = smoothstep(0.80, 0.95, dot(dir, normalize(vec3(-0.30, -0.04, -0.95))));
    perseus       *= 0.28 * exp(-bDeg*bDeg / 16.0);

    // Gran Surco de Polvo (Great Rift) ─────────────────────────────────────────
    // canal oscuro estrecho (σ ≈ 3°) que recorre el plano del lado del centro
    float lRad    = atan(dir.x, dir.z);
    float riftB   = exp(-bDeg*bDeg / 18.0);
    float riftSide = smoothstep(-0.10, 0.55, gcDot);
    float riftVar  = snoise(vec2(lRad * 2.8 + 0.3, 0.0)) * 0.35 + 0.65;
    float rift    = riftB * riftSide * riftVar;

    // Textura filamentosa (ruido a lo largo de la longitud galáctica) ──────────
    float t  = uTime * 0.0012;
    float n1 = snoise(vec2(lRad * 2.2,        + t));
    float n2 = snoise(vec2(lRad * 4.8 - 0.6,  - t * 0.6));
    float n3 = snoise(vec2(lRad * 9.5 + 1.1,  + t * 0.3));
    float noise = (n1*0.50 + n2*0.30 + n3*0.20) * mainBand * 0.32;

    // Brillo total ─────────────────────────────────────────────────────────────
    float bright = (mainBand + thickHalo + gcCore + gcBulge + cygnus + scorpius + perseus) * acDim;
    bright += noise;
    bright -= rift * 0.72;
    bright  = max(bright, 0.0);

    // Color ────────────────────────────────────────────────────────────────────
    vec3 bandColor = vec3(0.78, 0.87, 1.00);          // blanco-azulado
    vec3 coreColor = vec3(1.00, 0.88, 0.68);          // núcleo cálido
    float coreMix  = clamp(gcDot * 0.65 + 0.12, 0.0, 1.0);
    vec3  col      = mix(bandColor, coreColor, coreMix);

    // Alpha ────────────────────────────────────────────────────────────────────
    float alpha = clamp(bright * 0.20, 0.0, 0.30);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col, alpha);
}
`;

export default function MilkyWay() {
    const meshRef = useRef<THREE.Mesh>(null);

    const uniforms = useMemo(() => ({
        uTime:  { value: 0 },
        uGCDir: { value: GC_DIR },
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value =
            state.clock.getElapsedTime();
    });

    return (
        <mesh ref={meshRef} rotation={galacticRotation}>
            <sphereGeometry args={[99, 96, 96]} />
            <shaderMaterial
                key="milkyway-v2"
                transparent
                side={THREE.BackSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
}
