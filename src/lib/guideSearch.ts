import { getConstellationDisplayName } from '@/data/constellationNames';
import type { SolarSystemBody } from '@/data/solarSystemCatalog';
import { SOLAR_SYSTEM_EPHEMERIS, buildSolarSystemTarget } from '@/lib/solarSystem';
import { equToHor } from '@/lib/astronomy/transforms';
import type { DSO, Observer, Planet, Star } from '@/types/celestial';

export type SortMode = 'magnitude' | 'altitude';

export type StarWithAlt = Star & { alt: number };
export type DSOWithAlt = DSO & { alt: number };
export type PlanetWithAlt = Planet & { alt: number; phaseInfo?: string };

export interface GuideSearchCatalog {
    stars: Star[];
    dsos: DSO[];
    constellationTargets: Planet[];
    solarSystemBodies: SolarSystemBody[];
}

export interface GuideSearchInput extends GuideSearchCatalog {
    q: string;
    observer: Observer;
    timeMs: number;
    limit: number;
    sortBy: SortMode;
}

export interface GuideSearchResult {
    starList: StarWithAlt[];
    dsoList: DSOWithAlt[];
    planetList: PlanetWithAlt[];
    constellationList: PlanetWithAlt[];
    starTotal: number;
    galaxyTotal: number;
    nebulaTotal: number;
    clusterTotal: number;
    constellationTotal: number;
}

export const EMPTY_GUIDE_SEARCH_RESULT: GuideSearchResult = {
    starList: [],
    dsoList: [],
    planetList: [],
    constellationList: [],
    starTotal: 0,
    galaxyTotal: 0,
    nebulaTotal: 0,
    clusterTotal: 0,
    constellationTotal: 0,
};

export function computeGuideSearch(input: GuideSearchInput): GuideSearchResult {
    const { q, observer, timeMs, limit, sortBy, stars, dsos, constellationTargets, solarSystemBodies } = input;
    const date = new Date(timeMs);
    const matchStar = (s: Star) =>
        s.name.toLowerCase().includes(q) || s.constellation.toLowerCase().includes(q);
    const matchDSO = (d: DSO) =>
        d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
    const matchName = (name: string) => name.toLowerCase().includes(q);

    const sortFn = (a: { mag: number; alt: number }, b: { mag: number; alt: number }) => {
        if (sortBy === 'altitude') return b.alt - a.alt;
        return a.mag - b.mag;
    };

    const allStars = stars
        .filter(matchStar)
        .map(s => ({ ...s, alt: equToHor(s.ra, s.dec, observer.lat, observer.lon, date).alt }))
        .sort(sortFn);

    const allDSOs = dsos
        .filter(matchDSO)
        .map(d => ({ ...d, alt: equToHor(d.ra, d.dec, observer.lat, observer.lon, date).alt }))
        .sort(sortFn);

    const allPlanets = Object.keys(SOLAR_SYSTEM_EPHEMERIS)
        .filter((name) => name !== 'Sol')
        .map((name) => buildSolarSystemTarget(name, date, observer.lat, observer.lon, solarSystemBodies))
        .filter((p): p is PlanetWithAlt => p !== null && matchName(p.name))
        .sort(sortFn);

    const allConstellations = constellationTargets
        .filter(c => matchName(c.name) || matchName(getConstellationDisplayName(c.name)))
        .map(c => ({ ...c, alt: equToHor(c.ra, c.dec, observer.lat, observer.lon, date).alt }))
        .sort((a, b) => {
            if (sortBy === 'altitude') return b.alt - a.alt;
            return getConstellationDisplayName(a.name).localeCompare(getConstellationDisplayName(b.name));
        });

    const galaxies = allDSOs.filter(d => d.type === 'galaxy');
    const nebulae = allDSOs.filter(d => d.type === 'nebula');
    const clusters = allDSOs.filter(d => d.type === 'cluster');

    return {
        starList: allStars.slice(0, limit),
        dsoList: allDSOs,
        planetList: allPlanets,
        constellationList: allConstellations.slice(0, limit),
        starTotal: allStars.length,
        galaxyTotal: galaxies.length,
        nebulaTotal: nebulae.length,
        clusterTotal: clusters.length,
        constellationTotal: allConstellations.length,
    };
}
