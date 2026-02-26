/**
 * Service to resolve celestial object names using CDS Sesame (SIMBAD/NED/VizieR)
 * Documentation: https://cdsweb.u-strasbg.fr/cgi-bin/Sesame
 */

export interface SesameResolution {
    name: string;
    ra: number; // Decimal degrees
    dec: number; // Decimal degrees
    type?: string;
    mag?: number;
    source: 'SIMBAD' | 'NED' | 'VizieR';
}

/**
 * Resolver names via CDS Sesame
 */
export async function resolveObjectName(query: string): Promise<SesameResolution | null> {
    if (!query || query.length < 2) return null;

    try {
        // -oIJ means JSON output
        const url = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oIJ/A?${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();

        // Sesame returns a complex JSON. We look for the first valid resolution.
        // Usually data.Target.Resolver contains the result.
        const target = data.Target;
        if (!target || !target.Resolver) return null;

        // Try SIMBAD first, then NED, then VizieR
        const resolvers = Array.isArray(target.Resolver) ? target.Resolver : [target.Resolver];

        // Sort by priority or just take the first one that has jpos (J2000 position)
        const bestResolver = resolvers.find((r: any) => r.jpos) || resolvers[0];

        if (!bestResolver || !bestResolver.jpos) return null;

        // Position is in "RA Dec" string or components
        // jpos is usually "HH MM SS.ss +DD MM SS.s"
        // But Sesame JSON also provides decimal coordinates in jradeg and jdedeg
        const ra = parseFloat(bestResolver.jradeg);
        const dec = parseFloat(bestResolver.jdedeg);

        if (isNaN(ra) || isNaN(dec)) return null;

        return {
            name: bestResolver.oname || query,
            ra,
            dec,
            type: bestResolver.otype,
            mag: parseFloat(bestResolver.vmag),
            source: bestResolver._name as any
        };
    } catch (error) {
        console.error('Sesame Resolution Error:', error);
        return null;
    }
}
