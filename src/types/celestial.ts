export type CelestialKind = 'star' | 'dso' | 'planet';
export type DSOType = 'galaxy' | 'nebula' | 'cluster';

export interface Star {
    name: string;
    ra: number;
    dec: number;
    mag: number;
    constellation: string;
    desc: string;
    color: string;
    baseSize: number;
}

export interface DSO {
    id: string;
    name: string;
    ra: number;
    dec: number;
    type: DSOType;
    mag: number;
    desc: string;
    color: string;
}

export interface Challenge {
    name: string;
    hint: string;
    fun: string;
    award?: string;
}

export interface Observer {
    lat: number;
    lon: number;
}
