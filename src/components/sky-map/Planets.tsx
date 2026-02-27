'use client';

import { Html, Float } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Planet } from '@/types/celestial';
import * as Astronomy from 'astronomy-engine';

const JUPITER_MOON_DATA = [
    { key: 'io', name: 'Ío', color: '#ffffaa', mag: 5.0 },
    { key: 'europa', name: 'Europa', color: '#eeeeff', mag: 5.3 },
    { key: 'ganymede', name: 'Ganímedes', color: '#dddddd', mag: 4.6 },
    { key: 'callisto', name: 'Calisto', color: '#aaaaaa', mag: 5.6 },
];

// ── Configuración estática de cada planeta ────────────────────────────────────
interface PlanetConfig {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    description: (mag: number) => string;
    textureKey: keyof typeof TEXTURES;
}

const PLANET_CONFIGS: PlanetConfig[] = [
    {
        body: Astronomy.Body.Sun,
        name: 'Sol', symbol: '☀', color: '#fff5e6',
        description: () => 'Nuestra estrella. El centro del Sistema Solar.',
        textureKey: 'sun'
    },
    {
        body: Astronomy.Body.Venus,
        name: 'Venus', symbol: '♀', color: '#fff8d4',
        description: (mag) => `Planeta más brillante del cielo. Mag ${mag?.toFixed(1) ?? '?'}. Fases visibles con binoculares.`,
        textureKey: 'venus'
    },
    {
        body: Astronomy.Body.Jupiter,
        name: 'Júpiter', symbol: '♃', color: '#ffe4b0',
        description: (mag) => `El gigante gaseoso del sistema solar. Mag ${mag?.toFixed(1) ?? '?'}. Sus cuatro lunas son visibles con prismáticos.`,
        textureKey: 'jupiter'
    },
    {
        body: Astronomy.Body.Mars,
        name: 'Marte', symbol: '♂', color: '#ff7744',
        description: (mag) => `El Planeta Rojo. Mag ${mag?.toFixed(1) ?? '?'}. Su color naranja es inconfundible.`,
        textureKey: 'mars'
    },
    {
        body: Astronomy.Body.Saturn,
        name: 'Saturno', symbol: '♄', color: '#f5d97a',
        description: (mag) => `Sus anillos son visibles en telescopio pequeño. Mag ${mag?.toFixed(1) ?? '?'}.`,
        textureKey: 'saturn'
    },
    {
        body: Astronomy.Body.Mercury,
        name: 'Mercurio', symbol: '☿', color: '#b8c8d8',
        description: (mag) => `El planeta más esquivo. Mag ${mag?.toFixed(1) ?? '?'}. Siempre cerca del horizonte.`,
        textureKey: 'mercury'
    },
    {
        body: Astronomy.Body.Uranus,
        name: 'Urano', symbol: '⛢', color: '#a8dff0',
        description: (mag) => `Gigante de hielo. Mag ${mag?.toFixed(1) ?? '?'}. Visible a ojo desnudo en cielo muy oscuro.`,
        textureKey: 'uranus'
    },
    {
        body: Astronomy.Body.Neptune,
        name: 'Neptuno', symbol: '♆', color: '#4060ff',
        description: (mag) => `El gigante azul más lejano. Mag ${mag?.toFixed(1) ?? '?'}. Requiere binoculares.`,
        textureKey: 'neptune'
    },
];

const TEXTURES = {
    mercury: 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
    venus: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg',
    mars: 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
    jupiter: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg',
    saturn: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
    uranus: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
    neptune: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg',
    moon: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
    sun: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
};

const AU_KM = 149597870.7;
const MOON_RADIUS_KM = 1737.4;
const PLANET_RADIUS = 95;

// ── Safe texture loader (no Suspense/crash on 404) ───────────────────────────
function useSafeTexture(url: string): THREE.Texture | null {
    const [tex, setTex] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        if (!url) return;
        let alive = true;
        new THREE.TextureLoader().load(
            url,
            (t) => { if (alive) setTex(t); },
            undefined,
            () => { /* silently ignore load errors */ }
        );
        return () => { alive = false; };
    }, [url]);
    return tex;
}

