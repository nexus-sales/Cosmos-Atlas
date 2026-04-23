import fs from 'fs';

const starsText = fs.readFileSync('src/data/stars.ts', 'utf8');
const constellationsText = fs.readFileSync('src/data/constellations.ts', 'utf8');

const starNames = new Set();
const starRegex = /name:\s*["']([^"']+)["']/g;
let match;
while ((match = starRegex.exec(starsText)) !== null) {
    starNames.add(match[1]);
}

const constStrings = constellationsText.match(/["']([^"']+)["']/g);
const missing = new Set();
const ignore = ['Orion', 'Ursa Major', 'Cassiopeia', 'Leo', 'Scorpius', 'Gemini', 'Cygnus', 'Perseus', 'Taurus', 'Virgo', 'Boötes', 'Sagittarius', 'Aquila', 'Andromeda', 'Pegasus', 'Canis Major', 'Lyra', 'Auriga', 'Ursa Minor', 'Ophiuchus', 'Corvus', 'Crux', 'Aries', 'Cepheus', 'Hercules', 'Canis Minor', 'Centaurus', 'Libra', 'Aquarius', 'Capricornus', 'Cancer', 'Draco', 'Lepus', 'Triangulum', 'Delphinus', 'Sagitta', 'Corona Australis', 'Crater', 'Cetus', 'Pisces', 'Lupus', 'Ara', 'Monoceros', 'Scutum', 'Vulpecula', 'Lacerta', 'Serpens', 'Eridanus', 'Hydra', 'Vela', 'Pavo', 'Triangulum Australe', 'Corona Borealis', 'Carina', 'Puppis', 'Phoenix', 'Piscis Austrinus', 'Grus', 'Sculptor', 'Fornax', 'Horologium', 'Caelum', 'Pictor', 'Dorado', 'Reticulum', 'Hydrus', 'Tucana', 'Indus', 'Microscopium', 'Telescopium', 'Norma', 'Circinus', 'Musca', 'Chamaeleon', 'Volans', 'Apus', 'Mensa', 'Octans', 'Canes Venatici', 'Coma Berenices', 'Leo Minor', 'Lynx', 'Sextans', 'Antlia', 'Pyxis', 'Equuleus', 'Camelopardalis', 'Columba', 'Columba'];

if (constStrings) {
    constStrings.forEach(s => {
        const name = s.replace(/["']/g, '');
        if (name.length > 2 && !starNames.has(name) && !ignore.includes(name)) {
            missing.add(name);
        }
    });
}

console.log(Array.from(missing));
