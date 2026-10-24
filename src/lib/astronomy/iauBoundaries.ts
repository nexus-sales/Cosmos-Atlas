export type BoundaryPoint = readonly [raDegrees: number, decDegrees: number];
export type BoundaryPath = readonly BoundaryPoint[];

const MAGIC = 'CAB1';
const HEADER_BYTES = 12;

export function parseIauBoundaries(buffer: ArrayBuffer): BoundaryPath[] {
    if (buffer.byteLength < HEADER_BYTES) throw new Error('Catálogo IAU incompleto');

    const view = new DataView(buffer);
    const magic = String.fromCharCode(...Array.from({ length: 4 }, (_, index) => view.getUint8(index)));
    if (magic !== MAGIC) throw new Error('Formato de límites IAU no reconocido');

    const pathCount = view.getUint32(4, true);
    const expectedPointCount = view.getUint32(8, true);
    const paths: BoundaryPoint[][] = [];
    let offset = HEADER_BYTES;
    let pointCount = 0;

    for (let pathIndex = 0; pathIndex < pathCount; pathIndex++) {
        if (offset + 4 > view.byteLength) throw new Error('Catálogo IAU truncado antes de una ruta');
        const pathPointCount = view.getUint32(offset, true);
        offset += 4;
        if (pathPointCount < 2 || offset + pathPointCount * 8 > view.byteLength) {
            throw new Error('Ruta IAU inválida o truncada');
        }

        const path: BoundaryPoint[] = [];
        for (let pointIndex = 0; pointIndex < pathPointCount; pointIndex++) {
            const ra = view.getFloat32(offset, true); offset += 4;
            const dec = view.getFloat32(offset, true); offset += 4;
            if (!Number.isFinite(ra) || !Number.isFinite(dec) || ra < 0 || ra > 360 || dec < -90 || dec > 90) {
                throw new Error('Coordenada IAU fuera de rango');
            }
            path.push([ra, dec]);
        }
        paths.push(path);
        pointCount += pathPointCount;
    }

    if (pointCount !== expectedPointCount || offset !== view.byteLength) {
        throw new Error('El índice del catálogo IAU no coincide con sus datos');
    }
    return paths;
}
