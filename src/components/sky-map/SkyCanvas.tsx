'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import CelestialSphere from '@/components/sky-map/CelestialSphere';
import Stars from '@/components/sky-map/Stars';
import DeepSkyObjects from '@/components/sky-map/DeepSkyObjects';
import Constellations from '@/components/sky-map/Constellations';
import Planets from '@/components/sky-map/Planets';
import MilkyWay from '@/components/sky-map/MilkyWay';
import CelestialGrid from '@/components/sky-map/CelestialGrid';
import Horizon from '@/components/sky-map/Horizon';
import { useAppStore } from '@/stores/useAppStore';

import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';

export default function SkyCanvas() {
    const showGrid = useAppStore((state) => state.settings.showGrid);

    return (
        <div className="w-full h-full bg-[#02050a] relative">
            <Canvas
                gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, 0.1], fov: 60 }}
            >
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={60} />
                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        rotateSpeed={0.5}
                        reverseOrbit={true}
                        minDistance={0.01}
                        maxDistance={0.5}
                    />

                    <CelestialSphere />
                    <MilkyWay />
                    <Stars />
                    <DeepSkyObjects />
                    <Constellations />
                    <Planets />
                    <Horizon />
                    {showGrid && <CelestialGrid />}

                    <EffectComposer>
                        <Bloom
                            luminanceThreshold={0.2}
                            mipmapBlur
                            intensity={1.2}
                            radius={0.3}
                        />
                        <Noise opacity={0.03} />
                        <Vignette eskil={false} offset={0.1} darkness={1.1} />
                    </EffectComposer>
                </Suspense>
            </Canvas>
        </div>
    );
}
