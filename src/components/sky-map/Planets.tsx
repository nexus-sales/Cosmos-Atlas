'use client';

import { Html, Float } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';


// ── Texturas procedurales — sin dependencias externas ────────────────────────
function lcg(seed: number) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

function makeProceduralTexture(key: string): THREE.CanvasTexture {
    const W = 512, H = 256;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    switch (key) {
        case 'sun': {
            const g = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
            g.addColorStop(0, '#fff5a0'); g.addColorStop(0.4, '#ffa500'); g.addColorStop(1, '#cc4400');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            const r = lcg(42);
            for (let i = 0; i < 10; i++) {
                ctx.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.25})`;
                ctx.beginPath(); ctx.arc(r() * W, r() * H, 6 + r() * 22, 0, Math.PI * 2); ctx.fill();
            }
            break;
        }
        case 'mercury': {
            ctx.fillStyle = '#7a7a7a'; ctx.fillRect(0, 0, W, H);
            const r = lcg(100);
            for (let i = 0; i < 55; i++) {
                const [x, y, cr] = [r() * W, r() * H, 3 + r() * 18];
                ctx.fillStyle = `rgba(50,50,50,${0.25 + r() * 0.35})`;
                ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `rgba(180,180,180,${0.2 + r() * 0.2})`; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.stroke();
            }
            break;
        }
        case 'venus': {
            ctx.fillStyle = '#e8dca0'; ctx.fillRect(0, 0, W, H);
            const r = lcg(200);
            for (let y = 0; y < H; y++) {
                const wave = Math.sin(y * 0.12 + r() * 0.3) * 0.08;
                ctx.fillStyle = `rgba(255,248,220,${0.25 + wave + r() * 0.08})`;
                ctx.fillRect(0, y, W, 1);
            }
            break;
        }
        case 'mars': {
            ctx.fillStyle = '#b5401a'; ctx.fillRect(0, 0, W, H);
            const r = lcg(300);
            for (let i = 0; i < 25; i++) {
                ctx.fillStyle = `rgba(${160 + r() * 50},${40 + r() * 30},${10 + r() * 15},${0.25 + r() * 0.35})`;
                ctx.beginPath(); ctx.arc(r() * W, r() * H, 25 + r() * 70, 0, Math.PI * 2); ctx.fill();
            }
            const cap = ctx.createLinearGradient(0, 0, 0, 35);
            cap.addColorStop(0, 'rgba(240,240,255,0.85)'); cap.addColorStop(1, 'rgba(240,240,255,0)');
            ctx.fillStyle = cap; ctx.fillRect(0, 0, W, 35);
            break;
        }
        case 'jupiter': {
            const bands = ['#c88b3a', '#f0e0b0', '#a05828', '#d4a060', '#ecdcac', '#b07030', '#e0c888', '#c09850'];
            bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * (H / bands.length), W, H / bands.length + 1); });
            ctx.fillStyle = '#c02800';
            ctx.beginPath(); ctx.ellipse(W * 0.6, H * 0.56, 38, 22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#a02000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(W * 0.6, H * 0.56, 42, 26, 0, 0, Math.PI * 2); ctx.stroke();
            break;
        }
        case 'saturn': {
            const bands = ['#e8d890', '#d8c870', '#f4ecb0', '#c4b060', '#e0d488'];
            bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * (H / bands.length), W, H / bands.length + 1); });
            break;
        }
        case 'uranus': {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#a0f4f4'); g.addColorStop(0.5, '#7de8e8'); g.addColorStop(1, '#50c4c4');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            break;
        }
        case 'neptune': {
            const g = ctx.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, '#304090'); g.addColorStop(0.5, '#3f54ba'); g.addColorStop(1, '#1a2878');
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(10,15,80,0.55)';
            ctx.beginPath(); ctx.ellipse(W * 0.38, H * 0.42, 32, 18, 0.3, 0, Math.PI * 2); ctx.fill();
            break;
        }
        case 'moon': {
            // Tierras altas (base clara)
            ctx.fillStyle = '#cccbc5'; ctx.fillRect(0, 0, W, H);
            const r = lcg(500);

            // Mares lunares reales (planicies basálticas oscuras)
            const mares = [
                { x: 0.33, y: 0.38, rx: 82, ry: 66, rot: 0.3,  a: 0.44 }, // Mare Imbrium
                { x: 0.54, y: 0.44, rx: 55, ry: 42, rot: 0.15, a: 0.38 }, // Mare Serenitatis
                { x: 0.64, y: 0.54, rx: 46, ry: 34, rot: 0.2,  a: 0.36 }, // Mare Tranquillitatis
                { x: 0.26, y: 0.52, rx: 68, ry: 52, rot:-0.2,  a: 0.42 }, // Oceanus Procellarum
                { x: 0.50, y: 0.63, rx: 38, ry: 28, rot: 0.1,  a: 0.33 }, // Mare Fecunditatis
                { x: 0.40, y: 0.24, rx: 32, ry: 18, rot: 0.0,  a: 0.36 }, // Mare Frigoris
                { x: 0.60, y: 0.30, rx: 22, ry: 16, rot: 0.1,  a: 0.30 }, // Mare Vaporum
            ];
            for (const m of mares) {
                ctx.fillStyle = `rgba(55,54,50,${m.a})`;
                ctx.beginPath();
                ctx.ellipse(m.x * W, m.y * H, m.rx, m.ry, m.rot, 0, Math.PI * 2);
                ctx.fill();
            }

            // Cráteres grandes con fondo oscuro y reborde claro
            const largeCraters = [
                { x: 0.72, y: 0.72, r: 24 }, // Tycho (sur)
                { x: 0.42, y: 0.78, r: 20 }, // Clavius
                { x: 0.82, y: 0.48, r: 16 }, // Langrenus
                { x: 0.18, y: 0.32, r: 13 }, // Aristarchus
                { x: 0.53, y: 0.18, r: 15 }, // Plato
                { x: 0.78, y: 0.28, r: 18 }, // Copernicus
            ];
            for (const c of largeCraters) {
                ctx.fillStyle = 'rgba(65,64,60,0.65)';
                ctx.beginPath(); ctx.arc(c.x * W, c.y * H, c.r, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(215,213,205,0.72)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(c.x * W, c.y * H, c.r, 0, Math.PI * 2); ctx.stroke();
                if (c.r > 17) { // pico central
                    ctx.fillStyle = 'rgba(238,236,228,0.55)';
                    ctx.beginPath(); ctx.arc(c.x * W, c.y * H, c.r * 0.09, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Sistema de rayos de Tycho (líneas brillantes radiales)
            for (let ray = 0; ray < 14; ray++) {
                const ang = (ray / 14) * Math.PI * 2;
                const cx = 0.72 * W, cy = 0.72 * H;
                ctx.strokeStyle = `rgba(215,212,200,${0.12 + r() * 0.14})`;
                ctx.lineWidth = 0.7 + r() * 1.4;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 26);
                ctx.lineTo(cx + Math.cos(ang) * (55 + r() * 110), cy + Math.sin(ang) * (55 + r() * 110));
                ctx.stroke();
            }

            // Cráteres pequeños (textura de fondo)
            for (let i = 0; i < 160; i++) {
                const [x, y, cr] = [r() * W, r() * H, 0.8 + r() * 9];
                ctx.strokeStyle = `rgba(170,168,160,${0.18 + r() * 0.28})`; ctx.lineWidth = 0.5;
                ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.stroke();
            }
            break;
        }
        default: { ctx.fillStyle = '#888'; ctx.fillRect(0, 0, W, H); }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

function usePlanetTexture(key: string): THREE.CanvasTexture {
    return useMemo(() => makeProceduralTexture(key), [key]);
}

// Textura radial de los anillos de Saturno: B ring brillante, división de Cassini
// transparente, A ring exterior ligeramente más tenue.
function makeSaturnRingTexture(): THREE.CanvasTexture {
    const W = 512, H = 1;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const d = img.data;

    for (let x = 0; x < W; x++) {
        const t = x / (W - 1); // 0=borde interior, 1=borde exterior (ringGeometry inner→outer)
        let r = 220, g = 200, b = 155, a = 0;

        if (t < 0.08) {
            // C ring — muy tenue
            a = Math.round(t / 0.08 * 35);
        } else if (t < 0.12) {
            // Rampa C→B
            a = Math.round(35 + (t - 0.08) / 0.04 * 130);
        } else if (t < 0.55) {
            // B ring — más brillante (0.12-0.55)
            const inner = (t - 0.12) / 0.43;
            // Variación de densidad interna (B ring tiene bandas propias)
            const banding = 0.9 + 0.1 * Math.sin(inner * Math.PI * 8);
            a = Math.round(165 * banding);
            r = Math.round(225 * banding); g = Math.round(205 * banding); b = Math.round(158 * banding);
        } else if (t < 0.62) {
            // División de Cassini — gap transparente (0.55-0.62)
            const fade = Math.abs(t - 0.585) / 0.035;
            a = Math.round(Math.max(0, 1 - fade * fade) * 15);
        } else if (t < 0.87) {
            // A ring — ligeramente más tenue y más amarilla que B (0.62-0.87)
            const outer = (t - 0.62) / 0.25;
            const banding = 0.85 + 0.15 * Math.sin(outer * Math.PI * 5);
            a = Math.round(130 * banding * (1 - outer * 0.25));
            r = Math.round(215 * banding); g = Math.round(196 * banding); b = Math.round(148 * banding);
        } else {
            // F ring y borde exterior — fade rápido
            a = Math.round(Math.max(0, (1 - (t - 0.87) / 0.13)) * 18);
        }

        const i = x * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = Math.min(255, a);
    }

    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

function useSaturnRingTexture(): THREE.CanvasTexture {
    return useMemo(() => makeSaturnRingTexture(), []);
}

// Radios físicos ecuatoriales en km — para calcular tamaño angular real
const PLANET_PHYS_RADIUS_KM: Record<string, number> = {
    mercury: 2439.7,
    venus:   6051.8,
    mars:    3396.2,
    jupiter: 71492,
    saturn:  60268,
    uranus:  25559,
    neptune: 24764,
};
const AU_KM = 149597870.7;
// Base de referencia: Júpiter a ~4.0 AU (oposición media) = ~49" → scale 0.9
const REF_ARCSEC = 49.0;

const PLANET_CONFIGS = [
    { body: Astronomy.Body.Mercury, name: "Mercurio", symbol: "☿", color: "#b0b0b0", textureKey: "mercury" as const, description: (mag: number) => `El planeta más cercano al Sol. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Venus,   name: "Venus",    symbol: "♀", color: "#f0e6c0", textureKey: "venus"   as const, description: (mag: number) => `El lucero del alba, cubierto de nubes. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Mars,    name: "Marte",    symbol: "♂", color: "#c1440e", textureKey: "mars"    as const, description: (mag: number) => `El planeta rojo. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Jupiter, name: "Júpiter",  symbol: "♃", color: "#c88b3a", textureKey: "jupiter" as const, description: (mag: number) => `Gigante gaseoso con su Gran Mancha Roja. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Saturn,  name: "Saturno",  symbol: "♄", color: "#e8d890", textureKey: "saturn"  as const, description: (mag: number) => `El señor de los anillos. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Uranus,  name: "Urano",    symbol: "⛢", color: "#7de8e8", textureKey: "uranus"  as const, description: (mag: number) => `Un gigante helado con eje inclinado. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Neptune, name: "Neptuno",  symbol: "♆", color: "#3f54ba", textureKey: "neptune" as const, description: (mag: number) => `El planeta más lejano y ventoso. Mag: ${mag.toFixed(1)}` },
];

const SUN_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const SUN_FRAGMENT_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform sampler2D uMap;
    uniform float uTime;
    uniform float uOpacity;
    void main() {
        vec3 color = texture2D(uMap, vUv).rgb;
        vec3 viewDir = normalize(vViewPosition);

        // Brillo solar más intenso en el centro (frente a cámara)
        float rim = 1.0 - max(dot(vNormal, viewDir), 0.0);
        float intensity = pow(rim, 3.0);
        
        vec3 glow = vec3(1.0, 0.7, 0.3) * intensity * 1.8;
        vec3 sunBase = mix(color, vec3(1.0, 0.9, 0.7), 0.3);
        
        gl_FragColor = vec4(sunBase + glow, uOpacity);
    }
`;

// Vertex shader para planetas: emite normal en WORLD-space (para iluminación correcta)
// y en VIEW-space (para Fresnel). El SUN_VERTEX_SHADER sólo emite view-space.
const PLANET_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vNormalView;
    varying vec3 vViewPosition;
    void main() {
        vUv = uv;
        // World-space: uLightDirection también está en world-space
        vNormalWorld = normalize(mat3(modelMatrix) * normal);
        // View-space: para el efecto Fresnel (depende de la cámara)
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const PLANET_FRAGMENT_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vNormalView;
    varying vec3 vViewPosition;
    uniform sampler2D uMap;
    uniform vec3 uLightDirection;
    uniform float uOpacity;
    void main() {
        vec3 color = texture2D(uMap, vUv).rgb;

        // Iluminación: ambos en world-space → correcto independientemente del ángulo de cámara
        vec3 normal = normalize(vNormalWorld);
        vec3 lightDir = normalize(uLightDirection);
        float dotNL = dot(normal, lightDir);
        float light = smoothstep(-0.15, 0.25, dotNL);

        // Fresnel: view-space normal vs dirección de vista (correcto para borde atmosférico)
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(normalize(vNormalView), viewDir), 0.0), 3.0);
        vec3 atmosphericGlow = vec3(0.1, 0.3, 0.6) * fresnel * 0.5;

        float ambient = 0.06;
        vec3 finalColor = color * (light + ambient) + atmosphericGlow;
        gl_FragColor = vec4(finalColor, uOpacity);
    }
`;

/**
 * Shader exclusivo de la Luna:
 * - Terminador nítido (sin atmósfera lunar)
 * - Earthshine en el lado oscuro (luz reflejada por la Tierra)
 * - Oscurecimiento de limbo realista
 */
const MOON_FRAGMENT_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vNormalView;
    varying vec3 vViewPosition;
    uniform sampler2D uMap;
    uniform vec3 uLightDirection;
    uniform float uOpacity;

    void main() {
        vec3 albedo = texture2D(uMap, vUv).rgb;
        vec3 normal = normalize(vNormalWorld);
        vec3 lightDir = normalize(uLightDirection);
        float dotNL = dot(normal, lightDir);

        // Terminador nítido — la Luna carece de atmósfera que lo suavice
        float terminator = smoothstep(-0.022, 0.032, dotNL);

        // Oscurecimiento de limbo (polo físico de la Luna)
        vec3 viewDir = normalize(vViewPosition);
        float cosTheta = max(0.0, dot(normalize(vNormalView), viewDir));
        float limbDarken = pow(cosTheta, 0.35);

        // Lado iluminado: luz solar directa con oscurecimiento de limbo
        float sunLight = max(0.0, dotNL);
        vec3 litSide = albedo * (0.06 + sunLight * 0.94) * (0.55 + 0.45 * limbDarken);

        // Lado oscuro: earthshine — luz solar reflejada por la Tierra hacia la Luna
        // Tono ligeramente azulado (la Tierra refleja más azul)
        vec3 earthshine = albedo * vec3(0.36, 0.40, 0.50) * 0.032;

        // Mezcla a través del terminador
        vec3 finalColor = mix(earthshine, litSide, terminator);

        gl_FragColor = vec4(finalColor, uOpacity);
    }
`;

const PLANET_RADIUS = 95;


function SunMesh({ pos }: { pos: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const texture = usePlanetTexture('sun');
    const opacity = useAppStore(state => state.camFov < 45 ? 1.0 : 0.0);

    const uniforms = useMemo(() => ({
        uMap: { value: null as THREE.Texture | null },
        uTime: { value: 0 },
        uOpacity: { value: 0 }
    }), []);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;
            if (texture) material.uniforms.uMap.value = texture;
            material.uniforms.uOpacity.value = opacity;
            meshRef.current.rotation.y += 0.002;
        }
        if (glowRef.current) {
            glowRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 2.0) * 0.05);
        }
    });

    return (
        <group position={pos} visible={opacity > 0.01}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.5, 64, 64]} />
                <shaderMaterial
                    vertexShader={SUN_VERTEX_SHADER}
                    fragmentShader={SUN_FRAGMENT_SHADER}
                    uniforms={uniforms}
                    transparent
                />
            </mesh>
            <mesh ref={glowRef}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial
                    color="#ffaa44"
                    transparent
                    opacity={opacity * 0.4}
                    blending={THREE.AdditiveBlending}
                    side={THREE.BackSide}
                />
            </mesh>
            <pointLight intensity={5} color="#fff4d0" distance={15} decay={2} castShadow />
        </group>
    );
}

