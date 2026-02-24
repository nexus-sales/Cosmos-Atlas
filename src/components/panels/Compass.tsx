'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useState, useRef, useCallback } from 'react';

/**
 * Brújula interactiva que muestra la dirección cardinal hacia donde mira la cámara.
 * - Clic simple: centra la vista en el cenit (mirando hacia arriba)
 * - Doble clic: centra la vista mirando al norte (horizonte)
 */
export default function Compass() {
    const { camera } = useThree();
    const [azimuth, setAzimuth] = useState(0);
    const lastClickRef = useRef(0);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calcular acimut cada frame
    useFrame(() => {
        // La cámara está en el origen mirando hacia target=[0,0,0]
        // Dirección de vista = -camera.position normalizado
        const lookDir = camera.position.clone().negate().normalize();
        // Acimut: N=0°, E=90°, S=180°, W=270°
        // Norte = -Z, Este = +X
        const az = Math.atan2(lookDir.x, -lookDir.z) * (180 / Math.PI);
        setAzimuth((az + 360) % 360);
    });

    const handleClick = useCallback(() => {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickRef.current;

        // Cancelar timeout pendiente
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        if (timeSinceLastClick < 300) {
            // Doble clic → Mirar al Norte (horizonte)
            // Norte = -Z, cámara debe estar en +Z
            camera.position.set(0, 0, 0.01);
        } else {
            // Esperar para ver si es doble clic
            clickTimeoutRef.current = setTimeout(() => {
                // Clic simple → Mirar al Cenit (arriba)
                // Cenit = +Y, cámara debe estar en -Y
                camera.position.set(0, -0.01, 0.0001);
            }, 300);
        }

        lastClickRef.current = now;
    }, [camera]);

    // Dirección cardinal actual
    const getCardinalDirection = () => {
        if (azimuth >= 337.5 || azimuth < 22.5) return 'N';
        if (azimuth >= 22.5 && azimuth < 67.5) return 'NE';
        if (azimuth >= 67.5 && azimuth < 112.5) return 'E';
        if (azimuth >= 112.5 && azimuth < 157.5) return 'SE';
        if (azimuth >= 157.5 && azimuth < 202.5) return 'S';
        if (azimuth >= 202.5 && azimuth < 247.5) return 'SO';
        if (azimuth >= 247.5 && azimuth < 292.5) return 'O';
        return 'NO';
    };

    return (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
            <div className="absolute bottom-6 left-6 z-30 pointer-events-auto">
                <button
                    onClick={handleClick}
                    className="relative w-16 h-16 rounded-full bg-black/60 backdrop-blur-md
                               border border-white/20 hover:border-blue-400/50
                               shadow-lg shadow-black/50 transition-all duration-200
                               flex items-center justify-center group"
                    title="Clic: Cenit | Doble clic: Norte"
                >
                    <svg viewBox="0 0 100 100" className="w-14 h-14">
                        {/* Círculo exterior */}
                        <circle
                            cx="50"
                            cy="50"
                            r="46"
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="1"
                        />

                        {/* Marcas de grados (cada 30°) */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                            <line
                                key={deg}
                                x1="50"
                                y1="6"
                                x2="50"
                                y2={deg % 90 === 0 ? 12 : 9}
                                stroke={deg % 90 === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'}
                                strokeWidth={deg % 90 === 0 ? 1.5 : 1}
                                transform={`rotate(${deg}, 50, 50)`}
                            />
                        ))}

                        {/* Letras cardinales (fijas, no rotan) */}
                        <text
                            x="50"
                            y="20"
                            textAnchor="middle"
                            fill="#ff5555"
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="monospace"
                        >
                            N
                        </text>
                        <text
                            x="84"
                            y="54"
                            textAnchor="middle"
                            fill="#99bbff"
                            fontSize="9"
                            fontFamily="monospace"
                        >
                            E
                        </text>
                        <text
                            x="50"
                            y="88"
                            textAnchor="middle"
                            fill="#8888ff"
                            fontSize="9"
                            fontFamily="monospace"
                        >
                            S
                        </text>
                        <text
                            x="16"
                            y="54"
                            textAnchor="middle"
                            fill="#99bbff"
                            fontSize="9"
                            fontFamily="monospace"
                        >
                            O
                        </text>

                        {/* Aguja que rota (apunta al norte visual) */}
                        <g transform={`rotate(${-azimuth}, 50, 50)`}>
                            {/* Punta norte (roja) */}
                            <polygon
                                points="50,24 46,50 50,44 54,50"
                                fill="#ff5555"
                                className="drop-shadow-sm"
                            />
                            {/* Punta sur (gris) */}
                            <polygon
                                points="50,76 46,50 50,56 54,50"
                                fill="#666666"
                            />
                        </g>

                        {/* Centro */}
                        <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.3)" />
                        <circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.6)" />
                    </svg>

                    {/* Indicador de dirección actual */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2
                                    text-[10px] font-mono text-white/60 tracking-wider">
                        {getCardinalDirection()} {Math.round(azimuth)}°
                    </div>
                </button>
            </div>
        </Html>
    );
}
