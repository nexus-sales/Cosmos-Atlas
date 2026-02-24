// Líneas de constelación: cada entry es [estrella_inicio, estrella_fin].
// Los nombres deben coincidir exactamente con los de data/stars.ts.
export const CONSTELLATIONS: Record<string, [string, string][]> = {
    "Orion": [
        ["Betelgeuse", "Bellatrix"],
        ["Bellatrix", "Mintaka"],
        ["Mintaka", "Alnilam"],
        ["Alnilam", "Alnitak"],
        ["Alnitak", "Saiph"],
        ["Mintaka", "Rigel"],
        ["Rigel", "Saiph"],
        ["Alnilam", "Betelgeuse"],
        ["Betelgeuse", "Meissa"],
        ["Meissa", "Bellatrix"],
        ["Alnitak", "Hatysa"],
    ],
    "Ursa Major": [
        ["Dubhe", "Merak"],
        ["Merak", "Phecda"],
        ["Phecda", "Megrez"],
        ["Megrez", "Alioth"],
        ["Alioth", "Mizar"],
        ["Mizar", "Alkaid"],
        ["Megrez", "Dubhe"],
    ],
    "Cassiopeia": [
        ["Caph", "Schedar"],
        ["Schedar", "Navi"],
        ["Navi", "Ruchbah"],
        ["Ruchbah", "Segin"],
    ],
    "Leo": [
        ["Regulus", "Algieba"],
        ["Algieba", "Adhafera"],
        ["Adhafera", "Chertan"],
        ["Chertan", "Denebola"],
        ["Regulus", "Subra"],
        ["Denebola", "Zosma"],
        ["Zosma", "Chertan"],
    ],
    "Scorpius": [
        ["Antares", "Dschubba"],
        ["Dschubba", "Acrab"],
        ["Antares", "Wei"],
        ["Wei", "Sargas"],
        ["Sargas", "Shaula"],
        ["Shaula", "Lesath"],
        ["Antares", "Tau Sco"],
    ],
    "Gemini": [
        ["Castor", "Pollux"],
        ["Castor", "Alhena"],
        ["Pollux", "Alhena"],
        ["Castor", "Mebsuda"],
        ["Castor", "Tejat"],
        ["Castor", "Propus"],
    ],
    "Cygnus": [
        ["Deneb",     "Sadr"],
        ["Sadr",      "Albireo"],
        ["Sadr",      "Gienah Cyg"],
        ["Sadr",      "Fawaris"],
        ["Fawaris",   "Deneb"],
    ],
    "Perseus": [
        ["Mirfak", "Algol"],
        ["Mirfak", "Atik"],
        ["Algol",  "Atik"],
    ],
    "Taurus": [
        ["Aldebaran", "Elnath"],
    ],
    "Virgo": [
        ["Spica",  "Porrima"],
        ["Porrima", "Vindemiatrix"],
        ["Spica",  "Heze"],
    ],
    "Boötes": [
        ["Arcturus", "Muphrid"],
        ["Arcturus", "Izar"],
        ["Izar",     "Muphrid"],
    ],
    "Sagittarius": [
        ["Kaus Australis", "Kaus Media"],
        ["Kaus Media", "Kaus Borealis"],
        ["Nunki", "Kaus Media"],
    ],
    "Aquila": [
        ["Tarazed", "Altair"],
        ["Altair",  "Alshain"],
    ],
    "Andromeda": [
        ["Alpheratz", "Mirach"],
        ["Mirach", "Almach"],
    ],
    "Pegasus": [
        ["Alpheratz", "Scheat"],
        ["Scheat", "Markab"],
        ["Markab", "Algenib"],
        ["Algenib", "Alpheratz"],
    ],
    "Canis Major": [
        ["Sirius", "Mirzam"],
        ["Sirius", "Adhara"],
        ["Sirius", "Wezen"],
        ["Wezen",  "Aludra"],
        ["Wezen",  "Adhara"],
    ],

    // ── Nuevas constelaciones ─────────────────────────────────────────────────────

    "Lyra": [
        ["Vega",    "Sheliak"],
        ["Sheliak", "Sulafat"],
        ["Sulafat", "Vega"],
        ["Sheliak", "Sulafat"],
    ],

    "Auriga": [
        ["Capella",    "Menkaliman"],
        ["Menkaliman", "Elnath"],
        ["Elnath",     "Hassaleh"],
        ["Hassaleh",   "Capella"],
        ["Capella",    "Hassaleh"],
    ],

    "Ursa Minor": [
        ["Polaris", "Kochab"],
        ["Kochab",  "Pherkad"],
    ],

    "Ophiuchus": [
        ["Rasalhague", "Cebalrai"],
        ["Cebalrai",   "Yed Prior"],
        ["Yed Prior",  "Zeta Oph"],
        ["Zeta Oph",   "Sabik"],
        ["Sabik",      "Rasalhague"],
    ],

    "Corvus": [
        ["Gienah Crv", "Kraz"],
        ["Kraz",       "Algorab"],
        ["Algorab",    "Gienah Crv"],
    ],

    "Crux": [
        ["Gacrux", "Acrux"],
        ["Mimosa", "Imai"],
    ],

    "Aries": [
        ["Hamal",   "Sheratan"],
    ],

    "Cepheus": [
        ["Alderamin", "Alfirk"],
        ["Alfirk",    "Errai"],
        ["Errai",     "Alderamin"],
    ],

    "Hercules": [
        ["Kornephoros", "Rasalgethi"],
    ],

    "Canis Minor": [
        ["Procyon", "Gomeisa"],
    ],

    "Centaurus": [
        ["Alpha Centauri", "Hadar"],
        ["Hadar",          "Muhlifain"],
        ["Muhlifain",      "Menkent"],
        ["Menkent",        "Alpha Centauri"],
    ],

    "Libra": [
        ["Zubeneschamali", "Zubenelgenubi"],
    ],

    "Aquarius": [
        ["Sadalsuud",  "Sadalmelik"],
        ["Sadalmelik", "Skat"],
    ],

    "Capricornus": [
        ["Algedi",      "Dabih"],
        ["Dabih",       "Deneb Algedi"],
    ],

    // ══════════════════════════════════════════════════════════════════════════════
    // CONSTELACIONES ADICIONALES
    // ══════════════════════════════════════════════════════════════════════════════

    // ── Draco (El Dragón) ──────────────────────────────────────────────────────────
    "Draco": [
        ["Eltanin", "Rastaban"],
        ["Rastaban", "Grumium"],
        ["Grumium", "Chi Dra"],
        ["Eltanin", "Aldhibah"],
        ["Aldhibah", "Athebyne"],
        ["Athebyne", "Edasich"],
        ["Edasich", "Thuban"],
        ["Thuban", "Giausar"],
    ],

    // ── Lepus (La Liebre) ──────────────────────────────────────────────────────────
    "Lepus": [
        ["Arneb", "Nihal"],
        ["Nihal", "Epsilon Lep"],
        ["Arneb", "Mu Lep"],
    ],

    // ── Triangulum (El Triángulo) ──────────────────────────────────────────────────
    "Triangulum": [
        ["Mothallah", "Deltotum"],
        ["Deltotum", "Gamma Tri"],
        ["Gamma Tri", "Mothallah"],
    ],

    // ── Delphinus (El Delfín) ──────────────────────────────────────────────────────
    "Delphinus": [
        ["Sualocin", "Rotanev"],
        ["Rotanev", "Delta Del"],
        ["Delta Del", "Gamma Del"],
        ["Gamma Del", "Sualocin"],
    ],

    // ── Sagitta (La Flecha) ────────────────────────────────────────────────────────
    "Sagitta": [
        ["Alpha Sge", "Delta Sge"],
        ["Delta Sge", "Gamma Sge"],
    ],

    // ── Corona Australis (La Corona Austral) ───────────────────────────────────────
    "Corona Australis": [
        ["Meridiana", "Beta CrA"],
        ["Beta CrA", "Gamma CrA"],
    ],

    // ── Crater (La Copa) ───────────────────────────────────────────────────────────
    "Crater": [
        ["Alkes", "Delta Crt"],
        ["Delta Crt", "Gamma Crt"],
        ["Gamma Crt", "Beta Crt"],
        ["Beta Crt", "Alkes"],
    ],

    // ── Cetus (La Ballena) ─────────────────────────────────────────────────────────
    "Cetus": [
        ["Menkar", "Diphda"],
        ["Menkar", "Mira"],
        ["Diphda", "Iota Cet"],
        ["Mira", "Baten Kaitos"],
        ["Baten Kaitos", "Tau Cet"],
    ],

    // ── Pisces (Los Peces) ─────────────────────────────────────────────────────────
    "Pisces": [
        ["Alrescha", "Eta Psc"],
        ["Eta Psc", "Gamma Psc"],
        ["Gamma Psc", "Omega Psc"],
    ],

    // ── Lupus (El Lobo) ────────────────────────────────────────────────────────────
    "Lupus": [
        ["Alpha Lup", "Beta Lup"],
        ["Beta Lup", "Gamma Lup"],
        ["Gamma Lup", "Delta Lup"],
        ["Delta Lup", "Epsilon Lup"],
    ],

    // ── Ara (El Altar) ─────────────────────────────────────────────────────────────
    "Ara": [
        ["Beta Ara", "Alpha Ara"],
        ["Alpha Ara", "Zeta Ara"],
        ["Zeta Ara", "Gamma Ara"],
        ["Gamma Ara", "Delta Ara"],
    ],

    // ── Monoceros (El Unicornio) ───────────────────────────────────────────────────
    "Monoceros": [
        ["Alpha Mon", "Delta Mon"],
        ["Delta Mon", "Beta Mon"],
        ["Beta Mon", "Gamma Mon"],
    ],

    // ── Scutum (El Escudo) ─────────────────────────────────────────────────────────
    "Scutum": [
        ["Alpha Sct", "Beta Sct"],
    ],

    // ── Vulpecula (La Zorra) ───────────────────────────────────────────────────────
    "Vulpecula": [
        ["Anser", "Anser"], // Constelación pequeña de una estrella principal
    ],

    // ── Lacerta (El Lagarto) ───────────────────────────────────────────────────────
    "Lacerta": [
        ["Alpha Lac", "Alpha Lac"], // Constelación pequeña
    ],

    // ── Serpens (La Serpiente) ─────────────────────────────────────────────────────
    "Serpens": [
        ["Unukalhai", "Mu Ser"],
        ["Mu Ser", "Xi Ser"],
        ["Xi Ser", "Eta Ser"],
    ],

    // ── Eridanus (El Río Erídano) ──────────────────────────────────────────────────
    "Eridanus": [
        ["Cursa", "Zaurak"],
        ["Zaurak", "Rana"],
        ["Rana", "Azha"],
        ["Azha", "Theta1 Eri"],
        ["Theta1 Eri", "Achernar"],
    ],

    // ── Hydra (La Hidra) ───────────────────────────────────────────────────────────
    "Hydra": [
        ["Delta Hya", "Epsilon Hya"],
        ["Epsilon Hya", "Zeta Hya"],
        ["Zeta Hya", "Gamma Hya"],
        ["Gamma Hya", "Alphard"],
        ["Alphard", "Nu Hya"],
        ["Nu Hya", "Pi Hya"],
    ],

    // ── Vela (Las Velas) ───────────────────────────────────────────────────────────
    "Vela": [
        ["Gamma Velorum", "Delta Vel"],
        ["Delta Vel", "Kappa Vel"],
        ["Kappa Vel", "Phi Vel"],
        ["Phi Vel", "Mu Vel"],
        ["Suhail", "Gamma Velorum"],
    ],

    // ── Pavo (El Pavo Real) ────────────────────────────────────────────────────────
    "Pavo": [
        ["Peacock", "Beta Pav"],
        ["Beta Pav", "Delta Pav"],
        ["Peacock", "Eta Pav"],
    ],

    // ── Triangulum Australe (El Triángulo Austral) ─────────────────────────────────
    "Triangulum Australe": [
        ["Atria", "Beta TrA"],
        ["Beta TrA", "Gamma TrA"],
        ["Gamma TrA", "Atria"],
    ],

    // ── Corona Borealis (La Corona Boreal) ─────────────────────────────────────────
    "Corona Borealis": [
        ["Alphecca", "Nusakan"],
        ["Nusakan", "Gamma CrB"],
        ["Gamma CrB", "Delta CrB"],
        ["Delta CrB", "Theta CrB"],
    ],

    // ── Carina (La Quilla) ─────────────────────────────────────────────────────────
    "Carina": [
        ["Canopus", "Miaplacidus"],
        ["Miaplacidus", "Avior"],
        ["Avior", "Tureis"],
        ["Tureis", "Iota Car"],
        ["Iota Car", "Theta Car"],
        ["Theta Car", "Upsilon Car"],
    ],

    // ── Puppis (La Popa) ───────────────────────────────────────────────────────────
    "Puppis": [
        ["Naos", "Pi Pup"],
        ["Pi Pup", "Rho Pup"],
        ["Rho Pup", "Tau Pup"],
        ["Tau Pup", "Nu Pup"],
        ["Nu Pup", "Sigma Pup"],
    ],

    // ── Phoenix (El Fénix) ─────────────────────────────────────────────────────────
    "Phoenix": [
        ["Ankaa", "Beta Phe"],
        ["Beta Phe", "Gamma Phe"],
    ],

    // ── Piscis Austrinus (El Pez Austral) ──────────────────────────────────────────
    "Piscis Austrinus": [
        ["Fomalhaut", "Fomalhaut"], // Constelación centrada en su estrella principal
    ],

    // ── Grus (La Grulla) ───────────────────────────────────────────────────────────
    "Grus": [
        ["Al Nair", "Tiaki"],
    ],

    // ── Sculptor (El Escultor) ─────────────────────────────────────────────────────
    "Sculptor": [
        ["Alpha Scl", "Alpha Scl"], // Constelación tenue
    ],

    // ── Fornax (El Horno) ──────────────────────────────────────────────────────────
    "Fornax": [
        ["Alpha For", "Alpha For"],
    ],

    // ── Horologium (El Reloj) ──────────────────────────────────────────────────────
    "Horologium": [
        ["Alpha Hor", "Alpha Hor"],
    ],

    // ── Caelum (El Buril) ──────────────────────────────────────────────────────────
    "Caelum": [
        ["Alpha Cae", "Alpha Cae"],
    ],

    // ── Pictor (El Caballete del Pintor) ───────────────────────────────────────────
    "Pictor": [
        ["Alpha Pic", "Beta Pic"],
    ],

    // ── Dorado (El Pez Dorado) ─────────────────────────────────────────────────────
    "Dorado": [
        ["Alpha Dor", "Beta Dor"],
    ],

    // ── Reticulum (El Retículo) ────────────────────────────────────────────────────
    "Reticulum": [
        ["Alpha Ret", "Beta Ret"],
    ],

    // ── Hydrus (La Hidra Macho) ────────────────────────────────────────────────────
    "Hydrus": [
        ["Beta Hyi", "Alpha Hyi"],
        ["Alpha Hyi", "Gamma Hyi"],
        ["Gamma Hyi", "Beta Hyi"],
    ],

    // ── Tucana (El Tucán) ──────────────────────────────────────────────────────────
    "Tucana": [
        ["Alpha Tuc", "Beta Tuc"],
        ["Beta Tuc", "Gamma Tuc"],
    ],

    // ── Indus (El Indio) ───────────────────────────────────────────────────────────
    "Indus": [
        ["Alpha Ind", "Beta Ind"],
    ],

    // ── Microscopium (El Microscopio) ──────────────────────────────────────────────
    "Microscopium": [
        ["Gamma Mic", "Gamma Mic"],
    ],

    // ── Telescopium (El Telescopio) ────────────────────────────────────────────────
    "Telescopium": [
        ["Alpha Tel", "Alpha Tel"],
    ],

    // ── Norma (La Escuadra) ────────────────────────────────────────────────────────
    "Norma": [
        ["Gamma2 Nor", "Gamma2 Nor"],
    ],

    // ── Circinus (El Compás) ───────────────────────────────────────────────────────
    "Circinus": [
        ["Alpha Cir", "Alpha Cir"],
    ],

    // ── Musca (La Mosca) ───────────────────────────────────────────────────────────
    "Musca": [
        ["Alpha Mus", "Beta Mus"],
        ["Beta Mus", "Delta Mus"],
        ["Delta Mus", "Gamma Mus"],
        ["Gamma Mus", "Alpha Mus"],
    ],

    // ── Chamaeleon (El Camaleón) ───────────────────────────────────────────────────
    "Chamaeleon": [
        ["Alpha Cha", "Gamma Cha"],
        ["Gamma Cha", "Beta Cha"],
    ],

    // ── Volans (El Pez Volador) ────────────────────────────────────────────────────
    "Volans": [
        ["Gamma Vol", "Beta Vol"],
        ["Beta Vol", "Zeta Vol"],
        ["Zeta Vol", "Delta Vol"],
    ],

    // ── Apus (El Ave del Paraíso) ──────────────────────────────────────────────────
    "Apus": [
        ["Alpha Aps", "Gamma Aps"],
        ["Gamma Aps", "Beta Aps"],
    ],

    // ── Mensa (La Mesa) ────────────────────────────────────────────────────────────
    "Mensa": [
        ["Alpha Men", "Alpha Men"],
    ],

    // ── Octans (El Octante) ────────────────────────────────────────────────────────
    "Octans": [
        ["Nu Oct", "Nu Oct"],
    ],

    // ── Canes Venatici (Los Perros de Caza) ────────────────────────────────────────
    "Canes Venatici": [
        ["Cor Caroli", "Chara"],
    ],

    // ── Coma Berenices (La Cabellera de Berenice) ──────────────────────────────────
    "Coma Berenices": [
        ["Diadem", "Beta Com"],
    ],

    // ── Leo Minor (El León Menor) ──────────────────────────────────────────────────
    "Leo Minor": [
        ["Praecipua", "Praecipua"],
    ],

    // ── Lynx (El Lince) ────────────────────────────────────────────────────────────
    "Lynx": [
        ["Alpha Lyn", "Alpha Lyn"],
    ],

    // ── Sextans (El Sextante) ──────────────────────────────────────────────────────
    "Sextans": [
        ["Alpha Sex", "Alpha Sex"],
    ],

    // ── Antlia (La Máquina Neumática) ──────────────────────────────────────────────
    "Antlia": [
        ["Alpha Ant", "Alpha Ant"],
    ],

    // ── Pyxis (La Brújula) ─────────────────────────────────────────────────────────
    "Pyxis": [
        ["Alpha Pyx", "Beta Pyx"],
        ["Beta Pyx", "Gamma Pyx"],
    ],

    // ── Equuleus (El Caballito) ────────────────────────────────────────────────────
    "Equuleus": [
        ["Kitalpha", "Kitalpha"],
    ],

    // ── Camelopardalis (La Jirafa) ─────────────────────────────────────────────────
    "Camelopardalis": [
        ["Beta Cam", "Alpha Cam"],
    ],
};

