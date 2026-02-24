'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import { Planet } from '@/types/celestial';
import * as Astronomy from 'astronomy-engine';

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

const PLANET_RADIUS = 95;

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

/** Matches Body enum to Spanish names used in config */
const BODY_NAME_MAP: Record<string, string> = {
    'Mercurio': 'Mercury',
    'Venus': 'Venus',
    'Marte': 'Mars',
    'Júpiter': 'Jupiter',
    'Saturno': 'Saturn',
    'Urano': 'Uranus',
    'Neptuno': 'Neptune',
};

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
 * Updates an existing canvas and texture with the correct moon phase.
 * Phase: 0 = new moon, 90 = first quarter, 180 = full moon, 270 = last quarter.
 */
function updateMoonCanvas(canvas: HTMLCanvasElement, phase: number, color1 = '#d8d6c0', color2 = '#0c1322') {
    const S = 256;
    if (canvas.width !== S) canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2, r = S / 2 - 6;
    const H = Math.PI / 2;

    // Reset and clip
    ctx.save();
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background: night side (dark blue-gray)
    ctx.fillStyle = color2;
    ctx.fillRect(0, 0, S, S);

    const p = ((phase % 360) + 360) % 360;
    const wax = p <= 180;               // waxing (right side lit) vs waning (left side lit)
    const phi = wax ? p : 360 - p;     // phase within the half-cycle (0-180)
    const termB = Math.abs(Math.cos(phi * Math.PI / 180)) * r; // terminator ellipse semi-minor

    // Draw the lit half-disc
    ctx.fillStyle = color1;
    ctx.beginPath();
    if (wax) {
        ctx.arc(cx, cy, r, -H, H);  // right half
    } else {
        ctx.arc(cx, cy, r, H, -H);  // left half
    }
    ctx.closePath();
    ctx.fill();

    // Draw the terminator ellipse
    if (phi < 88) {
        ctx.fillStyle = color2;
        ctx.beginPath();
        if (wax) {
            ctx.ellipse(cx, cy, termB, r, 0, -H, H);
        } else {
            ctx.ellipse(cx, cy, termB, r, 0, H, -H);
        }
        ctx.closePath();
        ctx.fill();
    } else if (phi > 92) {
        ctx.fillStyle = color1;
        ctx.beginPath();
        if (wax) {
            ctx.ellipse(cx, cy, termB, r, 0, H, -H);
        } else {
            ctx.ellipse(cx, cy, termB, r, 0, -H, H);
        }
        ctx.closePath();
        ctx.fill();
    }

    // Limb-darkening
    const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,245,0.12)');
    g.addColorStop(0.6, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
}

/** Compute Moon equatorial position and phase for a given date */
function computeMoon(date: Date, obs: Astronomy.Observer): { planet: Planet; phase: number } | null {
    try {
        const eq = Astronomy.Equator(Astronomy.Body.Moon, date, obs, true, true);
        const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        const phase = Astronomy.MoonPhase(date);
        const pct = (illum.phase_fraction * 100).toFixed(0);
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
            },
            phase,
        };
    } catch {
        return null;
    }
}

// ── Components ───────────────────────────────────────────────────────────────