function MoonMesh({ planet, phase, opacity }: { planet: { pos: [number, number, number] }, phase: number, opacity: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    // time y observer se leen en useFrame desde getState() — sin re-renders innecesarios
    const texture = usePlanetTexture('moon');
    
    const uniforms = useMemo(() => ({
        uMap: { value: null as THREE.Texture | null },
        uOpacity: { value: 0 },
        uLightDirection: { value: new THREE.Vector3(1, 0, 0) }
    }), []);

    useFrame(() => {
        if (!meshRef.current) return;
        const material = meshRef.current.material as THREE.ShaderMaterial;
        if (texture) material.uniforms.uMap.value = texture;
        material.uniforms.uOpacity.value = opacity;

        try {
            const { time: t, observer: obs } = useAppStore.getState();
            const astObs = new Astronomy.Observer(obs.lat, obs.lon, 0);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, astObs, true, true);
            const sunHor = Astronomy.Horizon(t, astObs, sunEq.ra, sunEq.dec, 'normal');

            const el = THREE.MathUtils.degToRad(sunHor.altitude);
            const az = THREE.MathUtils.degToRad(sunHor.azimuth);

            material.uniforms.uLightDirection.value.set(
                Math.cos(el) * Math.sin(az),
                Math.sin(el),
                -Math.cos(el) * Math.cos(az)
            ).normalize();
        } catch {}
    });

    return (
        <group position={planet.pos} visible={opacity > 0.01}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.4, 64, 64]} />
                <shaderMaterial
                    vertexShader={PLANET_VERTEX_SHADER}
                    fragmentShader={MOON_FRAGMENT_SHADER}
                    uniforms={uniforms}
                    transparent
                />
            </mesh>
            <Html distanceFactor={120} zIndexRange={[90, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded border border-yellow-200/20 bg-black/80 px-2 py-1 text-[10px] font-bold font-mono text-yellow-100/80 -translate-x-1/2 -translate-y-8">
                    LUNA ({phase.toFixed(0)}°)
                </div>
            </Html>
        </group>
    );
}

