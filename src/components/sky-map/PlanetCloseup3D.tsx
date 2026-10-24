'use client';

import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';
import { planetBasis } from '@/lib/astronomy/planetOrientation';

interface PlanetCloseup3DProps {
    body: Astronomy.Body;
    name: string;
    color: string;
    textureKey?: string;
    date: Date;
}

type Vec3 = [number, number, number];

function normalize(vector: Vec3): Vec3 {
    const length = Math.hypot(...vector) || 1;
    return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function eqjVectorToScene(vector: Astronomy.Vector, date: Date): Vec3 {
    const rotated = Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date), vector);
    return [rotated.y, rotated.z, rotated.x];
}

function bodyDirections(body: Astronomy.Body, date: Date) {
    const planetHelio = Astronomy.HelioVector(body, date);
    const toSunEqj = new Astronomy.Vector(-planetHelio.x, -planetHelio.y, -planetHelio.z, planetHelio.t);
    const light = normalize(eqjVectorToScene(toSunEqj, date));

    if (body === Astronomy.Body.Earth) {
        return { light, camera: normalize([0.35, 0.25, 1]) as Vec3, illustrativeCamera: true };
    }

    const earthHelio = Astronomy.HelioVector(Astronomy.Body.Earth, date);
    const toEarthEqj = new Astronomy.Vector(
        earthHelio.x - planetHelio.x,
        earthHelio.y - planetHelio.y,
        earthHelio.z - planetHelio.z,
        planetHelio.t,
    );
    return { light, camera: normalize(eqjVectorToScene(toEarthEqj, date)), illustrativeCamera: false };
}

function orientationQuaternion(body: Astronomy.Body, date: Date) {
    const basis = planetBasis(body, date);
    const matrix = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(...basis.prime),
        new THREE.Vector3(...basis.north),
        new THREE.Vector3(...basis.side),
    );
    return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function PlanetModel({ body, name, color, textureKey, date }: PlanetCloseup3DProps) {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const orientation = useMemo(() => orientationQuaternion(body, date), [body, date]);
    const directions = useMemo(() => bodyDirections(body, date), [body, date]);

    useEffect(() => {
        if (!textureKey) return;
        let active = true;
        let loadedTexture: THREE.Texture | null = null;
        const loader = new THREE.TextureLoader();
        loader.load(`/textures/planets/${textureKey}_1k.jpg`, (loaded) => {
            if (!active) {
                loaded.dispose();
                return;
            }
            loadedTexture = loaded;
            loaded.colorSpace = THREE.SRGBColorSpace;
            loaded.anisotropy = 8;
            setTexture(loaded);
        });
        return () => {
            active = false;
            loadedTexture?.dispose();
        };
    }, [textureKey]);

    return (
        <>
            <ambientLight intensity={0.035} />
            <directionalLight position={directions.light.map((value) => value * 8) as Vec3} intensity={1.15} color="#fff8e8" />
            <group quaternion={orientation}>
                <mesh castShadow receiveShadow>
                    <sphereGeometry args={[1, 96, 96]} />
                    <meshStandardMaterial key={texture?.uuid ?? 'untextured'} map={texture} color={texture ? '#ffffff' : color} roughness={0.92} metalness={0} />
                </mesh>
                {name === 'Saturno' && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[1.28, 2.15, 160]} />
                        <shaderMaterial
                            transparent
                            side={THREE.DoubleSide}
                            depthWrite={false}
                            vertexShader={`
                                varying vec2 vRingPosition;
                                void main() {
                                    vRingPosition = position.xy;
                                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                                }
                            `}
                            fragmentShader={`
                                varying vec2 vRingPosition;
                                void main() {
                                    float r = length(vRingPosition);
                                    float t = clamp((r - 1.28) / (2.15 - 1.28), 0.0, 1.0);
                                    float bRing = smoothstep(0.06, 0.14, t) * (1.0 - smoothstep(0.52, 0.57, t));
                                    float cassini = smoothstep(0.55, 0.59, t) * (1.0 - smoothstep(0.61, 0.65, t));
                                    float aRing = smoothstep(0.62, 0.68, t) * (1.0 - smoothstep(0.88, 0.98, t));
                                    float fineBands = 0.86 + 0.14 * sin(t * 170.0);
                                    float alpha = (bRing * 0.72 + aRing * 0.52) * fineBands;
                                    alpha *= 1.0 - cassini * 0.96;
                                    vec3 color = mix(vec3(0.55, 0.48, 0.34), vec3(0.88, 0.82, 0.66), bRing);
                                    gl_FragColor = vec4(color, alpha);
                                }
                            `}
                        />
                    </mesh>
                )}
            </group>
        </>
    );
}

export default function PlanetCloseup3D(props: PlanetCloseup3DProps) {
    const directions = useMemo(() => bodyDirections(props.body, props.date), [props.body, props.date]);
    const cameraDistance = props.name === 'Saturno' ? 7.8 : 5.6;
    const cameraPosition = directions.camera.map((value) => value * cameraDistance) as Vec3;

    return (
        <div className="absolute inset-x-0 top-12 bottom-52 z-10">
            <Canvas camera={{ position: cameraPosition, fov: 38, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: true }}>
                <PlanetModel key={`${props.name}-${props.textureKey ?? 'procedural'}`} {...props} />
                <OrbitControls enablePan={false} minDistance={3.8} maxDistance={11} rotateSpeed={0.55} zoomSpeed={0.7} />
            </Canvas>
            <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1 font-mono text-[8px] uppercase tracking-wider text-white/45 backdrop-blur">
                {directions.illustrativeCamera ? 'Cámara exterior ilustrativa · eje y luz reales' : 'Cámara inicial desde la Tierra · arrastra para explorar'}
            </div>
        </div>
    );
}
