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

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as Astronomy from 'astronomy-engine';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { cn } from '@/lib/utils';
import { buildOrbitPath, heliocentricEclipticPosition, interplanetaryDistanceAu, lightTimeMinutes, projectEarthMoon, projectGalileanMoons, scaleSolarDistance, type SolarScaleMode } from '@/lib/astronomy/solarSystemOrbits';
import { getSolarSystemBodyByName } from '@/data/solarSystemCatalog';
import PlanetCloseup3D from '@/components/sky-map/PlanetCloseup3D';

interface PlanetConfig {
    body: Astronomy.Body;
    name: string;
    symbol: string;
    color: string;
    size: number;
    periodDays: number;
    textureKey?: string;
}

const PLANETS: PlanetConfig[] = [
    { body: Astronomy.Body.Mercury, name: 'Mercurio', symbol: '☿', color: '#b0b0b0', size: 4, periodDays: 87.969, textureKey: 'mercury' },
    { body: Astronomy.Body.Venus,   name: 'Venus',    symbol: '♀', color: '#f0e6c0', size: 6, periodDays: 224.701, textureKey: 'venus' },
    { body: Astronomy.Body.Earth,   name: 'Tierra',   symbol: '⊕', color: '#4488ff', size: 6, periodDays: 365.256 },
    { body: Astronomy.Body.Mars,    name: 'Marte',    symbol: '♂', color: '#c1440e', size: 5, periodDays: 686.98, textureKey: 'mars' },
    { body: Astronomy.Body.Jupiter, name: 'Júpiter',  symbol: '♃', color: '#c88b3a', size: 10, periodDays: 4332.59, textureKey: 'jupiter' },
    { body: Astronomy.Body.Saturn,  name: 'Saturno',  symbol: '♄', color: '#e8d890', size: 9, periodDays: 10759.22, textureKey: 'saturn' },
    { body: Astronomy.Body.Uranus,  name: 'Urano',    symbol: '⛢', color: '#7de8e8', size: 7, periodDays: 30688.5, textureKey: 'uranus' },
    { body: Astronomy.Body.Neptune, name: 'Neptuno',  symbol: '♆', color: '#3f54ba', size: 7, periodDays: 60182, textureKey: 'neptune' },
];

const SIMULATION_RATES = [
    { label: '1 h/s', millisecondsPerSecond: 3_600_000 },
    { label: '6 h/s', millisecondsPerSecond: 21_600_000 },
    { label: '1 d/s', millisecondsPerSecond: 86_400_000 },
    { label: '10 d/s', millisecondsPerSecond: 864_000_000 },
] as const;

function getPlanetPos(body: Astronomy.Body, date: Date): { x: number; y: number; au: number } | null {
    try {
        const position = heliocentricEclipticPosition(body, date);
        return { x: position.x, y: position.y, au: position.distanceAu };
    } catch { return null; }
}

interface PlanetScreenPos {
    body: Astronomy.Body;
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
    const solarSystemBodies = useCatalog((s) => s.solarSystemBodies);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef   = useRef<number>(0);
    const [displayTime, setDisplayTime] = useState(storeTime);
    const [playing, setPlaying] = useState(false);
    const [simulationRateIndex, setSimulationRateIndex] = useState(1);
    const [scaleMode, setScaleMode] = useState<SolarScaleMode>('educational');
    const [hoveredPlanet, setHoveredPlanet] = useState<PlanetScreenPos | null>(null);
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetConfig | null>(null);
    const [journeyProgress, setJourneyProgress] = useState(0);
    const [focusDetailMode, setFocusDetailMode] = useState<'planet' | 'moons'>('planet');
    const journeyAnimRef = useRef<number>(0);
    const planetImagesRef = useRef<Record<string, HTMLImageElement>>({});
    const [textureVersion, setTextureVersion] = useState(0);
    const positionsRef = useRef<PlanetScreenPos[]>([]);
    const speedRef = useRef<number>(SIMULATION_RATES[simulationRateIndex].millisecondsPerSecond);
    const orbitPaths = useMemo(() => PLANETS.map((planet) => ({
        planet,
        points: buildOrbitPath(planet.body, planet.periodDays),
    })), []);

    const bg  = nightMode ? '#0a0000' : '#020810';
    const fg  = nightMode ? '#ff4444' : '#4488ff';

