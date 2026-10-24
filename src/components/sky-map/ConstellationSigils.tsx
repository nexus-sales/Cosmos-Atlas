'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CONSTELLATIONS } from '@/data/constellations';
import { CONSTELLATION_ART } from '@/data/constellationArt';
import { useCatalog } from '@/stores/useCatalogStore';
import { useAppStore } from '@/stores/useAppStore';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { getConstellationFigureProfile } from '@/data/constellationFigureProfiles';
import type { FigureMotif } from '@/data/constellationFigureProfiles';

type Point2 = { x: number; y: number };
const RADIUS = 92.6;
const DETAILED_NAMES = new Set(CONSTELLATION_ART.map((figure) => figure.name));

function cross(origin: Point2, a: Point2, b: Point2) {
    return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function convexHull(points: Point2[]): Point2[] {
    const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;
    const lower: Point2[] = [];
    for (const point of sorted) {
        while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, point) <= 0) lower.pop();
        lower.push(point);
    }
    const upper: Point2[] = [];
    for (let index = sorted.length - 1; index >= 0; index--) {
        const point = sorted[index];
        while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, point) <= 0) upper.pop();
        upper.push(point);
    }
    lower.pop();
    upper.pop();
    return [...lower, ...upper];
}

function makeRibbon(a: Point2, b: Point2): Point2[] {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const px = (-dy / length) * 0.9;
    const py = (dx / length) * 0.9;
    return [
        { x: a.x + px, y: a.y + py },
        { x: b.x + px, y: b.y + py },
        { x: b.x - px, y: b.y - py },
        { x: a.x - px, y: a.y - py },
    ];
}

function expandHull(points: Point2[]) {
    const center = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;
    return points.map((point) => {
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const length = Math.hypot(dx, dy) || 1;
        return {
            x: center.x + dx * 1.10 + (dx / length) * 0.5,
            y: center.y + dy * 1.10 + (dy / length) * 0.5,
        };
    });
}

function tangentPointToSphere(point: Point2, normal: THREE.Vector3, axisU: THREE.Vector3, axisV: THREE.Vector3) {
    return normal.clone().multiplyScalar(RADIUS)
        .addScaledVector(axisU, point.x)
        .addScaledVector(axisV, point.y)
        .normalize()
        .multiplyScalar(RADIUS);
}

function motifStrokes(motif: FigureMotif, halfWidth: number, halfHeight: number, variant: number): Array<[Point2, Point2]> {
    const w = Math.max(halfWidth * 0.62, 1.2);
    const h = Math.max(halfHeight * 0.62, 1.2);
    const tilt = (variant - 1.5) * 0.08 * w;
    const p = (x: number, y: number): Point2 => ({ x: x * w + (y / h) * tilt, y: y * h });
    switch (motif) {
        case 'human': return [[p(0, .75), p(0, -.65)], [p(-.55, .25), p(.55, .25)], [p(0, -.65), p(-.42, -1)], [p(0, -.65), p(.42, -1)]];
        case 'land-animal': return [[p(-.8, -.35), p(.65, -.35)], [p(.65, -.35), p(.9, .3)], [p(.9, .3), p(.55, .15)], [p(-.55, -.35), p(-.7, -1)], [p(.35, -.35), p(.45, -1)]];
        case 'bird': return [[p(-1, .15), p(0, -.2)], [p(0, -.2), p(1, .15)], [p(-1, .15), p(-.45, -.55)], [p(1, .15), p(.45, -.55)], [p(0, -.2), p(0, .8)]];
        case 'sea-creature': return [[p(-1, 0), p(-.55, .45)], [p(-1, 0), p(-.55, -.45)], [p(-.55, .45), p(.75, 0)], [p(-.55, -.45), p(.75, 0)], [p(0, 0), p(.25, -.65)]];
        case 'serpent': return [[p(-1, -.55), p(-.55, .45)], [p(-.55, .45), p(0, -.35)], [p(0, -.35), p(.55, .55)], [p(.55, .55), p(1, -.1)]];
        case 'instrument': return [[p(-.65, -1), p(-.65, .8)], [p(0, -1), p(0, 1)], [p(.65, -1), p(.65, .8)], [p(-.8, -.75), p(.8, -.75)]];
        case 'vessel': return [[p(-1, -.35), p(-.6, -.8)], [p(-.6, -.8), p(.65, -.8)], [p(.65, -.8), p(1, -.35)], [p(0, -.35), p(0, .9)], [p(0, .8), p(.7, .15)]];
        case 'crown': return [[p(-1, -.65), p(-.75, .65)], [p(-.75, .65), p(-.25, .05)], [p(-.25, .05), p(0, .9)], [p(0, .9), p(.35, .05)], [p(.35, .05), p(.8, .65)], [p(.8, .65), p(1, -.65)]];
        default: return [[p(0, 1), p(1, 0)], [p(1, 0), p(0, -1)], [p(0, -1), p(-1, 0)], [p(-1, 0), p(0, 1)]];
    }
}