// ── Shared glow texture (one canvas, reused for all sprites) ──────────────────
function makeGlowTexture(): THREE.CanvasTexture {
    const S = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const c = S / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

function JupiterMoonMesh({ moon, glowTex }: { moon: any, glowTex: THREE.CanvasTexture }) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const camFov = useAppStore((state) => state.camFov);

    // Visible as distinct points of light, labels only when close
    const opacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 60, 20, 0.6, 1.0), 0.6, 1.0);
    // Base size increased so they are visible against background
    const size = (0.12 + (6 - moon.mag) * 0.04) * (camFov < 15 ? 0.5 : 1.0);

    return (
        <group position={moon.pos}>
            <sprite
                scale={[size, size, 1]}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedObject(moon);
                    setTargetedObject(moon);
                }}
            >
                <spriteMaterial
                    map={glowTex}
                    color={moon.color}
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </sprite>
            {camFov < 12 && (
                <Html distanceFactor={1.5}>
                    <div 
                        className="text-shadow-soft accent-color text-[9px] font-mono whitespace-nowrap pointer-events-none bg-black/40 px-1 py-0.5 rounded-[2px] translate-x-2 -translate-y-2 font-bold"
                        style={{ '--accent-color': moon.color } as CSSProperties}
                    >
                        {moon.name}
                    </div>
                </Html>
            )}
        </group>
    );
}

// ── Moon phase helpers ─────────────────────────────────────────────────────────
function getMoonPhaseName(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return 'Luna nueva';
    if (p < 67.5) return 'Creciente cóncava';
    if (p < 112.5) return 'Cuarto creciente';
    if (p < 157.5) return 'Gibosa creciente';
    if (p < 202.5) return 'Luna llena';
    if (p < 247.5) return 'Gibosa menguante';
    if (p < 292.5) return 'Cuarto menguante';
    return 'Creciente menguante';
}

function drawMoonSurface(canvas: HTMLCanvasElement, phase: number) {
    const S = 256;
    if (canvas.width !== S) { canvas.width = canvas.height = S; }
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2, r = S / 2 - 2;
    ctx.save();
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Surface gradient
    const base = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    base.addColorStop(0, '#f5f5f0');
    base.addColorStop(0.5, '#d8d8d0');
    base.addColorStop(1, '#b8b8b0');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);

    // Maria
    ctx.fillStyle = 'rgba(90,90,100,0.5)';
    [[cx - r * 0.35, cy - r * 0.1, r * 0.25],
    [cx - r * 0.15, cy - r * 0.35, r * 0.18],
    [cx + r * 0.15, cy - r * 0.25, r * 0.14],
    [cx + r * 0.25, cy - r * 0.1, r * 0.12],
    [cx - r * 0.2, cy + r * 0.2, r * 0.15],
    ].forEach(([mx, my, mr]) => {
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    });

    // Limb darkening
    const limb = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
    limb.addColorStop(0, 'transparent');
    limb.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = limb;
    ctx.fill();

    ctx.restore();
    void phase; // phase info is used by lighting, not drawn here
}

