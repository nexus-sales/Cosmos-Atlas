'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import CelestialSphere from '@/components/sky-map/CelestialSphere';
import Stars from '@/components/sky-map/Stars';
import DeepSkyObjects from '@/components/sky-map/DeepSkyObjects';
import Constellations from '@/components/sky-map/Constellations';
import ConstellationLabels from '@/components/sky-map/ConstellationLabels';
import Planets from '@/components/sky-map/Planets';
import MilkyWay from '@/components/sky-map/MilkyWay';
import CelestialGrid from '@/components/sky-map/CelestialGrid';
import Ecliptic from '@/components/sky-map/Ecliptic';
import Horizon from '@/components/sky-map/Horizon';
import BackgroundStars from '@/components/sky-map/BackgroundStars';
import TargetPointer from '@/components/sky-map/TargetPointer';
import FOVOverlay from '@/components/sky-map/FOVOverlay';
import Compass from '@/components/panels/Compass';
import Satellites from '@/components/sky-map/Satellites';
import MeteorShower from '@/components/effects/MeteorShower';
import Comets from '@/components/sky-map/Comets';
import AuroraBorealis from '@/components/sky-map/AuroraBorealis';
import AdaptiveSoundscape from '@/components/audio/AdaptiveSoundscape';
import TelescopeEffect from '@/components/sky-map/TelescopeEffect';
import AtmosphericSky from '@/components/sky-map/AtmosphericSky';
import SunFlare from '@/components/sky-map/SunFlare';
import FlightController from '@/components/sky-map/FlightController';
import { useAppStore } from '@/stores/useAppStore';
import * as THREE from 'three';
import { getLST } from '@/lib/astronomy/time';
import { equatorialTo3D } from '@/lib/astronomy/transforms';
import { deviceOrientationRef } from '@/hooks/useDeviceOrientation';

/**
 * Zoom por FOV — rueda de ratón + pinch táctil.
 *
 * Para el pinch se usan pointer events (no touch events) porque R3F establece
 * `touch-action: none` en el canvas y OrbitControls también usa pointer events,
 * lo que hace que los touchmove sean poco fiables. Al usar pointerdown/
 * pointermove en el mismo canvas los dos handlers conviven sin conflicto:
 * OrbitControls ignora el gesto de 2 dedos cuando enableZoom+enablePan=false
 * y nuestro handler calcula el delta de distancia entre ambos punteros.
 */
function FovZoom() {
    const { camera, gl } = useThree();
    const fovRef = useRef(60);
    const setCamFov = useAppStore((state) => state.setCamFov);

    useEffect(() => {
        const canvas = gl.domElement;
        const cam = camera as THREE.PerspectiveCamera;

        // ── Rueda de ratón ──────────────────────────────────────────────────
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 3 : -3;
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        // ── Pinch táctil con pointer events ────────────────────────────────
        // Mapa pointerId → posición actual
        const ptrs = new Map<number, { x: number; y: number }>();
        let lastDist = 0;

        const onPointerDown = (e: PointerEvent) => {
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!ptrs.has(e.pointerId)) return;
            ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ptrs.size !== 2) return;

            const [a, b] = [...ptrs.values()];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (lastDist === 0) { lastDist = dist; return; }

            // Separar dedos (dist crece) → zoom in (FOV baja)
            const delta = (lastDist - dist) * 0.15;
            lastDist = dist;
            fovRef.current = THREE.MathUtils.clamp(fovRef.current + delta, 10, 90);
            cam.fov = fovRef.current;
            cam.updateProjectionMatrix();
            setCamFov(fovRef.current);
        };

        const onPointerUp = (e: PointerEvent) => {
            ptrs.delete(e.pointerId);
            if (ptrs.size < 2) lastDist = 0;
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointermove', onPointerMove);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointermove', onPointerMove);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
        };
    }, [camera, gl, setCamFov]);

    return null;
}

