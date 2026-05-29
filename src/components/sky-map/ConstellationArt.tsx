'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import { CONSTELLATION_ART, type ConstellationFigure, type ArtPath } from '@/data/constellationArt';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

const RADIUS = 93; // ligeramente dentro de las estrellas para no taparlas

// ── Triangulación de polígonos esféricos ────────────────────────────────────
// Los puntos del fill se proyectan al plano tangente del centroide,
// se triangula en 2D con THREE.ShapeUtils y los vértices se usan tal cual
// (la aproximación planar es exacta para las pequeñas extensiones de las constelaciones).

function triangulatePolygon(fill: ArtPath): { vertices: Float32Array; indices: number[] } | null {
    if (fill.length < 3) return null;

    const pts3D = fill.map(([ra, dec]) => new THREE.Vector3(...equatorialTo3D(ra, dec, RADIUS)));

    // Centroide en la esfera
    const centroid = new THREE.Vector3();
    pts3D.forEach(p => centroid.add(p));
    centroid.normalize().multiplyScalar(RADIUS);

    // Sistema de ejes locales tangentes al centroide
    const normal = centroid.clone().normalize();
    const up = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const axisU = new THREE.Vector3().crossVectors(up, normal).normalize();
    const axisV = new THREE.Vector3().crossVectors(normal, axisU).normalize();

    // Proyección 2D
    const pts2D = pts3D.map(p => ({ x: p.dot(axisU), y: p.dot(axisV) }));

    let indices: number[];
    try {
        indices = THREE.ShapeUtils.triangulateShape(pts2D, []).flat();
    } catch {
        return null;
    }
    if (indices.length === 0) return null;

    const vertices = new Float32Array(pts3D.length * 3);
    pts3D.forEach((p, i) => { vertices[i * 3] = p.x; vertices[i * 3 + 1] = p.y; vertices[i * 3 + 2] = p.z; });

    return { vertices, indices };
}

function buildFillGeometry(fills: ArtPath[]): THREE.BufferGeometry | null {
    const allVerts: number[] = [];
    const allIdx:   number[] = [];

    for (const fill of fills) {
        const result = triangulatePolygon(fill);
        if (!result) continue;
        const base = allVerts.length / 3;
        allVerts.push(...result.vertices);
        allIdx.push(...result.indices.map(i => base + i));
    }

    if (allVerts.length === 0) return null;

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(allVerts), 3));
    geom.setIndex(allIdx);
    geom.computeVertexNormals();
    return geom;
}

function buildPathGeometry(paths: ArtPath[]): THREE.BufferGeometry[] {
    return paths.map(path => {
        if (path.length < 2) return null;
        const pts = path.map(([ra, dec]) => new THREE.Vector3(...equatorialTo3D(ra, dec, RADIUS)));
        return new THREE.BufferGeometry().setFromPoints(pts);
    }).filter((g): g is THREE.BufferGeometry => g !== null);
}

// ── Componente por figura ────────────────────────────────────────────────────

function FigureMesh({ figure, opacity, highlighted }: {
    figure: ConstellationFigure;
    opacity: number;
    highlighted: boolean;
}) {
    const { fillGeom, lineObjects } = useMemo(() => {
        const fillColor = highlighted ? '#7b9fff' : '#4466cc';
        const lineColor = highlighted ? '#aabbff' : '#6688dd';
        const fillAlpha = opacity * (highlighted ? 0.22 : 0.10);
        const lineAlpha = opacity * (highlighted ? 0.70 : 0.38);

        const lineMat = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: lineAlpha,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const lineObjects = buildPathGeometry(figure.paths).map(
            geom => new THREE.Line(geom, lineMat)
        );

        const fillMesh = (() => {
            const geom = figure.fills?.length ? buildFillGeometry(figure.fills) : null;
            if (!geom) return null;
            const mat = new THREE.MeshBasicMaterial({
                color: fillColor,
                transparent: true,
                opacity: fillAlpha,
                side: THREE.DoubleSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const m = new THREE.Mesh(geom, mat);
            m.renderOrder = -1;
            return m;
        })();

        return { fillGeom: fillMesh, lineObjects };
    // opacity y highlighted cambian cada frame al hacer zoom — reconstruir solo cuando cambian
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [figure, opacity, highlighted]);

    return (
        <group>
            {fillGeom && <primitive object={fillGeom} />}
            {lineObjects.map((obj, i) => <primitive key={i} object={obj} />)}
        </group>
    );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ConstellationArt() {
    const showConstellationArt = useAppStore(s => s.settings.showConstellationArt);
    const focusedConstellation = useAppStore(s => s.focusedConstellation);
    const camFov = useAppStore(s => s.camFov);

    if (!showConstellationArt) return null;

    // Las figuras son visibles a partir de FOV < 65°, plena visibilidad a < 45°
    const opacity = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(camFov, 65, 45, 0, 1),
        0, 1
    );
    if (opacity < 0.01) return null;

    return (
        <group>
            {CONSTELLATION_ART.map(figure => (
                <FigureMesh
                    key={figure.name}
                    figure={figure}
                    opacity={opacity}
                    highlighted={figure.name === focusedConstellation}
                />
            ))}
        </group>
    );
}
