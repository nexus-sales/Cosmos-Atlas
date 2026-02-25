'use client';

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { Planet } from '@/types/celestial';
import * as Astronomy from 'astronomy-engine';

// ── Configuración estática de cada planeta ────────────────────────────────────
interface PlanetConfig {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    description: (mag: number) => string;
}

const PLANET_CONFIGS: PlanetConfig[] = [
    {
        body: Astronomy.Body.Venus,
        name: 'Venus', symbol: '♀', color: '#fff8d4',
        description: (mag) => `Planeta más brillante del cielo. Mag ${mag.toFixed(1)}. Fases visibles con binoculares.`,
    },
    {
        body: Astronomy.Body.Jupiter,
        name: 'Júpiter', symbol: '♃', color: '#ffe4b0',
        description: (mag) => `El gigante gaseoso del sistema solar. Mag ${mag.toFixed(1)}. Sus cuatro lunas son visibles con prismáticos.`,
    },
    {
        body: Astronomy.Body.Mars,
        name: 'Marte', symbol: '♂', color: '#ff7744',
        description: (mag) => `El Planeta Rojo. Mag ${mag.toFixed(1)}. Su color naranja es inconfundible.`,
    },
    {
        body: Astronomy.Body.Saturn,
        name: 'Saturno', symbol: '♄', color: '#f5d97a',
        description: (mag) => `Sus anillos son visibles en telescopio pequeño. Mag ${mag.toFixed(1)}.`,
    },
    {
        body: Astronomy.Body.Mercury,
        name: 'Mercurio', symbol: '☿', color: '#b8c8d8',
        description: (mag) => `El planeta más esquivo. Mag ${mag.toFixed(1)}. Siempre cerca del horizonte.`,
    },
    {
        body: Astronomy.Body.Uranus,
        name: 'Urano', symbol: '⛢', color: '#a8dff0',
        description: (mag) => `Gigante de hielo. Mag ${mag.toFixed(1)}. Visible a ojo desnudo en cielo muy oscuro.`,
    },
    {
        body: Astronomy.Body.Neptune,
        name: 'Neptuno', symbol: '♆', color: '#4060ff',
        description: (mag) => `El gigante azul más lejano. Mag ${mag.toFixed(1)}. Requiere binoculares.`,
    },
];

