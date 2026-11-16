export type CelestialKind = 'star' | 'dso' | 'planet';
export type DSOType = 'galaxy' | 'nebula' | 'cluster';

export interface Planet {
    name: string;
    ra: number;
    dec: number;
    mag: number;
    dist?: number;
    desc: string;
    color: string;
    symbol: string;
    kind: 'planet';
}

export interface Star {
    name: string;
    ra: number;
    dec: number;
    mag: number;
    magnitudeBand?: 'G' | 'V';
    constellation: string;
    desc: string;
    color: string;
    baseSize: number;
    kind?: 'star';
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
    sizeArcmin?: number;
    kind?: 'dso';
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
