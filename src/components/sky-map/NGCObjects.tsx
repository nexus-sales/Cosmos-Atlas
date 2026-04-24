'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { loadNGC, type NGCObject } from '@/lib/astronomy/ngc';
import { useAppStore } from '@/stores/useAppStore';

const RADIUS = 94; 
const MAX_VISIBLE = 2000;

const vertexShader = `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  uniform float uFOV;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Escalar tamaño según FOV (más visibles al hacer zoom)
    float fovFactor = clamp(60.0 / uFOV, 1.0, 4.0);
    gl_PointSize = size * fovFactor * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  uniform bool uNightMode;

  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;

    vec3 baseColor = vColor;
    if (uNightMode) baseColor = vec3(1.0, 0.0, 0.0);

    // Núcleo muy suave, sin bordes duros
    float alpha = exp(-r * 8.0) * 0.4;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

export default function NGCObjects() {
    const bortleScale = useAppStore(s => s.settings.bortleScale);
    const nightMode   = useAppStore(s => s.settings.nightMode);
    const camFov      = useAppStore(s => s.camFov);
    const [objects, setObjects] = useState<NGCObject[]>([]);
    const pointsRef = useRef<THREE.Points>(null);

    useEffect(() => {
        loadNGC().then(setObjects);
    }, []);

    const [geometry, material] = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE * 3), 3));
        geom.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE * 3), 3));
        geom.setAttribute('size',     new THREE.BufferAttribute(new Float32Array(MAX_VISIBLE), 1));

        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime:      { value: 0 },
                uNightMode: { value: false },
                uFOV:       { value: 60 }
            },
            transparent: true,
            depthWrite:  false,
            blending:    THREE.AdditiveBlending
        });

        return [geom, mat];
    }, []);

    useFrame((state) => {
        if (objects.length === 0 || !pointsRef.current) return;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geometry.getAttribute('color')    as THREE.BufferAttribute;
        const sizAttr = geometry.getAttribute('size')     as THREE.BufferAttribute;

        // Filtro de magnitud basado en zoom y Bortle
        const limitingMag = (60 / camFov) * 2.5 + (10.0 - bortleScale);
        
        let count = 0;
        for (let i = 0; i < objects.length && count < MAX_VISIBLE; i++) {
            const obj = objects[i];
            if (obj.mag > limitingMag) continue;

            const p = equatorialTo3D(obj.ra, obj.dec, RADIUS);
            posAttr.setXYZ(count, p[0], p[1], p[2]);
            
            // Color según tipo (Galaxia=Azul, Nebulosa=Rojo, Cúmulo=Amarillo)
            if (obj.type === 1) colAttr.setXYZ(count, 0.6, 0.8, 1.0);
            else if (obj.type === 2) colAttr.setXYZ(count, 1.0, 0.5, 0.5);
            else colAttr.setXYZ(count, 1.0, 1.0, 0.7);

            // Cap strictly to prevent massive orbs for huge objects like M44
            sizAttr.setX(count, Math.min(3.5, Math.max(0.8, obj.size / 20.0)));
            count++;
        }

        geometry.setDrawRange(0, count);
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        sizAttr.needsUpdate = true;

        // eslint-disable-next-line react-hooks/immutability
        material.uniforms.uTime.value      = state.clock.elapsedTime;
        material.uniforms.uNightMode.value = nightMode;
        material.uniforms.uFOV.value       = camFov;
    });

    return <points ref={pointsRef} geometry={geometry} material={material} />;
}
