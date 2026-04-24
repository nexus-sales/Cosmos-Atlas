import fs from 'fs';

const csvPath = 'C:/Users/ucoip/.gemini/antigravity/brain/740c9be7-78de-4ed1-95e5-188e3ace5eb8/.system_generated/steps/184/content.md';
const rawData = fs.readFileSync(csvPath, 'utf8');

// Saltamos el header de d3-celestial y el header del CSV
const lines = rawData.split('\n');
const startLine = lines.findIndex(l => l.startsWith('Name;Type;RA;Dec;'));
const dataLines = lines.slice(startLine + 1);

function parseRA(raStr) {
    if (!raStr) return 0;
    const parts = raStr.split(':');
    const h = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parseFloat(parts[2]) || 0;
    return (h + m / 60 + s / 3600) * 15;
}

function parseDec(decStr) {
    if (!decStr) return 0;
    const sign = decStr.startsWith('-') ? -1 : 1;
    const clean = decStr.replace(/[+-]/, '');
    const parts = clean.split(':');
    const d = parseFloat(parts[0]) || 0;
    const m = parseFloat(parts[1]) || 0;
    const s = parseFloat(parts[2]) || 0;
    return sign * (d + m / 60 + s / 3600);
}

const objects = [];

dataLines.forEach(line => {
    if (!line.trim()) return;
    const cols = line.split(';');
    if (cols.length < 10) return;

    const typeStr = cols[1];
    const ra = parseRA(cols[2]);
    const dec = parseDec(cols[3]);
    let mag = parseFloat(cols[9]) || parseFloat(cols[8]) || 15.0; // V-Mag o B-Mag o 15
    const size = parseFloat(cols[5]) || 2.0; // MajAx o 2 arcmin por defecto

    // Tipos: 1: Galaxy, 2: Nebula, 3: Cluster, 4: Other
    let type = 4;
    if (typeStr === 'G' || typeStr.includes('G')) type = 1;
    else if (['PN', 'Neb', 'HII', 'RfN', 'SNR'].includes(typeStr)) type = 2;
    else if (['OCl', 'GCl'].includes(typeStr)) type = 3;
    
    // Ignorar duplicados o inexistentes
    if (['Dup', 'NonEx'].includes(typeStr)) return;

    objects.push({ ra, dec, mag, size, type });
});

// Limitar a los 10,000 objetos más brillantes para no saturar memoria móvil
objects.sort((a, b) => a.mag - b.mag);
const finalObjects = objects.slice(0, 10000);

const buffer = Buffer.alloc(4 + finalObjects.length * 20);
buffer.writeUInt32LE(finalObjects.length, 0);

finalObjects.forEach((obj, i) => {
    const off = 4 + i * 20;
    buffer.writeFloatLE(obj.ra, off);
    buffer.writeFloatLE(obj.dec, off + 4);
    buffer.writeFloatLE(obj.mag, off + 8);
    buffer.writeFloatLE(obj.size, off + 12);
    buffer.writeUInt8(obj.type, off + 16);
});

fs.writeFileSync('public/ngc.bin', buffer);
console.log(`Generado ngc.bin con ${finalObjects.length} objetos reales.`);