/**
 * Habilita el clipping local del renderer para que el horizonte
 * funcione correctamente con planos de corte por material.
 */
function SetupRenderer() {
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const { gl } = useThree();

    useEffect(() => {
        glRef.current = gl;
        // eslint-disable-next-line react-hooks/immutability
        gl.localClippingEnabled = true;
        return () => {
            if (glRef.current) {
                glRef.current.localClippingEnabled = false;
            }
        };
    }, [gl]);

    return null;
}

/**
 * Rota toda la esfera celeste (coordenadas ecuatoriales) al sistema
 * horizontal local del observador:
 *   - rotation.x = 90 - lat   → inclina el polo norte celeste
 *   - rotation.y = -LST        → gira para la hora sidérea local
 * Con esto las estrellas se mueven correctamente según la ubicación
 * y la hora real, exactamente como en el cielo nocturno.
 */
function CelestialGroup({ children }: { children: React.ReactNode }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (!groupRef.current) return;
        const { time, observer } = useAppStore.getState();
        const lst = getLST(time, observer.lon);
        groupRef.current.rotation.x = THREE.MathUtils.degToRad(90 - observer.lat);
        groupRef.current.rotation.y = THREE.MathUtils.degToRad(-lst);
    });

    return <group ref={groupRef}>{children}</group>;
}

/**
 * Smoothly flies the camera to face the targeted object.
 * Runs after OrbitControls (priority 0 > -1) so our position sticks each frame.
 */
