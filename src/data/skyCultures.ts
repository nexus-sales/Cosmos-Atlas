import { CONSTELLATIONS } from '@/data/constellations';
import { CONSTELLATION_ART } from '@/data/constellationArt';

export type SkyCultureId = 'western-iau' | 'chinese-classical' | 'navigation' | 'scientific-iau';

export interface SkyAsterism {
    id: string;
    name: string;
    description: string;
    starNames: readonly string[];
}

export interface SkyCultureDefinition {
    id: SkyCultureId;
    name: string;
    shortName: string;
    region: string;
    tradition: string;
    license: string;
    sources: readonly string[];
    artMode: 'western' | 'none';
    constellationLines: typeof CONSTELLATIONS;
    constellationArt: typeof CONSTELLATION_ART;
    asterisms: readonly SkyAsterism[];
}

export const WESTERN_ASTERISMS: readonly SkyAsterism[] = [
    { id: 'summer-triangle', name: 'Triángulo de Verano', description: 'Vega, Deneb y Altair.', starNames: ['Vega', 'Deneb', 'Altair', 'Vega'] },
    { id: 'winter-hexagon', name: 'Hexágono de Invierno', description: 'Recorrido boreal alrededor de Orión.', starNames: ['Capella', 'Aldebaran', 'Rigel', 'Sirius', 'Procyon', 'Pollux', 'Capella'] },
    { id: 'winter-triangle', name: 'Triángulo de Invierno', description: 'Betelgeuse, Sirius y Procyon.', starNames: ['Betelgeuse', 'Sirius', 'Procyon', 'Betelgeuse'] },
    { id: 'great-square', name: 'Gran Cuadrado de Pegaso', description: 'Referencia del cielo otoñal.', starNames: ['Alpheratz', 'Scheat', 'Markab', 'Algenib', 'Alpheratz'] },
    { id: 'big-dipper', name: 'Gran Carro', description: 'Las siete estrellas principales de la Osa Mayor.', starNames: ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'] },
    { id: 'northern-cross', name: 'Cruz del Norte', description: 'Asterismo principal del Cisne.', starNames: ['Deneb', 'Sadr', 'Albireo', 'Sadr'] },
    { id: 'southern-cross', name: 'Cruz del Sur', description: 'Referencia austral de navegación.', starNames: ['Gacrux', 'Acrux', 'Mimosa'] },
] as const;

const CHINESE_ASTERISMS: readonly SkyAsterism[] = [
    { id: 'beidou', name: 'Běidǒu · 北斗', description: 'El Cazo del Norte, parte del recinto púrpura.', starNames: ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'] },
    { id: 'shen', name: 'Shēn · 參', description: 'Las tres estrellas centrales de la mansión Shēn.', starNames: ['Alnitak', 'Alnilam', 'Mintaka'] },
    { id: 'hegu', name: 'Hégǔ · 河鼓', description: 'El Tambor del Río alrededor de Altair.', starNames: ['Tarazed', 'Altair', 'Alshain'] },
] as const;

const NAVIGATION_ASTERISMS: readonly SkyAsterism[] = [
    { id: 'north-pointer', name: 'Punteros del norte', description: 'Merak y Dubhe prolongados hacia Polaris.', starNames: ['Merak', 'Dubhe', 'Polaris'] },
    { id: 'south-cross', name: 'Cruz del Sur', description: 'Eje Gacrux–Acrux para estimar el polo sur celeste.', starNames: ['Gacrux', 'Acrux', 'Mimosa'] },
    { id: 'centaurus-pointers', name: 'Punteros de Centauro', description: 'Alpha Centauri y Hadar apuntan hacia Crux.', starNames: ['Alpha Centauri', 'Hadar', 'Mimosa'] },
    { id: 'summer-navigation', name: 'Triángulo de Verano', description: 'Tres faros boreales muy brillantes.', starNames: ['Vega', 'Deneb', 'Altair', 'Vega'] },
] as const;

export const SKY_CULTURES: readonly SkyCultureDefinition[] = [
    {
        id: 'western-iau', name: 'Occidental IAU', shortName: 'Occidental', region: 'Internacional',
        tradition: 'Las 88 constelaciones oficiales, con figuras grecorromanas y modernas.', artMode: 'western',
        license: 'Ilustraciones originales de Cosmos Atlas; límites IAU acreditados por separado.',
        sources: ['IAU: The Constellations', 'Delporte (1930): Délimitation scientifique des constellations'],
        constellationLines: CONSTELLATIONS, constellationArt: CONSTELLATION_ART, asterisms: WESTERN_ASTERISMS,
    },
    {
        id: 'chinese-classical', name: 'China clásica', shortName: 'China clásica', region: 'Asia oriental',
        tradition: 'Selección introductoria de asterismos tradicionales chinos; no sustituye un atlas histórico completo.', artMode: 'none',
        license: 'Trazados educativos originales sobre el catálogo estelar de Cosmos Atlas.',
        sources: ['Sun & Kistemaker (1997): The Chinese Sky During the Han', 'Stellarium Sky Cultures: Chinese'],
        constellationLines: CONSTELLATIONS, constellationArt: [], asterisms: CHINESE_ASTERISMS,
    },
    {
        id: 'navigation', name: 'Navegación celeste', shortName: 'Navegación', region: 'Global',
        tradition: 'Capa educativa moderna para localizar norte y sur; no representa una cultura histórica.', artMode: 'none',
        license: 'Contenido original de Cosmos Atlas.', sources: ['IHO: celestial navigation principles'],
        constellationLines: CONSTELLATIONS, constellationArt: [], asterisms: NAVIGATION_ASTERISMS,
    },
    {
        id: 'scientific-iau', name: 'IAU científico', shortName: 'IAU científico', region: 'Internacional',
        tradition: 'Vista técnica: líneas y límites oficiales sin figuras mitológicas.', artMode: 'none',
        license: 'Contenido original de Cosmos Atlas; límites IAU acreditados por separado.', sources: ['IAU: The Constellations'],
        constellationLines: CONSTELLATIONS, constellationArt: [], asterisms: [],
    },
] as const;

export const DEFAULT_SKY_CULTURE_ID: SkyCultureId = 'western-iau';

export function getSkyCulture(id: SkyCultureId | string) {
    return SKY_CULTURES.find((culture) => culture.id === id) ?? SKY_CULTURES[0];
}
