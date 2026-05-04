/**
 * Canonical planet names for the application.
 * Using UTF-8 characters for correct Spanish localization.
 */
export const PLANET_NAMES = {
    MERCURY: 'Mercurio',
    VENUS: 'Venus',
    MARS: 'Marte',
    JUPITER: 'Júpiter',
    SATURN: 'Saturno',
    URANUS: 'Urano',
    NEPTUNE: 'Neptuno',
    MOON: 'Luna',
    SUN: 'Sol',
} as const;

export type PlanetKey = keyof typeof PLANET_NAMES;
export const PLANET_LIST = Object.values(PLANET_NAMES);

/**
 * Helper to check if a string is a valid planet name.
 */
export const isPlanetName = (name: string): name is typeof PLANET_LIST[number] => {
    return PLANET_LIST.includes(name as any);
};
