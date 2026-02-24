'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import * as satellite from 'satellite.js';
import { useAppStore } from '@/stores/useAppStore';

interface SatelliteData {
    name: string;
    tle1: string;
    tle2: string;
    color: string;
    size: number;
}

const SATELLITES_TLE: SatelliteData[] = [
    {
        name: 'ISS (Zarya)',
        tle1: '1 25544U 98067A   26054.56458333  .00015000  00000-0  25000-3 0  9999',
        tle2: '2 25544  51.6400 123.4500 0005000 270.0000 180.0000 15.5000000000001',
        color: '#ffffff',
        size: 3.5
    },
    {
        name: 'Hubble Space Telescope',
        tle1: '1 20580U 90037B   26054.50000000  .00001000  00000-0  10000-3 0  9999',
        tle2: '2 20580  28.4700 250.1200 0003000 150.0000 210.0000 15.1000000000001',
        color: '#aaddff',
        size: 2.0
    }
];

// Reemplazar con datos reales de CelesTrak periódicamente
const CELESTRAK_URLS = {
    stations: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=last-30-days&FORMAT=tle',
    starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle'
};

const RADIUS = 95;
const MAX_SATS = 6000;

export default function Satellites() {
    const pointsRef = useRef<THREE.Points>(null);
    const time = useAppStore((state) => state.time);
    const observer = useAppStore((state) => state.observer);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const showSatellites = useAppStore((state) => state.settings.showSatellites);
    const showStarlink = useAppStore((state) => state.settings.showStarlink);

    const [specialSats, setSpecialSats] = useState<{ name: string, satrec: satellite.SatRec, color: string, size: number }[]>([]);
    const [starlinkSats, setStarlinkSats] = useState<{ name: string, satrec: satellite.SatRec, color: string, size: number }[]>([]);

    // ── 1. Carga de TLEs ────────────────────────────────────────────────────
    useEffect(() => {
        // ISS y Hubble
        const initial = SATELLITES_TLE.map(s => ({
            name: s.name,
            satrec: satellite.twoline2satrec(s.tle1, s.tle2),
            color: s.color,
            size: s.size
        }));
        setSpecialSats(initial);

        // Fetch ISS Real
        fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle')
            .then(r => r.text())
            .then(t => {
                const lines = t.split('\n').filter(l => l.trim().length > 0);
                if (lines.length >= 3) {
                    setSpecialSats(prev => [
                        { name: lines[0].trim(), satrec: satellite.twoline2satrec(lines[1], lines[2]), color: '#ffffff', size: 4.0 },
                        ...prev.filter(s => !s.name.includes('ISS'))
                    ]);
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!showStarlink) {
            setStarlinkSats([]);
            return;
        }

        // Fetch Starlink
        fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle')
            .then(r => r.text())
            .then(text => {
                const lines = text.split('\n').filter(l => l.trim().length > 0);
                const records = [];
                for (let i = 0; i < lines.length; i += 3) {
                    if (lines[i + 1] && lines[i + 2]) {
                        records.push({
                            name: lines[i].trim(),
                            satrec: satellite.twoline2satrec(lines[i + 1], lines[i + 2]),
                            color: '#88aaff',
                            size: 1.2
                        });
                    }
                }
                // Limitar a los primeros 2000 para no destruir CPUs modestas
                setStarlinkSats(records.slice(0, 2000));
            })
            .catch(() => { });
    }, [showStarlink]);

    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SATS * 3), 3));
        geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SATS * 3), 3));
        geom.setAttribute('size', new THREE.BufferAttribute(new Float32Array(MAX_SATS), 1));

        const mat = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: false,
            blending: THREE.AdditiveBlending
        });

        return [geom, mat];
    }, []);

    // ── 2. Loop de Propagación y Culling ────────────────────────────────────
    useFrame(() => {
        if (!pointsRef.current || !showSatellites) {
            if (pointsRef.current) pointsRef.current.visible = false;
            return;
        }
        pointsRef.current.visible = true;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

        let count = 0;
        const gmst = satellite.gstime(time);
        const observerGd = {
            longitude: satellite.degreesToRadians(observer.lon),
            latitude: satellite.degreesToRadians(observer.lat),
            height: 0
        };

        const allSats = [...specialSats, ...starlinkSats];

        allSats.forEach((sat) => {
            if (count >= MAX_SATS) return;

            const pv = satellite.propagate(sat.satrec, time);
            if (!pv || !pv.position) return;

            const posEci = pv.position as satellite.EciVec3<number>;
            const posEcf = satellite.eciToEcf(posEci, gmst);
            const look = satellite.ecfToLookAngles(observerGd, posEcf);

            // Solo si está por encima del horizonte
            if (look.elevation > 0) {
                // Convertir Alt/Az a coordenadas 3D en el espacio horizontal local.
                // Sistema de la escena (sin CelestialGroup):
                //   +Y = cénit, +X = Este, -Z = Norte (frente del observador)
                // Acimut: 0=Norte, 90=Este, 180=Sur, 270=Oeste (en radianes)
                const el = look.elevation; // radianes
                const az = look.azimuth;   // radianes, 0=N, π/2=E
                const cosEl = Math.cos(el);
                // X = Este, Y = Cénit, Z = Norte (negativo porque -Z es Norte en R3F)
                const x3 = cosEl * Math.sin(az) * RADIUS; // Este
                const y3 = Math.sin(el) * RADIUS; // Cénit
                const z3 = -cosEl * Math.cos(az) * RADIUS; // Norte → -Z
                posAttr.setXYZ(count, x3, y3, z3);

                const color = new THREE.Color(nightMode ? '#ff0000' : sat.color);
                colAttr.setXYZ(count, color.r, color.g, color.b);
                sizAttr.setX(count, sat.size);
                count++;
            }
        });

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}