interface PlanetData {
    name: string;
    pos: [number, number, number];
    textureKey: string;
    ra: number;
    dec: number;
    distAU: number;
}

function PlanetMesh({ planet }: { planet: PlanetData }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const camFov = useAppStore(state => state.camFov);
    const texture = usePlanetTexture(planet.textureKey);
    const ringTexture = useSaturnRingTexture();

    // Tamaño angular real en arcsec = 2 * (physRadius_km / (dist_AU * AU_KM)) * 206265
    const physRadius = PLANET_PHYS_RADIUS_KM[planet.textureKey] ?? 3000;
    const angularArcsec = 2 * (physRadius / (Math.max(0.1, planet.distAU) * AU_KM)) * 206265;
    // Normalizado respecto a Júpiter en oposición (referencia = 0.9)
    const baseScale = 0.9 * (angularArcsec / REF_ARCSEC);

    // ZoomBoost: hace visible el disco al acercar la cámara
    const zoomBoost = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 35, 2, 1.0, 30.0), 1.0, 30.0);
    const scale = baseScale * zoomBoost;

    // Opacidad: aparece cuando nos acercamos, pero no queremos que sea transparente si ya estamos cerca
    const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 65, 55, 0, 1), 0, 1);

    const uniforms = useMemo(() => ({
        uMap: { value: null as THREE.Texture | null },
        uOpacity: { value: 0 },
        uLightDirection: { value: new THREE.Vector3(1, 0, 0) }
    }), []);

    useFrame(() => {
        if (!meshRef.current) return;
        const material = meshRef.current.material as THREE.ShaderMaterial;
        if (texture) material.uniforms.uMap.value = texture;
        material.uniforms.uOpacity.value = opacity;

        try {
            const { time: t, observer: obs } = useAppStore.getState();
            const astObs = new Astronomy.Observer(obs.lat, obs.lon, 0);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, t, astObs, true, true);
            const sunHor = Astronomy.Horizon(t, astObs, sunEq.ra, sunEq.dec, 'normal');

            const el = THREE.MathUtils.degToRad(sunHor.altitude);
            const az = THREE.MathUtils.degToRad(sunHor.azimuth);

            // Dirección sol -> observador en coordenadas locales
            material.uniforms.uLightDirection.value.set(
                Math.cos(el) * Math.sin(az),
                Math.sin(el),
                -Math.cos(el) * Math.cos(az)
            ).normalize();
        } catch {}
    });

    return (
        <group position={planet.pos} visible={opacity > 0.01}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh ref={meshRef}>
                    <sphereGeometry args={[scale, 64, 64]} />
                    <shaderMaterial
                        vertexShader={PLANET_VERTEX_SHADER}
                        fragmentShader={PLANET_FRAGMENT_SHADER}
                        uniforms={uniforms}
                        transparent
                        depthTest={true}
                        depthWrite={true}
                    />
                </mesh>
                {planet.name === "Saturno" && (
                    <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                        <ringGeometry args={[scale * 1.4, scale * 2.4, 128]} />
                        <meshBasicMaterial
                            map={ringTexture}
                            transparent
                            opacity={opacity}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                            blending={THREE.NormalBlending}
                        />
                    </mesh>
                )}
            </Float>
            <Html distanceFactor={150}>
                <div className="pointer-events-none whitespace-nowrap rounded border border-white/20 bg-black/80 px-2 py-1 text-[10px] font-bold font-mono text-white -translate-x-1/2 -translate-y-12">
                    {planet.name.toUpperCase()}
                </div>
            </Html>
        </group>
    );
}