const AU_KM = 149597870.7;
const MOON_RADIUS_KM = 1737.4;
const PLANET_RADIUS = 95;

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
    [ [cx - r * 0.35, cy - r * 0.1, r * 0.25],
      [cx - r * 0.15, cy - r * 0.35, r * 0.18],
      [cx + r * 0.15, cy - r * 0.25, r * 0.14],
      [cx + r * 0.25, cy - r * 0.1, r * 0.12],
      [cx - r * 0.2,  cy + r * 0.2,  r * 0.15],
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
function MoonMesh({ planet, phase }: {
    planet: Planet & { pos: [number, number, number]; angularSize: number };
    phase: number;
}) {
    const setSelectedObj = useAppStore((s) => s.setSelectedObject);
    // Real apparent radius of Moon: ~0.25° → at R=95: 95*tan(0.25°*π/180) ≈ 0.414 units
    // angularSize in arcsec: ~1800 → 1800 * 0.00023 ≈ 0.414
    const SIZE = THREE.MathUtils.clamp(planet.angularSize * 0.00023, 0.35, 0.52);

    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        drawMoonSurface(canvas, phase);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const roundedPhase = Math.round(phase / 2) * 2;
    useEffect(() => {
        const canvas = texture.image as HTMLCanvasElement;
        drawMoonSurface(canvas, roundedPhase);
        texture.needsUpdate = true;
    }, [roundedPhase, texture]);

    useEffect(() => () => texture.dispose(), [texture]);

    return (
        <group position={planet.pos}>
            <mesh onClick={(e) => { e.stopPropagation(); setSelectedObj(planet); }}>
                <sphereGeometry args={[SIZE, 32, 32]} />
                <meshStandardMaterial
                    map={texture}
                    transparent
                    depthWrite={false}
                    toneMapped={false}
                    roughness={0.85}
                    metalness={0.0}
                    emissive="#111111"
                    emissiveIntensity={0.1}
                />
            </mesh>
            {/* Soft glow around Moon */}
            <mesh>
                <sphereGeometry args={[SIZE * 1.2, 16, 16]} />
                <meshBasicMaterial color="#c0d0e8" transparent opacity={0.07} depthWrite={false} side={THREE.BackSide} />
            </mesh>
            <Html distanceFactor={90}>
                <div style={{
                    color: '#d8d6c0', fontSize: '11px', fontFamily: "'Courier New', monospace",
                    whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
                    textShadow: '0 0 8px rgba(216,214,192,0.8)', paddingLeft: '10px',
                    fontWeight: 'bold', letterSpacing: '0.3px',
                }}>
                    ☽ Luna <span style={{ fontSize: '9px', opacity: 0.7 }}>{getMoonPhaseName(phase)}</span>
                </div>
            </Html>
        </group>
    );
}

// ── PlanetMesh ────────────────────────────────────────────────────────────────
// Planets are rendered as bright glowing sprites — like stars but larger and
// distinctly colored. This matches what planets actually look like to the naked eye.
function PlanetMesh({ planet, glowTex }: {
    planet: Planet & { pos: [number, number, number]; angularSize: number; phase: number; ringTilt?: number };
    glowTex: THREE.CanvasTexture;
}) {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);

    // Visual size based on apparent magnitude (same scale as Stars.tsx)
    // Reference: mag -4.5 (Venus) → large; mag +8 (Neptune) → tiny point
    const brightness = Math.pow(2.512, -1.5 - planet.mag); // normalised at mag -1.5
    const normB = Math.min(1.0, brightness);
    const baseSize = 0.08 + Math.pow(normB, 0.45) * 0.30; // range: ~0.08 (Neptune) to ~0.38 (Venus)

    const hasSaturnRings = planet.name === 'Saturno';

    return (
        <group position={planet.pos}>
            {/* Outer soft glow — larger, more transparent */}
            <sprite
                scale={[baseSize * 3.5, baseSize * 3.5, 1]}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}
            >
                <spriteMaterial
                    map={glowTex}
                    color={planet.color}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                    opacity={0.5}
                    transparent
                />
            </sprite>

            {/* Core bright disc */}
            <sprite
                scale={[baseSize, baseSize, 1]}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}
            >
                <spriteMaterial
                    map={glowTex}
                    color={planet.color}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </sprite>

            {/* Saturn ring indicator — symbolic but helps identification */}
            {hasSaturnRings && planet.ringTilt !== undefined && (
                <mesh rotation={[planet.ringTilt + Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[baseSize * 1.5, baseSize * 2.6, 48]} />
                    <meshBasicMaterial
                        color="#d4c080"
                        transparent
                        opacity={0.55}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}

            <Html distanceFactor={90}>
                <div style={{
                    color: planet.color, fontSize: '11px',
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
                    textShadow: `0 0 6px ${planet.color}`, paddingLeft: '8px',
                    fontWeight: 'bold',
                }}>
                    {planet.symbol} {planet.name}{' '}
                    <span style={{ fontSize: '9px', opacity: 0.65 }}>{planet.mag.toFixed(1)}</span>
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
        };
    } catch { return null; }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Planets() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);

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
        return { planets, moon };
    }, [minuteKey, observer]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <group>
            {data.planets.map(p => (
                <PlanetMesh key={p!.name} planet={p!} glowTex={glowTex} />
            ))}
            {data.moon && (
                <MoonMesh
                    planet={{
                        ...data.moon.planet,
                        pos: equatorialTo3D(data.moon.planet.ra, data.moon.planet.dec, PLANET_RADIUS) as [number, number, number],
                    }}
                    phase={data.moon.phase}
                />
            )}
        </group>
    );
}
