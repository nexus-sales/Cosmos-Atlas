'use client';

import { Html, Float } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';

const JUPITER_MOON_DATA = [
    { id: 'io', name: 'Io', color: '#ffffaa', mag: 5.0 },
    { id: 'europa', name: 'Europa', color: '#eef1ff', mag: 5.3 },
    { id: 'ganymede', name: 'Ganímedes', color: '#d1d1d1', mag: 4.6 },
    { id: 'callisto', name: 'Calisto', color: '#a2a2a2', mag: 5.7 }
];

const TEXTURES = {
    mercury: '/textures/planets/mercury.jpg',
    venus: '/textures/planets/venus.jpg',
    mars: '/textures/planets/mars.jpg',
    jupiter: '/textures/planets/jupiter.jpg',
    saturn: '/textures/planets/saturn.jpg',
    uranus: '/textures/planets/uranus.jpg',
    neptune: '/textures/planets/neptune.jpg',
    moon: '/textures/planets/moon.jpg',
    sun: '/textures/planets/sun.jpg',
};

const PLANET_CONFIGS = [
    { body: Astronomy.Body.Mercury, name: "Mercurio", symbol: "☿", color: "#A5A5A5", textureKey: "mercury" as const, description: (mag: number) => `El planeta más cercano al Sol. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Venus, name: "Venus", symbol: "♀", color: "#E3BB76", textureKey: "venus" as const, description: (mag: number) => `El lucero del alba, cubierto de nubes. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Mars, name: "Marte", symbol: "♂", color: "#E27B58", textureKey: "mars" as const, description: (mag: number) => `El planeta rojo. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Jupiter, name: "Júpiter", symbol: "♃", color: "#D39C7E", textureKey: "jupiter" as const, description: (mag: number) => `Gigante gaseoso con su Gran Mancha Roja. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Saturn, name: "Saturno", symbol: "♄", color: "#C5AB6E", textureKey: "saturn" as const, description: (mag: number) => `El señor de los anillos. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Uranus, name: "Urano", symbol: "⛢", color: "#B5E3E3", textureKey: "uranus" as const, description: (mag: number) => `Un gigante helado con eje inclinado. Mag: ${mag.toFixed(1)}` },
    { body: Astronomy.Body.Neptune, name: "Neptuno", symbol: "♆", color: "#6081FF", textureKey: "neptune" as const, description: (mag: number) => `El planeta más lejano y ventoso. Mag: ${mag.toFixed(1)}` },
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

const PLANET_FRAGMENT_SHADER = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform sampler2D uMap;
    uniform vec3 uLightDirection;
    uniform float uOpacity;
    void main() {
        vec3 color = texture2D(uMap, vUv).rgb;
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(uLightDirection);
        vec3 viewDir = normalize(vViewPosition);

        // Terminador planetario realista (dot product corregido)
        float dotNL = dot(normal, lightDir);
        float light = smoothstep(-0.15, 0.25, dotNL);
        
        // Fresnel sutil para atmósfera/borde
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        vec3 atmosphericGlow = vec3(0.1, 0.3, 0.6) * fresnel * light * 0.4;

        // Luz ambiental mínima para ver el lado oscuro sutilmente
        float ambient = 0.04;
        
        vec3 finalColor = color * (light + ambient) + atmosphericGlow;
        gl_FragColor = vec4(finalColor, uOpacity);
    }
`;

const PLANET_RADIUS = 95;

function useSafeTexture(url: string) {
    const [tex, setTex] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        new THREE.TextureLoader().load(url, (t) => {
            t.minFilter = THREE.LinearFilter;
            t.generateMipmaps = true;
            setTex(t);
        });
    }, [url]);
    return tex;
}

function SunMesh() {
    const meshRef = useRef<THREE.Mesh>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const texture = useSafeTexture(TEXTURES.sun);
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
        <group position={[0, 0, 0]} visible={opacity > 0.01}>
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
    const time = useAppStore(state => state.time);
    const observer = useAppStore(state => state.observer);
    const texture = useSafeTexture(TEXTURES.moon);
    
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
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const sunHor = Astronomy.Horizon(time, obs, sunEq.ra, sunEq.dec, 'normal');
            
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
                    vertexShader={SUN_VERTEX_SHADER}
                    fragmentShader={PLANET_FRAGMENT_SHADER}
                    uniforms={uniforms}
                    transparent
                />
            </mesh>
            <Html distanceFactor={120} zIndexRange={[90, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded border border-white/20 bg-black/80 px-2 py-1 text-[10px] font-bold font-mono text-white -translate-x-1/2 -translate-y-8">
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
}

function PlanetMesh({ planet }: { planet: PlanetData }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const camFov = useAppStore(state => state.camFov);
    const time = useAppStore(state => state.time);
    const observer = useAppStore(state => state.observer);
    const texture = useSafeTexture(TEXTURES[planet.textureKey as keyof typeof TEXTURES]);
    
    const isGasGiant = ["Júpiter", "Saturno", "Urano", "Neptuno"].includes(planet.name);
    const baseScale = isGasGiant ? 0.9 : 0.5;
    
    // ZoomBoost suavizado: aumenta el tamaño del planeta cuando el FOV es muy bajo
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
            const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
            const sunEq = Astronomy.Equator(Astronomy.Body.Sun, time, obs, true, true);
            const sunHor = Astronomy.Horizon(time, obs, sunEq.ra, sunEq.dec, 'normal');
            
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
                        vertexShader={SUN_VERTEX_SHADER}
                        fragmentShader={PLANET_FRAGMENT_SHADER}
                        uniforms={uniforms}
                        transparent
                        depthTest={true}
                        depthWrite={true}
                    />
                </mesh>
                {planet.name === "Saturno" && (
                    <mesh rotation={[Math.PI / 2.5, 0, 0]} castShadow receiveShadow>
                        <ringGeometry args={[scale * 1.4, scale * 2.4, 64]} />
                        <meshStandardMaterial
                            map={texture}
                            transparent
                            opacity={opacity * 0.8}
                            side={THREE.DoubleSide}
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
    const time = useAppStore(state => state.time);
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

        // Júpiter Vector para sus lunas
        const jupiter = planets.find(p => p.name === "Júpiter");
        let jMoons: MoonData[] = [];
        if (jupiter) {
            jMoons = JUPITER_MOON_DATA.map(m => ({
                id: m.id,
                name: m.name,
                color: m.color,
                pos: [
                    jupiter.pos[0] + Math.sin(time.getTime() * 0.001 + m.mag) * 2,
                    jupiter.pos[1] + Math.cos(time.getTime() * 0.002 + m.mag) * 1.5,
                    jupiter.pos[2] + Math.cos(time.getTime() * 0.001 + m.mag) * 2
                ] as [number, number, number]
            }));
        }
        
        return { planets, moon, jMoons };
    }, [time, observer]);

    return (
        <group>
            <SunMesh />
            {data.planets.map(p => (
                <PlanetMesh key={p.name} planet={p} />
            ))}
            {data.moon && (
                <MoonMesh planet={data.moon.planet} phase={data.moon.phase} opacity={camFov < 30 ? 1 : 0} />
            )}
            {data.jMoons.map(m => (
                <JupiterMoonMesh key={m.id} moon={m} />
            ))}
        </group>
    );
}



