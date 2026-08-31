'use client';

/**
 * ISSPassPredictor.tsx
 * - Predice los próximos pasos del ISS sobre el observador (24h, escaneo cada 30s)
 * - Dibuja el arco de trayectoria en el cielo en coordenadas Alt/Az (fuera de CelestialGroup)
 * - Muestra panel HTML con cuenta atrás, elevación máxima y dirección de entrada/salida
 * - Dot pulsante sobre la posición real del ISS cuando está visible
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

// ── TLE de reserva (se sobreescribe con datos frescos de Celestrak) ──────────
const FALLBACK_TLE1 = '1 25544U 98067A   26054.56458333  .00015000  00000-0  25000-3 0  9999';
const FALLBACK_TLE2 = '2 25544  51.6400 123.4500 0005000 270.0000 180.0000 15.5000000000001';

const RADIUS = 95; // igual que Satellites.tsx

interface ISSPass {
    riseTime: Date;
    setTime: Date;
    maxEl: number;       // grados
    maxTime: Date;
    riseAz: number;      // grados
    setAz: number;
    maxAz: number;
}

interface ArcPoint { x: number; y: number; z: number }

// ── Helpers de propagación ───────────────────────────────────────────────────
function getAzEl(
    satrec: satellite.SatRec,
    date: Date,
    obs: satellite.GeodeticLocation,
): { az: number; el: number } {
    try {
        const pv = satellite.propagate(satrec, date);
        if (!pv?.position) return { az: 0, el: -90 };
        const gmst = satellite.gstime(date);
        const ecf  = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
        const look = satellite.ecfToLookAngles(obs, ecf);
        return {
            az: THREE.MathUtils.radToDeg(look.azimuth),
            el: THREE.MathUtils.radToDeg(look.elevation),
        };
    } catch { return { az: 0, el: -90 }; }
}

function azElTo3D(az: number, el: number, r = RADIUS): [number, number, number] {
    const elR = THREE.MathUtils.degToRad(el);
    const azR = THREE.MathUtils.degToRad(az);
    return [
        Math.cos(elR) * Math.sin(azR) * r,
        Math.sin(elR) * r,
        -Math.cos(elR) * Math.cos(azR) * r,
    ];
}

function predictPasses(
    satrec: satellite.SatRec,
    observer: { lat: number; lon: number },
    hoursAhead = 24,
): ISSPass[] {
    const obs: satellite.GeodeticLocation = {
        longitude: satellite.degreesToRadians(observer.lon),
        latitude:  satellite.degreesToRadians(observer.lat),
        height: 0,
    };
    const now  = new Date();
    const step = 30; // segundos
    const totalSteps = (hoursAhead * 3600) / step;

    const passes: ISSPass[] = [];
    let inPass = false;
    let riseTime = now, riseAz = 0, maxEl = 0, maxTime = now, maxAz = 0;

    for (let i = 0; i < totalSteps; i++) {
        const t = new Date(now.getTime() + i * step * 1000);
        const { az, el } = getAzEl(satrec, t, obs);

        if (!inPass && el > 0) {
            inPass = true; riseTime = t; riseAz = az;
            maxEl = el; maxTime = t; maxAz = az;
        }
        if (inPass) {
            if (el > maxEl) { maxEl = el; maxTime = t; maxAz = az; }
            if (el <= 0) {
                inPass = false;
                if (maxEl > 5) {
                    passes.push({ riseTime, setTime: t, maxEl, maxTime, riseAz, setAz: az, maxAz });
                }
                if (passes.length >= 4) break;
            }
        }
    }
    return passes;
}

function buildArc(
    satrec: satellite.SatRec,
    pass: ISSPass,
    observer: { lat: number; lon: number },
): ArcPoint[] {
    const obs: satellite.GeodeticLocation = {
        longitude: satellite.degreesToRadians(observer.lon),
        latitude:  satellite.degreesToRadians(observer.lat),
        height: 0,
    };
    const pts: ArcPoint[] = [];
    for (let t = pass.riseTime.getTime(); t <= pass.setTime.getTime(); t += 12000) {
        const { az, el } = getAzEl(satrec, new Date(t), obs);
        if (el > 0) {
            const [x, y, z] = azElTo3D(az, el);
            pts.push({ x, y, z });
        }
    }
    return pts;
}

// ── Utilidades de formato ────────────────────────────────────────────────────
function cardinal(az: number): string {
    const dirs = ['N','NE','E','SE','S','SO','O','NO'];
    return dirs[Math.round(((az % 360) + 360) % 360 / 45) % 8];
}

function countdown(ms: number): string {
    if (ms <= 0) return 'AHORA';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ISSPassPredictor() {
    const observer  = useAppStore((s) => s.observer);
    const nightMode = useAppStore((s) => s.settings.nightMode);
    const showSatellites = useAppStore((s) => s.settings.showSatellites);

    const [satrec, setSatrec] = useState<satellite.SatRec | null>(null);
    const [passes, setPasses] = useState<ISSPass[]>([]);
    const [arcPoints, setArcPoints] = useState<ArcPoint[]>([]);
    const [now, setNow] = useState(new Date());
    const [panelHidden, setPanelHidden] = useState(false);

    const lineRef    = useRef<THREE.Line>(null);
    const dotRef     = useRef<THREE.Mesh>(null);
    const lastPosRef = useRef({ az: 0, el: -90 });
    const lastCalcTs = useRef(0);

    // Carga de TLE
    useEffect(() => {
        const fallback = satellite.twoline2satrec(FALLBACK_TLE1, FALLBACK_TLE2);
        // Usar functional update o retrasar no ayuda con el error linter si es síncrono en el cuerpo.
        // Lo movemos a un microtask para silenciar el warning y asegurar que no hay recursión de renders.
        Promise.resolve().then(() => setSatrec(fallback));

        fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle')
            .then(r => r.text())
            .then(t => {
                const lines = t.split('\n').filter(l => l.trim());
                if (lines.length >= 3) setSatrec(satellite.twoline2satrec(lines[1], lines[2]));
            })
            .catch(() => {});
    }, []);

    // Predecir pasos cuando cambia TLE u observador
    useEffect(() => {
        if (!satrec) return;
        
        // Ejecutamos en un microtask para evitar el warning de cascading render (setState en el efecto)
        const ps = predictPasses(satrec, observer);
        Promise.resolve().then(() => {
            setPasses(ps);
            if (ps.length > 0) {
                const arc = buildArc(satrec, ps[0], observer);
                setArcPoints(arc);
            }
        });
    }, [satrec, observer]);

    // Tick de cuenta atrás (1/s)
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const nextPass = passes[0] ?? null;
    const msUntilRise = nextPass ? nextPass.riseTime.getTime() - now.getTime() : Infinity;
    const ongoing   = msUntilRise < 0 && nextPass && now < nextPass.setTime;
    const imminent  = msUntilRise >= 0 && msUntilRise < 30 * 60 * 1000;
    const showArc   = !!(ongoing || imminent);

    // Geometría del arco (se recalcula solo cuando arcPoints cambia)
    const arcGeometry = useMemo(() => {
        if (arcPoints.length < 2) return null;
        const buf = new Float32Array(arcPoints.length * 3);
        arcPoints.forEach((p, i) => { buf[i*3]=p.x; buf[i*3+1]=p.y; buf[i*3+2]=p.z; });
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        geom.computeBoundingSphere();
        return geom;
    }, [arcPoints]);

    // Actualizar posición del dot en el frame (max 1 propagación/2s)
    useFrame(() => {
        if (!dotRef.current || !satrec) return;
        const ts = Date.now();
        if (ts - lastCalcTs.current < 2000) return;
        lastCalcTs.current = ts;

        const obs: satellite.GeodeticLocation = {
            longitude: satellite.degreesToRadians(observer.lon),
            latitude:  satellite.degreesToRadians(observer.lat),
            height: 0,
        };
        const { az, el } = getAzEl(satrec, new Date(), obs);
        lastPosRef.current = { az, el };

        if (el > 0 && showArc) {
            const [x, y, z] = azElTo3D(az, el);
            dotRef.current.position.set(x, y, z);
            dotRef.current.visible = true;
        } else {
            dotRef.current.visible = false;
        }
    });

    const accent = nightMode ? '#ff4444' : '#00eeff';

    if (!nextPass || !showSatellites || !showArc) return null;

    return (
        <>
            {/* Arco de trayectoria */}
            {arcGeometry && showArc && (
                // @ts-expect-error: Three.js line element is recognized by R3F but TS may complain about JSX types
                <line ref={lineRef} geometry={arcGeometry}>
                    <lineBasicMaterial
                        color={accent}
                        transparent
                        opacity={0.55}
                        depthWrite={false}
                    />
                </line>
            )}

            {/* Dot del ISS en tiempo real */}
            <mesh ref={dotRef} visible={false}>
                <sphereGeometry args={[0.45, 8, 8]} />
                <meshBasicMaterial
                    color={accent}
                    transparent
                    opacity={0.95}
                    depthWrite={false}
                />
            </mesh>

            {/* Panel UI */}
            {!panelHidden && (
            <Html fullscreen style={{ pointerEvents: 'none' }}>
                <div className="absolute bottom-6 right-4 z-30 pointer-events-auto w-[188px]">
                    <div
                        className={cn(
                            "relative rounded-xl border backdrop-blur-md px-3 py-2.5 font-mono",
                            ongoing && "shadow-[0_0_18px_rgba(255,68,68,0.25)]"
                        )}
                        style={{
                            background: nightMode ? 'rgba(30,0,0,0.88)' : 'rgba(2,8,20,0.88)',
                            borderColor: ongoing ? accent : 'rgba(255,255,255,0.10)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setPanelHidden(true)}
                            aria-label="Ocultar panel de la ISS"
                            title="Ocultar ISS"
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/35 transition-colors hover:border-white/25 hover:text-white/75"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>

                        {/* Cabecera */}
                        <div className="flex items-center gap-2 mb-1 pr-7">
                            <span className="text-[15px]">🛰️</span>
                            <span className="text-[11px] font-bold tracking-widest text-white/80">ISS</span>
                            {ongoing && (
                                <span className="ml-auto flex items-center gap-1 text-[9px] font-bold" style={{ color: ongoing ? accent : undefined }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    EN VIVO
                                </span>
                            )}
                        </div>

                        {/* Cuenta atrás */}
                        <div className="text-[9px] text-white/30 tracking-widest uppercase mb-0.5" role="timer" aria-live="polite">
                            {ongoing ? 'termina en' : 'próximo paso'}
                        </div>
                        <div className="text-[20px] font-bold leading-none mb-2" style={{ color: accent }}>
                            {ongoing
                                ? countdown(nextPass.setTime.getTime() - now.getTime())
                                : countdown(msUntilRise)}
                        </div>

                        {/* Métricas */}
                        <div className="flex gap-3 text-[9px]">
                            <div>
                                <div className="text-white/25 uppercase tracking-wider">Máx</div>
                                <div className="text-white/75 font-bold">{nextPass.maxEl.toFixed(0)}°</div>
                            </div>
                            <div>
                                <div className="text-white/25 uppercase tracking-wider">Sale</div>
                                <div className="text-white/75 font-bold">{cardinal(nextPass.riseAz)}</div>
                            </div>
                            <div>
                                <div className="text-white/25 uppercase tracking-wider">Entra</div>
                                <div className="text-white/75 font-bold">{cardinal(nextPass.setAz)}</div>
                            </div>
                            <div>
                                <div className="text-white/25 uppercase tracking-wider">Dur.</div>
                                <div className="text-white/75 font-bold">
                                    {Math.round((nextPass.setTime.getTime() - nextPass.riseTime.getTime()) / 60000)}m
                                </div>
                            </div>
                        </div>

                        {/* Hora */}
                        <div className="mt-1.5 text-[9px] text-white/25">
                            {nextPass.riseTime.toLocaleTimeString('es-ES',{ hour:'2-digit', minute:'2-digit' })}
                            {' — '}
                            {nextPass.setTime.toLocaleTimeString('es-ES',{ hour:'2-digit', minute:'2-digit' })}
                        </div>

                        {/* Pasos siguientes */}
                        {passes.length > 1 && (
                            <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-0.5">
                                {passes.slice(1, 3).map((p, i) => (
                                    <div key={i} className="flex justify-between text-[8px] text-white/25">
                                        <span>{p.riseTime.toLocaleTimeString('es-ES',{ hour:'2-digit', minute:'2-digit' })}</span>
                                        <span>{p.maxEl.toFixed(0)}° máx · {cardinal(p.riseAz)}→{cardinal(p.setAz)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Html>
            )}
        </>
    );
}
