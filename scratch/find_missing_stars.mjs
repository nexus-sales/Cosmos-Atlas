import { CONSTELLATIONS } from './src/data/constellations';
import { STARS } from './src/data/stars';

const starNames = new Set(STARS.map(s => s.name));
const missingStars = new Set();

for (const lines of Object.values(CONSTELLATIONS)) {
    for (const [start, end] of lines) {
        if (!starNames.has(start)) missingStars.add(start);
        if (!starNames.has(end)) missingStars.add(end);
    }
}

console.log(Array.from(missingStars));
