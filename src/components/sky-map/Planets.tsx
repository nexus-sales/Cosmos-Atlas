'use client';

import { useMemo, useRef } from 'react';
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
        name: 'Venus', symbol: '♀', color: '#fff8d4', size: 0.55,
        description: (mag) => `Planeta más brillante del cielo. Mag ${mag.toFixed(1)}. Fases visibles con binoculares.`,
    },
    {
        body: Astronomy.Body.Jupiter,
        name: 'Júpiter', symbol: '♃', color: '#ffe4b0', size: 0.48,
        description: (mag) => `El gigante gaseoso del sistema solar. Mag ${mag.toFixed(1)}. Sus cuatro lunas son visibles con prismáticos.`,
    },
    {
        body: Astronomy.Body.Mars,
        name: 'Marte', symbol: '♂', color: '#ff7744', size: 0.32,
        description: (mag) => `El Planeta Rojo. Mag ${mag.toFixed(1)}. Su color naranja es inconfundible.`,
    },
    {
        body: Astronomy.Body.Saturn,
        name: 'Saturno', symbol: '♄', color: '#f5d97a', size: 0.35,
        description: (mag) => `Con sus anillos visibles en telescopio pequeño. Mag ${mag.toFixed(1)}.`,
    },
    {
        body: Astronomy.Body.Mercury,
        name: 'Mercurio', symbol: '☿', color: '#b8c8d8', size: 0.22,
        description: (mag) => `El planeta más esquivo. Mag ${mag.toFixed(1)}. Siempre cerca del horizonte.`,
    },
    {
        body: Astronomy.Body.Uranus,
        name: 'Urano', symbol: '⛢', color: '#a8dff0', size: 0.18,
        description: (mag) => `Gigante de hielo. Mag ${mag.toFixed(1)}. Visible a ojo desnudo en cielo muy oscuro.`,
    },
    {
        body: Astronomy.Body.Neptune,
        name: 'Neptuno', symbol: '♆', color: '#4060ff', size: 0.16,
        description: (mag) => `El gigante azul más lejano. Mag ${mag.toFixed(1)}. Requiere binoculares.`,
    },
];

const PLANET_RADIUS = 95;

/** Calcula la posición en AR/Dec de un planeta para una fecha dada */
function computePlanetPosition(cfg: PlanetConfig, date: Date, astroObserver: Astronomy.Observer): Planet | null {
    try {
        const eq = Astronomy.Equator(cfg.body, date, astroObserver, true, true);
        const illum = Astronomy.Illumination(cfg.body, date);
        return {
            name: cfg.name,
            symbol: cfg.symbol,
            ra: eq.ra * 15,   // RA viene en horas → convertir a grados
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

// ── Componente de un planeta individual ──────────────────────────────────
function PlanetMesh({ planet }: { planet: Planet & { pos: [number, number, number] } }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);

    // Determinar tamaño visual según magnitud y configuración
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
            {/* Núcleo del planeta */}
            <mesh
                ref={meshRef}
                onClick={(e) => { e.stopPropagation(); setSelectedObject(planet); }}
            >
                <sphereGeometry args={[size, 16, 16]} />
                <meshBasicMaterial color={planet.color} />
            </mesh>

            {/* Halo de atmósfera */}
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

// ── Componente principal ──────────────────────────────────────────────────
export default function Planets() {
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);

    const planets = useMemo(() => {
        const astroObserver = new Astronomy.Observer(observer.lat, observer.lon, 0);
        return PLANET_CONFIGS
            .map(cfg => computePlanetPosition(cfg, time, astroObserver))
            .filter(Boolean)
            .map(p => ({
                ...p!,
                pos: equatorialTo3D(p!.ra, p!.dec, PLANET_RADIUS) as [number, number, number],
            }));
    }, [time, observer]);  // Se recalcula cuando el tiempo o la ubicación cambian

    return (
        <group>
            {planets.map((planet) => (
                <PlanetMesh key={planet.name} planet={planet} />
            ))}
        </group>
    );
}
