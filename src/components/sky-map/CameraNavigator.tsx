'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import { getLST } from '@/lib/astronomy/time';
import { equatorialTo3D, equToHor } from '@/lib/astronomy/transforms';
import type { Star, DSO, Planet } from '@/types/celestial';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraNavigatorProps {
    controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
    trackingRef: React.MutableRefObject<boolean>;
    manualFovRef: React.MutableRefObject<number | null>;
}

export default function CameraNavigator({
    controlsRef,
    trackingRef,
    manualFovRef,
}: CameraNavigatorProps) {
    const { camera } = useThree();
    const targetedObject = useAppStore((s) => s.targetedObject);
    const followTarget = useAppStore((s) => s.settings.followTarget);
    const setCamFov = useAppStore((state) => state.setCamFov);
    const setIsFlying = useAppStore((state) => state.setIsFlying);
    const setWarpFactor = useAppStore((state) => state.setWarpFactor);
    const setSubHorizonAlert = useAppStore((state) => state.setSubHorizonAlert);

    const isFlying = useRef(false);
    const prevTarget = useRef<Star | DSO | Planet | null>(null);
    const targetFov = useRef(60);
    const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

    // Bézier arc state
    const bezierP0 = useRef(new THREE.Vector3()); // start direction (unit)
    const bezierP1 = useRef(new THREE.Vector3()); // end direction (unit)
    const bezierPc = useRef(new THREE.Vector3()); // control point (lifted midpoint)
    const bezierT  = useRef(0);                   // progress [0, 1]
    const bezierDur = useRef(3.5);                // flight duration in seconds

    /** Quadratic Bézier between unit vectors using slerp pairs */
    function bezierSlerp(t: number): THREE.Vector3 {
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out
        const q0 = new THREE.Vector3().copy(bezierP0.current).lerp(bezierPc.current, eased).normalize();
        const q1 = new THREE.Vector3().copy(bezierPc.current).lerp(bezierP1.current, eased).normalize();
        return q0.lerp(q1, eased).normalize();
    }

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

            // Comprobar si el objeto está bajo el horizonte y avisar al usuario
            const altData = equToHor(targetedObject.ra, targetedObject.dec, observer.lat, observer.lon, time);
            if (altData.alt < -3) {
                const altStr = altData.alt.toFixed(0);
                setSubHorizonAlert(`${targetedObject.name} está bajo el horizonte (${altStr}°)`);
                // Auto-limpiar el aviso tras 6 segundos
                setTimeout(() => setSubHorizonAlert(null), 6000);
            } else {
                setSubHorizonAlert(null);
            }
            const lst = getLST(time, observer.lon);
            const euler = new THREE.Euler(
                THREE.MathUtils.degToRad(observer.lat - 90),
                THREE.MathUtils.degToRad(-lst),
                0,
                'XYZ',
            );
            const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
            const [ex, ey, ez] = equatorialTo3D(targetedObject.ra, targetedObject.dec, 1);
            const targetWorldDir = new THREE.Vector3(ex, ey, ez).applyMatrix4(rotMatrix).normalize();
            targetCamPosRef.current = targetWorldDir.clone().negate().multiplyScalar(0.01);

            // Setup Bézier arc
            bezierP0.current.copy(camera.position).normalize();
            bezierP1.current.copy(targetWorldDir).negate();
            // Control point: midpoint lifted toward zenith (+Y)
            const mid = bezierP0.current.clone().add(bezierP1.current).normalize();
            const lift = new THREE.Vector3(0, 1, 0).multiplyScalar(0.4);
            bezierPc.current.copy(mid).add(lift).normalize();
            bezierT.current = 0;
            // Shorter flight if already close
            const dot = bezierP0.current.dot(bezierP1.current.clone().negate());
            bezierDur.current = THREE.MathUtils.clamp(2.0 + Math.acos(Math.max(-1, Math.min(1, dot))) * 0.8, 1.5, 4.0);

            const isPlanet = 'kind' in targetedObject && targetedObject.kind === 'planet';
            const isDSO = 'type' in targetedObject;
            const isConstel = 'symbol' in targetedObject && targetedObject.symbol === '\u2726';

            if (isConstel) {
                targetFov.current = ('angularSize' in targetedObject && typeof targetedObject.angularSize === 'number')
                    ? targetedObject.angularSize
                    : 45;
            } else if (isPlanet || isDSO) {
                targetFov.current = 22;
            } else {
                targetFov.current = 36;
            }

            // Nuevo objetivo -> el zoom manual del vuelo anterior ya no aplica,
            // empezamos con el encuadre por defecto de este objeto.
            manualFovRef.current = null;

            prevTarget.current = targetedObject;
        }

        if (!trackingRef.current) {
            isFlying.current = false;
            prevTarget.current = targetedObject;
            return;
        }

        if (!targetedObject || !targetCamPosRef.current) return;

        // FOV Transition — el zoom manual del usuario (manualFovRef) se
        // mantiene indefinidamente mientras siga en el mismo objetivo; solo
        // se descarta al fijar un objetivo nuevo (arriba) o al abandonar el
        // seguimiento (trackingRef pasa a false). Antes expiraba solo con
        // un temporizador de 1s, lo que hacia que la camara "saltara" de
        // vuelta al encuadre original en cualquier pausa natural entre
        // gestos de zoom.
        const cam = camera as THREE.PerspectiveCamera;
        const desiredFov = manualFovRef.current ?? targetFov.current;

        // Bézier arc flight or tracking snap
        if (isFlying.current) {
            bezierT.current = Math.min(1, bezierT.current + delta / bezierDur.current);
            const arcDir = bezierSlerp(bezierT.current);
            camera.position.copy(arcDir).multiplyScalar(0.01);

            // Warp Effect: Aumentar FOV drásticamente en el centro del viaje
            const wf = Math.sin(bezierT.current * Math.PI);
            setWarpFactor(wf);
            setIsFlying(true);
            
            const warpFovBoost = wf * 45;
            // eslint-disable-next-line react-hooks/immutability
            cam.fov = THREE.MathUtils.lerp(cam.fov, desiredFov + warpFovBoost, 0.15);
            cam.updateProjectionMatrix();
            setCamFov(cam.fov);

            if (bezierT.current >= 1) {
                isFlying.current = false;
                setIsFlying(false);
                setWarpFactor(0);
            }
        } else {
            // Normal FOV lerp
            if (Math.abs(cam.fov - desiredFov) > 0.1) {
                cam.fov = THREE.MathUtils.lerp(cam.fov, desiredFov, 0.05);
                cam.updateProjectionMatrix();
                setCamFov(cam.fov);
            }

            // Settled tracking: snap tightly to keep up with sky rotation
            camera.position.copy(targetCamPosRef.current);
            // Refresh target pos to follow sky rotation
            const { time, observer } = useAppStore.getState();
            const lst = getLST(time, observer.lon);
            const euler = new THREE.Euler(
                THREE.MathUtils.degToRad(observer.lat - 90),
                THREE.MathUtils.degToRad(-lst), 0, 'XYZ',
            );
            const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
            const [ex, ey, ez] = equatorialTo3D(targetedObject.ra, targetedObject.dec, 1);
            const dir = new THREE.Vector3(ex, ey, ez).applyMatrix4(rotMatrix).normalize();
            targetCamPosRef.current = dir.clone().negate().multiplyScalar(0.01);
        }

        camera.lookAt(0, 0, 0);

        // Sync OrbitControls
        if (controlsRef?.current) {
            controlsRef.current.update();
        }
    });

    return null;
}
