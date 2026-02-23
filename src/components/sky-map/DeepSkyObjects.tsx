'use client';

import { useMemo } from 'react';
import { DSOS } from '@/data/dsos';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';
import { Html } from '@react-three/drei';

export default function DeepSkyObjects() {
    const setSelectedObject = useAppStore((state) => state.setSelectedObject);
    const DSO_RADIUS = 94;

    const dsoData = useMemo(() => {
        return DSOS.map((dso) => {
            const pos = equatorialTo3D(dso.ra, dso.dec, DSO_RADIUS);
            return { ...dso, pos };
        });
    }, []);

    return (
        <group>
            {dsoData.map((dso) => (
                <group key={dso.id} position={dso.pos}>
                    {/* Visual representation of a DSO */}
                    <mesh
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedObject(dso);
                        }}
                    >
                        <ringGeometry args={[0.5, 0.7, 32]} />
                        <meshBasicMaterial color={dso.color} transparent opacity={0.6} />
                    </mesh>

                    {/* Label that stays small but visible */}
                    <Html distanceFactor={10}>
                        <div className="text-[10px] text-white/50 whitespace-nowrap pointer-events-none select-none">
                            {dso.id}
                        </div>
                    </Html>
                </group>
            ))}
        </group>
    );
}
