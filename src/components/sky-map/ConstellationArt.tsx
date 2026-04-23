import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Line, useTexture } from '@react-three/drei';
import { CONSTELLATION_ART } from '@/data/constellationArt';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { useAppStore } from '@/stores/useAppStore';

type Point3 = [number, number, number];

const RADIUS = 91;

function smoothPolyline(points: Point3[], closed: boolean) {
    if (points.length < 4) return points;
    const vectors = points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal', 0.5);
    const target = Math.min(220, Math.max(40, points.length * 10));
    return curve.getPoints(target).map((v) => [v.x, v.y, v.z] as Point3);
}



export default function ConstellationArt() {
    const showConstellationArt = useAppStore((state) => state.settings.showConstellationArt);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const selectedObject = useAppStore((state) => state.selectedObject);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const kidsMode = useAppStore((state) => state.settings.kidsMode);
    const camFov = useAppStore((state) => state.camFov);



    const figures = useMemo(() => {
        return CONSTELLATION_ART.map((figure) => ({
            name: figure.name,
            polylines: figure.paths.map((path) => {
                const pts = path.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
                const closed = pts.length >= 3 &&
                    pts[0][0] === pts[pts.length - 1][0] &&
                    pts[0][1] === pts[pts.length - 1][1] &&
                    pts[0][2] === pts[pts.length - 1][2];
                return smoothPolyline(pts, closed);
            }),
            fillOutlines: (figure.fills ?? []).map((fill) => {
                const pts = fill.map(([ra, dec]) => equatorialTo3D(ra, dec, RADIUS));
                const closedPts = pts.length > 2 ? [...pts, pts[0]] : pts;
                return smoothPolyline(closedPts, true);
            }),
        }));
    }, []);

    const activeConstellation = focusedConstellation || (selectedObject && CONSTELLATION_ART.some(a => a.name === selectedObject.name) ? selectedObject.name : null);
    const autoFigure = !showConstellationArt && !!activeConstellation && camFov <= 60;
    const shouldRender = showConstellationArt || autoFigure;
    if (!shouldRender) return null;

    const autoPresence = autoFigure
        ? THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 70, 35, 0.0, 1.0), 0.0, 1.0)
        : 1.0;

    return (
        <group renderOrder={2}>
            {figures.map(({ name, polylines, fillOutlines }) => {
                const isFocused = name === activeConstellation;
                if (autoFigure && !isFocused) return null;

                const color = nightMode
                    ? (isFocused ? '#ff4422' : '#661100')
                    : (isFocused
                        ? (kidsMode ? '#44ccff' : '#d4af37')
                        : (kidsMode ? '#114466' : '#8a6510'));

                const outlineOpacity = (isFocused ? (kidsMode ? 0.35 : 0.15) : 0.04) * autoPresence;
                const lineOpacity = (isFocused ? (kidsMode ? 0.50 : 0.25) : 0.06) * autoPresence;
                const lineWidth = isFocused ? (kidsMode ? 2.0 : 0.9) : 0.6;

                if (Math.max(outlineOpacity, lineOpacity) < 0.01) return null;

                // Removed the 'Picasso' vector polylines.
                // We will rely purely on the elegant star-connecting stick figures from Constellations.tsx
                return null;
            })}
        </group>
    );
}
