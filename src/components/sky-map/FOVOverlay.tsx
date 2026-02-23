'use client';

import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';

export default function FOVOverlay() {
    const { camera, size } = useThree();
    const settings = useAppStore((state) => state.settings);
    const { showFOV, focalLength, sensorWidth, sensorHeight } = settings;

    if (!showFOV) return null;

    // Calcular FOV del sensor en grados
    const fovX = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
    const fovY = 2 * Math.atan(sensorHeight / (2 * focalLength)) * (180 / Math.PI);

    // Obtener FOV actual de la cámara (vertical)
    const cam = camera as THREE.PerspectiveCamera;
    const camFovY = cam.fov;

    // El aspecto de la cámara suele ser size.width / size.height
    // La cámara de Three.js define su FOV verticalmente.
    // camFovX = 2 * atan(tan(camFovY/2) * aspect)
    const camFovX = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camFovY) / 2) * cam.aspect) * (180 / Math.PI);

    // Tamaño del rectángulo en píxeles
    const rectWidth = (fovX / camFovX) * size.width;
    const rectHeight = (fovY / camFovY) * size.height;

    return (
        <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
            style={{ mixBlendMode: 'screen' }}
        >
            <div
                className="border border-blue-400/50 relative"
                style={{
                    width: `${rectWidth}px`,
                    height: `${rectHeight}px`,
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)',
                }}
            >
                {/* Esquinas (Retículo) */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400" />

                {/* Centro */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 border border-blue-400/40 rounded-full" />

                {/* Info */}
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[9px] text-blue-400 font-mono tracking-widest uppercase">
                    FOV: {fovX.toFixed(2)}° x {fovY.toFixed(2)}° | {focalLength}mm
                </div>
            </div>
        </div>
    );
}