interface MoonData {
    id: string;
    name: string;
    color: string;
    pos: [number, number, number];
}

function JupiterMoonMesh({ moon }: { moon: MoonData }) {
    const camFov = useAppStore(state => state.camFov);
    const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 15, 5, 0, 1), 0, 1);
    
    if (opacity < 0.01) return null;

    return (
        <group position={moon.pos}>
            <mesh>
                <sphereGeometry args={[0.08, 32, 32]} />
                <meshBasicMaterial color={moon.color} />
            </mesh>
            <Html distanceFactor={80}>
                <div 
                    role="presentation" 
                    className="pointer-events-none whitespace-nowrap text-[8px] font-mono opacity-80" 
                    style={{ color: moon.color } as CSSProperties}
                >
                    {moon.name}
                </div>
            </Html>
        </group>
    );
}

export default function Planets() {
    // timeMinute solo cambia 1x/min — evita recalcular VSOP87 cada segundo
    const time = useAppStore(state => state.timeMinute);
    const observer = useAppStore(state => state.observer);
    const camFov = useAppStore(state => state.camFov);

    const data = useMemo(() => {
        const bs = new Astronomy.Observer(observer.lat, observer.lon, 0);
        const planets = PLANET_CONFIGS.map(cfg => {
            try {
                const eq = Astronomy.Equator(cfg.body, time, bs, true, true);
                return {
                    ...cfg,
                    ra: eq.ra * 15,
                    dec: eq.dec,
                    distAU: eq.dist,
                    pos: equatorialTo3D(eq.ra * 15, eq.dec, PLANET_RADIUS) as [number, number, number],
                } as PlanetData;
            } catch { return null; }
        }).filter((p): p is PlanetData => p !== null);

        let moon = null;
        try {
            const eq = Astronomy.Equator(Astronomy.Body.Moon, time, bs, true, true);
            const phase = Astronomy.MoonPhase(time);
            moon = {
                planet: { name: 'Luna', pos: equatorialTo3D(eq.ra * 15, eq.dec, PLANET_RADIUS) as [number, number, number] },
                phase
            };
        } catch {}

        // Posición astronómica del Sol (para renderizarlo en el lugar correcto)
        let sunPos: [number, number, number] = [0, PLANET_RADIUS, 0];
        try {
            const eq = Astronomy.Equator(Astronomy.Body.Sun, time, bs, true, true);
            sunPos = equatorialTo3D(eq.ra * 15, eq.dec, PLANET_RADIUS) as [number, number, number];
        } catch {}

        // Lunas galileanas de Júpiter — efemérides reales via astronomy-engine
        const jupiter = planets.find(p => p.name === "Júpiter");
        let jMoons: MoonData[] = [];
        if (jupiter) {
            try {
                // GalileanMoons devuelve posiciones en UA relativas a Júpiter
                // en coordenadas ecuatoriales geocéntricas. Escalamos para la escena.
                const MOON_SCALE = 4.0; // amplificador visual para que sean visibles
                const gm = Astronomy.JupiterMoons(time);
                const moonConfigs = [
                    { id: 'io',       name: 'Io',        color: '#ffffaa', data: gm.io },
                    { id: 'europa',   name: 'Europa',    color: '#eef1ff', data: gm.europa },
                    { id: 'ganymede', name: 'Ganímedes', color: '#d1d1d1', data: gm.ganymede },
                    { id: 'callisto', name: 'Calisto',   color: '#a2a2a2', data: gm.callisto },
                ];
                jMoons = moonConfigs.map(m => ({
                    id: m.id,
                    name: m.name,
                    color: m.color,
                    pos: [
                        jupiter.pos[0] + m.data.x * MOON_SCALE,
                        jupiter.pos[1] + m.data.y * MOON_SCALE,
                        jupiter.pos[2] + m.data.z * MOON_SCALE,
                    ] as [number, number, number]
                }));
            } catch {
                // Fallback visual si falla astronomy-engine en un tick concreto
                jMoons = [];
            }
        }

        return { planets, moon, jMoons, sunPos };
    }, [time, observer]);

    return (
        <group>
            <SunMesh pos={data.sunPos} />
            {data.planets.map(p => (
                <PlanetMesh key={p.name} planet={p} />
            ))}
            {data.moon && (
                <MoonMesh planet={data.moon.planet} phase={data.moon.phase} opacity={camFov < 50 ? Math.min(1, (50 - camFov) / 15) : 0} />
            )}
            {data.jMoons.map(m => (
                <JupiterMoonMesh key={m.id} moon={m} />
            ))}
        </group>
    );
}