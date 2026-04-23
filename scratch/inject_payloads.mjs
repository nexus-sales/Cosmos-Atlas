import fs from 'fs';

const newStars = JSON.parse(fs.readFileSync('scratch/new_stars_payload.json', 'utf8'));
const constellationLines = JSON.parse(fs.readFileSync('scratch/constellation_lines_payload.json', 'utf8'));

// Leer stars.ts actual para mantener las estrellas "hero" (con descripción)
const starsPath = 'src/data/stars.ts';
let starsText = fs.readFileSync(starsPath, 'utf8');

// Buscamos el final del array STARS
const arrayEndIndex = starsText.lastIndexOf('];');

const newStarsBlock = newStars.map(s => {
    return `    { name: "${s.name}", ra: ${s.ra.toFixed(3)}, dec: ${s.dec.toFixed(3)}, mag: 4.5, constellation: "${s.constellation}", desc: "Punto de anclaje oficial de la constelación.", color: "#ffffff", baseSize: 1.2 },`;
}).join('\n');

const updatedStarsText = starsText.substring(0, arrayEndIndex) + newStarsBlock + '\n];\n';
fs.writeFileSync(starsPath, updatedStarsText);

// Actualizar constellations.ts
const constellationsPath = 'src/data/constellations.ts';
let constHeader = 'export const CONSTELLATIONS: Record<string, [string, string][]> = {\n';
let constBody = '';

for (const [id, lines] of Object.entries(constellationLines)) {
    const segments = lines.map(l => `        ["${l[0]}", "${l[1]}"],`).join('\n');
    constBody += `    "${id}": [\n${segments}\n    ],\n`;
}

fs.writeFileSync(constellationsPath, constHeader + constBody + '};\n');

console.log('Actualización masiva completada con éxito.');
