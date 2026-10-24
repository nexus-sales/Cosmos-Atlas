import { describe, expect, it } from 'vitest';
import { parseIauBoundaries } from '@/lib/astronomy/iauBoundaries';

function makeCatalog() {
    const buffer = new ArrayBuffer(12 + 4 + 3 * 8);
    const view = new DataView(buffer);
    'CAB1'.split('').forEach((char, index) => view.setUint8(index, char.charCodeAt(0)));
    view.setUint32(4, 1, true);
    view.setUint32(8, 3, true);
    view.setUint32(12, 3, true);
    [[0, -10], [15, 0], [30, 10]].forEach(([ra, dec], index) => {
        view.setFloat32(16 + index * 8, ra, true);
        view.setFloat32(20 + index * 8, dec, true);
    });
    return buffer;
}

describe('parseIauBoundaries', () => {
    it('lee rutas ecuatoriales del formato binario compacto', () => {
        expect(parseIauBoundaries(makeCatalog())).toEqual([[[0, -10], [15, 0], [30, 10]]]);
    });

    it('rechaza archivos truncados o con firma incorrecta', () => {
        expect(() => parseIauBoundaries(new ArrayBuffer(4))).toThrow('incompleto');
        const invalid = makeCatalog();
        new DataView(invalid).setUint8(0, 0);
        expect(() => parseIauBoundaries(invalid)).toThrow('no reconocido');
    });
});