// Add controlsRef prop type to CameraNavigator
function CameraNavigator({ controlsRef }: { controlsRef?: React.MutableRefObject<any> }) {
    const { camera } = useThree();
    const targetedObject = useAppStore((s) => s.targetedObject);
    const viewMode = useAppStore((s) => s.viewMode);
    const setCamFov = useAppStore((state) => state.setCamFov);

    const isFlying = useRef(false);
    const prevTarget = useRef<typeof targetedObject>(null);
    const targetFov = useRef(60);

    useEffect(() => {
        if (targetedObject && targetedObject !== prevTarget.current) {
            isFlying.current = true;
            // Si es planeta o DSO, zoom in automático para ver el modelo 3D
            const isPlanet = 'kind' in targetedObject && targetedObject.kind === 'planet';
            const isDSO = 'type' in targetedObject; // DSO check
            targetFov.current = (isPlanet || isDSO) ? 22 : 60;
        } else if (!targetedObject) {
             isFlying.current = false;
             
             // AL DETENERSE (por cancelar target): Sincronizar OrbitControls
             if (controlsRef?.current) {
                 // Forzamos a OrbitControls a leer la posición actual de la cámara
                 // y recalcular sus ángulos esféricos internos.
                 // Esto normalmente no es método público, pero seteando objeto.position funciona si llamamos update
                 // PERO update() escribe.
                 // El truco es: controls.target.copy(0,0,0); controls.object.position.copy(camera.position); controls.update();
                 // Pero update() mueve la cámara...
                 
                 // En Three.js OrbitControls, para re-sincronizar:
                 // controls.update() usa la posición actual de la cámara PARA calcular el offset si no ha cambiado?
                 // No, usa sus coordenadas esféricas internas.
                 
                 // Debemos REGENERAR las coordenadas esféricas internas desde la posición actual.
                 // Esto ocurre en el constructor... o si llamamos a saveState() / reset()? No.
                 
                 // Solución común:
                 // controls.target.set(0,0,0);
                 // controls.object.position.copy(camera.position); 
                 // controls.update(); // <- Esto puede causar el salto si los internos están desincronizados.
                 
                 // PERO, si llamamos a `controls.listenToKeyEvents(window)` o similar, a veces se resetea.
                 
                 // La solución robusta conocida:
                 // controlsRef.current.object.position.copy(camera.position);
                 // controlsRef.current.object.lookAt(controlsRef.current.target);
                 // Y *luego* actualizar internos... pero cómo?
                 
                 // Si miramos el código fuente de OrbitControls, `update()` recalcula la posición DESDE theta/phi.
                 // No hay un `updateFromCamera()`.
                 
                 // Espera! Si OrbitControls tiene `enableDamping={true}` se actualiza.
                 // Si no, no se actualiza solo?
                 
                 // El salto ocurre porque `OrbitControls` mantiene `spherical` state.
                 // Si modificamos la cámara externamente, `spherical` se vuelve obsoleto.
                 // Cuando OrbitControls retoma el control, usa `spherical` antiguo.
                 
                 // PARA ACTUALIZAR `spherical` desde cámara:
                 // No hay API pública.
                 // PERO: Si cambiamos `target`, a veces recalcula.
                 
                 // TRUCO: Disparar un 'change' event manualmente? No.
                 
                 // Lo que suele funcionar es acceder a las propiedades privadas o reinicializar.
                 // O, simplemente, mantener OrbitControls actualizado MIENTRAS volamos.
                 
                 // Vamos a intentar actualizar la posición en el controlsRef MIENTRAS volamos,
                 // pero sin llamar a update(). 
                 // Solo actualizamos la posición del objeto de controls (que es la cámara, ya lo hacemos).
                 
                 // Ah! En `drei`, `makeDefault` hace que los controles se actualicen con el loop de render.
                 // Si no usamos `makeDefault`, quizás no.
                 
                 // Si el usuario reporta "vuelve al horizonte", es probable que el punto (0,0,0) de la esfera
                 // coincida con el horizonte en la configuración inicial o por defecto (theta/phi).
                 
                 // VOY A APLICAR LA ESTRATEGIA:
                 // En cada frame de vuelo, actualizamos manualmentes los controles si es posible,
                 // O mejor: Al finalizar el vuelo, reseteamos los controles para que recalcule desde la posición actual.
                 // Pero `reset()` vuelve al estado inicial.
                 
                 // Si miramos la documentacion de Three.js OrbitControls:
                 // "This control ... expects that the camera is positioned at the desired start position."
                 
                 // Entonces, si desmontamos y montamos OrbitControls, cogerá la nueva posición.
                 // Esto es una opción: key={someKey} en OrbitControls.
                 
                 // Vamos a forzar un re-mount de OrbitControls cuando `targetedObject` cambia a null?
                 // No, eso cortaría el gesto de drag.
                 
                 // ESPERA. `setTargetedObject(null)` se llama en `onStart`.
                 // El usuario YA ha empezado el drag.
                 // OrbitControls YA ha capturado el estado inicial del drag (mousedown).
                 // Y ese estado inicial era DONDE ESTABA LA CÁMARA antes de `setTargetedObject`.
                 
                 // Si la cámara estaba siendo movida por `CameraNavigator` (por ejemplo tracking de Luna),
                 // y OrbitControls NO se actualizaba, entonces su estado interno REFLEJA LA POSICIÓN ANTIGUA
                 // (quizás desde la última vez que interactuamos, o el inicio).
                 
                 // POR ESO SALTA.
             }
        }
        prevTarget.current = targetedObject;
    }, [targetedObject, controlsRef]); // Añadido controlsRef

    useFrame(() => {
        // Disable navigation if not in observatory mode
        if (viewMode !== 'observatory') return;

        if (targetedObject && isFlying.current) {
            // ...existing logic helper...
        } else {
            // Si NO estamos volando, o targetedObject es null...
            // Y si OrbitControls está activo...
        }
        
        if (!targetedObject) return;
        
        // Calcular SIEMPRE la posición objetivo del objeto en el cielo
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

        const targetCamPos = targetWorldDir.clone().negate().multiplyScalar(0.01);
        const currentPos = camera.position.clone();

        const dot = currentPos.normalize().dot(targetCamPos.clone().normalize());

        // FOV Transition
        const cam = camera as THREE.PerspectiveCamera;
        if (Math.abs(cam.fov - targetFov.current) > 0.1) {
            cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov.current, 0.05);
            cam.updateProjectionMatrix();
            setCamFov(cam.fov);
        }

        // Tracking logic
        // Si no estamos volando (ya llegamos), verificamos si debemos mantener el tracking
        if (!isFlying.current) {
             // Si el usuario intenta mover la cámara manualmente (el dot product baja),
             // rompemos el tracking para dejarle control.
             // Solo hacemos tracking si estamos alineados (o casi).
             if (dot > 0.999) {
                 camera.position.copy(targetCamPos);
                 camera.lookAt(0, 0, 0);
             }
             return;
        }

        // Flight logic
        const speed = THREE.MathUtils.clamp(0.06 + (1 - dot) * 0.08, 0.05, 0.15);
        const newPos = camera.position.clone().lerp(targetCamPos, speed).normalize().multiplyScalar(0.01);
        
        // Apply position
        camera.position.copy(newPos);
        camera.lookAt(0, 0, 0);

        // Update OrbitControls if available so it knows where we are
        // This prevents the "snap back" when user grabs control
        if (controlsRef?.current) {
             // No hay método público para "leer" la cámara, pero si movemos la cámara
             // y luego llamamos a update(), OrbitControls podría sobreescribirlo o leerlo.
             // En este caso, queremos que OrbitControls NO aplique su estado antiguo.
             // La mejor forma es deshabilitarlo momentáneamente o, mejor aún,
             // intentar actualizar su estado interno si pudiéramos.
             // Como no podemos fácilmente sin hacks, asumimos que al iniciar el drag (onStart)
             // OrbitControls leerá la posición actual si no tiene inercia pendiente.
             
             // PERO el usuario reporta que "vuelve al horizonte".
             // Esto significa que OrbitControls TIENE un estado guardado (probablemente phi=PI/2).
             
             // Vamos a intentar un truco: desactivar enableRotate mientras volamos?
             // No, porque eso re-renderiza Canvas.
             
             // Truco: controls.object.position.copy(camera.position) YA está hecho porque object===camera.
             // controls.target es 0,0,0.
             
             // Si forzamos controls.update() AQUI, OrbitControls dirá:
             // "Mi estado es phi=PI/2, theta=0. Voy a poner la cámara ahí".
             // Y nos fastidia el vuelo.
             
             // Lo que necesitamos es: controls.object = camera.
             // controls.update() hace:
             // offset.copy( object.position ).sub( target );
             // spherical.setFromVector3( offset );
             // ... y luego aplica límites ...
             // ... y luego object.position.copy(...)
             
             // ESPERA. update() lee `object.position` y calcula spherical SOLO SI `autoRotate` o `autoPush`?
             // No, update() generalmente hace:
             // 1. Aplica damping/autorotate a spherical.
             // 2. Calcula offset desde spherical.
             // 3. Aplica offset a camera.position.
             
             // ENTONCES update() MACHACA la posición de la cámara.
             // Por eso si llamamos update() o si OrbitControls llama update() en su loop, nos machaca si el estado interno difiere.
             
             // Y si NO llamamos update(), OrbitControls no machaca nada... hasta que tocamos.
             // Cuando tocamos (onPointerDown), ¿OrbitControls lee la cámara?
             // SÍ, OrbitControls hace:
             // rotateStart.set( event.clientX, event.clientY );
             // Y asume que el estado actual (spherical) es válido.
             
             // POR TANTO: El estado spherical interno de OrbitControls ESTÁ DESACTUALIZADO.
             // Necesitamos actualizarlo.
             
             // ¿Cómo actualizar `spherical` sin llamar a `update` (que escribe)?
             // No hay API pública.
             
             // PERO: Si llamamos a `controls.update()` *justo después* de mover la cámara,
             // OrbitControls sobreescribirá la cámara con el estado viejo.
             
             // EXCEPTO si seteamos el estado viejo para que coincida con la cámara.
             // Tampoco podemos.
             
             // UN MOMENTO. Hay una función `setAzimuthalAngle` y `setPolarAngle`?
             // En la implementación estándar de OrbitControls de jsm, NO.
             // Getters sí: getAzimuthalAngle, getPolarAngle.
             
             // Si el user dice "vuelve al horizonte", es porque OrbitControls cree que phi=PI/2.
             
             // LA SOLUCIÓN DEFINITIVA:
             // Destruir y recrear OrbitControls al terminar el vuelo.
             // O cambiar la `key` de OrbitControls.
             
             // Vamos a usar el hack de la `key`.
        }

        if (dot > 0.999 && Math.abs(cam.fov - targetFov.current) < 0.5) {
            isFlying.current = false;
            camera.position.copy(targetCamPos);
            camera.lookAt(0, 0, 0);
            
            // Force OrbitControls update/resync by invalidating or similar?
            return;
        }
    });

    return null;
}



