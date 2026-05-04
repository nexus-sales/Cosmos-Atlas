import fs from 'fs';

const starsText = fs.readFileSync('src/data/stars.ts', 'utf8');
const constellationsText = fs.readFileSync('src/data/constellations.ts', 'utf8');

const starNames = new Set();
const starRegex = /name:\s*["']([^"']+)["']/g;
let match;
while ((match = starRegex.exec(starsText)) !== null) {
    starNames.add(match[1]);
}

// Extract constellation segments
const constRegex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
let cMatch;
const missing = [];
while ((cMatch = constRegex.exec(constellationsText)) !== null) {
    const cName = cMatch[1];
    const segmentText = cMatch[2];
    const segmentRegex = /\[\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\]/g;
    let sMatch;
    while ((sMatch = segmentRegex.exec(segmentText)) !== null) {
        const s1 = sMatch[1];
        const s2 = sMatch[2];
        if (!starNames.has(s1)) missing.push({ constellation: cName, star: s1 });
        if (!starNames.has(s2)) missing.push({ constellation: cName, star: s2 });
    }
}

console.log(JSON.stringify(missing, null, 2));
