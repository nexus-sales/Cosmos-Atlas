import type { DSO } from '@/types/celestial';
/**
 * ngc.ts
 * Carga asíncrona del catálogo NGC/IC desde /ngc.bin
 * 
 * Formato binario esperado:
 *   Bytes 0-3   : uint32LE — número de objetos N
 *   Bytes 4...  : N × 20 bytes — estructura por objeto:
 *                   [0-3]   ra (float32LE)
 *                   [4-7]   dec (float32LE)
 *                   [8-11]  mag (float32LE)
 *                   [12-15] size (float32LE, arcmin)
 *                   [16]    type (uint8: 1=Galaxy, 2=Nebula, 3=Cluster, 4=Other)
 *                   [17-19] uint24LE ID (bit 23 = IC, remaining bits = number; zero = legacy)
 */

export interface NGCObject {
    ra: number;
    dec: number;
    mag: number;
    size: number;
    type: number;
    id: string; // Real NGC/IC identity, or an explicitly anonymous legacy row
}

export function parseNGC(buf: ArrayBuffer): NGCObject[] {
    if (buf.byteLength < 4) throw new Error('Truncated NGC header');
    const view = new DataView(buf);
    const count = view.getUint32(0, true);
    if (buf.byteLength !== 4 + count * 20) throw new Error('Invalid NGC binary length');
    return Array.from({ length: count }, (_, i) => {
        const off = 4 + i * 20;
        const identity = view.getUint8(off + 17) | (view.getUint8(off + 18) << 8) | (view.getUint8(off + 19) << 16);
        return {
            ra: view.getFloat32(off, true), dec: view.getFloat32(off + 4, true),
            mag: view.getFloat32(off + 8, true), size: view.getFloat32(off + 12, true),
            type: view.getUint8(off + 16),
            id: identity === 0 ? `Catalog row ${i + 1}` : `${identity & 0x800000 ? 'IC' : 'NGC'} ${identity & 0x7fffff}`,
        };
    });
}

let cachedNGC: NGCObject[] | null = null;
let loadPromise: Promise<NGCObject[]> | null = null;

export async function loadNGC(): Promise<NGCObject[]> {
    if (cachedNGC) return cachedNGC;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            const res = await fetch('/ngc.bin?v=2');
            if (!res.ok) throw new Error('No se encontró ngc.bin');
            
            const buf = await res.arrayBuffer();
            const objects = parseNGC(buf);

            cachedNGC = objects;
            return objects;
        } catch (err) {
            console.warn('[NGC] Usando catálogo reducido (fallback):', err);
            return []; // Retornar vacío o catálogo mínimo
        }
    })();

    const result = await loadPromise;
    if (!cachedNGC) loadPromise = null;
    return result;
}

export function ngcToDSO(obj: NGCObject): DSO {
    return {
        id: obj.id.replace(/ /g, ''), name: obj.id, ra: obj.ra, dec: obj.dec,
        mag: obj.mag, sizeArcmin: obj.size > 0 ? obj.size : undefined,
        type: obj.type === 1 ? 'galaxy' : obj.type === 3 ? 'cluster' : 'nebula',
        color: obj.type === 1 ? '#99ccff' : obj.type === 3 ? '#ffffb3' : '#ff8080',
        desc: `OpenNGC. Magnitud V ${obj.mag.toFixed(2)}.`, kind: 'dso',
    };
}
