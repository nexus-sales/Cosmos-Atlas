export type SesameApiResolution = {
    name: string;
    ra: number;
    dec: number;
    type?: string;
    mag?: number;
    source: 'SIMBAD' | 'NED' | 'VizieR';
};

export function parseSesame(text: string): SesameApiResolution | null {
    const position = text.match(/^%J\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)/m);
    if (!position) return null;
    const ra = Number(position[1]);
    const dec = Number(position[2]);
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) return null;
    const name = text.match(/^%I\.0\s+(.+)$/m)?.[1]?.trim()
        ?? text.match(/^%I\s+(.+)$/m)?.[1]?.trim()
        ?? 'Objeto celeste';
    const type = text.match(/^%C\.0\s+(.+)$/m)?.[1]?.trim();
    const magnitude = text.match(/^%M\.V\s+([+-]?\d+(?:\.\d+)?)/m)?.[1];
    const resolver = text.match(/^#=([SNV])/m)?.[1];
    return {
        name, ra, dec, type,
        ...(magnitude ? { mag: Number(magnitude) } : {}),
        source: resolver === 'N' ? 'NED' : resolver === 'V' ? 'VizieR' : 'SIMBAD',
    };
}
