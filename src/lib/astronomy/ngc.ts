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
 *                   [17-19] padding/reserva
 */

export interface NGCObject {
    ra: number;
    dec: number;
    mag: number;
    size: number;
    type: number;
    id: string; // Generado como "NGC XXX" o "IC XXX" según índice si no viene en binario
}

let cachedNGC: NGCObject[] | null = null;
let loadPromise: Promise<NGCObject[]> | null = null;

export async function loadNGC(): Promise<NGCObject[]> {
    if (cachedNGC) return cachedNGC;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
        try {
            const res = await fetch('/ngc.bin');
            if (!res.ok) throw new Error('No se encontró ngc.bin');
            
            const buf = await res.arrayBuffer();
            const view = new DataView(buf);
            const count = view.getUint32(0, true);
            
            const objects: NGCObject[] = new Array(count);
            for (let i = 0; i < count; i++) {
                const off = 4 + i * 20;
                objects[i] = {
                    ra:   view.getFloat32(off,      true),
                    dec:  view.getFloat32(off + 4,  true),
                    mag:  view.getFloat32(off + 8,  true),
                    size: view.getFloat32(off + 12, true),
                    type: view.getUint8(off + 16),
                    id:   `NGC ${i + 1}` // Simplificación, en producción se usaría ID real
                };
            }
            
            cachedNGC = objects;
            return objects;
        } catch (err) {
            console.warn('[NGC] Usando catálogo reducido (fallback):', err);
            return []; // Retornar vacío o catálogo mínimo
        }
    })();

    return loadPromise;
}