/**
 * When followOrientation is active, reads the module-level deviceOrientationRef
 * (written by the DeviceOrientation event listener) and applies the device heading
 * and elevation to the camera position each frame.
 *
 * Mapping (Three.js scene: North=-Z, East=+X, Zenith=+Y):
 *   elevation = clamp(90 - beta, -10, 90)
 *   azimuth   = alpha (0=North, clockwise)
 *   cam_pos   = (-cos(el)*sin(az), -sin(el), cos(el)*cos(az)) * 0.01
 *
 * A lerp smoothing factor of 0.12 removes gyroscope jitter.
 */
function OrientationDriver() {
    const { camera } = useThree();
    const followOrientation = useAppStore((s) => s.followOrientation);
    const azRef = useRef(0);
    const elRef = useRef(45);

    useFrame(() => {
        if (!followOrientation) return;

        const { alpha, beta } = deviceOrientationRef;

        // elevation: 90° when phone flat face-up → looking at zenith
        //            0° when phone vertical      → looking at horizon
        const targetEl = Math.max(-10, Math.min(90, 90 - beta));

        // Smooth angle lerp — handle 359→1 wrap-around for azimuth
        const dAz = ((alpha - azRef.current) % 360 + 540) % 360 - 180;
        azRef.current = (azRef.current + dAz * 0.12 + 360) % 360;
        elRef.current += (targetEl - elRef.current) * 0.12;

        const elRad = THREE.MathUtils.degToRad(elRef.current);
        const azRad = THREE.MathUtils.degToRad(azRef.current);

        camera.position.set(
            -Math.cos(elRad) * Math.sin(azRad) * 0.01,
            -Math.sin(elRad) * 0.01,
            Math.cos(elRad) * Math.cos(azRad) * 0.01,
        );
    });

    return null;
}

