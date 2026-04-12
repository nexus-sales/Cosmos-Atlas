/**
 * generate-hipparcos.mjs
 * Descarga el catálogo Hipparcos (I/239/hip_main) desde VizieR TAP
 * y genera public/hipparcos.bin — 4 floats por estrella (ra, dec, mag, bv)
 *
 * Uso: node scripts/generate-hipparcos.mjs
 * Requisito: Node 18+ (fetch nativo)
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dir, '..', 'public', 'hipparcos.bin');
const MAG_LIMIT = 8.0;

// VizieR ASU-TSV — catálogo Hipparcos I/239/hip_main
// Formato: tab-separated, columnas RArad (rad), DErad (rad), Vmag, B-V
const VIZIER_URL = 'https://vizier.cds.unistra.fr/viz-bin/asu-tsv';
const params = new URLSearchParams({
    '-source': 'I/239/hip_main',
    '-out': 'HIP,_RAJ2000,_DEJ2000,Vmag,B-V',
    'Vmag': `<${MAG_LIMIT}`,
    '-out.max': '15000',
    '-sort': 'Vmag',
    '-oc.form': 'dec',
});

console.log(`Descargando Hipparcos (mag ≤ ${MAG_LIMIT}) desde VizieR...`);

let csv;
try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    const res = await fetch(`${VIZIER_URL}?${params}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    csv = await res.text();
} catch (err) {
    console.error('Error al descargar:', err.message);
    process.exit(1);
}

// Parsear TSV — las líneas que empiezan con # son comentarios/metadatos
// Formato de datos: HIP  _RAJ2000  _DEJ2000  Vmag  B-V (separados por tab)
const allLines = csv.split('\n');
// Encontrar el índice de la línea de cabecera de columnas (la que tiene _RAJ2000)
const headerIdx = allLines.findIndex(l => l.includes('_RAJ2000') && l.includes('_DEJ2000'));
const header = headerIdx >= 0 ? allLines[headerIdx] : '';
console.log('Header detectado:', header.trim().slice(0, 80));
// Las líneas de datos vienen después del header (saltar la línea de unidades y la de guiones)
// y no empiezan con #
const dataLines = allLines
    .slice(headerIdx + 1)
    .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('-') && !l.includes('deg') && !l.includes('mag'));
console.log(`Líneas recibidas: ${dataLines.length}`);

const stars = [];
let skipped = 0;

for (const line of dataLines) {
    // TSV: HIP   RArad   DErad   Vmag   B-V (separados por tabulador o espacios múltiples)
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) { skipped++; continue; }

    const raRad  = parseFloat(parts[1]);
    const decRad = parseFloat(parts[2]);
    const vmag   = parseFloat(parts[3]);
    const bv     = parseFloat(parts[4]);

    if (isNaN(raRad) || isNaN(decRad) || isNaN(vmag)) { skipped++; continue; }

    // Convertir radianes → grados para compatibilidad con el sistema existente
    const raDeg  = (raRad  * 180.0 / Math.PI);
    const decDeg = (decRad * 180.0 / Math.PI);
    const bvSafe = isNaN(bv) ? 0.5 : Math.max(-0.5, Math.min(2.5, bv));

    stars.push([raDeg, decDeg, vmag, bvSafe]);
}

console.log(`Estrellas válidas: ${stars.length}  |  Omitidas: ${skipped}`);

if (stars.length === 0) {
    console.error('No se obtuvieron estrellas. Abortando.');
    process.exit(1);
}

// ── Formato binario ─────────────────────────────────────────────────────────
// Header  : 4 bytes — uint32LE: número de estrellas
// Por star: 16 bytes — 4× float32LE: [ra, dec, mag, bv]
// Total   : 4 + N*16 bytes

const buf = Buffer.alloc(4 + stars.length * 16);
buf.writeUInt32LE(stars.length, 0);

for (let i = 0; i < stars.length; i++) {
    const off = 4 + i * 16;
    buf.writeFloatLE(stars[i][0], off);      // ra  (deg)
    buf.writeFloatLE(stars[i][1], off + 4);  // dec (deg)
    buf.writeFloatLE(stars[i][2], off + 8);  // mag
    buf.writeFloatLE(stars[i][3], off + 12); // bv
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, buf);

const kb = (buf.length / 1024).toFixed(1);
console.log(`\n✓ Generado: ${OUT_PATH}`);
console.log(`  Estrellas: ${stars.length.toLocaleString()}`);
console.log(`  Tamaño   : ${kb} KB`);
console.log(`  Rango mag: ${stars[0][2].toFixed(2)} → ${stars[stars.length-1][2].toFixed(2)}`);
console.log('\nListo. Reinicia el servidor de desarrollo.');
