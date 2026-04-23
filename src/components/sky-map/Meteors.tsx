'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '@/stores/useAppStore';

const METEOR_COUNT = 8; // Número bajo para que se sienta especial

const vertexShader = `
    attribute float instanceOpacity;
    varying float vOpacity;
    varying vec2 vUv;
    
    void main() {
        vOpacity = instanceOpacity;
        vUv = uv;
        vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    varying float vOpacity;
    varying vec2 vUv;
    uniform vec3 uColor;
    
    void main() {
        // Hacer que se desvanezca en la cola (vUv.y va de 0 a 1 a lo largo del cilindro)
        float tailFade = smoothstep(0.0, 0.3, vUv.y);
        float headFade = smoothstep(1.0, 0.8, vUv.y);
        
        // Bordes suaves
        float edgeFade = smoothstep(0.0, 0.5, 0.5 - abs(vUv.x - 0.5));
        
        float alpha = tailFade * headFade * edgeFade * vOpacity;
        gl_FragColor = vec4(uColor, alpha * 0.8);
    }
`;

export default function Meteors() {
    const nightMode = useAppStore(s => s.settings.nightMode);
    
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const meteors = useMemo(() => {
        return Array.from({ length: METEOR_COUNT }).map(() => ({
            active: false,
            startPos: new THREE.Vector3(),
            endPos: new THREE.Vector3(),
            progress: 0,
            speed: 0,
            length: 0,
            waitDelay: Math.random() * 8 + 2
        }));
    }, []);

    const uniforms = useMemo(() => ({
        uColor: { value: new THREE.Color('#ffffff') }
    }), []);

    const opacityArray = useMemo(() => new Float32Array(METEOR_COUNT), []);

    useFrame((_, delta) => {
        if (!meshRef.current) return;
        
        let needUpdate = false;
        const color = new THREE.Color(nightMode ? '#ff4444' : '#e0f2fe');
        uniforms.uColor.value.copy(color);

        for (let i = 0; i < METEOR_COUNT; i++) {
            const m = meteors[i];
            
            if (!m.active) {
                m.waitDelay -= delta;
                if (m.waitDelay <= 0) {
                    m.active = true;
                    m.progress = 0;
                    m.speed = 1.5 + Math.random() * 2.0; 
                    m.length = 15 + Math.random() * 25; 
                    
                    // Spawn above horizon
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI * 0.4; // Upper dome
                    const r = 90;
                    m.startPos.setFromSphericalCoords(r, phi, theta);
                    
                    // Direction downwards
                    const dir = new THREE.Vector3(
                        (Math.random() - 0.5) * 0.5,
                        -1 - Math.random(),
                        (Math.random() - 0.5) * 0.5
                    ).normalize();
                    
                    m.endPos.copy(m.startPos).add(dir.multiplyScalar(m.length));
                    
                    opacityArray[i] = 0;
                    needUpdate = true;
                }
            } else {
                m.progress += delta * m.speed;
                if (m.progress > 1.0) {
                    m.active = false;
                    m.waitDelay = Math.random() * 15 + 5; 
                    dummy.scale.setScalar(0);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                    opacityArray[i] = 0;
                    needUpdate = true;
                } else {
                    const currentPos = new THREE.Vector3().lerpVectors(m.startPos, m.endPos, m.progress);
                    dummy.position.copy(currentPos);
                    dummy.lookAt(m.endPos);
                    
                    dummy.scale.set(0.15, 0.15, m.length);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                    
                    // Fade in quickly, fade out slowly
                    let op = 1.0;
                    if (m.progress < 0.1) op = m.progress * 10;
                    else op = 1.0 - ((m.progress - 0.1) / 0.9);
                    
                    opacityArray[i] = op;
                    needUpdate = true;
                }
            }
        }
        
        if (needUpdate) {
            meshRef.current.instanceMatrix.needsUpdate = true;
            meshRef.current.geometry.attributes.instanceOpacity.needsUpdate = true;
        }
    });

    // Rotar geometría para que el largo (eje Y) se alinee con el eje Z (para lookAt)
    const geomRef = useRef<THREE.CylinderGeometry>(null);
    useMemo(() => {
        if (geomRef.current) {
            geomRef.current.rotateX(Math.PI / 2);
        }
    }, []);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, METEOR_COUNT]} renderOrder={80}>
            <cylinderGeometry ref={geomRef} args={[1, 1, 1, 8, 1, true]}>
                <instancedBufferAttribute attach="attributes-instanceOpacity" args={[opacityArray, 1]} />
            </cylinderGeometry>
            <shaderMaterial 
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </instancedMesh>
    );
}
