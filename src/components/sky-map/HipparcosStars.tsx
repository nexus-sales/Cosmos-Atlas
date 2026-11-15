'use client';

/**
 * HipparcosStars.tsx
 * Renderiza el catálogo Hipparcos completo (~15.000 estrellas hasta mag 7).
 *
 * Arquitectura:
 * - Carga /hipparcos.bin de forma asíncrona al montar el componente
 * - Usa el mismo shader que Stars.tsx (twinkle, airmass, color espectral)
 * - Cada fuente conserva su identificador HIP y es seleccionable.
 * - Las estrellas con nombre propio siguen en Stars.tsx y no se duplican aquí.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { starDayDimming } from '@/lib/astronomy/skyBrightness';
import { sunHorRef } from '@/lib/skyRefs';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { loadHipparcos, bvToHex, type HipStar } from '@/lib/astronomy/hipparcos';
import { useAppStore } from '@/stores/useAppStore';
import { useCatalog } from '@/stores/useCatalogStore';
import { findNamedStarNear } from '@/lib/astronomy/starIdentification';

const RADIUS = 98; // igual que Stars.tsx

// ── Shaders (idénticos a Stars.tsx para consistencia visual) ────────────────
const vertexShader = `
  attribute float size;
  attribute vec3 color;
  attribute float distanceFactor;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  uniform float uTime;

  void main() {
    vColor = color;
    vSize = size;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    float altitude = worldPosition.y / length(worldPosition.xyz);
    float airmass = 1.0 / max(0.08, altitude);

    float depthFactor = 1.0 - distanceFactor * 0.2;

    // Centelleo sutil — las estrellas débiles centellean menos
    float twinkleSpeed = 1.8 + airmass * 0.25;
    float twinkleAmp = 0.12 + airmass * 0.08;
    float noise = sin(uTime * twinkleSpeed + position.x * 47.0) * 0.6
                + sin(uTime * twinkleSpeed * 0.71 + position.y * 53.0) * 0.4;
    // Extinción atmosférica: igual que Stars.tsx para consistencia visual
    float extinction = exp(-0.28 * max(0.0, airmass - 1.0));
    vOpacity = depthFactor * ((1.0 - twinkleAmp) + twinkleAmp * noise) * extinction;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 1.4 * (vOpacity * 0.3 + 0.7) * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSize;
  uniform bool uNightMode;
  uniform float uDayDim;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    vec3 baseColor = vColor;
    if (uNightMode) {
        float lum = dot(vColor, vec3(0.299, 0.587, 0.114));
        baseColor = vec3(lum * 1.8, 0.0, 0.0);
    }

    float core = exp(-r * 9.0) * 1.8;
    float halo = exp(-r * 18.0) * 0.3;
    float finalAlpha = (core + halo) * vOpacity * uDayDim;
    vec3 finalColor = mix(baseColor, vec3(1.0), core * 0.4);

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
  }
`;

/** Convierte la lista de HipStar en BufferGeometry + ShaderMaterial */
function buildGeometry(stars: HipStar[]): [THREE.BufferGeometry, THREE.ShaderMaterial] {
    const n = stars.length;
    const pos     = new Float32Array(n * 3);
    const col     = new Float32Array(n * 3);
    const sz      = new Float32Array(n);
    const distFac = new Float32Array(n);

    const tmpColor = new THREE.Color();
    const refMag   = -1.5;

    for (let i = 0; i < n; i++) {
        const star = stars[i];
        const p = equatorialTo3D(star.ra, star.dec, RADIUS);
        pos[i * 3]     = p[0];
        pos[i * 3 + 1] = p[1];
        pos[i * 3 + 2] = p[2];

        tmpColor.set(bvToHex(star.bv));
        col[i * 3]     = tmpColor.r;
        col[i * 3 + 1] = tmpColor.g;
        col[i * 3 + 2] = tmpColor.b;

        const brightness = Math.pow(2.512, refMag - star.mag);
        const normB      = Math.min(1.0, brightness);
        sz[i]            = 0.5 + Math.pow(normB, 0.45) * 5.5;
        distFac[i]       = Math.min(1.0, Math.max(0.0, (star.mag + 1.5) / 8.5));
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position',     new THREE.BufferAttribute(pos,     3));
    geom.setAttribute('color',        new THREE.BufferAttribute(col,     3));
    geom.setAttribute('size',         new THREE.BufferAttribute(sz,      1));
    geom.setAttribute('distanceFactor', new THREE.BufferAttribute(distFac, 1));

    const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime:      { value: 0 },
            uNightMode: { value: false },
            uDayDim:    { value: 1 },
        },
        transparent: true,
        depthWrite:  false,
    });

    return [geom, mat];
}

