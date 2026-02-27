'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/stores/useAppStore';
import * as Astronomy from 'astronomy-engine';
import { equatorialTo3D } from '@/lib/astronomy/transforms';

type CtrlState = { enabled: boolean; target: THREE.Vector3 };

/**
 * Cinematic Flight Controller
 *
 * Handles smooth transitions between "Observatory Mode" (Earth based)
 * and "Orbital Mode" (Planet based).
 *
 * Uses smooth interpolation for position and lookAt vectors.
 */
export default function FlightController() {
    const { camera } = useThree();
    const viewMode = useAppStore(state => state.viewMode);
    const flightTarget = useAppStore(state => state.flightTarget);
    const endFlight = useAppStore(state => state.endFlight);
    const observer = useAppStore(state => state.observer);
    const time = useAppStore(state => state.time);

    // Constant matching Planets.tsx radius
    const PLANET_RADIUS = 95;

    // Refs for animation state
    const isFlying = useRef(false);
    const flightProgress = useRef(0);
    const startPos = useRef(new THREE.Vector3());
    const targetPos = useRef(new THREE.Vector3());
    const startLook = useRef(new THREE.Vector3());
    const targetLook = useRef(new THREE.Vector3());
    const prevMode = useRef<typeof viewMode | null>(null);
    const prevTarget = useRef<string | null>(null);

    // Pending controls mutations — applied in useFrame via state.controls
    // to avoid mutating the value returned from useThree()
    const pendingControlsEnabled = useRef<boolean | null>(null);
    const pendingControlsTarget = useRef<THREE.Vector3 | null>(null);

    // Sync camera state when flight starts
    useEffect(() => {
        if (viewMode === 'observatory') {
            if (prevMode.current !== 'observatory') {
                camera.position.set(0, 0, 0.01);
                camera.lookAt(new THREE.Vector3(1, 0, 0));
                pendingControlsEnabled.current = true;
                pendingControlsTarget.current = new THREE.Vector3(0, 0, 0);
            }
            prevMode.current = viewMode;
            prevTarget.current = flightTarget;
            return;
        }

        if (viewMode === 'orbital' && flightTarget) {
            if (prevMode.current === 'orbital' && prevTarget.current === flightTarget) {
                return;
            }
            // Find target position in 3D space
            // Identify body from name string
            let body: Astronomy.Body | null = null;

            // Map common names to Astronomy.Body
            const bodyMap: Record<string, Astronomy.Body> = {
                'Sun': Astronomy.Body.Sun, 'Sol': Astronomy.Body.Sun,
                'Mercury': Astronomy.Body.Mercury, 'Mercurio': Astronomy.Body.Mercury,
                'Venus': Astronomy.Body.Venus,
                'Earth': Astronomy.Body.Earth, 'Tierra': Astronomy.Body.Earth,
                'Mars': Astronomy.Body.Mars, 'Marte': Astronomy.Body.Mars,
                'Jupiter': Astronomy.Body.Jupiter, 'Júpiter': Astronomy.Body.Jupiter,
                'Saturn': Astronomy.Body.Saturn, 'Saturno': Astronomy.Body.Saturn,
                'Uranus': Astronomy.Body.Uranus, 'Urano': Astronomy.Body.Uranus,
                'Neptune': Astronomy.Body.Neptune, 'Neptuno': Astronomy.Body.Neptune,
                'Moon': Astronomy.Body.Moon, 'Luna': Astronomy.Body.Moon,
            };

            body = bodyMap[flightTarget] || null;

            if (body) {
                // Calculate position
                try {
                    const obs = new Astronomy.Observer(observer.lat, observer.lon, 0);
                    const eq = Astronomy.Equator(body, time, obs, true, true);
                    const pos3D = equatorialTo3D(eq.ra, eq.dec, PLANET_RADIUS);

                    // Setup animation vectors
                    startPos.current.copy(camera.position);

                    // Simple "forward" vector for lookAt
                    const forward = new THREE.Vector3();
                    camera.getWorldDirection(forward);
                    startLook.current.copy(camera.position).add(forward);

                    // Destination:
                    // Create a position slightly offset from the planet so we look AT it.
                    // The planet is at pos3D (magnitude 95) relative to origin.
                    // We want to be at magnitude ~90, looking at ~95.

                    const targetDir = new THREE.Vector3().fromArray(pos3D).normalize();

                    // Position camera at 85 units (10 units away from surface/center)
                    // At 95 radius, 10 units is quite close (like 1/9th of radius away/inside?).
                    // Wait, if radius is 95, surface is at 95. Origin is 0.
                    // So we want to be at (95 - epsilon). But we are OUTSIDE looking OUT?
                    // No, the Sky Map is "inside out". We are at 0 looking at 95.
                    // If we want to "approach" the planet, we fly closer to 95.
                    // So we go from 0 -> 90.
                    targetPos.current.copy(targetDir).multiplyScalar(85.0);
                    targetLook.current.fromArray(pos3D);

                    isFlying.current = true;
                    flightProgress.current = 0;

                    // Disable orbit controls during flight (applied next frame)
                    pendingControlsEnabled.current = false;

                } catch (e) {
                    console.error("Flight calculation failed", e);
                    endFlight();
                }
            } else {
                console.warn(`Flight target body '${flightTarget}' not found`);
                endFlight();
            }
        }

        prevMode.current = viewMode;
        prevTarget.current = flightTarget;
    }, [viewMode, flightTarget, camera, observer, time, endFlight]);

    useFrame((state, delta) => {
        const ctrl = state.controls as unknown as CtrlState | null | undefined;

        // Apply any controls mutations deferred from useEffect
        if (ctrl) {
            if (pendingControlsEnabled.current !== null) {
                ctrl.enabled = pendingControlsEnabled.current;
                pendingControlsEnabled.current = null;
            }
            if (pendingControlsTarget.current) {
                ctrl.target.copy(pendingControlsTarget.current);
                pendingControlsTarget.current = null;
            }
        }

        if (isFlying.current) {
            flightProgress.current += delta * 0.4; // ~2.5 seconds flight

            if (flightProgress.current >= 1.0) {
                flightProgress.current = 1.0;
                isFlying.current = false;

                // Ensure final position is exact
                camera.position.copy(targetPos.current);
                camera.lookAt(targetLook.current);

                // Update controls target to the planet so we can orbit IT (limited)
                if (ctrl) {
                    ctrl.target.copy(targetLook.current);
                    // We keep controls disabled or change properties?
                    // If we enable them, the user will rotate around the planet (targetLook)
                    ctrl.enabled = true;
                }
                return;
            }

            // Ease function (easeInOutCubic)
            const t = flightProgress.current;
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            // Interpolate Position
            // We use lerpVectors to update camera position without creating new objects every frame
            const currentPos = new THREE.Vector3().lerpVectors(startPos.current, targetPos.current, ease);
            camera.position.copy(currentPos);

            // Interpolate LookAt
            const currentLook = new THREE.Vector3().lerpVectors(startLook.current, targetLook.current, ease);
            camera.lookAt(currentLook);

            // Sync controls target to prevent snap
            if (ctrl) {
               ctrl.target.copy(currentLook);
            }
        }
    });

    return null;
}
