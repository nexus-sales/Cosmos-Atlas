import fs from 'fs';

const starsPath = 'src/data/stars.ts';
const constPath = 'src/data/constellations.ts';

const starsText = fs.readFileSync(starsPath, 'utf8');
const constellationsText = fs.readFileSync(constPath, 'utf8');

const starNames = new Set();
const starMatch = starsText.match(/name:\s*["']([^"']+)["']/g);
if (starMatch) {
    starMatch.forEach(m => {
        const name = m.match(/["']([^"']+)["']/)[1];
        starNames.add(name);
    });
}

const constNames = new Set();
// Find all strings in the CONSTELLATIONS record
const constMatch = constellationsText.match(/["']([^"']+)["']/g);
if (constMatch) {
    constMatch.forEach(m => {
        const name = m.replace(/["']/g, '');
        constNames.add(name);
    });
}

const constellations = [
    'Orion', 'Ursa Major', 'Cassiopeia', 'Leo', 'Scorpius', 'Gemini', 'Cygnus', 'Perseus', 'Taurus', 'Virgo', 'Boötes', 'Sagittarius', 'Aquila', 'Andromeda', 'Pegasus', 'Canis Major', 'Lyra', 'Auriga', 'Ursa Minor', 'Ophiuchus', 'Corvus', 'Crux', 'Aries', 'Cepheus', 'Hercules', 'Canis Minor', 'Centaurus', 'Libra', 'Aquarius', 'Capricornus', 'Cancer', 'Draco', 'Lepus', 'Triangulum', 'Delphinus', 'Sagitta', 'Corona Australis', 'Crater', 'Cetus', 'Pisces', 'Lupus', 'Ara', 'Monoceros', 'Scutum', 'Vulpecula', 'Lacerta', 'Serpens', 'Eridanus', 'Hydra', 'Vela', 'Pavo', 'Triangulum Australe', 'Corona Borealis', 'Carina', 'Puppis', 'Phoenix', 'Piscis Austrinus', 'Grus', 'Sculptor', 'Fornax', 'Horologium', 'Caelum', 'Pictor', 'Dorado', 'Reticulum', 'Hydrus', 'Tucana', 'Indus', 'Microscopium', 'Telescopium', 'Norma', 'Circinus', 'Musca', 'Chamaeleon', 'Volans', 'Apus', 'Mensa', 'Octans', 'Canes Venatici', 'Coma Berenices', 'Leo Minor', 'Lynx', 'Sextans', 'Antlia', 'Pyxis', 'Equuleus', 'Camelopardalis', 'Columba'
];

const missing = [];
for (const name of constNames) {
    if (name.length > 2 && !starNames.has(name) && !constellations.includes(name)) {
        missing.push(name);
    }
}

console.log(JSON.stringify(missing, null, 2));
