'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COMETS, getCometPosition, getCometInfo, type Comet } from '@/data/comets';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';
import type { CometLiveData } from '@/app/api/comets/route';
import type { OrbitalElements } from '@/lib/astronomy/cometOrbits';

const cometVertexShader = `
    attribute vec3 color;
    varying vec3 vWorldPosition;
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float uTime;
    
    void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vColor = color;
        
        // Animación de parpadeo en la cola
        float flicker = 0.7 + 0.3 * sin(uTime * 3.0 + position.x * 10.0);
        vAlpha = flicker * (1.0 - length(position.xy) / 10.0);
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const cometFragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
        // Forma de la cola (gradiente suave)
        float alpha = vAlpha * 0.6;
        gl_FragColor = vec4(vColor, alpha);
    }
`;

/** LCG determinista — evita Math.random en useMemo (react-hooks/purity) */
function makeLCG(seed: number) {
    let s = seed >>> 0;
    return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

function CometTail({ comet, position }: { comet: typeof COMETS[0]; position: [number, number, number] }) {
    const tailRef = useRef<THREE.Points>(null);
    const timeRef = useRef(0);

    const { geometry, material } = useMemo(() => {
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const tailColor = new THREE.Color(comet.color);
        // Semilla basada en el color del cometa — reproducible y determinista
        const rng = makeLCG(tailColor.r * 0xffff ^ tailColor.b * 0xabcd);

        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;

            // Cola cónica que se ensancha
            const spread = t * 2.5;
            const x = (rng() - 0.5) * spread;
            const y = (rng() - 0.5) * spread;
            const z = -t * comet.tailLength * 0.5; // Cola hacia atrás

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color渐变: núcleo blanco, cola del color del cometa
            const colorMix = t;
            const r = THREE.MathUtils.lerp(1.0, tailColor.r, colorMix);
            const g = THREE.MathUtils.lerp(1.0, tailColor.g, colorMix);
            const b = THREE.MathUtils.lerp(1.0, tailColor.b, colorMix);

            colors[i * 3] = r;
            colors[i * 3 + 1] = g;
            colors[i * 3 + 2] = b;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.ShaderMaterial({
            vertexShader: cometVertexShader,
            fragmentShader: cometFragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uTime: { value: 0 }
            }
        });

        return { geometry: geom, material: mat };
    }, [comet.color, comet.tailLength]);

    useFrame((state) => {
        if (tailRef.current) {
            timeRef.current = state.clock.elapsedTime;
            (tailRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = timeRef.current;
            
            // La cola ya está orientada por el componente padre (CometItem) 
            // solo añadimos un suave rastro de turbulencia
            tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;
        }
    });

    return (
        <group position={position}>
            {/* Núcleo del cometa */}
            <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            
            {/* Coma (atmósfera del cometa) */}
            <mesh>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color={comet.color} transparent opacity={0.3} />
            </mesh>

            {/* Cola iónica */}
            <points ref={tailRef} geometry={geometry} material={material} />
        </group>
    );
}

interface CometData {
    id: string;
    name: string;
    designation: string;
    pos: [number, number, number];
    magnitude: number;
    visible: boolean;
    tailAngle: number;
    description: string;
    color: string;
}

function CometItem({ comet }: { comet: CometData }) {
    const [hovered, setHovered] = useState(false);
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);

    const displayColor = nightMode ? '#ff4444' : comet.color;

    return (
        <group position={comet.pos}>
            {/* Hitbox invisible */}
            <mesh
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setSelectedObject({
                        name: comet.name,
                        ra: 0,
                        dec: 0,
                        mag: comet.magnitude,
                        desc: comet.description,
                        color: comet.color,
                        kind: 'planet' as const,
                        symbol: '☄️'
                    });
                }}
                onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            >
                <sphereGeometry args={[1.5, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Cometa con cola orientada anti-solar */}
            <group onUpdate={(self) => {
                // Orientar la cola en dirección opuesta al origen (el Sol está cerca del origen en coord ec)
                // En una app pro usaríamos la posición real del Sol, aquí simplificamos a vector radial inverso
                const dir = new THREE.Vector3().copy(new THREE.Vector3(...comet.pos)).normalize();
                self.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
            }}>
                <CometTail 
                    comet={{ ...COMETS.find(c => c.id === comet.id)!, color: comet.color, tailLength: comet.tailAngle }}
                    position={[0, 0, 0]}
                />
            </group>

            {/* Label en hover */}
            {hovered && (
                <Html distanceFactor={15} zIndexRange={[100, 0]}>
                    <div
                        className="accent-label pointer-events-none whitespace-nowrap -translate-y-7 rounded-lg border-2 bg-black/80 px-3 py-1.5 text-[14px] font-black font-mono transition-all"
                        style={{
                            '--accent-color': displayColor,
                            '--accent-border': `${displayColor}aa`,
                            color: displayColor,
                            textShadow: `0 0 10px ${displayColor}`,
                        } as CSSProperties}
                    >
                        ☄️ {comet.name}
                        <div className="mt-1 text-[11px] opacity-80">
                            Mag {comet.magnitude.toFixed(1)} · {comet.visible ? '✓ Visible' : '⚠ Débil'}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/** Merge live JPL data into our static catalog, returning a combined list */
function mergeLiveData(live: CometLiveData[]): Comet[] {
    // Start with the static catalog
    const base = new Map<string, Comet>(COMETS.map(c => [c.id, { ...c }]));

    for (const l of live) {
        const els: OrbitalElements = { e: l.e, q: l.q, i: l.i, om: l.om, w: l.w, tp: l.tp };
        const existing = base.get(l.pdes);
        if (existing) {
            // Update elements from live data, keep visual styling from static catalog
            existing.elements = els;
            if (l.M1 !== null) existing.magnitude = l.M1;
        } else {
            // New comet from JPL not in our static list
            base.set(l.pdes, {
                id: l.pdes,
                name: l.name,
                designation: l.pdes,
                period: l.per ?? 0,
                perihelion: l.q,
                aphelion: l.per ? l.q * (1 + l.e) / (1 - l.e) : l.q * 20,
                inclination: l.i,
                eccentricity: l.e,
                magnitude: l.M1 ?? 10,
                color: '#aaddff',
                tailLength: 4,
                active: true,
                description: `Cometa ${l.pdes}. Datos en tiempo real de JPL.`,
                elements: els,
            });
        }
    }

    return Array.from(base.values());
}

export default function Comets() {
    const COMET_RADIUS = 92;
    // timeMinute solo cambia 1x/min — posiciones de cometas no requieren precisión de segundo
    const time = useAppStore((state) => state.timeMinute);
    const [liveComets, setLiveComets] = useState<Comet[]>(COMETS);

    // Fetch live data from our API route once on mount
    useEffect(() => {
        fetch('/api/comets')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.ok && Array.isArray(data.comets)) {
                    setLiveComets(mergeLiveData(data.comets));
                }
            })
            .catch(() => {
                // Network error: keep using static catalog
            });
    }, []);

    const cometData = useMemo(() => {
        return liveComets
            .filter(c => c.active)
            .map((comet) => {
                const pos = getCometPosition(comet, time);
                const info = getCometInfo(comet, time);
                const spherePos = equatorialTo3D(pos.ra, pos.dec, COMET_RADIUS) as [number, number, number];

                return {
                    ...comet,
                    pos: spherePos,
                    magnitude: info.magnitude,
                    visible: info.visible,
                    tailAngle: info.tailAngle,
                    description: info.description
                };
            });
    }, [liveComets, time]);

    return (
        <group>
            {cometData.map((comet) => (
                <CometItem key={comet.id} comet={comet} />
            ))}
        </group>
    );
}
