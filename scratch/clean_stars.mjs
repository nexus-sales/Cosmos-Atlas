import fs from 'fs';

const filePath = 'src/data/stars.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const seenNames = new Set();
const uniqueLines = [];
let removedCount = 0;

// Preservamos el header (imports y apertura de array)
uniqueLines.push(lines[0], lines[1], lines[2], lines[3], lines[4], lines[5]);

for (let i = 6; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/name:\s*\"([^\"]+)\"/);
    
    if (nameMatch) {
        const name = nameMatch[1];
        if (seenNames.has(name)) {
            removedCount++;
            continue; // Saltamos esta línea (duplicado)
        }
        seenNames.add(name);
    }
    uniqueLines.push(line);
}

fs.writeFileSync(filePath, uniqueLines.join('\n'));
console.log(`Limpieza completada. Estrellas duplicadas eliminadas: ${removedCount}`);
