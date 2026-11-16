import fs from 'node:fs';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';

// Input is the semicolon-separated OpenNGC database_files/NGC.csv.
const input = process.argv[2] ?? 'scripts/data/OpenNGC.csv.gz';
if (!input) throw new Error('Usage: node scripts/generate-ngc.mjs path/to/NGC.csv');
const bytes = fs.readFileSync(input);
const raw = (input.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8');
const [header, ...lines] = raw.trim().split(/\r?\n/);
const columns = header.split(';');
function coordinate(value, hours = false) {
    const [a, b, c] = value.replace(/^[+-]/, '').split(':').map(Number);
    return (value.startsWith('-') ? -1 : 1) * (a + b / 60 + c / 3600) * (hours ? 15 : 1);
}
const objects = [];
for (const line of lines) {
    const values = line.split(';');
    const row = Object.fromEntries(columns.map((key, i) => [key, values[i]]));
    const match = /^(NGC|IC)(\d+)$/.exec(row.Name);
    const mag = row['V-Mag']?.trim() ? Number(row['V-Mag']) : NaN;
    if (!match || !Number.isFinite(mag) || ['Dup', 'NonEx'].includes(row.Type)) continue;
    const type = ['OCl', 'GCl', 'GClN', 'Cl+N'].includes(row.Type) ? 3
        : ['G', 'GPair', 'GTrpl', 'GGroup'].includes(row.Type) ? 1
            : ['PN', 'Neb', 'HII', 'RfN', 'SNR', 'EmN'].includes(row.Type) ? 2 : 4;
    if (type === 4) continue;
    const ra = coordinate(row.RA, true);
    const dec = coordinate(row.Dec);
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) continue;
    objects.push({ ra, dec, mag, size: Number(row.MajAx) || 0, type,
        packedId: Number(match[2]) | (match[1] === 'IC' ? 0x800000 : 0) });
}
objects.sort((a, b) => a.mag - b.mag || a.packedId - b.packedId);
const buffer = Buffer.alloc(4 + objects.length * 20);
buffer.writeUInt32LE(objects.length, 0);
objects.forEach((obj, i) => {
    const offset = 4 + i * 20;
    [obj.ra, obj.dec, obj.mag, obj.size].forEach((value, j) => buffer.writeFloatLE(value, offset + j * 4));
    buffer.writeUInt8(obj.type, offset + 16);
    buffer.writeUIntLE(obj.packedId, offset + 17, 3);
});
fs.writeFileSync('public/ngc.bin', buffer);
console.log(JSON.stringify({ count: objects.length, inputSha256: crypto.createHash('sha256').update(raw).digest('hex') }));
