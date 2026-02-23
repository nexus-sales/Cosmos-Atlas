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
};