function SeeingJitter() {
    const { camera } = useThree();
    const camFov = useAppStore((s) => s.camFov);
    const telescopeMode = useAppStore((s) => s.settings.telescopeMode);

    useFrame((state) => {
        if (!telescopeMode || camFov > 25) return;
        const time = state.clock.getElapsedTime();
        const zoomFactor = 1.0 - (camFov / 25.0);
        const intensity = 0.00004 * (1.0 + zoomFactor * 3.0);
        const jitterX = Math.sin(time * 15.0) * intensity;
        const jitterY = Math.cos(time * 18.0) * intensity;
        camera.translateX(jitterX);
        camera.translateY(jitterY);
    });
    return null;
}



export default function SkyCanvas() {
    const showGrid = useAppStore((state) => state.settings.showGrid);
    const showMilkyWay = useAppStore((state) => state.settings.showMilkyWay);
    const showEcliptic = useAppStore((state) => state.settings.showEcliptic);
    const showConstellations = useAppStore((state) => state.settings.showConstellations);
    const followOrientation = useAppStore((state) => state.followOrientation);
    const setTargetedObject = useAppStore((state) => state.setTargetedObject);
    const targetedObject = useAppStore((state) => state.targetedObject);
    
    // Create a ref for OrbitControls to sync it
    const controlsRef = useRef<any>(null);

    return (
        <div className="w-full h-full bg-[#04091a] relative">
            <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                gl={{ antialias: true, stencil: false, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, 0.01], fov: 60, near: 0.001, far: 200 }}
            >
                <Suspense fallback={null}>
                    <SetupRenderer />

                    {/* Iluminación para planetas y Luna (meshStandardMaterial) */}
                    {/* Luz ambiental suave para el lado oscuro */}
                    <ambientLight intensity={0.15} />
                    {/* Luz direccional que simula el Sol - viene desde +X (Este) */}
                    <directionalLight
                        position={[100, 0, 0]}
                        intensity={3.5}
                        color="#ffffff"
                    />

                    {/* In AR/orientation mode, disable drag rotation so OrientationDriver owns the camera */}
                    {/* Key prop ensures re-mount when target changes, preventing "snap back" to old position */}
                    <OrbitControls
                        key={targetedObject ? 'targeted' : 'free'}
                        ref={controlsRef}
                        enableZoom={false}
                        enablePan={false}
                        enableRotate={!followOrientation}
                        rotateSpeed={-0.4}
                        target={[0, 0, 0]}
                        onStart={() => {
                            setTargetedObject(null);
                        }}
                    />
                    <OrientationDriver />
                    <FovZoom />
                    <FlightController />

                    {/* Esfera Atmosférica Pro — reemplaza a CelestialSphere */}
                    <AtmosphericSky />

                    {/* Grupo rotado al sistema horizontal del observador */}
                    <CelestialGroup>
                        <BackgroundStars />
                        {showMilkyWay && <MilkyWay />}
                        <Stars />
                        <DeepSkyObjects />
                        <Constellations />
                        {showConstellations && <ConstellationLabels />}
                        <Planets />
                        {showGrid && <CelestialGrid />}
                        {showEcliptic && <Ecliptic />}
                        <TargetPointer />
                        {/* Cometas con colas dinámicas (usan coordenadas ecuatoriales) */}
                        <Comets />
                    </CelestialGroup>

                    {/* Satélites en espacio mundo horizontal (Alt/Az), NO dentro del CelestialGroup */}
                    <Satellites />
                    
                    {/* Move CameraNavigator inside to access the controls ref if we passed it, but better: 
                        Make CameraNavigator take the ref as prop. But CameraNavigator is defined outside.
                        Actually, let's keep CameraNavigator as is and use a context or effect for syncing.
                        
                        Wait, we can forward the ref to CameraNavigator if we move it inside SkyCanvas or pass it.
                        Or better: Use a Context.
                        
                        Simplest way: Define CameraNavigator inside SkyCanvas (it's fine if it's memoized or stable).
                        Or pass the ref to a wrapper.
                        
                        Let's pass the ref to CameraNavigator. We need to modify the component signature.
                     */}
                    <CameraNavigator controlsRef={controlsRef} />

                    {/* Horizonte en espacio mundo (plano horizontal fijo) */}

                    <Horizon />

                    {/* Aurora Boreal/Austral */}
                    <AuroraBorealis />

                    {/* Lluvia de meteoros real */}
                    <MeteorShower />

                    <SeeingJitter />
                    <TelescopeEffect />

                    {/* FOVOverlay maneja su propio Html wrapper internamente */}
                    <FOVOverlay />
                    <AdaptiveSoundscape />
                    <SunFlare />
                    {/* Brújula con reset de orientación */}
                    <Compass />
                </Suspense>
            </Canvas>
        </div>
    );
}
