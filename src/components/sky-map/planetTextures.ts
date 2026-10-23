import { useEffect, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * true (y se mantiene) cuando el objeto ha entrado alguna vez en el encuadre de la cámara.
 * Evita descargar el mapa de planetas que nunca se miran. Comprueba ~4 veces/s.
 */
export function useEnteredView(ref: RefObject<THREE.Object3D | null>, active: boolean): boolean {
    const [entered, setEntered] = useState(false);
    const tick = useRef(0);
    const scratch = useRef({ pos: new THREE.Vector3(), dir: new THREE.Vector3() });

    useFrame(({ camera }) => {
        if (entered || !active || !ref.current) return;
        if (tick.current++ % 15 !== 0) return;
        const { pos, dir } = scratch.current;
        ref.current.getWorldPosition(pos).sub(camera.position).normalize();
        camera.getWorldDirection(dir);
        const fov = (camera as THREE.PerspectiveCamera).fov ?? 60;
        if (dir.angleTo(pos) < THREE.MathUtils.degToRad(fov)) setEntered(true);
    });

    return entered;
}

/**
 * Mapas reales (Solar System Scope, CC BY 4.0, derivados de datos NASA).
 * Ver docs/CREDITS-planet-textures.md. El sol conserva su textura procedural.
 */
const REAL_TEXTURE_KEYS = new Set([
    'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon',
]);

const cache = new Map<string, THREE.Texture>();
const pending = new Map<string, Promise<THREE.Texture | null>>();

/** 1K en móvil / poca memoria, 2K en escritorio. */
function pickResolution(): '1k' | '2k' {
    if (typeof window === 'undefined') return '1k';
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const small = window.innerWidth < 768 || (mem !== undefined && mem <= 4);
    return small ? '1k' : '2k';
}

function loadRealTexture(key: string): Promise<THREE.Texture | null> {
    const res = pickResolution();
    const id = `${key}_${res}`;
    const hit = cache.get(id);
    if (hit) return Promise.resolve(hit);
    const inflight = pending.get(id);
    if (inflight) return inflight;

    const p = new Promise<THREE.Texture | null>(resolve => {
        new THREE.TextureLoader().load(
            `/textures/planets/${id}.jpg`,
            tex => {
                tex.anisotropy = 4;
                tex.wrapS = THREE.RepeatWrapping;
                tex.needsUpdate = true;
                cache.set(id, tex);
                resolve(tex);
            },
            undefined,
            () => resolve(null),
        );
    }).finally(() => pending.delete(id));
    pending.set(id, p);
    return p;
}

/**
 * Devuelve la textura real cuando `enabled` (esfera visible) y ya está cargada;
 * mientras tanto, o si falla la carga/red, devuelve `fallback` (la procedural).
 */
export function useRealPlanetTexture(key: string, enabled: boolean, fallback: THREE.Texture): THREE.Texture {
    const [real, setReal] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (!enabled || !REAL_TEXTURE_KEYS.has(key)) return;
        let alive = true;
        loadRealTexture(key).then(t => { if (alive && t) setReal(t); });
        return () => { alive = false; };
    }, [key, enabled]);

    return real ?? fallback;
}
