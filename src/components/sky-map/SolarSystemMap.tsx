'use client';

/**
 * SolarSystemMap.tsx
 * Vista heliocéntrica 2D del Sistema Solar, activada por botón en el Header.
 * - Posiciones reales de los planetas usando astronomy-engine (HelioVector)
 * - Escala logarítmica para mostrar el sistema solar completo
 * - Animación en tiempo real (1 día/frame en modo rápido)
 * - Clic en planeta para ver info
 * - Compatible con night mode
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Astronomy from 'astronomy-engine';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface PlanetConfig {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    size: number;
}

const PLANETS: PlanetConfig[] = [
    { body: Astronomy.Body.Mercury, name: 'Mercurio', symbol: '☿', color: '#b0b0b0', size: 4  },
    { body: Astronomy.Body.Venus,   name: 'Venus',    symbol: '♀', color: '#f0e6c0', size: 6  },
    { body: Astronomy.Body.Earth,   name: 'Tierra',   symbol: '⊕', color: '#4488ff', size: 6  },
    { body: Astronomy.Body.Mars,    name: 'Marte',    symbol: '♂', color: '#c1440e', size: 5  },
    { body: Astronomy.Body.Jupiter, name: 'Júpiter',  symbol: '♃', color: '#c88b3a', size: 10 },
    { body: Astronomy.Body.Saturn,  name: 'Saturno',  symbol: '♄', color: '#e8d890', size: 9  },
    { body: Astronomy.Body.Uranus,  name: 'Urano',    symbol: '⛢', color: '#7de8e8', size: 7  },
    { body: Astronomy.Body.Neptune, name: 'Neptuno',  symbol: '♆', color: '#3f54ba', size: 7  },
];

// Semieje mayor real en UA
const SEMI_MAJOR: Record<string, number> = {
    Mercurio: 0.387, Venus: 0.723, Tierra: 1.0, Marte: 1.524,
    Júpiter: 5.203,  Saturno: 9.537, Urano: 19.19, Neptuno: 30.07,
};

// Escala logarítmica: r_screen = k * ln(1 + r_AU * c)
function logScale(au: number, maxAu = 32, maxPx = 1): number {
    return Math.log(1 + (au / maxAu) * (Math.E - 1)) * maxPx;
}

function getPlanetPos(body: Astronomy.Body, date: Date): { x: number; y: number; au: number } | null {
    try {
        const v = Astronomy.HelioVector(body, date);
        const au = Math.sqrt(v.x * v.x + v.y * v.y);
        return { x: v.x, y: v.y, au };
    } catch { return null; }
}

interface PlanetScreenPos {
    name: string;
    symbol: string;
    color: string;
    size: number;
    sx: number;
    sy: number;
    au: number;
}

export default function SolarSystemMap({ onClose }: { onClose: () => void }) {
    const storeTime = useAppStore((s) => s.time);
    const nightMode = useAppStore((s) => s.settings.nightMode);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef   = useRef<number>(0);
    const [displayTime, setDisplayTime] = useState(storeTime);
    const [playing, setPlaying] = useState(false);
    const [hoveredPlanet, setHoveredPlanet] = useState<PlanetScreenPos | null>(null);
    const positionsRef = useRef<PlanetScreenPos[]>([]);
    const speedRef = useRef(0); // días/frame cuando playing

    const bg  = nightMode ? '#0a0000' : '#020810';
    const fg  = nightMode ? '#ff4444' : '#4488ff';

    // Dibujar el sistema solar
    const draw = useCallback((date: Date) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const maxR = Math.min(W, H) * 0.47;

        ctx.clearRect(0, 0, W, H);

        // Fondo
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Líneas de cuadrícula sutiles
        ctx.strokeStyle = nightMode ? 'rgba(120,0,0,0.12)' : 'rgba(68,136,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let r = 0.25; r <= 1.0; r += 0.25) {
            ctx.beginPath();
            ctx.arc(cx, cy, r * maxR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Órbitas (círculos aproximados en escala logarítmica)
        PLANETS.forEach(p => {
            const au = SEMI_MAJOR[p.name] ?? 1;
            const r  = logScale(au, 32, maxR);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `${p.color}22`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });

        // Sol
        const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        sunGrad.addColorStop(0, '#fff8d0');
        sunGrad.addColorStop(0.4, '#ffaa00');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Glow del sol
        const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
        glowGrad.addColorStop(0, 'rgba(255,200,60,0.18)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();

        // Planetas
        const newPositions: PlanetScreenPos[] = [];

        PLANETS.forEach(cfg => {
            const pos = getPlanetPos(cfg.body, date);
            if (!pos) return;

            // Proyección X-Y del plano eclíptico
            const r = logScale(pos.au, 32, maxR);
            const angle = Math.atan2(pos.y, pos.x);
            const sx = cx + r * Math.cos(angle);
            const sy = cy - r * Math.sin(angle); // invertir Y para pantalla

            newPositions.push({ ...cfg, sx, sy, au: pos.au });

            // Halo
            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, cfg.size * 2.5);
            halo.addColorStop(0, `${cfg.color}55`);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, cfg.size * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Planeta
            ctx.fillStyle = cfg.color;
            ctx.beginPath();
            ctx.arc(sx, sy, cfg.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Anillo de Saturno
            if (cfg.name === 'Saturno') {
                ctx.strokeStyle = `${cfg.color}99`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(sx, sy, cfg.size, cfg.size / 3, 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Nombre en desktop (sin símbolo para no aglomerar)
            ctx.fillStyle = `${cfg.color}cc`;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(cfg.symbol, sx, sy - cfg.size - 3);
        });

        positionsRef.current = newPositions;

        // Fecha
        ctx.fillStyle = nightMode ? 'rgba(255,100,100,0.45)' : 'rgba(100,160,255,0.45)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(date.toLocaleDateString('es-ES', { year:'numeric', month:'short', day:'numeric' }), 10, H - 10);
    }, [bg, nightMode]);

    // Animación
    useEffect(() => {
        if (!playing) {
            draw(displayTime);
            return;
        }
        let t = displayTime.getTime();
        speedRef.current = 86400000; // 1 día/frame

        const loop = () => {
            t += speedRef.current;
            const d = new Date(t);
            setDisplayTime(d);
            draw(d);
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing]);

    // Redibujar en pausa cuando displayTime o nightMode cambia
    useEffect(() => {
        if (!playing) draw(displayTime);
    }, [displayTime, playing, draw]);

    // Resize handler
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.parentElement!.getBoundingClientRect();
            canvas.width  = rect.width;
            canvas.height = rect.height;
            draw(displayTime);
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const hit = positionsRef.current.find(p => {
            const dx = p.sx - mx, dy = p.sy - my;
            return Math.sqrt(dx*dx + dy*dy) < p.size + 8;
        }) ?? null;
        setHoveredPlanet(hit);
    }, []);

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex flex-col",
                nightMode ? "bg-[#0a0000]" : "bg-[#020814]"
            )}
        >
            {/* Toolbar */}
            <div
                className={cn(
                    "flex items-center gap-3 px-4 py-2 border-b shrink-0",
                    nightMode ? "border-red-900/30" : "border-blue-900/30"
                )}
            >
                <span className="text-[16px]">🌌</span>
                <span
                    className="text-[12px] font-mono font-bold tracking-widest uppercase"
                    style={{ color: fg }}
                >
                    Sistema Solar
                </span>
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => setDisplayTime(new Date(displayTime.getTime() - 30 * 86400000))}
                        className="px-2.5 py-1 rounded text-[10px] font-mono border"
                        style={{ borderColor: `${fg}44`, color: `${fg}99` }}
                        aria-label="Retroceder 30 días"
                    >
                        ← 30d
                    </button>
                    <button
                        onClick={() => setPlaying(p => !p)}
                        className="px-3 py-1 rounded text-[10px] font-mono font-bold border"
                        style={{ borderColor: fg, color: fg }}
                        aria-pressed={playing}
                    >
                        {playing ? '⏸ PAUSA' : '▶ ANIMAR'}
                    </button>
                    <button
                        onClick={() => setDisplayTime(new Date(displayTime.getTime() + 30 * 86400000))}
                        className="px-2.5 py-1 rounded text-[10px] font-mono border"
                        style={{ borderColor: `${fg}44`, color: `${fg}99` }}
                        aria-label="Avanzar 30 días"
                    >
                        30d →
                    </button>
                    <button
                        onClick={() => { setPlaying(false); setDisplayTime(storeTime); }}
                        className="px-2.5 py-1 rounded text-[10px] font-mono border"
                        style={{ borderColor: `${fg}44`, color: `${fg}99` }}
                    >
                        HOY
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-2 px-3 py-1 rounded text-[10px] font-mono font-bold border border-white/20 text-white/50"
                    >
                        ✕ CERRAR
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredPlanet(null)}
                />

                {/* Tooltip de planeta */}
                {hoveredPlanet && (
                    <div
                        className="absolute pointer-events-none rounded-lg border px-3 py-2 font-mono text-[11px]"
                        style={{
                            left: hoveredPlanet.sx + 14,
                            top: hoveredPlanet.sy - 14,
                            background: nightMode ? 'rgba(30,0,0,0.92)' : 'rgba(2,8,20,0.92)',
                            borderColor: `${hoveredPlanet.color}55`,
                            color: hoveredPlanet.color,
                        }}
                    >
                        <div className="font-bold">{hoveredPlanet.symbol} {hoveredPlanet.name}</div>
                        <div className="text-[9px] opacity-60 mt-0.5">
                            {hoveredPlanet.au.toFixed(3)} UA del Sol
                        </div>
                    </div>
                )}

                {/* Leyenda escala */}
                <div
                    className="absolute bottom-4 right-4 text-[9px] font-mono opacity-30"
                    style={{ color: fg }}
                >
                    Escala logarítmica · Plano eclíptico
                </div>
            </div>
        </div>
    );
}