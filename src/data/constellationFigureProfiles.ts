import { CONSTELLATIONS } from '@/data/constellations';

export type FigureMotif = 'human' | 'land-animal' | 'bird' | 'sea-creature' | 'serpent' | 'instrument' | 'vessel' | 'crown' | 'object';

const GROUPS: Record<FigureMotif, readonly string[]> = {
    human: ['Andromeda', 'Aquarius', 'Auriga', 'Boötes', 'Cassiopeia', 'Centaurus', 'Cepheus', 'Gemini', 'Hercules', 'Indus', 'Ophiuchus', 'Orion', 'Perseus', 'Sagittarius', 'Virgo'],
    'land-animal': ['Aries', 'Camelopardalis', 'Cancer', 'Canes Venatici', 'Canis Major', 'Canis Minor', 'Capricornus', 'Chamaeleon', 'Equuleus', 'Leo', 'Leo Minor', 'Lepus', 'Lupus', 'Lynx', 'Monoceros', 'Pegasus', 'Scorpius', 'Taurus', 'Ursa Major', 'Ursa Minor', 'Vulpecula'],
    bird: ['Apus', 'Aquila', 'Columba', 'Corvus', 'Cygnus', 'Grus', 'Pavo', 'Phoenix', 'Tucana'],
    'sea-creature': ['Cetus', 'Delphinus', 'Dorado', 'Hydrus', 'Piscis Austrinus', 'Pisces', 'Volans'],
    serpent: ['Draco', 'Eridanus', 'Hydra', 'Serpens'],
    instrument: ['Caelum', 'Circinus', 'Horologium', 'Lyra', 'Microscopium', 'Norma', 'Pictor', 'Reticulum', 'Sculptor', 'Sextans', 'Telescopium'],
    vessel: ['Carina', 'Puppis', 'Pyxis', 'Vela'],
    crown: ['Corona Australis', 'Corona Borealis'],
    object: ['Antlia', 'Ara', 'Coma Berenices', 'Crater', 'Crux', 'Fornax', 'Lacerta', 'Libra', 'Mensa', 'Musca', 'Octans', 'Sagitta', 'Scutum', 'Triangulum', 'Triangulum Australe'],
};

const MOTIF_COLORS: Record<FigureMotif, string> = {
    human: '#668dd1', 'land-animal': '#4e83a9', bird: '#6b8fc4', 'sea-creature': '#397f9f',
    serpent: '#4d8f82', instrument: '#7b79b5', vessel: '#4f87a0', crown: '#9a7fb8', object: '#657ea7',
};

export interface ConstellationFigureProfile {
    name: string;
    motif: FigureMotif;
    color: string;
    variant: number;
}

function stableVariant(name: string) {
    return [...name].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7) % 4;
}

export const CONSTELLATION_FIGURE_PROFILES: Record<string, ConstellationFigureProfile> = Object.fromEntries(
    Object.keys(CONSTELLATIONS).map((name) => {
        const motif = (Object.entries(GROUPS).find(([, names]) => names.includes(name))?.[0] ?? 'object') as FigureMotif;
        return [name, { name, motif, color: MOTIF_COLORS[motif], variant: stableVariant(name) }];
    }),
);

export function getConstellationFigureProfile(name: string) {
    return CONSTELLATION_FIGURE_PROFILES[name];
}