export default function HipparcosStars() {
    const bortleScale     = useAppStore(s => s.settings.bortleScale);
    const nightMode       = useAppStore(s => s.settings.nightMode);
    const deviceQuality   = useAppStore(s => s.deviceQuality);
    const camFov          = useAppStore(s => s.camFov);
    const setSelectedObject = useAppStore(s => s.setSelectedObject);
    const catalogStars = useCatalog(s => s.stars);
    const { raycaster } = useThree();

    const [allStars, setAllStars] = useState<HipStar[]>([]);
    const pointsRef = useRef<THREE.Points>(null);

    // Cargar catálogo una sola vez
    useEffect(() => {
        loadHipparcos().then(setAllStars);
    }, []);

    // Magnitud límite por Bortle + penalización en dispositivos de gama baja
    const qualityOffset = deviceQuality === 'low' ? -2.0 : deviceQuality === 'medium' ? -1.0 : 0;
    const limitingMag = 5.5 - (bortleScale - 1) * 0.45 + qualityOffset;

    // Filtrar por limitingMag y reconstruir geometría
    const [geometry, material, visibleStars] = useMemo(() => {
        if (allStars.length === 0) return [null, null, [] as HipStar[]];
        const filtered = allStars.filter(s => s.mag <= limitingMag);
        const [nextGeometry, nextMaterial] = buildGeometry(filtered);
        return [nextGeometry, nextMaterial, filtered] as const;
    }, [allStars, limitingMag]);

    useFrame((state) => {
        if (!material) return;
        const mat = material as THREE.ShaderMaterial;
        // eslint-disable-next-line react-hooks/immutability
        mat.uniforms.uTime.value      = state.clock.elapsedTime;
        mat.uniforms.uNightMode.value = nightMode;
        mat.uniforms.uDayDim.value    = starDayDimming(sunHorRef.alt, 0.15);
        // eslint-disable-next-line react-hooks/immutability -- R3F expone este parámetro mutable para configurar el raycast de Points.
        raycaster.params.Points = {
            threshold: THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(camFov, 80, 10, 3.2, 0.55), 0.55, 3.2),
        };
    });

    const selectHipStar = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (event.index === undefined) return;
        const star = visibleStars[event.index];
        if (!star) return;
        const namedStar = findNamedStarNear(star, catalogStars);
        if (namedStar) {
            setSelectedObject(namedStar);
            return;
        }
        setSelectedObject({
            name: `HIP ${star.hip}`,
            ra: star.ra,
            dec: star.dec,
            mag: star.mag,
            constellation: 'Catálogo Hipparcos',
            desc: `Estrella del catálogo Hipparcos. Índice de color B−V ${star.bv.toFixed(2)}.`,
            color: bvToHex(star.bv),
            baseSize: 1,
            kind: 'star',
        });
    };

    if (!geometry || !material) return null;

    return (
        <points
            ref={pointsRef}
            geometry={geometry}
            material={material}
            renderOrder={0}  // renderizar antes que las estrellas nombradas (renderOrder=1)
            onClick={selectHipStar}
        />
    );
}