// ── MoonMesh ──────────────────────────────────────────────────────────────────
const SUN_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SUN_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float uTime;
void main() {
    // Boiling effect simulation
    float noise = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 + uTime * 1.2);
    vec3 color = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.9, 0.3), noise * 0.5 + 0.5);
    
    // Fresnel glow
    float intensity = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
    color += vec3(1.0, 0.8, 0.4) * intensity;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

    const MOON_VERTEX_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

    const MOON_FRAGMENT_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform sampler2D uMap;
    uniform float uPhase;
    uniform float uOpacity;
    void main() {
        vec3 normal = normalize(vNormal);
        float phaseAdj = radians(uPhase + 180.0);
        vec3 lightDir = normalize(vec3(cos(phaseAdj), 0.0, sin(phaseAdj)));
        float lit = step(0.0, dot(normal, lightDir));
        float earthshine = 0.01;
        float shade = mix(earthshine, 1.0, lit);
        vec3 tex = texture2D(uMap, vUv).rgb;
        tex = mix(tex, tex * tex, 0.2);
        vec3 color = tex * shade;
        gl_FragColor = vec4(color, uOpacity);
    }
    `;

function SunMesh({ planet, opacity }: { planet: any, opacity: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
            meshRef.current.rotation.y += 0.002;
        }
        if (glowRef.current) {
            glowRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 2.0) * 0.05);
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 }
    }), []);

    return (
        <group position={planet.pos}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.5, 64, 64]} />
                <shaderMaterial
                    vertexShader={SUN_VERTEX_SHADER}
                    fragmentShader={SUN_FRAGMENT_SHADER}
                    uniforms={uniforms}
                    transparent
                    opacity={opacity}
                />
            </mesh>

            {/* Corona / Glow */}
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

            <pointLight
                intensity={5}
                color="#fff4d0"
                distance={15}
                decay={2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-near={0.1}
                shadow-camera-far={20}
            />
        </group>
    );
}

function MoonMesh({ planet, phase, opacity }: {
    planet: Planet & { pos: [number, number, number]; angularSize: number };
    phase: number;
    opacity: number;
}) {
    const setSelectedObj = useAppStore((s) => s.setSelectedObject);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    // Real apparent radius of Moon: ~0.25° → at R=95: 95*tan(0.25°*π/180) ≈ 0.414 units
    // angularSize in arcsec: ~1800 → 1800 * 0.00023 ≈ 0.414
    const SIZE = THREE.MathUtils.clamp(planet.angularSize * 0.00023, 0.35, 0.52);

    const texture = useSafeTexture(TEXTURES.moon);
    const fallbackTex = useMemo(() => {
        const data = new Uint8Array([216, 214, 192, 255]);
        const tex = new THREE.DataTexture(data, 1, 1);
        tex.needsUpdate = true;
        return tex;
    }, []);
    const setTargetedObject = useAppStore((s) => s.setTargetedObject);

    const uniforms = useMemo(() => ({
        uMap: { value: texture ?? fallbackTex },
        uPhase: { value: phase },
        uOpacity: { value: opacity },
    }), [texture, fallbackTex, phase, opacity]);

    useEffect(() => {
        if (!materialRef.current) return;
        materialRef.current.uniforms.uMap.value = texture ?? fallbackTex;
        materialRef.current.uniforms.uPhase.value = phase;
        materialRef.current.uniforms.uOpacity.value = opacity;
    }, [texture, fallbackTex, phase, opacity]);

    // No longer need manual disposal with useTexture

    return (
        <group position={planet.pos}>
            <mesh onClick={(e) => {
                e.stopPropagation();
                setSelectedObj(planet);
                setTargetedObject(planet);
            }}
                castShadow
                receiveShadow
            >
                <sphereGeometry args={[SIZE, 64, 64]} />
                <shaderMaterial
                    ref={materialRef}
                    uniforms={uniforms}
                    vertexShader={MOON_VERTEX_SHADER}
                    fragmentShader={MOON_FRAGMENT_SHADER}
                    transparent
                    opacity={opacity}
                />
            </mesh>
            <Html distanceFactor={90}>
                <div 
                    className="text-shadow-moon text-[#d8d6c0] text-[11px] font-mono whitespace-nowrap pointer-events-none select-none pl-2.5 font-bold tracking-[0.3px]"
                >
                    ☽ Luna <span className="text-[9px] opacity-70">{getMoonPhaseName(phase)}</span>
                </div>
            </Html>
        </group>
    );
}


/**
 * Planet3D: Renderiza el modelo 3D real del planeta cuando el usuario se acerca.
 * Incluye texturas, iluminación reactiva y rotación sutil.
 */
function Planet3D({
    planet,
    opacity,
    camFov,
    isTargeted,
}: {
    planet: Planet & { pos: [number, number, number]; angularSize: number; textureKey: keyof typeof TEXTURES };
    opacity: number;
    camFov: number;
    isTargeted: boolean;
}) {
    // Always call hook unconditionally (React rules), use empty string for sun
    const textureUrl = planet.textureKey !== 'sun' ? TEXTURES[planet.textureKey] : '';
    const texture = useSafeTexture(textureUrl);

    if (planet.textureKey === 'sun') {
        return <SunMesh planet={planet} opacity={opacity} />;
    }

    const isSaturn = planet.name === 'Saturno';
    const isGasGiant = planet.name === 'Júpiter' || planet.name === 'Saturno' || planet.name === 'Urano' || planet.name === 'Neptuno';

    // Tamaño visual en modo 3D (ligeramente exagerado para impacto visual)
    const baseScale = isGasGiant ? 0.9 : 0.5;
    const zoomBoost = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 50, 15, 1.0, 4.0),
        1.0,
        4.0,
    );
    const targetBoost = isTargeted ? 1.5 : 1.0;
    const scale = baseScale * zoomBoost * targetBoost;

    return (
        <group position={planet.pos} visible={opacity > 0.01}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[scale, 64, 64]} />
                    <meshStandardMaterial
                        map={texture ?? undefined}
                        color={texture ? undefined : planet.color}
                        transparent
                        opacity={opacity}
                        roughness={0.7}
                        metalness={0.1}
                    />
                </mesh>

                {isSaturn && (
                    <mesh rotation={[Math.PI / 2.5, 0, 0]} castShadow receiveShadow>
                        <ringGeometry args={[scale * 1.4, scale * 2.4, 64]} />
                        <meshStandardMaterial
                            map={texture} // Reutilizamos pero idealmente sería textura de anillos
                            color="#d4c080"
                            transparent
                            opacity={opacity * 0.8}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )}
            </Float>

            {/* Atmósfera/Brillo sutil para gigantes y Venus */}
            {(isGasGiant || planet.name === 'Venus') && (
                <mesh>
                    <sphereGeometry args={[scale * 1.05, 32, 32]} />
                    <meshBasicMaterial
                        color={planet.color}
                        transparent
                        opacity={opacity * 0.2}
                        side={THREE.BackSide}
                    />
                </mesh>
            )}
        </group>
    );
}

// ── PlanetMesh ────────────────────────────────────────────────────────────────
function PlanetMesh({ planet, glowTex }: {
    planet: Planet & { pos: [number, number, number]; angularSize: number; phase: number; ringTilt?: number; textureKey: keyof typeof TEXTURES };
    glowTex: THREE.CanvasTexture;
}) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const camFov = useAppStore((state) => state.camFov);
    const viewMode = useAppStore((state) => state.viewMode);
    const flightTarget = useAppStore((state) => state.flightTarget);
    const targetedObject = useAppStore((state) => state.targetedObject);

    const isOrbitalTarget = viewMode === 'orbital' && flightTarget === planet.name;
    const isTargeted = targetedObject?.name === planet.name;

    // Zoom Cross-fade:
    // fov=90 (lejos) -> sprite 1.0, 3D 0.0
    // fov=30 (cerca) -> sprite 0.0, 3D 1.0
    // If in orbital mode, force 3D model for the target
    const baseSpriteOpacity = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 50, 30, 1, 0), 0, 1);
    const spriteOpacity = isOrbitalTarget ? 0.0 : baseSpriteOpacity;
    const model3DOpacity = isOrbitalTarget ? 1.0 : (1 - baseSpriteOpacity);

    const brightness = Math.pow(2.512, -1.5 - planet.mag);
    const normB = Math.min(1.0, brightness);
    const baseSize = 0.08 + Math.pow(normB, 0.45) * 0.30;

    return (
        <group>
            {/* Modo Sprite (Cielo General) */}
            <group position={planet.pos} visible={spriteOpacity > 0.01}>
                {/* Sol conserva su halo masivo, planetas son más precisos (punto brillante) */}
                <sprite
                    scale={[baseSize * (planet.name === 'Sol' ? 4.0 : 1.8), baseSize * (planet.name === 'Sol' ? 4.0 : 1.8), 1]}
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObject(planet);
                        setTargetedObject(planet);
                    }}
                >
                    <spriteMaterial
                        map={glowTex}
                        color={planet.color}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                        opacity={spriteOpacity * 0.7}
                        transparent
                    />
                </sprite>
                {/* Centro brillante del planeta */}
                <sprite
                    scale={[baseSize * 0.6, baseSize * 0.6, 1]}
                >
                    <spriteMaterial
                        map={glowTex}
                        color="#ffffff"
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                        opacity={spriteOpacity}
                        transparent
                    />
                </sprite>
            </group>

            {/* Modo 3D (Zoom Detallado) */}
            <Planet3D planet={planet} opacity={model3DOpacity} camFov={camFov} isTargeted={isTargeted} />

            <Html position={planet.pos} distanceFactor={90}>
                <div
                    onClick={() => {
                        setSelectedObject(planet);
                        setTargetedObject(planet);
                    }}
                    className="planet-label font-semibold uppercase whitespace-nowrap cursor-pointer select-none pl-3 transition-all font-sans"
                    style={{
                        '--accent-color': planet.color,
                        fontSize: camFov < 35 ? '14px' : '11px',
                        opacity: THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 90, 80, 0.4, 1.0), 0.4, 1),
                    } as CSSProperties}
                >
                    {planet.name}
                </div>
            </Html>
        </group>
    );
}

// ── Astronomy helpers ──────────────────────────────────────────────────────────
function computeMoon(date: Date, obs: Astronomy.Observer) {
    try {
        const eq = Astronomy.Equator(Astronomy.Body.Moon, date, obs, true, true);
        const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        const phase = Astronomy.MoonPhase(date);
        const distKm = illum.geo_dist * AU_KM;
        const angSizeArcsec = (2 * MOON_RADIUS_KM / distKm) * (180 / Math.PI) * 3600;
        const pct = (illum.phase_fraction * 100).toFixed(0);
        return {
            planet: {
                name: 'Luna', symbol: '☽', ra: eq.ra * 15, dec: eq.dec,
                mag: illum.mag, color: '#d8d6c0',
                desc: `${getMoonPhaseName(phase)} — ${pct}% iluminada. Satélite natural de la Tierra.`,
                kind: 'planet' as const, angularSize: angSizeArcsec,
                textureKey: 'moon' as const,
            },
            phase,
        };
    } catch { return null; }
}

function computePlanetPosition(cfg: PlanetConfig, date: Date, obs: Astronomy.Observer) {
    try {
        const eq = Astronomy.Equator(cfg.body, date, obs, true, true);
        const illum = Astronomy.Illumination(cfg.body, date);
        const ringTilt = illum.ring_tilt !== undefined
            ? THREE.MathUtils.degToRad(illum.ring_tilt) : 0;
        const elongation = Astronomy.Elongation(cfg.body, date);
        return {
            name: cfg.name, symbol: cfg.symbol,
            ra: eq.ra * 15, dec: eq.dec,
            mag: illum.mag, color: cfg.color,
            desc: cfg.description(illum.mag),
            kind: 'planet' as const,
            pos: equatorialTo3D(eq.ra * 15, eq.dec, PLANET_RADIUS) as [number, number, number],
            angularSize: illum.geo_dist * 0, // not used for size anymore
            phase: elongation.elongation,
            ringTilt,
            textureKey: cfg.textureKey,
        };
    } catch { return null; }
}

function computeJupiterMoons(date: Date, obs: Astronomy.Observer) {
    try {
        const jupEq = Astronomy.Equator(Astronomy.Body.Jupiter, date, obs, true, true);
        // We need the geocentric vector of Jupiter in AU
        const jupIllum = Astronomy.Illumination(Astronomy.Body.Jupiter, date);
        const dist = jupIllum.geo_dist;
        const raRad = jupEq.ra * 15 * Math.PI / 180;
        const decRad = jupEq.dec * Math.PI / 180;

        const jVec = {
            x: dist * Math.cos(decRad) * Math.cos(raRad),
            y: dist * Math.cos(decRad) * Math.sin(raRad),
            z: dist * Math.sin(decRad)
        };

        const moons = Astronomy.JupiterMoons(date);
        return JUPITER_MOON_DATA.map((m) => {
            const relV = (moons as any)[m.key];

            // Proportional scaling for the "Exaggerated" view
            // Jupiter's model is ~0.9 units. Real angular size is ~0.0001 rad.
            // We need to scale the relative distance by ~100 to match the visual disk.
            const visualScale = 110.0;

            const v = {
                x: jVec.x + relV.x * visualScale,
                y: jVec.y + relV.y * visualScale,
                z: jVec.z + relV.z * visualScale
            };

            const ra = Math.atan2(v.y, v.x) * (180 / Math.PI) / 15;
            const dec = Math.atan2(v.z, Math.sqrt(v.x * v.x + v.y * v.y)) * (180 / Math.PI);
            const correctedRA = ra < 0 ? ra + 24 : ra;

            return {
                id: `jup_moon_${m.key}`,
                name: m.name,
                ra: correctedRA * 15,
                dec: dec,
                mag: m.mag,
                color: m.color,
                kind: 'planet' as const,
                desc: `Una de las lunas galileanas de Júpiter. Descubierta por Galileo Galilei en 1610.`,
                pos: equatorialTo3D(correctedRA * 15, dec, PLANET_RADIUS) as [number, number, number],
            };
        });
    } catch { return []; }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Planets() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const camFov = useAppStore((state) => state.camFov);

    // Shared glow texture for all planet sprites
    const glowTex = useMemo(() => makeGlowTexture(), []);
    useEffect(() => () => glowTex.dispose(), [glowTex]);

    // Recalculate planet positions every minute (they move slowly)
    const minuteKey = Math.floor(time.getTime() / 60000);

    const data = useMemo(() => {
        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
        const t = useAppStore.getState().time; // use latest time at calculation moment
        const planets = PLANET_CONFIGS
            .map(cfg => computePlanetPosition(cfg, t, obs))
            .filter(Boolean) as ReturnType<typeof computePlanetPosition>[];
        const moon = computeMoon(t, obs);
        const jupiterMoons = computeJupiterMoons(t, obs);
        return { planets, moon, jupiterMoons };
    }, [minuteKey, observer]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <group>
            {data.planets.map(p => (
                <PlanetMesh key={p!.name} planet={p!} glowTex={glowTex} />
            ))}
            {data.jupiterMoons.map(m => (
                <JupiterMoonMesh key={m.id} moon={m} glowTex={glowTex} />
            ))}
            {data.moon && (
                <MoonMesh
                    planet={{
                        ...data.moon.planet,
                        pos: equatorialTo3D(data.moon.planet.ra, data.moon.planet.dec, PLANET_RADIUS) as [number, number, number],
                    }}
                    phase={data.moon.phase}
                    opacity={useAppStore.getState().camFov < 45 ? 1.0 : 0.0}
                />
            )}
        </group>
    );
}