function buildSigilGeometries(
    stars: ReturnType<typeof useCatalog.getState>['stars'],
    focusedConstellation: string | null,
) {
    const starMap = new Map(stars.map((star) => [star.name, star]));
    const fillPositions: number[] = [];
    const fillColors: number[] = [];
    const fillIndices: number[] = [];
    const outlinePositions: number[] = [];

    for (const [name, segments] of Object.entries(CONSTELLATIONS)) {
        if (DETAILED_NAMES.has(name)) continue;
        const unique = new Map<string, THREE.Vector3>();
        for (const [startName, endName] of segments) {
            for (const starName of [startName, endName]) {
                const star = starMap.get(starName);
                if (star) unique.set(starName, new THREE.Vector3(...equatorialTo3D(star.ra, star.dec, RADIUS)));
            }
        }
        const points3D = [...unique.values()];
        if (points3D.length < 2) continue;

        const normal = points3D.reduce((sum, point) => sum.add(point.clone().normalize()), new THREE.Vector3()).normalize();
        const reference = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
        const axisU = new THREE.Vector3().crossVectors(reference, normal).normalize();
        const axisV = new THREE.Vector3().crossVectors(normal, axisU).normalize();
        const projected = points3D.map((point) => ({ x: point.dot(axisU), y: point.dot(axisV) }));
        const rawHull = convexHull(projected);
        const hull = expandHull(rawHull.length === 2 ? makeRibbon(rawHull[0], rawHull[1]) : rawHull);
        if (hull.length < 3) continue;

        const spherePoints = hull.map((point) => tangentPointToSphere(point, normal, axisU, axisV));
        const baseIndex = fillPositions.length / 3;
        const profile = getConstellationFigureProfile(name);
        const color = new THREE.Color(focusedConstellation === name ? '#b9d5ff' : profile.color);
        for (const point of spherePoints) {
            fillPositions.push(point.x, point.y, point.z);
            fillColors.push(color.r, color.g, color.b);
        }
        for (let index = 1; index < spherePoints.length - 1; index++) {
            fillIndices.push(baseIndex, baseIndex + index, baseIndex + index + 1);
        }
        for (let index = 0; index < spherePoints.length; index++) {
            const next = spherePoints[(index + 1) % spherePoints.length];
            outlinePositions.push(...spherePoints[index].toArray(), ...next.toArray());
        }
        const bounds = hull.reduce((result, point) => ({
            minX: Math.min(result.minX, point.x), maxX: Math.max(result.maxX, point.x),
            minY: Math.min(result.minY, point.y), maxY: Math.max(result.maxY, point.y),
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
        const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
        for (const [start, end] of motifStrokes(profile.motif, (bounds.maxX - bounds.minX) / 2, (bounds.maxY - bounds.minY) / 2, profile.variant)) {
            const a = tangentPointToSphere({ x: start.x + center.x, y: start.y + center.y }, normal, axisU, axisV);
            const b = tangentPointToSphere({ x: end.x + center.x, y: end.y + center.y }, normal, axisU, axisV);
            outlinePositions.push(...a.toArray(), ...b.toArray());
        }
    }

    const fill = new THREE.BufferGeometry();
    fill.setAttribute('position', new THREE.Float32BufferAttribute(fillPositions, 3));
    fill.setAttribute('color', new THREE.Float32BufferAttribute(fillColors, 3));
    fill.setIndex(fillIndices);
    const outline = new THREE.BufferGeometry();
    outline.setAttribute('position', new THREE.Float32BufferAttribute(outlinePositions, 3));
    return { fill, outline };
}

export default function ConstellationSigils({ opacity }: { opacity: number }) {
    const stars = useCatalog((state) => state.stars);
    const focusedConstellation = useAppStore((state) => state.focusedConstellation);
    const nightMode = useAppStore((state) => state.settings.nightMode);
    const geometries = useMemo(
        () => buildSigilGeometries(stars, focusedConstellation),
        [focusedConstellation, stars],
    );

    useEffect(() => () => {
        geometries.fill.dispose();
        geometries.outline.dispose();
    }, [geometries]);

    if (opacity < 0.01) return null;
    return (
        <group renderOrder={-1}>
            <mesh geometry={geometries.fill}>
                <meshBasicMaterial
                    vertexColors
                    color={nightMode ? '#7a2020' : '#7ca2d8'}
                    transparent
                    opacity={opacity * 0.13}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </mesh>
            <lineSegments geometry={geometries.outline}>
                <lineBasicMaterial
                    color={nightMode ? '#6b1c1c' : '#5275a5'}
                    transparent
                    opacity={opacity * 0.42}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </lineSegments>
        </group>
    );
}
