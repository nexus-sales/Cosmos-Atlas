'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

interface CameraNavigatorProps {
    controlsRef: React.MutableRefObject<any>;
    trackingRef: React.MutableRefObject<boolean>;
    manualFovRef: React.MutableRefObject<number | null>;
    manualFovHoldRef: React.MutableRefObject<number>;
}

export default function CameraNavigator({
    controlsRef,
    trackingRef,
    manualFovRef,
    manualFovHoldRef,
}: CameraNavigatorProps) {
    const { camera } = useThree();
    const targetedObject = useAppStore((s) => s.targetedObject);
    const followTarget = useAppStore((s) => s.settings.followTarget);
    const setCamFov = useAppStore((state) => state.setCamFov);

    const isFlying = useRef(false);
    const prevTarget = useRef<any>(null);
    const targetFov = useRef(60);
    const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

    useFrame((_, delta) => {
        if (!followTarget) {
            trackingRef.current = false;
            isFlying.current = false;
            return;
        }

        if (targetedObject && targetedObject !== prevTarget.current) {
            isFlying.current = true;
            trackingRef.current = true;
            const { time, observer } = useAppStore.getState();
            const lst = getLST(time, observer.lon);
            const euler = new THREE.Euler(
                THREE.MathUtils.degToRad(90 - observer.lat),
                THREE.MathUtils.degToRad(-lst),
                0,
                'XYZ',
            );
            const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
            const [ex, ey, ez] = equatorialTo3D(targetedObject.ra, targetedObject.dec, 1);
            const targetWorldDir = new THREE.Vector3(ex, ey, ez).applyMatrix4(rotMatrix).normalize();
            targetCamPosRef.current = targetWorldDir.clone().negate().multiplyScalar(0.01);
            
            const isPlanet = 'kind' in targetedObject && targetedObject.kind === 'planet';
            const isDSO = 'type' in (targetedObject as any);
            targetFov.current = (isPlanet || isDSO) ? 22 : 60;
            prevTarget.current = targetedObject;
        }

        if (!trackingRef.current) {
            isFlying.current = false;
            prevTarget.current = targetedObject;
            return;
        }

        if (!targetedObject || !targetCamPosRef.current) return;

        const targetCamPos = targetCamPosRef.current;
        const currentPos = camera.position.clone();
        const dot = currentPos.normalize().dot(targetCamPos.clone().normalize());

        // FOV Transition
        const cam = camera as THREE.PerspectiveCamera;
        let desiredFov = targetFov.current;
        if (manualFovRef.current !== null) {
            desiredFov = manualFovRef.current;
            manualFovHoldRef.current = Math.max(0, manualFovHoldRef.current - delta);
            if (manualFovHoldRef.current === 0) manualFovRef.current = null;
        }

        if (Math.abs(cam.fov - desiredFov) > 0.1) {
            cam.fov = THREE.MathUtils.lerp(cam.fov, desiredFov, 0.05);
            cam.updateProjectionMatrix();
            setCamFov(cam.fov);
        }

        // Flight & Tracking logic
        const speed = isFlying.current 
            ? THREE.MathUtils.clamp(0.06 + (1 - dot) * 0.08, 0.05, 0.15)
            : 1.0; 

        const newPos = camera.position.clone().lerp(targetCamPos, speed).normalize().multiplyScalar(0.01);
        camera.position.copy(newPos);
        camera.lookAt(0, 0, 0);

        if (dot > 0.9999) isFlying.current = false;

        // CRITICAL FIX: Sincronizar OrbitControls MIENTRAS volamos o trackeamos
        if (controlsRef?.current) {
            controlsRef.current.update();
        }
    });

    return null;
}
