import fs from 'fs';

const filePath = 'src/data/stars.ts';
const content = fs.readFileSync(filePath, 'utf8');

const stars = [];
const matches = content.matchAll(/\{ name: \"([^\"]+)\", ra: ([\d.-]+), dec: ([\d.-]+)/g);
for (const m of matches) {
    stars.push({ name: m[1], ra: parseFloat(m[2]), dec: parseFloat(m[3]) });
}

const posMap = new Map();
const nameMap = new Map();
const duplicates = [];

stars.forEach(s => {
    // Check name
    if (nameMap.has(s.name)) {
        duplicates.push(`Nombre duplicado: ${s.name}`);
    }
    nameMap.set(s.name, true);

    // Check position (precision of 0.001 degrees)
    const posKey = `${s.ra.toFixed(3)},${s.dec.toFixed(3)}`;
    if (posMap.has(posKey)) {
        duplicates.push(`Posición duplicada: ${posKey} (${posMap.get(posKey)} y ${s.name})`);
    } else {
        posMap.set(posKey, s.name);
    }
});

if (duplicates.length > 0) {
    console.log('--- DUPLICADOS ENCONTRADOS ---');
    duplicates.forEach(d => console.log(d));
} else {
    console.log('No se encontraron duplicados por nombre ni por posición.');
}
