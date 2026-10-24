import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? resolve('public/iau-boundaries.bin');

if (!inputPath) {
    throw new Error('Uso: node scripts/generate-iau-boundaries.mjs <lines_in_20.txt> [salida]');
}

const SOURCE = 'https://pbarbier.com/constellations/lines_in_20.txt';
const rows = readFileSync(inputPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
        const [raHours, decDegrees, edgeId] = line.split(/\s+/);
        return { ra: Number(raHours) * 15, dec: Number(decDegrees), edgeId };
    });

const paths = [];
for (const row of rows) {
    const current = paths.at(-1);
    if (!current || current.edgeId !== row.edgeId) {
        paths.push({ edgeId: row.edgeId, points: [[row.ra, row.dec]] });
    } else {
        current.points.push([row.ra, row.dec]);
    }
}

const usablePaths = paths.filter((path) => path.points.length >= 2);
const pointCount = usablePaths.reduce((sum, path) => sum + path.points.length, 0);
const byteLength = 12 + usablePaths.length * 4 + pointCount * 8;
const buffer = new ArrayBuffer(byteLength);
const view = new DataView(buffer);
let offset = 0;

// CAB1: Cosmos Atlas Boundaries, version 1.
for (const char of 'CAB1') view.setUint8(offset++, char.charCodeAt(0));
view.setUint32(offset, usablePaths.length, true); offset += 4;
view.setUint32(offset, pointCount, true); offset += 4;

for (const path of usablePaths) {
    view.setUint32(offset, path.points.length, true); offset += 4;
    for (const [ra, dec] of path.points) {
        view.setFloat32(offset, ra, true); offset += 4;
        view.setFloat32(offset, dec, true); offset += 4;
    }
}

writeFileSync(outputPath, Buffer.from(buffer));
console.log(JSON.stringify({ source: SOURCE, paths: usablePaths.length, points: pointCount, bytes: byteLength }));
