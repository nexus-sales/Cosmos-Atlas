'use client';

import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';

interface FOVOverlayContentProps {
    rectWidth: number;
    rectHeight: number;
    fovX: number;
    fovY: number;
    focalLength: number;
}

/**
 * Componente HTML puro que renderiza el overlay.
 * Recibe los datos calculados como props.
 */
function FOVOverlayContent({ rectWidth = 0, rectHeight = 0, fovX = 0, fovY = 0, focalLength = 50 }: FOVOverlayContentProps) {
    // Guard: don't render if values are not valid yet
    if (rectWidth <= 0 || rectHeight <= 0) return null;
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20 mix-blend-screen">
            <div
                className="border border-blue-400/50 relative shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                style={{
                    width: `${rectWidth}px`,
                    height: `${rectHeight}px`,
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

/**
 * Componente principal que usa useThree() en el contexto de R3F
 * y pasa los datos calculados al Html portal.
 */
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

    // camFovX = 2 * atan(tan(camFovY/2) * aspect)
    const camFovX = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camFovY) / 2) * cam.aspect) * (180 / Math.PI);

    // Tamaño del rectángulo en píxeles
    const rectWidth = (fovX / camFovX) * size.width;
    const rectHeight = (fovY / camFovY) * size.height;

    return (
        <Html fullscreen className="pointer-events-none">
            <FOVOverlayContent
                rectWidth={rectWidth}
                rectHeight={rectHeight}
                fovX={fovX}
                fovY={fovY}
                focalLength={focalLength}
            />
        </Html>
    );
}
