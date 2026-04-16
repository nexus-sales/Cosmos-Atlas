'use client';

/**
 * ThreeClockPatch
 *
 * Three.js r168+ emits a deprecation warning when `new THREE.Clock()` is
 * instantiated. React Three Fiber uses THREE.Clock internally (vanilla.mjs),
 * which is outside our control until R3F updates to THREE.Timer.
 *
 * This component patches `console.warn` to swallow ONLY that specific
 * Three.js deprecation message. All other warnings are forwarded normally.
 * It must be rendered before <Canvas> (i.e. in the root layout or page).
 */

import { useEffect } from 'react';

const SUPPRESSED_PATTERNS = [
    'THREE.Clock: This module has been deprecated',
    'THREE.THREE.Clock',
];

export default function ThreeClockPatch() {
    useEffect(() => {
        const originalWarn = console.warn.bind(console);

        console.warn = (...args: unknown[]) => {
            const message = String(args[0] ?? '');
            if (SUPPRESSED_PATTERNS.some((p) => message.includes(p))) {
                // Suppress intentionally — R3F uses THREE.Clock internally.
                // Remove this patch once @react-three/fiber >= 9.x ships THREE.Timer.
                return;
            }
            originalWarn(...args);
        };

        return () => {
            console.warn = originalWarn;
        };
    }, []);

    return null;
}
