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

// ── Moon helpers ─────────────────────────────────────────────────────────────

function getMoonPhaseName(phase: number): string {
    const p = ((phase % 360) + 360) % 360;
    if (p < 22.5 || p >= 337.5) return 'Luna nueva';
    if (p < 67.5)  return 'Creciente c\u00f3ncava';
    if (p < 112.5) return 'Cuarto creciente';
    if (p < 157.5) return 'Gibosa creciente';
    if (p < 202.5) return 'Luna llena';
    if (p < 247.5) return 'Gibosa menguante';
    if (p < 292.5) return 'Cuarto menguante';
    return 'Creciente menguante';
}

/**
 * Generates a canvas texture showing the correct moon phase.
 * Phase: 0 = new moon, 90 = first quarter, 180 = full moon, 270 = last quarter.
 */
function createMoonTexture(phase: number): THREE.CanvasTexture {
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d')!;
    const cx = S / 2, cy = S / 2, r = S / 2 - 6;
    const H = Math.PI / 2;

    // Clip all drawing to the moon circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Background: night side (dark blue-gray)
    ctx.fillStyle = '#0c1322';
    ctx.fillRect(0, 0, S, S);

    const p = ((phase % 360) + 360) % 360;
    const wax = p <= 180;               // waxing (right side lit) vs waning (left side lit)
    const phi = wax ? p : 360 - p;     // phase within the half-cycle (0-180)
    const termB = Math.abs(Math.cos(phi * Math.PI / 180)) * r; // terminator ellipse semi-minor

    // Draw the lit half-disc
    ctx.fillStyle = '#d8d6c0';
    ctx.beginPath();
    if (wax) {
        ctx.arc(cx, cy, r, -H, H);  // right half
    } else {
        ctx.arc(cx, cy, r, H, -H);  // left half
    }
    ctx.closePath();
    ctx.fill();

    // Draw the terminator ellipse to turn the half-disc into crescent or gibbous
    if (phi < 88) {
        // Crescent: dark terminator cuts into the lit half from the inside
        ctx.fillStyle = '#0c1322';
        ctx.beginPath();
        if (wax) {
            ctx.ellipse(cx, cy, termB, r, 0, -H, H);   // right-side dark ellipse
        } else {
            ctx.ellipse(cx, cy, termB, r, 0, H, -H);   // left-side dark ellipse
        }
        ctx.closePath();
        ctx.fill();
    } else if (phi > 92) {
        // Gibbous: lit terminator extends the lit zone into the dark half
        ctx.fillStyle = '#d8d6c0';
        ctx.beginPath();
        if (wax) {
            ctx.ellipse(cx, cy, termB, r, 0, H, -H);   // left-side lit ellipse
        } else {
            ctx.ellipse(cx, cy, termB, r, 0, -H, H);   // right-side lit ellipse
        }
        ctx.closePath();
        ctx.fill();
    }

    // Subtle limb-darkening + atmosphere glow
    const g = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.05, cx, cy, r);
    g.addColorStop(0,   'rgba(255,255,245,0.12)');
    g.addColorStop(0.6, 'rgba(0,0,0,0)');
    g.addColorStop(1,   'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

/** Compute Moon equatorial position and phase for a given date */
function computeMoon(date: Date, obs: Astronomy.Observer): { planet: Planet; phase: number } | null {
    try {
        const eq    = Astronomy.Equator(Astronomy.Body.Moon, date, obs, true, true);
        const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
        const phase = Astronomy.MoonPhase(date);
        const pct   = (illum.phase_fraction * 100).toFixed(0);
        return {
            planet: {
                name:   'Luna',
                symbol: '\u263d',
                ra:     eq.ra * 15,
                dec:    eq.dec,
                mag:    illum.mag,
                color:  '#d8d6c0',
                desc:   `${getMoonPhaseName(phase)} \u2014 ${pct}% iluminada. Sat\u00e9lite natural de la Tierra.`,
                kind:   'planet',
            },
            phase,
        };
    } catch {
        return null;
    }
}

// ── Moon billboard component ──────────────────────────────────────────────────
function MoonMesh({ planet, phase }: { planet: Planet & { pos: [number, number, number] }; phase: number }) {
    const billboardRef   = useRef<THREE.Group>(null);
    const setSelectedObj = useAppStore((s) => s.setSelectedObject);
    const SIZE = 2.0;

    // Round phase to nearest 3° so the texture doesn't update every frame
    const roundedPhase = Math.round(phase / 3) * 3;
    const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        const tex = createMoonTexture(roundedPhase);
        setTexture(tex);
        return () => { tex.dispose(); };
    }, [roundedPhase]);

    // Billboard: keep the disc facing the camera each frame
    useFrame(({ camera }) => {
        billboardRef.current?.quaternion.copy(camera.quaternion);
    });

    return (
        <group position={planet.pos} ref={billboardRef}>
            {/* Phase disc */}
            {texture && (
                <mesh onClick={(e) => { e.stopPropagation(); setSelectedObj(planet); }}>
                    <planeGeometry args={[SIZE * 2, SIZE * 2]} />
                    <meshBasicMaterial map={texture} transparent alphaTest={0.01} depthWrite={false} />
                </mesh>
            )}

            {/* Atmospheric glow */}
            <mesh>
                <planeGeometry args={[SIZE * 4.5, SIZE * 4.5]} />
                <meshBasicMaterial color="#b8c8e0" transparent opacity={0.04} depthWrite={false} />
            </mesh>

            {/* Floating label */}
            <Html distanceFactor={90}>
                <div style={{
                    color: '#d8d6c0',
                    fontSize: '11px',
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textShadow: '0 0 10px rgba(216,214,192,0.8)',
                    paddingLeft: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                }}>
                    {'\u263d'} Luna
                    <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '5px' }}>
                        {getMoonPhaseName(phase)}
                    </span>
                </div>
            </Html>
        </group>
    );
}