    // Dibujar el sistema solar
    const draw = useCallback((date: Date) => {
        // Cambia al completarse una textura y fuerza este callback a repintar.
        void textureVersion;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const maxR = Math.min(W, H) * 0.47;

        // La cámara trabaja sobre la proyección 2D del plano eclíptico. No es
        // una trayectoria espacial: desplaza y amplía el mapa hacia el destino.
        const selectedPosition = selectedPlanet ? getPlanetPos(selectedPlanet.body, date) : null;
        const selectedRadius = selectedPosition
            ? scaleSolarDistance(Math.hypot(selectedPosition.x, selectedPosition.y), maxR, scaleMode)
            : 0;
        const selectedAngle = selectedPosition ? Math.atan2(selectedPosition.y, selectedPosition.x) : 0;
        const selectedBaseX = cx + selectedRadius * Math.cos(selectedAngle);
        const selectedBaseY = cy - selectedRadius * Math.sin(selectedAngle);
        const cameraEase = journeyProgress <= 0 ? 0 : 1 - Math.pow(1 - journeyProgress, 3);
        const focusZoom = scaleMode === 'physical' ? 7 : 5;
        const cameraZoom = 1 + (focusZoom - 1) * cameraEase;
        // Conserva un movimiento de pantalla continuo mientras cambia el zoom:
        // el destino viaja desde su posición inicial hasta el centro sin rebote.
        const cameraX = selectedBaseX - ((selectedBaseX - cx) * (1 - cameraEase)) / cameraZoom;
        const cameraY = selectedBaseY - ((selectedBaseY - cy) * (1 - cameraEase)) / cameraZoom;
        const project = (x: number, y: number) => ({
            x: cx + (x - cameraX) * cameraZoom,
            y: cy + (y - cameraY) * cameraZoom,
        });

        ctx.clearRect(0, 0, W, H);

        // Fondo
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        // Líneas de cuadrícula sutiles
        ctx.strokeStyle = nightMode ? 'rgba(120,0,0,0.12)' : 'rgba(68,136,255,0.06)';
        ctx.lineWidth = 0.5;
        const projectedSun = project(cx, cy);
        for (let r = 0.25; r <= 1.0; r += 0.25) {
            ctx.beginPath();
            ctx.arc(projectedSun.x, projectedSun.y, r * maxR * cameraZoom, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Trayectorias heliocéntricas reales muestreadas en el plano eclíptico.
        orbitPaths.forEach(({ planet, points }) => {
            ctx.beginPath();
            points.forEach((point, index) => {
                const r = scaleSolarDistance(Math.hypot(point.x, point.y), maxR, scaleMode);
                const angle = Math.atan2(point.y, point.x);
                const baseX = cx + r * Math.cos(angle);
                const baseY = cy - r * Math.sin(angle);
                const screen = project(baseX, baseY);
                if (index === 0) ctx.moveTo(screen.x, screen.y); else ctx.lineTo(screen.x, screen.y);
            });
            ctx.closePath();
            ctx.strokeStyle = `${planet.color}35`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });

        // Sol
        const sunSize = 14 * Math.min(cameraZoom, 2);
        const sunGrad = ctx.createRadialGradient(projectedSun.x, projectedSun.y, 0, projectedSun.x, projectedSun.y, sunSize);
        sunGrad.addColorStop(0, '#fff8d0');
        sunGrad.addColorStop(0.4, '#ffaa00');
        sunGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(projectedSun.x, projectedSun.y, sunSize, 0, Math.PI * 2);
        ctx.fill();

        // Glow del sol
        const glowGrad = ctx.createRadialGradient(projectedSun.x, projectedSun.y, 0, projectedSun.x, projectedSun.y, sunSize * 2);
        glowGrad.addColorStop(0, 'rgba(255,200,60,0.18)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(projectedSun.x, projectedSun.y, sunSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Planetas
        const newPositions: PlanetScreenPos[] = [];

        PLANETS.forEach(cfg => {
            const pos = getPlanetPos(cfg.body, date);
            if (!pos) return;

            // Proyección X-Y del plano eclíptico
            const r = scaleSolarDistance(Math.hypot(pos.x, pos.y), maxR, scaleMode);
            const angle = Math.atan2(pos.y, pos.x);
            const baseX = cx + r * Math.cos(angle);
            const baseY = cy - r * Math.sin(angle); // invertir Y para pantalla
            const screen = project(baseX, baseY);
            const sx = screen.x;
            const sy = screen.y;

            newPositions.push({ ...cfg, sx, sy, au: pos.au });

            // Halo
            const focusedPlanetDiameter = Math.min(150, Math.max(104, Math.min(W, H) * 0.14));
            const focusedSystemDiameter = Math.min(64, Math.max(46, Math.min(W, H) * 0.055));
            const focusedDiameter = focusDetailMode === 'moons'
                ? ((cfg.name === 'Júpiter' || cfg.name === 'Tierra') ? focusedSystemDiameter : focusedPlanetDiameter)
                : focusedPlanetDiameter;
            const displaySize = cfg.name === selectedPlanet?.name
                ? cfg.size + (focusedDiameter - cfg.size) * cameraEase
                : cfg.size;
            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, displaySize * 2.5);
            halo.addColorStop(0, `${cfg.color}55`);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, displaySize * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Planeta
            if (cfg.name === selectedPlanet?.name && cameraEase > 0.05) {
                const planetGradient = ctx.createRadialGradient(
                    sx - displaySize * 0.18,
                    sy - displaySize * 0.2,
                    displaySize * 0.04,
                    sx,
                    sy,
                    displaySize * 0.58,
                );
                planetGradient.addColorStop(0, '#ffffff');
                planetGradient.addColorStop(0.18, cfg.color);
                planetGradient.addColorStop(1, '#050910');
                ctx.fillStyle = planetGradient;
            } else {
                ctx.fillStyle = cfg.color;
            }
            ctx.beginPath();
            ctx.arc(sx, sy, displaySize / 2, 0, Math.PI * 2);
            ctx.fill();

            const texture = cfg.textureKey ? planetImagesRef.current[cfg.textureKey] : undefined;
            if (texture && cfg.name === selectedPlanet?.name && cameraEase > 0.15) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(sx, sy, displaySize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(texture, sx - displaySize / 2, sy - displaySize / 2, displaySize, displaySize);
                const shade = ctx.createLinearGradient(sx - displaySize / 2, sy, sx + displaySize / 2, sy);
                shade.addColorStop(0, 'rgba(255,255,255,0.18)');
                shade.addColorStop(0.48, 'rgba(255,255,255,0)');
                shade.addColorStop(1, 'rgba(0,0,0,0.68)');
                ctx.fillStyle = shade;
                ctx.fillRect(sx - displaySize / 2, sy - displaySize / 2, displaySize, displaySize);
                ctx.restore();
            } else if (cfg.name === 'Tierra' && cfg.name === selectedPlanet?.name && cameraEase > 0.15) {
                // Representación procedural honesta mientras no exista una textura terrestre local.
                ctx.save();
                ctx.beginPath();
                ctx.arc(sx, sy, displaySize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = '#2369a8';
                ctx.fillRect(sx - displaySize / 2, sy - displaySize / 2, displaySize, displaySize);
                ctx.fillStyle = '#67a35b';
                ctx.beginPath();
                ctx.ellipse(sx - displaySize * 0.12, sy - displaySize * 0.08, displaySize * 0.2, displaySize * 0.11, -0.5, 0, Math.PI * 2);
                ctx.ellipse(sx + displaySize * 0.18, sy + displaySize * 0.13, displaySize * 0.16, displaySize * 0.09, 0.55, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Anillo de Saturno
            if (cfg.name === 'Saturno') {
                ctx.strokeStyle = `${cfg.color}99`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(sx, sy, displaySize, displaySize / 3, 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Nombre en desktop (sin símbolo para no aglomerar)
            ctx.fillStyle = `${cfg.color}cc`;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(cfg.symbol, sx, sy - displaySize - 3);

            if (cfg.name === 'Júpiter' && selectedPlanet?.name === 'Júpiter' && focusDetailMode === 'moons' && cameraEase > 0.85) {
                const jupiterRadiusPx = displaySize / 2;
                const moonColors: Record<string, string> = { io: '#ffe38a', europa: '#e8efff', ganymede: '#c9c2b5', callisto: '#9b8f82' };
                const moonProjections = projectGalileanMoons(date);
                const maxProjectedSeparation = Math.max(1, ...moonProjections.map((moon) => Math.hypot(moon.xJupiterRadii, moon.yJupiterRadii)));
                const orbitalScale = Math.min(W, H) * 0.34 / maxProjectedSeparation;
                moonProjections.forEach((moon) => {
                    if (moon.phenomenon === 'occulted') return;
                    const moonX = sx + moon.xJupiterRadii * orbitalScale;
                    const moonY = sy - moon.yJupiterRadii * orbitalScale;
                    const moonRadius = moon.id === 'ganymede' ? 5 : moon.id === 'callisto' ? 4.5 : 4;
                    ctx.fillStyle = moonColors[moon.id];
                    ctx.beginPath();
                    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.68)';
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(moon.name, moonX, moonY - 7);
                    if (moon.phenomenon === 'transit') {
                        ctx.fillStyle = 'rgba(96,165,250,0.9)';
                        ctx.font = '7px monospace';
                        ctx.fillText('TRÁNSITO', moonX, moonY + 11);
                    }
                });
                moonProjections.forEach((moon) => {
                    if (!moon.shadow) return;
                    const shadowX = sx + moon.shadow.xJupiterRadii * jupiterRadiusPx;
                    const shadowY = sy - moon.shadow.yJupiterRadii * jupiterRadiusPx;
                    ctx.fillStyle = 'rgba(0,0,0,0.88)';
                    ctx.beginPath();
                    ctx.arc(shadowX, shadowY, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                });
            }

            if (cfg.name === 'Tierra' && selectedPlanet?.name === 'Tierra' && focusDetailMode === 'moons' && cameraEase > 0.85) {
                const earthMoon = projectEarthMoon(date);
                const projectedSeparation = Math.max(1, Math.hypot(earthMoon.xEarthRadii, earthMoon.yEarthRadii));
                const orbitalScale = Math.min(W, H) * 0.34 / projectedSeparation;
                const moonX = sx + earthMoon.xEarthRadii * orbitalScale;
                const moonY = sy - earthMoon.yEarthRadii * orbitalScale;
                ctx.fillStyle = '#d9d8cf';
                ctx.beginPath();
                ctx.arc(moonX, moonY, Math.max(5, displaySize * 0.16), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.72)';
                ctx.font = '9px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Luna', moonX, moonY - 8);
            }
        });

        positionsRef.current = newPositions;

        if (selectedPlanet) {
            const earth = newPositions.find((planet) => planet.name === 'Tierra');
            const target = newPositions.find((planet) => planet.name === selectedPlanet.name);
            if (earth && target) {
                ctx.save();
                ctx.setLineDash([5, 5]);
                ctx.strokeStyle = `${selectedPlanet.color}88`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(earth.sx, earth.sy);
                ctx.lineTo(target.sx, target.sy);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.strokeStyle = selectedPlanet.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(target.sx, target.sy, selectedPlanet.size + 6, 0, Math.PI * 2);
                ctx.stroke();
                if (journeyProgress > 0) {
                    const eased = 1 - Math.pow(1 - journeyProgress, 3);
                    const x = earth.sx + (target.sx - earth.sx) * eased;
                    const y = earth.sy + (target.sy - earth.sy) * eased;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = `${selectedPlanet.color}aa`;
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // Fecha
        ctx.fillStyle = nightMode ? 'rgba(255,100,100,0.45)' : 'rgba(100,160,255,0.45)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const showPreciseTime = focusDetailMode === 'moons'
            && journeyProgress >= 0.98
            && (selectedPlanet?.name === 'Tierra' || selectedPlanet?.name === 'Júpiter');
        ctx.fillText(
            showPreciseTime
                ? date.toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                : date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }),
            10,
            H - 10,
        );
    }, [bg, focusDetailMode, journeyProgress, nightMode, orbitPaths, scaleMode, selectedPlanet, textureVersion]);

    useEffect(() => {
        let active = true;
        PLANETS.forEach((planet) => {
            if (!planet.textureKey || planetImagesRef.current[planet.textureKey]) return;
            const image = new Image();
            image.onload = () => {
                if (!active || !planet.textureKey) return;
                planetImagesRef.current[planet.textureKey] = image;
                setTextureVersion((version) => version + 1);
            };
            image.src = `/textures/planets/${planet.textureKey}_1k.jpg`;
        });
        return () => { active = false; };
    }, []);

    // Animación
    useEffect(() => {
        if (!playing) {
            draw(displayTime);
            return;
        }
        let t = displayTime.getTime();
        let previousFrame = performance.now();

        const loop = (now: number) => {
            const elapsedSeconds = Math.min(0.25, (now - previousFrame) / 1000);
            previousFrame = now;
            t += speedRef.current * elapsedSeconds;
            const d = new Date(t);
            setDisplayTime(d);
            draw(d);
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing]);

    useEffect(() => {
        speedRef.current = SIMULATION_RATES[simulationRateIndex].millisecondsPerSecond;
    }, [simulationRateIndex]);

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

    const findPlanetAt = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left, my = clientY - rect.top;
        return positionsRef.current.find((planet) => Math.hypot(planet.sx - mx, planet.sy - my) < planet.size + 10) ?? null;
    }, []);

    const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const hit = findPlanetAt(event.clientX, event.clientY);
        if (!hit) return;
        setSelectedPlanet(PLANETS.find((planet) => planet.name === hit.name) ?? null);
        setJourneyProgress(0);
        setFocusDetailMode('planet');
    }, [findPlanetAt]);

    const startVisualJourney = useCallback(() => {
        cancelAnimationFrame(journeyAnimRef.current);
        const started = performance.now();
        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / 1800);
            setJourneyProgress(progress);
            if (progress < 1) journeyAnimRef.current = requestAnimationFrame(tick);
        };
        journeyAnimRef.current = requestAnimationFrame(tick);
    }, []);

    const returnToSystem = useCallback(() => {
        cancelAnimationFrame(journeyAnimRef.current);
        const started = performance.now();
        const initialProgress = journeyProgress;
        const tick = (now: number) => {
            const elapsed = Math.min(1, (now - started) / 900);
            setJourneyProgress(initialProgress * (1 - elapsed));
            if (elapsed < 1) journeyAnimRef.current = requestAnimationFrame(tick);
        };
        journeyAnimRef.current = requestAnimationFrame(tick);
    }, [journeyProgress]);

    useEffect(() => () => cancelAnimationFrame(journeyAnimRef.current), []);

    const selectedDistance = selectedPlanet ? interplanetaryDistanceAu(selectedPlanet.body, displayTime) : 0;
    const selectedInfo = selectedPlanet
        ? getSolarSystemBodyByName(selectedPlanet.name, solarSystemBodies)
        : undefined;
    const selectedAxis = useMemo(() => {
        if (!selectedPlanet) return null;
        try {
            return Astronomy.RotationAxis(selectedPlanet.body, displayTime);
        } catch {
            return null;
        }
    }, [displayTime, selectedPlanet]);
    const galileanMoons = useMemo(
        () => selectedPlanet?.name === 'Júpiter' ? projectGalileanMoons(displayTime) : [],
        [displayTime, selectedPlanet],
    );
    const earthMoon = useMemo(
        () => selectedPlanet?.name === 'Tierra' ? projectEarthMoon(displayTime) : null,
        [displayTime, selectedPlanet],
    );
    const moonSystemActive = focusDetailMode === 'moons'
        && journeyProgress >= 0.98
        && (selectedPlanet?.name === 'Tierra' || selectedPlanet?.name === 'Júpiter');
    const timeStepMs = moonSystemActive ? 6 * 3_600_000 : 30 * 86_400_000;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col",
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
                    <div className="flex rounded border border-white/10 p-0.5">
                        {(['physical', 'educational'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setScaleMode(mode)}
                                className={cn(
                                    'rounded px-2 py-1 text-[8px] font-bold uppercase tracking-wider',
                                    scaleMode === mode ? 'bg-blue-500/20 text-blue-200' : 'text-white/35'
                                )}
                            >
                                {mode === 'physical' ? 'Física' : 'Educativa'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setDisplayTime(new Date(displayTime.getTime() - timeStepMs))}
                        className="px-2.5 py-1 rounded text-[10px] font-mono border"
                        style={{ borderColor: `${fg}44`, color: `${fg}99` }}
                        aria-label={moonSystemActive ? 'Retroceder 6 horas' : 'Retroceder 30 días'}
                    >
                        {moonSystemActive ? '← 6h' : '← 30d'}
                    </button>
                    <button
                        onClick={() => setPlaying(p => !p)}
                        className="px-3 py-1 rounded text-[10px] font-mono font-bold border"
                        style={{ borderColor: fg, color: fg }}
                        aria-pressed={playing}
                    >
                        {playing ? '⏸ PAUSA' : '▶ ANIMAR'}
                    </button>
                    <select
                        value={simulationRateIndex}
                        onChange={(event) => setSimulationRateIndex(Number(event.target.value))}
                        aria-label="Velocidad de simulación"
                        className="rounded border border-white/10 bg-[#07101d] px-2 py-1 text-[9px] font-mono text-white/55 outline-none"
                    >
                        {SIMULATION_RATES.map((rate, index) => <option key={rate.label} value={index}>{rate.label}</option>)}
                    </select>
                    <button
                        onClick={() => setDisplayTime(new Date(displayTime.getTime() + timeStepMs))}
                        className="px-2.5 py-1 rounded text-[10px] font-mono border"
                        style={{ borderColor: `${fg}44`, color: `${fg}99` }}
                        aria-label={moonSystemActive ? 'Avanzar 6 horas' : 'Avanzar 30 días'}
                    >
                        {moonSystemActive ? '6h →' : '30d →'}
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
                    onClick={handleClick}
                />

                {selectedPlanet && journeyProgress >= 0.98 && focusDetailMode === 'planet' && (
                    <PlanetCloseup3D
                        key={selectedPlanet.name}
                        body={selectedPlanet.body}
                        name={selectedPlanet.name}
                        color={selectedPlanet.color}
                        textureKey={selectedPlanet.textureKey}
                        date={displayTime}
                    />
                )}

                {journeyProgress > 0.02 && (
                    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-blue-400/20 bg-[#07101d]/90 px-4 py-2 font-mono shadow-xl backdrop-blur-xl">
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200">
                            {journeyProgress < 1 ? 'Transición de cámara' : `Vista enfocada · ${selectedPlanet?.name ?? ''}`}
                        </span>
                        <button onClick={returnToSystem} className="rounded border border-white/15 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white/60 hover:text-white">
                            Volver al sistema
                        </button>
                    </div>
                )}

                {selectedPlanet && (
                    <div className="absolute bottom-12 left-1/2 z-20 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-[#07101d]/94 p-3 font-mono shadow-2xl backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <div className="text-2xl" style={{ color: selectedPlanet.color }}>{selectedPlanet.symbol}</div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[9px] uppercase tracking-widest text-white/35">Destino seleccionado</div>
                                <div className="text-sm font-bold" style={{ color: selectedPlanet.color }}>{selectedPlanet.name}</div>
                                <div className="mt-1 grid grid-cols-2 gap-2 text-[9px] text-white/55">
                                    <span>Tierra: {selectedDistance.toFixed(3)} UA</span>
                                    <span>Luz: {lightTimeMinutes(selectedDistance).toFixed(1)} min</span>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedPlanet(null); setJourneyProgress(0); }} className="text-white/35 hover:text-white" aria-label="Cerrar destino">✕</button>
                        </div>
                        {selectedInfo && (
                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-white/8 pt-3 text-[9px] sm:grid-cols-3">
                                <span className="text-white/35">Diámetro <strong className="block text-white/70">{selectedInfo.radiusKm ? `${(selectedInfo.radiusKm * 2).toLocaleString('es-ES')} km` : 'Sin dato'}</strong></span>
                                <span className="text-white/35">Gravedad <strong className="block text-white/70">{selectedInfo.gravityMs2 !== undefined ? `${selectedInfo.gravityMs2} m/s²` : 'Sin dato'}</strong></span>
                                <span className="text-white/35">Rotación <strong className="block text-white/70">{selectedInfo.rotationPeriodHours !== undefined ? `${Math.abs(selectedInfo.rotationPeriodHours).toLocaleString('es-ES')} h${selectedInfo.rotationPeriodHours < 0 ? ' retrógrada' : ''}` : 'Sin dato'}</strong></span>
                                <span className="text-white/35">Año orbital <strong className="block text-white/70">{selectedInfo.orbitalPeriodDays !== undefined ? `${selectedInfo.orbitalPeriodDays.toLocaleString('es-ES')} días` : 'Sin dato'}</strong></span>
                                <span className="text-white/35">Lunas conocidas <strong className="block text-white/70">{selectedInfo.moonsCount ?? 'Sin dato'}</strong></span>
                                <span className="text-white/35">Atmósfera <strong className="block text-white/70">{selectedInfo.atmosphereMain?.join(' · ') || (selectedInfo.hasAtmosphere ? 'Sí' : 'No')}</strong></span>
                                {selectedAxis && <span className="text-white/35">Polo norte IAU <strong className="block text-white/70">AR {(selectedAxis.ra * 15).toFixed(2)}° · Dec {selectedAxis.dec.toFixed(2)}°</strong></span>}
                                {selectedAxis && <span className="text-white/35">Meridiano W <strong className="block text-white/70">{selectedAxis.spin.toFixed(2)}°</strong></span>}
                            </div>
                        )}
                        {(selectedPlanet.name === 'Júpiter' || selectedPlanet.name === 'Tierra') && journeyProgress >= 0.98 && (
                            <>
                                <div className="mt-3 flex rounded-lg border border-white/10 p-0.5">
                                    <button onClick={() => setFocusDetailMode('planet')} className={cn('flex-1 rounded py-1.5 text-[8px] font-bold uppercase tracking-wider', focusDetailMode === 'planet' ? 'bg-blue-500/20 text-blue-200' : 'text-white/35')}>Planeta</button>
                                    <button onClick={() => setFocusDetailMode('moons')} className={cn('flex-1 rounded py-1.5 text-[8px] font-bold uppercase tracking-wider', focusDetailMode === 'moons' ? 'bg-blue-500/20 text-blue-200' : 'text-white/35')}>Sistema de lunas</button>
                                </div>
                                {focusDetailMode === 'moons' && (
                                    <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[8px] text-white/45">
                                        {selectedPlanet.name === 'Júpiter' && galileanMoons.map((moon) => (
                                            <span key={moon.id} className={cn(moon.phenomenon === 'transit' && 'text-blue-300', moon.phenomenon === 'occulted' && 'text-amber-300/70')}>
                                                {moon.name}: {moon.phenomenon === 'transit' ? 'en tránsito' : moon.phenomenon === 'occulted' ? 'oculta' : `${Math.abs(moon.xJupiterRadii).toFixed(1)} Rj`}
                                            </span>
                                        ))}
                                        {galileanMoons.some((moon) => moon.shadow) && (
                                            <span className="text-slate-300">● sombra central visible</span>
                                        )}
                                        {selectedPlanet.name === 'Tierra' && earthMoon && (
                                            <>
                                                <span>Distancia: {earthMoon.distanceEarthRadii.toFixed(1)} R⊕</span>
                                                <span>Fase: {(earthMoon.illuminatedFraction * 100).toFixed(1)}% iluminada</span>
                                                <span>Ángulo: {earthMoon.phaseAngleDeg.toFixed(1)}°</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        {journeyProgress < 0.98 ? (
                            <button onClick={startVisualJourney} className="mt-3 w-full rounded-lg border border-blue-400/25 bg-blue-500/10 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-300 hover:bg-blue-500/20">
                                Abrir vista enfocada
                            </button>
                        ) : (
                            <button onClick={returnToSystem} className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/60 hover:bg-white/10">
                                Volver al sistema completo
                            </button>
                        )}
                        <p className="mt-1.5 text-center text-[8px] text-white/30">Movimiento de cámara sobre el mapa 2D. {focusDetailMode === 'moons' ? (selectedPlanet.name === 'Tierra' ? 'Posición y separación calculadas; discos ampliados para ser visibles.' : 'Posiciones y separaciones calculadas; discos ampliados. Sombra geométrica sin penumbra.') : `Disco ampliado; ${selectedPlanet.name === 'Tierra' ? 'representación procedural' : 'textura visual'} no orientada. Polo y W calculados con elementos IAU 2015.`}</p>
                    </div>
                )}

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
                    Escala {scaleMode === 'physical' ? 'física lineal' : 'educativa logarítmica'} · Plano eclíptico · Órbitas reales
                </div>
            </div>
        </div>
    );
}
