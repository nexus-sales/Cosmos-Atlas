import fs from 'fs';

// Cargamos los datos descargados
const rawData = fs.readFileSync('C:/Users/ucoip/.gemini/antigravity/brain/740c9be7-78de-4ed1-95e5-188e3ace5eb8/.system_generated/steps/127/content.md', 'utf8');
const jsonStart = rawData.indexOf('{');
const data = JSON.parse(rawData.substring(jsonStart));

// Estrellas actuales para evitar duplicados
const starsText = fs.readFileSync('src/data/stars.ts', 'utf8');
const existingStars = [];
const starRegex = /name:\s*["']([^"']+)["'],\s*ra:\s*([\d.-]+),\s*dec:\s*([\d.-]+)/g;
let match;
while ((match = starRegex.exec(starsText)) !== null) {
    existingStars.push({ name: match[1], ra: parseFloat(match[2]), dec: parseFloat(match[3]) });
}

const newStars = [];
const constellationLines = {};

data.features.forEach(f => {
    const id = f.id;
    const lines = f.geometry.coordinates;
    constellationLines[id] = [];
    
    lines.forEach(segment => {
        for (let i = 0; i < segment.length - 1; i++) {
            const p1 = segment[i];
            const p2 = segment[i+1];
            
            const findOrAdd = (p) => {
                const ra = p[0] < 0 ? p[0] + 360 : p[0];
                const dec = p[1];
                
                // Buscar si ya existe una estrella en esa posición (margen 0.05 grados)
                const found = existingStars.find(s => Math.abs(s.ra - ra) < 0.1 && Math.abs(s.dec - dec) < 0.1);
                if (found) return found.name;
                
                const newFound = newStars.find(s => Math.abs(s.ra - ra) < 0.01 && Math.abs(s.dec - dec) < 0.01);
                if (newFound) return newFound.name;
                
                const name = `${id}-St${newStars.length + 1}`;
                newStars.push({ name, ra, dec, constellation: id });
                return name;
            };
            
            const s1 = findOrAdd(p1);
            const s2 = findOrAdd(p2);
            constellationLines[id].push([s1, s2]);
        }
    });
});

// Guardar los resultados en archivos temporales para inyectarlos
fs.writeFileSync('scratch/new_stars_payload.json', JSON.stringify(newStars, null, 2));
fs.writeFileSync('scratch/constellation_lines_payload.json', JSON.stringify(constellationLines, null, 2));

console.log(`Procesado: ${newStars.length} nuevas estrellas y 88 constelaciones.`);