function MoonMesh({ planet, phase }: { planet: Planet & { pos: [number, number, number] }; phase: number }) {
    const billboardRef = useRef<THREE.Group>(null);
    const setSelectedObj = useAppStore((s) => s.setSelectedObject);
    const SIZE = 2.0;

    const [texture] = useState(() => {
        const canvas = document.createElement('canvas');
        const tex = new THREE.CanvasTexture(canvas);
        updateMoonCanvas(canvas, phase);
        tex.needsUpdate = true;
        return tex;
    });

    const roundedPhase = Math.round(phase / 2) * 2;

    useEffect(() => {
        const canvas = texture.image as HTMLCanvasElement;
        updateMoonCanvas(canvas, roundedPhase);
        texture.needsUpdate = true;
    }, [roundedPhase, texture]);

    useEffect(() => { return () => texture.dispose(); }, [texture]);

    useFrame(({ camera }) => {
        billboardRef.current?.quaternion.copy(camera.quaternion);
    });

    return (
        <group position={planet.pos} ref={billboardRef}>
            <mesh onClick={(e) => { e.stopPropagation(); setSelectedObj(planet); }}>
                <planeGeometry args={[SIZE * 2, SIZE * 2]} />
                <meshBasicMaterial map={texture} transparent alphaTest={0.01} depthWrite={false} />
            </mesh>
            <mesh>
                <planeGeometry args={[SIZE * 4.5, SIZE * 4.5]} />
                <meshBasicMaterial color="#b8c8e0" transparent opacity={0.04} depthWrite={false} />
            </mesh>
            <Html distanceFactor={90}>
                <div style={{ color: '#d8d6c0', fontSize: '11px', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', textShadow: '0 0 10px rgba(216,214,192,0.8)', paddingLeft: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {'\u263d'} Luna <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '5px' }}>{getMoonPhaseName(phase)}</span>
                </div>
            </Html>
        </group>
    );
}

function PlanetMesh({ planet }: { planet: Planet & { pos: [number, number, number]; angularSize: number; phase: number; ringTilt?: number; moons?: Astronomy.JupiterMoonsInfo } }) {
    const meshRef = useRef<THREE.Group>(null);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);

    // Visual size: 1 arcsec = 0.00045 units roughly on sphere R=95
    // multiplier to make them visible without zoom, but proportional
    const size = Math.max(0.15, planet.angularSize * 0.02);

    const [texture] = useState(() => {
        const canvas = document.createElement('canvas');
        const tex = new THREE.CanvasTexture(canvas);
        updateMoonCanvas(canvas, planet.phase, planet.color, '#110505');
        tex.needsUpdate = true;
        return tex;
    });

    useEffect(() => {
        const canvas = texture.image as HTMLCanvasElement;
        updateMoonCanvas(canvas, planet.phase, planet.color, '#110505');
        texture.needsUpdate = true;
    }, [planet.phase, texture, planet.color]);

    useEffect(() => { return () => texture.dispose(); }, [texture]);

    useFrame(({ camera }) => {
        if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion);
    });

    return (
        <group position={planet.pos}>
            <group ref={meshRef}>
                <mesh onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}>
                    <planeGeometry args={[size * 2, size * 2]} />
                    <meshBasicMaterial map={texture} transparent alphaTest={0.01} depthWrite={false} />
                </mesh>

                {/* Atmosphere halo */}
                <mesh scale={[1.4, 1.4, 1]}>
                    <planeGeometry args={[size * 2, size * 2]} />
                    <meshBasicMaterial color={planet.color} transparent opacity={0.08} depthWrite={false} />
                </mesh>

                {/* Real Saturn Rings Tilt */}
                {planet.name === 'Saturno' && planet.ringTilt !== undefined && (
                    <mesh rotation={[planet.ringTilt, 0, 0]}>
                        <ringGeometry args={[size * 2.2, size * 4.5, 64]} />
                        <meshBasicMaterial color="#e8c870" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>
                )}
            </group>

            {/* Jupiter Moons (Galilean) */}
            {planet.name === 'Júpiter' && planet.moons && (
                <group>
                    {[planet.moons.io, planet.moons.europa, planet.moons.ganymede, planet.moons.callisto].map((m, idx) => {
                        // Moons are in units of Jupiter radius. 
                        // Visual offset = m.x * (planet size in units)
                        const offset = new THREE.Vector3(m.x * size, m.y * size, m.z * size);
                        // Moons are very small points
                        return (
                            <mesh key={idx} position={offset}>
                                <sphereGeometry args={[size * 0.05, 8, 8]} />
                                <meshBasicMaterial color="#ffffff" />
                            </mesh>
                        );
                    })}
                </group>
            )}

            <Html distanceFactor={90}>
                <div style={{ color: planet.color, fontSize: '11px', fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none', textShadow: `0 0 8px ${planet.color}`, paddingLeft: '8px', fontWeight: 'bold' }}>
                    {planet.symbol} {planet.name} <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '4px' }}>{planet.mag.toFixed(1)}</span>
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
