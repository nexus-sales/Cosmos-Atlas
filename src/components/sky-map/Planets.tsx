'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { Planet } from '@/types/celestial';
import * as Astronomy from 'astronomy-engine';

// ── Rayleigh Scattering Shader para atmósferas planetarias ───────────────────
const atmosphereVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const atmosphereFragmentShader = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform vec3 uLightDir; // Dirección hacia la luz (Sol)
    varying vec3 vNormal;
    
    void main() {
        // Producto punto para el lado iluminado
        float lightDot = dot(vNormal, uLightDir);
        
        // Fresnel: más intenso en los bordes (limb)
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
        
        // Scattering: azul en el lado iluminado, más tenue en sombra
        float scatter = max(0.0, lightDot) * 0.7 + 0.3;
        
        vec3 atmColor = uColor * scatter * uIntensity;
        float alpha = fresnel * 0.4 * uIntensity;
        
        // Color más azul en los bordes (efecto Rayleigh puro)
        atmColor = mix(atmColor, vec3(0.4, 0.6, 1.0), fresnel * 0.5);
        
        gl_FragColor = vec4(atmColor, alpha);
    }
`;

// ── Configuración estática de cada planeta ────────────────────────────────
interface PlanetConfig {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    size: number;
    description: (mag: number) => string;
}

const PLANET_CONFIGS: PlanetConfig[] = [
    {
        body: Astronomy.Body.Venus,
        name: 'Venus', symbol: '\u2640', color: '#fff8d4', size: 0.55,
        description: (mag) => `Planeta m\u00e1s brillante del cielo. Mag ${mag.toFixed(1)}. Fases visibles con binoculares.`,
    },
    {
        body: Astronomy.Body.Jupiter,
        name: 'J\u00fapiter', symbol: '\u2643', color: '#ffe4b0', size: 0.48,
        description: (mag) => `El gigante gaseoso del sistema solar. Mag ${mag.toFixed(1)}. Sus cuatro lunas son visibles con pism\u00e1ticos.`,
    },
    {
        body: Astronomy.Body.Mars,
        name: 'Marte', symbol: '\u2642', color: '#ff7744', size: 0.32,
        description: (mag) => `El Planeta Rojo. Mag ${mag.toFixed(1)}. Su color naranja es inconfundible.`,
    },
    {
        body: Astronomy.Body.Saturn,
        name: 'Saturno', symbol: '\u2644', color: '#f5d97a', size: 0.35,
        description: (mag) => `Con sus anillos visibles en telescopio peque\u00f1o. Mag ${mag.toFixed(1)}.`,
    },
    {
        body: Astronomy.Body.Mercury,
        name: 'Mercurio', symbol: '\u263f', color: '#b8c8d8', size: 0.22,
        description: (mag) => `El planeta m\u00e1s esquivo. Mag ${mag.toFixed(1)}. Siempre cerca del horizonte.`,
    },
    {
        body: Astronomy.Body.Uranus,
        name: 'Urano', symbol: '\u26e2', color: '#a8dff0', size: 0.18,
        description: (mag) => `Gigante de hielo. Mag ${mag.toFixed(1)}. Visible a ojo desnudo en cielo muy oscuro.`,
    },
    {
        body: Astronomy.Body.Neptune,
        name: 'Neptuno', symbol: '\u2646', color: '#4060ff', size: 0.16,
        description: (mag) => `El gigante azul m\u00e1s lejano. Mag ${mag.toFixed(1)}. Requiere binoculares.`,
    },
];

// ── Physical constants ────────────────────────────────────────────────────────
const RADII_KM: Record<string, number> = {
    'Mercurio': 2439.7,
    'Venus': 6051.8,
    'Marte': 3389.5,
    'Júpiter': 69911,
    'Saturno': 58232,
    'Urano': 25362,
    'Neptuno': 24622,
};

const AU_KM = 149597870.7;
const MOON_RADIUS_KM = 1737.4;

// ── Moon helpers ─────────────────────────────────────────────────────────────

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

/**
 * Updates an existing canvas and texture with lunar surface features (craters, maria).
 * This texture is used with lighting to create realistic phases.
 */
function updateMoonCanvas(canvas: HTMLCanvasElement, phase: number, color1 = '#d8d6c0', color2 = '#0c1322') {
    const S = 256;
    if (canvas.width !== S) canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2, r = S / 2 - 2;

    ctx.save();
    ctx.clearRect(0, 0, S, S);
    
    // Base lunar surface
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Base color with subtle gradient - más brillante
    const base = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    base.addColorStop(0, '#f5f5f0');
    base.addColorStop(0.5, '#d8d8d0');
    base.addColorStop(1, '#b8b8b0');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);

    // Maria (dark spots) - simplified lunar features - más contraste
    ctx.fillStyle = 'rgba(90, 90, 100, 0.5)';
    
    // Oceanus Procellarum
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.1, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Imbrium
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy - r * 0.35, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Serenitatis
    ctx.beginPath();
    ctx.arc(cx + r * 0.15, cy - r * 0.25, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Tranquillitatis
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Crisium
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.35, cy - r * 0.35, r * 0.08, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Nubium
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy + r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Mare Humorum
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy + r * 0.1, r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Craters (small dark spots)
    ctx.fillStyle = 'rgba(80, 80, 85, 0.3)';
    const craters = [
        { x: 0.2, y: -0.15, r: 0.06 },
        { x: -0.1, y: 0.3, r: 0.05 },
        { x: 0.35, y: 0.2, r: 0.04 },
        { x: -0.25, y: -0.3, r: 0.05 },
        { x: 0.05, y: 0.1, r: 0.04 },
        { x: -0.4, y: 0.15, r: 0.06 },
        { x: 0.15, y: -0.45, r: 0.04 },
    ];
    
    craters.forEach(c => {
        ctx.beginPath();
        ctx.arc(cx + c.x * r, cy + c.y * r, r * c.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Subtle limb darkening
    const limbGrad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
    limbGrad.addColorStop(0, 'transparent');
    limbGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = limbGrad;
    ctx.fill();

    ctx.restore();
}

/**
 * Creates a simple planet disc texture (for outer planets that don't show phases).
 * Includes subtle limb darkening and optional surface features.
 */
function createPlanetTexture(canvas: HTMLCanvasElement, color: string, hasRings = false) {
    const S = 256;
    if (canvas.width !== S) canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2, r = S / 2 - 8;

    ctx.save();
    ctx.clearRect(0, 0, S, S);

    // Main disc with gradient
    const mainGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.2, 0, cx, cy, r);
    mainGrad.addColorStop(0, color);
    mainGrad.addColorStop(0.7, color);
    mainGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = mainGrad;
    ctx.fill();

    // Subtle bands for gas giants
    if (!hasRings) {
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 4; i++) {
            const y = cy - r * 0.6 + i * r * 0.4;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            ctx.fillRect(cx - r, y, r * 2, r * 0.15);
        }
        ctx.globalAlpha = 1;
    }

    // Limb darkening
    const limbGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    limbGrad.addColorStop(0, 'transparent');
    limbGrad.addColorStop(0.8, 'transparent');
    limbGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = limbGrad;
    ctx.fill();

    ctx.restore();
}

/** Compute Moon equatorial position and phase for a given date */
function computeMoon(date: Date, obs: Astronomy.Observer): { planet: Planet & { angularSize: number }; phase: number } | null {
    try {
        const eq = Astronomy.Equator(Astronomy.Body.Moon, date, obs, true, true);
        const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        const phase = Astronomy.MoonPhase(date);
        const pct = (illum.phase_fraction * 100).toFixed(0);
        const distKm = illum.geo_dist * AU_KM;
        const angSizeArcsec = (2 * MOON_RADIUS_KM / distKm) * (180 / Math.PI) * 3600;
        return {
            planet: {
                name: 'Luna',
                symbol: '\u263d',
                ra: eq.ra * 15,
                dec: eq.dec,
                mag: illum.mag,
                color: '#d8d6c0',
                desc: `${getMoonPhaseName(phase)} \u2014 ${pct}% iluminada. Sat\u00e9lite natural de la Tierra.`,
                kind: 'planet',
                angularSize: angSizeArcsec,
            },
            phase,
        };
    } catch {
        return null;
    }
}

// ── Components ───────────────────────────────────────────────────────────────

function MoonMesh({ planet, phase }: { planet: Planet & { pos: [number, number, number]; angularSize: number }; phase: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const setSelectedObj = useAppStore((s) => s.setSelectedObject);
    const SIZE = THREE.MathUtils.clamp(planet.angularSize * 0.001, 1.5, 2.6);
    const textureRef = useRef<THREE.CanvasTexture | null>(null);

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        const tex = new THREE.CanvasTexture(canvas);
        updateMoonCanvas(canvas, phase);
        tex.needsUpdate = true;
        textureRef.current = tex;
        return tex;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const roundedPhase = Math.round(phase / 2) * 2;

    useEffect(() => {
        const canvas = texture.image as HTMLCanvasElement;
        updateMoonCanvas(canvas, roundedPhase);
        // eslint-disable-next-line react-hooks/immutability
        texture.needsUpdate = true;
    }, [roundedPhase, texture]);

    useEffect(() => { return () => texture.dispose(); }, [texture]);

    return (
        <group position={planet.pos}>
            {/* Luna como esfera 3D real con iluminación */}
            <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); setSelectedObj(planet); }}>
                <sphereGeometry args={[SIZE, 32, 32]} />
                <meshStandardMaterial 
                    map={texture} 
                    transparent 
                    depthWrite={false} 
                    toneMapped={false}
                    roughness={0.8}
                    metalness={0.0}
                    emissive="#222222"
                    emissiveIntensity={0.15}
                />
            </mesh>
            {/* Glow suave alrededor */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[SIZE * 1.15, 32, 32]} />
                <meshBasicMaterial color="#b8c8e0" transparent opacity={0.08} depthWrite={false} side={THREE.BackSide} />
            </mesh>
            <Html distanceFactor={90}>
                <div style={{ color: '#d8d6c0', fontSize: '12px', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', textShadow: '0 0 10px rgba(216,214,192,0.8)', paddingLeft: '12px', fontWeight: 'bold', letterSpacing: '0.3px' }}>
                    {'\u263d'} Luna <span style={{ fontSize: '10px', opacity: 0.7 }}>{getMoonPhaseName(phase)}</span>
                </div>
            </Html>
        </group>
    );
}

// Planetas interiores muestran fases, exteriores no
const INNER_PLANETS = ['Mercurio', 'Venus'];

function PlanetMesh({ planet }: { planet: Planet & { pos: [number, number, number]; angularSize: number; phase: number; ringTilt?: number; moons?: Astronomy.JupiterMoonsInfo } }) {
    const sphereRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const textureRef = useRef<THREE.CanvasTexture | null>(null);

    // Tamaño visual proporcional al tamaño angular real
    const size = Math.max(0.18, planet.angularSize * 0.025);
    const isInnerPlanet = INNER_PLANETS.includes(planet.name);
    const hasSaturnRings = planet.name === 'Saturno';

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        const tex = new THREE.CanvasTexture(canvas);
        if (isInnerPlanet) {
            updateMoonCanvas(canvas, planet.phase, planet.color, '#110505');
        } else {
            createPlanetTexture(canvas, planet.color, hasSaturnRings);
        }
        tex.needsUpdate = true;
        textureRef.current = tex;
        return tex;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const canvas = texture.image as HTMLCanvasElement;
        if (isInnerPlanet) {
            updateMoonCanvas(canvas, planet.phase, planet.color, '#110505');
        } else {
            createPlanetTexture(canvas, planet.color, hasSaturnRings);
        }
        // eslint-disable-next-line react-hooks/immutability
        texture.needsUpdate = true;
    }, [planet.phase, texture, planet.color, isInnerPlanet, hasSaturnRings]);

    useEffect(() => { return () => texture.dispose(); }, [texture]);

    // Planetas con atmósfera significativa (Tierra, Venus, Marte, gigantes)
    const hasAtmosphere = ['Venus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Neptuno'].includes(planet.name);
    
    // Color de atmósfera según el planeta
    const atmosphereColor = useMemo(() => {
        switch (planet.name) {
            case 'Tierra': return new THREE.Color(0x4488ff); // Azul terrestre
            case 'Venus': return new THREE.Color(0xffdd88); // Amarillo denso
            case 'Marte': return new THREE.Color(0xff8866); // Rojo tenue
            case 'Júpiter': return new THREE.Color(0x88aadd); // Azul tenue
            case 'Saturno': return new THREE.Color(0xaaccff); // Azul pálido
            case 'Urano': return new THREE.Color(0x88ddff); // Cian
            case 'Neptuno': return new THREE.Color(0x4466ff); // Azul intenso
            default: return new THREE.Color(planet.color);
        }
    }, [planet.name, planet.color]);

    return (
        <group position={planet.pos}>
            {/* Planeta como esfera 3D real con iluminación */}
            <mesh ref={sphereRef} onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    depthWrite={false}
                    toneMapped={false}
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Atmósfera con Rayleigh Scattering (shader personalizado) */}
            {hasAtmosphere && (
                <mesh>
                    <sphereGeometry args={[size * 1.15, 32, 32]} />
                    <shaderMaterial
                        vertexShader={atmosphereVertexShader}
                        fragmentShader={atmosphereFragmentShader}
                        transparent
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        side={THREE.BackSide}
                        uniforms={{
                            uColor: { value: atmosphereColor },
                            uIntensity: { value: planet.name === 'Tierra' ? 0.8 : 0.5 },
                            uLightDir: { value: new THREE.Vector3(1, 0, 0) }, // Sol desde +X
                        }}
                    />
                </mesh>
            )}

            {/* Saturn Rings - usando inclinación real */}
            {hasSaturnRings && planet.ringTilt !== undefined && (
                <mesh ref={ringRef} rotation={[planet.ringTilt, 0, 0]}>
                    <ringGeometry args={[size * 1.6, size * 3.2, 64]} />
                    <meshStandardMaterial color="#d4b896" transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
                </mesh>
            )}

            {/* Jupiter Galilean Moons */}
            {planet.name === 'Júpiter' && planet.moons && (
                <group>
                    {[
                        { moon: planet.moons.io, name: 'Io', color: '#ffcc66' },
                        { moon: planet.moons.europa, name: 'Europa', color: '#ffffff' },
                        { moon: planet.moons.ganymede, name: 'Ganímedes', color: '#cccccc' },
                        { moon: planet.moons.callisto, name: 'Calisto', color: '#999999' },
                    ].map(({ moon, color }, idx) => {
                        const offset = new THREE.Vector3(moon.x * size * 1.5, moon.y * size * 0.3, moon.z * size);
                        return (
                            <mesh key={idx} position={offset}>
                                <sphereGeometry args={[size * 0.1, 8, 8]} />
                                <meshStandardMaterial color={color} roughness={0.8} />
                            </mesh>
                        );
                    })}
                </group>
            )}

            <Html distanceFactor={90}>
                <div style={{ color: planet.color, fontSize: '12px', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', textShadow: `0 0 8px ${planet.color}`, paddingLeft: '8px', fontWeight: 'bold' }}>
                    {planet.symbol} {planet.name} <span style={{ fontSize: '10px', opacity: 0.7 }}>{planet.mag.toFixed(1)}</span>
                </div>
            </Html>
        </group>
    );
}

// ── Main Logic ────────────────────────────────────────────────────────────────

function computePlanetPosition(cfg: PlanetConfig, date: Date, obs: Astronomy.Observer) {
    try {
        const body = cfg.body;
        const eq = Astronomy.Equator(body, date, obs, true, true);
        const illum = Astronomy.Illumination(body, date);

        // Angular size: 2 * atan(radius / distance)
        const distKm = illum.geo_dist * AU_KM;
        const radiusKm = RADII_KM[cfg.name] || 2000;
        const angSizeArcsec = (2 * radiusKm / distKm) * (180 / Math.PI) * 3600;

        // Use real ring tilt if available
        const ringTilt = illum.ring_tilt !== undefined ? THREE.MathUtils.degToRad(illum.ring_tilt) : 0;

        let moons;
        if (cfg.name === 'Júpiter') {
            moons = Astronomy.JupiterMoons(date);
        }

        return {
            name: cfg.name,
            symbol: cfg.symbol,
            ra: eq.ra * 15,
            dec: eq.dec,
            mag: illum.mag,
            color: cfg.color,
            desc: cfg.description(illum.mag),
            kind: 'planet' as const,
            pos: equatorialTo3D(eq.ra * 15, eq.dec, 95) as [number, number, number],
            angularSize: angSizeArcsec,
            phase: Astronomy.Elongation(body, date).elongation, // Using elongation as phase proxy
            ringTilt,
            moons
        };
    } catch { return null; }
}

export default function Planets() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);

    const data = useMemo(() => {
        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
        const planets = PLANET_CONFIGS
            .map(cfg => computePlanetPosition(cfg, time, obs))
            .filter(Boolean);
        const moon = computeMoon(time, obs);
        return { planets, moon };
    }, [time, observer]);

    return (
        <group>
            {data.planets.map(p => <PlanetMesh key={p!.name} planet={p!} />)}
            {data.moon && <MoonMesh planet={{ ...data.moon.planet, pos: equatorialTo3D(data.moon.planet.ra, data.moon.planet.dec, 95) as [number, number, number] }} phase={data.moon.phase} />}
        </group>
    );
}