// ── Regular planet mesh ────────────────────────────────────────────────────────
function PlanetMesh({ planet }: { planet: Planet & { pos: [number, number, number] } }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);

    const size = useMemo(() => {
        const cfg = PLANET_CONFIGS.find(c => c.name === planet.name);
        return cfg?.size ?? 0.25;
    }, [planet.name]);

    useFrame((state) => {
        if (meshRef.current) {
            const s = 1.0 + 0.06 * Math.sin(state.clock.elapsedTime * 1.4 + planet.ra);
            meshRef.current.scale.setScalar(s);
        }
    });

    return (
        <group position={planet.pos}>
            {/* N\u00facleo del planeta */}
            <mesh
                ref={meshRef}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}
            >
                <sphereGeometry args={[size, 16, 16]} />
                <meshBasicMaterial color={planet.color} />
            </mesh>

            {/* Halo de atm\u00f3sfera */}
            <mesh>
                <sphereGeometry args={[size * 1.8, 16, 16]} />
                <meshBasicMaterial color={planet.color} transparent opacity={0.10} side={THREE.BackSide} />
            </mesh>

            {/* Anillos de Saturno */}
            {planet.name === 'Saturno' && (
                <mesh rotation={[Math.PI * 0.2, 0, Math.PI * 0.15]}>
                    <ringGeometry args={[size * 1.55, size * 2.8, 64]} />
                    <meshBasicMaterial color="#e8c870" transparent opacity={0.55} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Etiqueta flotante */}
            <Html distanceFactor={90}>
                <div style={{
                    color: planet.color,
                    fontSize: '11px',
                    fontFamily: "'Courier New', monospace",
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    textShadow: `0 0 8px ${planet.color}, 0 0 16px ${planet.color}`,
                    paddingLeft: '8px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                }}>
                    {planet.symbol} {planet.name}
                    <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '4px' }}>
                        {planet.mag.toFixed(1)}
                    </span>
                </div>
            </Html>
        </group>
    );
}

// ── Calcula la posición de un planeta ─────────────────────────────────────────
function computePlanetPosition(cfg: PlanetConfig, date: Date, astroObserver: Astronomy.Observer): Planet | null {
    try {
        const eq = Astronomy.Equator(cfg.body, date, astroObserver, true, true);
        const illum = Astronomy.Illumination(cfg.body, date);
        return {
            name: cfg.name,
            symbol: cfg.symbol,
            ra: eq.ra * 15,
            dec: eq.dec,
            mag: illum.mag,
            color: cfg.color,
            desc: cfg.description(illum.mag),
            kind: 'planet',
        };
    } catch {
        return null;
    }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Planets() {
    const time     = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);

    const { planets, moonData } = useMemo(() => {
        const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
        const planets = PLANET_CONFIGS
            .map(cfg => computePlanetPosition(cfg, time, obs))
            .filter(Boolean)
            .map(p => ({
                ...p!,
                pos: equatorialTo3D(p!.ra, p!.dec, PLANET_RADIUS) as [number, number, number],
            }));
        const moonData = computeMoon(time, obs);
        return { planets, moonData };
    }, [time, observer]);

    return (
        <group>
            {/* 7 planetas */}
            {planets.map((planet) => (
                <PlanetMesh key={planet.name} planet={planet} />
            ))}

            {/* Luna con fase */}
            {moonData && (
                <MoonMesh
                    planet={{ ...moonData.planet, pos: equatorialTo3D(moonData.planet.ra, moonData.planet.dec, PLANET_RADIUS) as [number, number, number] }}
                    phase={moonData.phase}
                />
            )}
        </group>
    );
}
