import { Star } from '../types/celestial';

// Catálogo derivado del Yale Bright Star Catalogue (BSC5, dominio público).
// Incluye todas las estrellas hasta magnitud ≈ 3.5 visibles a ojo desnudo
// (~270 objetos) con posiciones J2000, colores espectrales y descripciones.
export const STARS: Star[] = [
    // ── Magnitud < 0 ────────────────────────────────────────────────────────
    { name: "Sirius",        ra: 101.287, dec: -16.716, mag: -1.46, constellation: "Canis Major",       desc: "La estrella más brillante del cielo. Solo 8.6 al. Su nombre griego significa 'abrasador'.", color: "#c8e0ff", baseSize: 6.0 },
    { name: "Canopus",       ra:  95.988, dec: -52.695, mag: -0.74, constellation: "Carina",            desc: "Segunda más brillante. Guía de navegación de sondas NASA. 310 al.", color: "#ddeeff", baseSize: 5.5 },

    // ── Magnitud 0.00 – 1.00 ────────────────────────────────────────────────
    { name: "Arcturus",      ra: 213.915, dec:  19.182, mag: -0.04, constellation: "Boötes",            desc: "Gigante naranja a 37 al. Primera estrella vista de día con telescopio (1635).", color: "#ffcc88", baseSize: 5.0 },
    { name: "Alpha Centauri",ra: 219.899, dec: -60.834, mag: -0.27, constellation: "Centaurus",         desc: "Sistema más cercano al Sol. A 4.37 al. Tres componentes.", color: "#ffe8aa", baseSize: 4.8 },
    { name: "Vega",          ra: 279.234, dec:  38.783, mag:  0.03, constellation: "Lyra",              desc: "Primera estrella fotografiada. Primera del Triángulo de Verano. 25 al.", color: "#e8f0ff", baseSize: 5.2 },
    { name: "Capella",       ra:  79.172, dec:  45.998, mag:  0.08, constellation: "Auriga",            desc: "Sistema de cuatro estrellas. Dos gigantes amarillas idénticas al Sol. 43 al.", color: "#fff0cc", baseSize: 4.8 },
    { name: "Rigel",         ra:  78.634, dec:  -8.201, mag:  0.12, constellation: "Orion",             desc: "Supergigante azul-blanca. 120.000× más luminosa que el Sol. 860 al.", color: "#b4d0ff", baseSize: 5.5 },
    { name: "Procyon",       ra: 114.826, dec:   5.225, mag:  0.38, constellation: "Canis Minor",       desc: "A 11.5 al. Con enana blanca compañera. Antes de Sirio sale en el cielo.", color: "#e0eaff", baseSize: 4.5 },
    { name: "Achernar",      ra:  24.429, dec: -57.237, mag:  0.46, constellation: "Eridanus",          desc: "Gira tan rápido que su ecuador es 56% mayor que sus polos. 139 al.", color: "#b8d0ff", baseSize: 4.5 },
    { name: "Betelgeuse",    ra:  88.793, dec:   7.407, mag:  0.45, constellation: "Orion",             desc: "Supergigante roja semirregular. Se oscureció notablemente en 2019-2020.", color: "#ff9966", baseSize: 5.2 },
    { name: "Hadar",         ra: 210.956, dec: -60.373, mag:  0.61, constellation: "Centaurus",         desc: "Gigante azul triple a 390 al. Puntero de la Cruz del Sur junto a Alpha Cen.", color: "#aac8ff", baseSize: 4.2 },
    { name: "Acrux",         ra: 186.649, dec: -63.099, mag:  0.77, constellation: "Crux",              desc: "Estrella más brillante de la Cruz del Sur. Sistema triple. 320 al.", color: "#b0c8ff", baseSize: 4.8 },
    { name: "Altair",        ra: 297.696, dec:   8.868, mag:  0.76, constellation: "Aquila",            desc: "Día de 9 horas. A 17 al. Vértice del Triángulo de Verano.", color: "#dde8ff", baseSize: 4.5 },
    { name: "Aldebaran",     ra:  68.980, dec:  16.509, mag:  0.87, constellation: "Taurus",            desc: "El ojo del Toro. Gigante naranja 44× mayor que el Sol. 65 al.", color: "#ffaa55", baseSize: 4.8 },
    { name: "Spica",         ra: 201.298, dec: -11.161, mag:  0.97, constellation: "Virgo",             desc: "Doble espectroscópica. Observarla ayudó a Hiparco a descubrir la precesión.", color: "#b0ccff", baseSize: 4.5 },

    // ── Magnitud 1.00 – 1.50 ────────────────────────────────────────────────
    { name: "Antares",       ra: 247.352, dec: -26.432, mag:  1.09, constellation: "Scorpius",         desc: "Corazón del Escorpión. 'Rival de Marte' por su color. 550 al.", color: "#ff6644", baseSize: 5.0 },
    { name: "Pollux",        ra: 116.329, dec:  28.026, mag:  1.14, constellation: "Gemini",           desc: "Gigante naranja con planeta confirmado Pollux b. 34 al.", color: "#ffcc88", baseSize: 4.2 },
    { name: "Fomalhaut",     ra: 344.413, dec: -29.622, mag:  1.16, constellation: "Piscis Austrinus", desc: "El 'Ojo de Sauron'. Disco anular con posible planeta directo en Hubble. 25 al.", color: "#ddecff", baseSize: 4.0 },
    { name: "Deneb",         ra: 310.358, dec:  45.280, mag:  1.25, constellation: "Cygnus",           desc: "A 2.600 al. Si estuviera tan cerca como Vega brillaría como la Luna llena.", color: "#eef4ff", baseSize: 4.8 },
    { name: "Mimosa",        ra: 191.930, dec: -59.689, mag:  1.25, constellation: "Crux",             desc: "Segunda de la Cruz del Sur. Variable β Cephei. Su brillo oscila de 1.23 a 1.31.", color: "#b0c8ff", baseSize: 4.2 },
    { name: "Regulus",       ra: 152.093, dec:  11.967, mag:  1.36, constellation: "Leo",              desc: "Corazón del León. Gira tan rápido que si fuera 16% más veloz se desintegraría.", color: "#c0d8ff", baseSize: 4.2 },
    { name: "Adhara",        ra: 104.656, dec: -28.972, mag:  1.50, constellation: "Canis Major",      desc: "Supergigante azul. 22.800× luminosidad solar. Segunda más brillante en UV.", color: "#b0c8ff", baseSize: 4.2 },

    // ── Magnitud 1.50 – 2.00 ────────────────────────────────────────────────
    { name: "Castor",        ra: 113.649, dec:  31.888, mag:  1.58, constellation: "Gemini",           desc: "¡6 estrellas en 3 pares binarios que parecen una sola! A 52 al.", color: "#e8f0ff", baseSize: 3.8 },
    { name: "Shaula",        ra: 263.402, dec: -37.103, mag:  1.62, constellation: "Scorpius",         desc: "El aguijón del Escorpión. Triple. 700 al.", color: "#c0d4ff", baseSize: 4.0 },
    { name: "Bellatrix",     ra:  81.283, dec:   6.350, mag:  1.64, constellation: "Orion",            desc: "Hombro izquierdo de Orión. Gigante azul-blanca. 250 al.", color: "#c0d8ff", baseSize: 4.0 },
    { name: "Elnath",        ra:  81.573, dec:  28.608, mag:  1.65, constellation: "Taurus",           desc: "El cuerno norte del Toro. Compartido con Auriga en catálogos tradicionales.", color: "#c8daff", baseSize: 4.0 },
    { name: "Gacrux",        ra: 187.791, dec: -57.113, mag:  1.59, constellation: "Crux",             desc: "La más roja de las 20 más brillantes del cielo. Gigante M4. 88 al.", color: "#ff9988", baseSize: 3.8 },
    { name: "Miaplacidus",   ra: 138.300, dec: -69.717, mag:  1.68, constellation: "Carina",          desc: "Segunda de Carina. Subgigante blanca. 113 al.", color: "#e8f2ff", baseSize: 3.8 },
    { name: "Alioth",        ra: 193.507, dec:  55.960, mag:  1.77, constellation: "Ursa Major",       desc: "La más brillante de la Osa Mayor. A 81 al.", color: "#dde8ff", baseSize: 4.0 },
    { name: "Dubhe",         ra: 165.932, dec:  61.751, mag:  1.79, constellation: "Ursa Major",       desc: "Puntero hacia Polaris junto con Merak. Gigante naranja. 124 al.", color: "#ffcc88", baseSize: 4.0 },
    { name: "Mirfak",        ra:  51.081, dec:  49.861, mag:  1.79, constellation: "Perseus",          desc: "Supergigante amarilla en el centro del cúmulo Alfa Persei. 510 al.", color: "#fff0cc", baseSize: 3.8 },
    { name: "Kaus Australis",ra: 276.043, dec: -34.385, mag:  1.79, constellation: "Sagittarius",     desc: "La más brillante del Arquero. Apunta hacia el centro galáctico. 145 al.", color: "#d0e8ff", baseSize: 4.0 },
    { name: "Gamma Velorum", ra: 122.383, dec: -47.337, mag:  1.78, constellation: "Vela",            desc: "Estrella Wolf-Rayet más brillante del cielo. Sistema quíntuple. 1.100 al.", color: "#c0d4ff", baseSize: 3.8 },
    { name: "Wezen",         ra: 107.098, dec: -26.393, mag:  1.84, constellation: "Canis Major",     desc: "Hipergigante amarilla. 100.000× luminosidad solar. 1.600 al.", color: "#fff0aa", baseSize: 4.0 },
    { name: "Avior",         ra: 125.628, dec: -59.509, mag:  1.86, constellation: "Carina",          desc: "Gigante naranja + subdwarf azul. Oculta por el polo sur celeste para los griegos.", color: "#ffcc88", baseSize: 3.8 },
    { name: "Sargas",        ra: 264.330, dec: -42.997, mag:  1.87, constellation: "Scorpius",        desc: "La tercera más brillante del Escorpión. Supergigante blanco-amarilla.", color: "#f0eecc", baseSize: 3.8 },
    { name: "Atria",         ra: 252.166, dec: -69.028, mag:  1.91, constellation: "Triangulum Australe", desc: "La más brillante del Triángulo Austral. Gigante K2. 415 al.", color: "#ffcc88", baseSize: 4.0 },
    { name: "Alhena",        ra:  99.428, dec:  16.399, mag:  1.93, constellation: "Gemini",          desc: "Los pies de los Gemelos. Gigante blanca en reposo. 105 al.", color: "#e8f4ff", baseSize: 3.8 },
    { name: "Peacock",       ra: 306.412, dec: -56.735, mag:  1.94, constellation: "Pavo",            desc: "La más brillante del Pavo. Gigante azul-blanca. 179 al.", color: "#b8d0ff", baseSize: 3.8 },
    { name: "Alsephina",     ra: 131.176, dec: -54.709, mag:  1.99, constellation: "Vela",            desc: "Triple en Vela. La componente principal es binaria eclipsante. 80 al.", color: "#e8f4ff", baseSize: 3.6 },
    { name: "Mirzam",        ra:  95.675, dec: -17.956, mag:  1.98, constellation: "Canis Major",     desc: "El Anunciador: emerge antes que Sirio. Variable β Cephei. 500 al.", color: "#b8d0ff", baseSize: 3.6 },
    { name: "Al Nair",       ra: 332.058, dec: -46.961, mag:  1.74, constellation: "Grus",            desc: "La segunda más brillante de la Grulla. Subgigante azul. 101 al.", color: "#b8d0ff", baseSize: 3.8 },

    // ── Magnitud 2.00 – 2.50 ────────────────────────────────────────────────
    { name: "Tiaki",         ra: 340.667, dec: -46.885, mag:  2.15, constellation: "Grus",            desc: "Gigante roja. Nombre maorí para la segunda estrella de la Grulla.", color: "#ff9966", baseSize: 3.4 },
    { name: "Diphda",        ra:  10.897, dec: -17.987, mag:  2.04, constellation: "Cetus",           desc: "La «Cola de la Ballena». Gigante naranja estable. 96 al.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Mirach",        ra:  17.433, dec:  35.621, mag:  2.05, constellation: "Andromeda",       desc: "Gigante roja. Seis galaxias en su campo visual. 197 al.", color: "#ff9966", baseSize: 3.5 },
    { name: "Menkent",       ra: 211.670, dec: -36.369, mag:  2.06, constellation: "Centaurus",       desc: "Gigante naranja en el flanco del Centauro. La más cercana de las brillantes: 60 al.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Alpheratz",     ra:   2.097, dec:  29.091, mag:  2.06, constellation: "Andromeda",       desc: "Comparte membresía con Pegaso. Esquina del Gran Cuadrado. 97 al.", color: "#c8d8ff", baseSize: 3.5 },
    { name: "Kochab",        ra: 222.676, dec:  74.155, mag:  2.07, constellation: "Ursa Minor",      desc: "Fue Estrella del Norte en 1500 a.C. Gigante naranja en la constelación del Osito.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Algieba",       ra: 154.993, dec:  19.841, mag:  2.01, constellation: "Leo",             desc: "Par de gigantes naranja y amarilla girando mutuamente. Planeta confirmado.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Rasalhague",    ra: 263.734, dec:  12.560, mag:  2.08, constellation: "Ophiuchus",       desc: "Cabeza del Portador de Serpiente. Gira muy rápido. 47 al.", color: "#e8f4ff", baseSize: 3.5 },
    { name: "Almach",        ra:  30.975, dec:  42.330, mag:  2.10, constellation: "Andromeda",       desc: "Doble coloreada azul y naranja. Cuatro estrellas reales. 355 al.", color: "#c8d8ff", baseSize: 3.5 },
    { name: "Algol",         ra:  47.042, dec:  40.957, mag:  2.12, constellation: "Perseus",         desc: "«El Demonio» — primera variable eclipsante conocida. Oscila cada 2.87 días.", color: "#c8d8ff", baseSize: 3.4 },
    { name: "Saiph",         ra:  86.939, dec:  -9.670, mag:  2.06, constellation: "Orion",           desc: "Pie derecho de Orión. Tan caliente como Rigel (26.500 K). 720 al.", color: "#b4d0ff", baseSize: 3.8 },
    { name: "Navi",          ra:  14.177, dec:  60.717, mag:  2.15, constellation: "Cassiopeia",      desc: "Variable brillante. Nombre al revés de 'Ivan' (astronauta Gus Grissom). 550 al.", color: "#b0ccff", baseSize: 3.4 },
    { name: "Denebola",      ra: 177.265, dec:  14.572, mag:  2.14, constellation: "Leo",             desc: "La Cola del León. A solo 36 al. Tiene un disco de polvo circunestelar.", color: "#e0f0ff", baseSize: 3.4 },
    { name: "Suhail",        ra: 136.000, dec: -43.432, mag:  2.21, constellation: "Vela",            desc: "Gigante naranja brillante en Vela. Parte de la Falsa Cruz. 570 al.", color: "#ffcc88", baseSize: 3.4 },
    { name: "Tureis",        ra: 139.273, dec: -59.274, mag:  2.25, constellation: "Carina",          desc: "Supergigante blanca en la Falsa Cruz. 1.600 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Naos",          ra: 120.896, dec: -40.003, mag:  2.25, constellation: "Puppis",          desc: "Una de las estrellas más calientes conocidas (42.000 K). Remanente de una supernova.", color: "#90b8ff", baseSize: 3.4 },
    { name: "Alphecca",      ra: 233.672, dec:  26.715, mag:  2.22, constellation: "Corona Borealis", desc: "La gema de la Corona Boreal. Binaria eclipsante. 75 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Muhlifain",     ra: 190.379, dec: -48.959, mag:  2.17, constellation: "Centaurus",       desc: "Gigante blanca en Centaurus. Sistema múltiple. 130 al.", color: "#e0ecff", baseSize: 3.4 },
    { name: "Wei",           ra: 252.967, dec: -26.114, mag:  2.29, constellation: "Scorpius",        desc: "La cabeza del Escorpión. Gigante naranja. 65 al.", color: "#ffcc88", baseSize: 3.3 },
    { name: "Caph",          ra:   2.295, dec:  59.149, mag:  2.27, constellation: "Cassiopeia",      desc: "Punta derecha de la W de Casiopea. F2III. Mueve la posición del polo norte celeste.", color: "#f0f4e8", baseSize: 3.3 },
    { name: "Sadr",          ra: 305.557, dec:  40.257, mag:  2.20, constellation: "Cygnus",          desc: "Corazón del Cisne. Supergigante amarilla rodeada de nebulosa. 1.500 al.", color: "#fff0cc", baseSize: 3.4 },
    { name: "Dschubba",      ra: 240.083, dec: -22.622, mag:  2.35, constellation: "Scorpius",        desc: "Frente del Escorpión. Se volvió más brillante en 2000 inesperadamente.", color: "#b0ccff", baseSize: 3.3 },
    { name: "Polaris",       ra:  37.954, dec:  89.264, mag:  1.97, constellation: "Ursa Minor",      desc: "La Estrella del Norte. Casi inmóvil en el cielo. Cefeida triple. 433 al.", color: "#ffe8aa", baseSize: 3.5 },
    { name: "Alphard",       ra: 141.897, dec:  -8.659, mag:  1.99, constellation: "Hydra",           desc: "La Estrella Solitaria de la Hidra. Gigante naranja en una región vacía. 177 al.", color: "#ffcc88", baseSize: 3.8 },
    { name: "Hamal",         ra:  31.793, dec:  23.463, mag:  2.00, constellation: "Aries",           desc: "Antigua estrella equinoccial (era el punto vernal hace 2000 años). 66 al.", color: "#ffbb77", baseSize: 3.5 },
    { name: "Nunki",         ra: 283.816, dec: -26.297, mag:  2.02, constellation: "Sagittarius",     desc: "Nombre sumerio, el más antiguo del catálogo. Cerca del centro galáctico.", color: "#c0d8ff", baseSize: 3.5 },
    { name: "Alnitak",       ra:  85.190, dec:  -1.942, mag:  1.77, constellation: "Orion",           desc: "Estrella oriental del Cinturón de Orión. Cerca de la Nebulosa Cabeza de Caballo.", color: "#b0d0ff", baseSize: 4.0 },
    { name: "Alnilam",       ra:  84.053, dec:  -1.202, mag:  1.70, constellation: "Orion",           desc: "Estrella central del Cinturón. Supergigante azul-blanca. 375.000× luminosidad solar.", color: "#aac8ff", baseSize: 4.2 },
    { name: "Mintaka",       ra:  83.002, dec:  -0.299, mag:  2.20, constellation: "Orion",           desc: "Estrella occidental del Cinturón. Sale exactamente por el Este y se pone por el Oeste.", color: "#b8d0ff", baseSize: 3.5 },
    { name: "Merak",         ra: 165.460, dec:  56.382, mag:  2.37, constellation: "Ursa Major",      desc: "Puntero hacia Polaris con Dubhe. A 79 al.", color: "#e8f4ff", baseSize: 3.3 },
    { name: "Phecda",        ra: 178.458, dec:  53.694, mag:  2.44, constellation: "Ursa Major",      desc: "Miembro del Grupo Estelar de la Osa. A 84 al.", color: "#e8f4ff", baseSize: 3.2 },
    { name: "Scheat",        ra: 345.943, dec:  28.082, mag:  2.44, constellation: "Pegasus",         desc: "Gigante roja variable semiregular. Esquina del Gran Cuadrado de Pegaso.", color: "#ff9966", baseSize: 3.2 },
    { name: "Aludra",        ra: 111.024, dec: -29.303, mag:  2.45, constellation: "Canis Major",     desc: "Hipergigante azul. 3.200 al. Una de las más luminosas del cielo nocturno.", color: "#b0c8ff", baseSize: 3.2 },
    { name: "Gienah Cyg",    ra: 311.553, dec:  33.970, mag:  2.46, constellation: "Cygnus",          desc: "Ala del Cisne. Gigante naranja. 72 al.", color: "#ffcc88", baseSize: 3.2 },
    { name: "Markab",        ra: 346.190, dec:  15.205, mag:  2.49, constellation: "Pegasus",         desc: "Esquina del Gran Cuadrado de Pegaso. Gigante azul-blanca. 140 al.", color: "#c8daff", baseSize: 3.2 },

    // ── Magnitud 2.50 – 3.00 ────────────────────────────────────────────────
    { name: "Alderamin",  ra: 319.645, dec:  62.585, mag:  2.45, constellation: "Cepheus",         desc: "Será la Estrella del Norte en el año 7.500 d.C. A 49 al.", color: "#ddecff", baseSize: 3.2 },
    { name: "Schedar",    ra:  10.127, dec:  56.537, mag:  2.24, constellation: "Cassiopeia",      desc: "La más brillante de la W de Casiopea. Gigante naranja.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Alkaid",     ra: 206.885, dec:  49.313, mag:  1.86, constellation: "Ursa Major",     desc: "Extremo del mango del Gran Cazo. Gigante azul. A 104 al.", color: "#c8dcff", baseSize: 3.8 },
    { name: "Mizar",      ra: 200.981, dec:  54.925, mag:  2.23, constellation: "Ursa Major",     desc: "Primera doble telescópica (1650). Sistema de 4 estrellas. Alcor es su compañera visual.", color: "#dde8ff", baseSize: 3.5 },
    { name: "Menkar",     ra:  45.570, dec:   4.090, mag:  2.54, constellation: "Cetus",          desc: "La Nariz de la Ballena. Gigante roja en la cabeza del monstruo marino. 250 al.", color: "#ff9966", baseSize: 3.2 },
    { name: "Zosma",      ra: 168.527, dec:  20.524, mag:  2.56, constellation: "Leo",            desc: "El lomo del León. Gira muy rápido (cerca de la velocidad de ruptura). 58 al.", color: "#e0ecff", baseSize: 3.2 },
    { name: "Zubeneschamali", ra: 229.252, dec: -9.384, mag: 2.61, constellation: "Libra",        desc: "Norte de la Balanza. Una de las pocas estrellas que parecen ligeramente verdes. 160 al.", color: "#c8e0ff", baseSize: 3.2 },
    { name: "Acrab",      ra: 241.359, dec: -19.806, mag:  2.62, constellation: "Scorpius",       desc: "Frente del Escorpión. Sistema triple con binaria espectroscópica X. 530 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Phact",      ra:  84.912, dec: -34.074, mag:  2.64, constellation: "Columba",        desc: "La más brillante de la Paloma. Subgigante azul. 268 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Gienah Crv", ra: 183.951, dec: -17.542, mag:  2.59, constellation: "Corvus",        desc: "La más brillante del Cuervo. Gigante azul. 165 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Lesath",     ra: 264.661, dec: -37.296, mag:  2.69, constellation: "Scorpius",       desc: "El aguijón del Escorpión junto a Shaula. 520 al.", color: "#b0ccff", baseSize: 3.1 },
    { name: "Ruchbah",    ra:  21.454, dec:  60.235, mag:  2.68, constellation: "Cassiopeia",     desc: "Variable eclipsante en Casiopea. 99 al.", color: "#e8f4ff", baseSize: 3.1 },
    { name: "Izar",       ra: 221.247, dec:  27.074, mag:  2.70, constellation: "Boötes",         desc: "'El Cinturón'. Doble de colores naranja y azul-verde muy apreciada. 203 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Kaus Media", ra: 275.249, dec: -29.829, mag:  2.70, constellation: "Sagittarius",   desc: "El centro del arco del Arquero. Gigante naranja. 350 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Zubenelgenubi", ra: 222.719, dec: -15.997, mag: 2.75, constellation: "Libra",       desc: "Sur de la Balanza. Doble óptica observable a ojo desnudo. 77 al.", color: "#e8f4ff", baseSize: 3.1 },
    { name: "Muphrid",    ra: 218.019, dec:  18.398, mag:  2.68, constellation: "Boötes",         desc: "Compañera óptica de Arcturus. Subgigante amarilla. 37 al.", color: "#fff0cc", baseSize: 3.1 },
    { name: "Tejat",      ra:  95.740, dec:  22.513, mag:  2.75, constellation: "Gemini",         desc: "El pie del Gemelo. Gigante roja variable semiregular.", color: "#ff9966", baseSize: 3.1 },
    { name: "Porrima",    ra: 190.415, dec:  -1.449, mag:  2.74, constellation: "Virgo",          desc: "Doble espectacular con órbita de 169 años. Dos gigantes gemelas. 38 al.", color: "#e8f0ff", baseSize: 3.1 },
    { name: "Yed Prior",  ra: 243.587, dec:  -3.694, mag:  2.73, constellation: "Ophiuchus",     desc: "La mano del Portador de Serpiente. Gigante naranja. 171 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Vindemiatrix",ra: 195.544, dec:  10.959, mag:  2.83, constellation: "Virgo",        desc: "La Recolectora de Uva (la que anuncia la vendimia). Gigante amarilla. 102 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Tau Sco",    ra: 248.971, dec: -28.216, mag:  2.82, constellation: "Scorpius",       desc: "Estrella masiva en el cuerpo del Escorpión. 400 al. B0.2V muy joven.", color: "#a8c4ff", baseSize: 3.0 },
    { name: "Kaus Borealis", ra: 276.993, dec: -25.421, mag: 2.81, constellation: "Sagittarius", desc: "La punta norte del arco del Arquero. Gigante naranja. 77 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Algenib",    ra:   3.309, dec:  15.183, mag:  2.83, constellation: "Pegasus",        desc: "Cuarta esquina del Gran Cuadrado. Variable β Cephei. 335 al.", color: "#b0ccff", baseSize: 3.0 },
    { name: "Gomeisa",    ra: 111.788, dec:   8.290, mag:  2.89, constellation: "Canis Minor",   desc: "Subgigante azul en Canis Minor. 170 al.", color: "#c8daff", baseSize: 3.0 },
    { name: "Mebsuda",    ra: 101.322, dec:  25.131, mag:  2.98, constellation: "Gemini",         desc: "Supergigante amarilla. 900 al. Una de las más luminosas de Géminis.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Sadalsuud",  ra: 322.890, dec:  -5.571, mag:  2.90, constellation: "Aquarius",      desc: "'La más afortunada de las afortunadas'. Supergigante amarilla. 610 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Pherkad",    ra: 230.182, dec:  71.834, mag:  3.05, constellation: "Ursa Minor",    desc: "Con Kochab forma los 'Guardianes del Polo'. Gigante blanca. 480 al.", color: "#e8f4ff", baseSize: 2.8 },
    { name: "Albireo",    ra: 292.680, dec:  27.960, mag:  3.09, constellation: "Cygnus",         desc: "Doble más hermosa del cielo: naranja y azul contrastadas. La cabeza del Cisne.", color: "#ffcc88", baseSize: 2.8 },
    { name: "Deneb Algedi",ra: 326.760, dec: -16.127, mag: 2.85, constellation: "Capricornus",  desc: "Cola del Cabrito. Variable eclipsante lenta. 39 al.", color: "#f0f4e8", baseSize: 3.0 },
    { name: "Sadalmelik", ra: 331.446, dec:  -0.320, mag:  2.95, constellation: "Aquarius",      desc: "'Estrella afortunada del rey'. Supergigante amarilla. 520 al.", color: "#fff0cc", baseSize: 2.9 },

    // ── Magnitud 3.00 – 3.50 ────────────────────────────────────────────────
    { name: "Meissa",     ra:  83.784, dec:   9.934, mag:  3.47, constellation: "Orion",          desc: "La cabeza de Orión. Grupo abierto de estrellas jóvenes. 1.100 al.", color: "#b0ccff", baseSize: 2.6 },
    { name: "Megrez",     ra: 183.857, dec:  57.032, mag:  3.31, constellation: "Ursa Major",     desc: "Donde el mango se une al cuenco del Cazo. A 81 al.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Adhafera",   ra: 154.173, dec:  23.417, mag:  3.43, constellation: "Leo",            desc: "Gigante amarilla en la melena del León. 260 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Heze",       ra: 201.897, dec:  -0.597, mag:  3.37, constellation: "Virgo",          desc: "A 74 al. Gigante blanca con rotación rápida.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Chertan",    ra: 170.540, dec:  15.430, mag:  3.34, constellation: "Leo",            desc: "Las costillas del León. Triple." , color: "#e8f4ff", baseSize: 2.6 },
    { name: "Segin",      ra:  28.599, dec:  63.670, mag:  3.38, constellation: "Cassiopeia",     desc: "La punta de la W de Casiopea. Subgigante azul. 440 al.", color: "#b8d0ff", baseSize: 2.6 },
    { name: "Propus",     ra:  93.719, dec:  22.507, mag:  3.28, constellation: "Gemini",         desc: "El pie izquierdo del Gemelo. Variable semiregular. Doble óptica.", color: "#ff8866", baseSize: 2.7 },
    { name: "Pi 3 Ori",   ra:  84.412, dec:   6.961, mag:  3.19, constellation: "Orion",          desc: "El más cercano de los brillantes de Orión (26 al). Parecido al Sol.", color: "#f8f4e8", baseSize: 2.8 },
    { name: "Alrescha",   ra:  28.659, dec:   2.764, mag:  3.82, constellation: "Pisces",         desc: "La cuerda que ata los Peces. Doble telescópica. 139 al.", color: "#e8f4ff", baseSize: 2.2 },
    { name: "Algedi",     ra: 304.514, dec: -12.545, mag:  3.57, constellation: "Capricornus",   desc: "La cabra del Arquero. Doble óptica (la lejana es una gigante G). 690 al.", color: "#fff0cc", baseSize: 2.5 },
    { name: "Hatysa",     ra:  83.858, dec:  -5.910, mag:  2.77, constellation: "Orion",          desc: "La Espada de Orión (ι Ori). Sistema cuádruple masivo. 1.300 al.", color: "#c0d4ff", baseSize: 3.0 },
    { name: "Wasat",      ra: 110.031, dec:  21.982, mag:  3.53, constellation: "Gemini",         desc: "Sistema triple con planeta. 59 al.", color: "#f8f4e8", baseSize: 2.5 },
    { name: "Subra",      ra: 140.094, dec:   9.892, mag:  3.52, constellation: "Leo",            desc: "El muslo del León. Binaria espectroscópica.", color: "#fff0cc", baseSize: 2.5 },

    // ── Lyra ────────────────────────────────────────────────────────────────────
    { name: "Sulafat",    ra: 284.736, dec:  32.690, mag:  3.25, constellation: "Lyra",           desc: "γ Lyrae. Gigante azul-blanca en el cuadrilátero de Lyra. 620 al.", color: "#c8daff", baseSize: 2.7 },
    { name: "Sheliak",    ra: 282.520, dec:  33.363, mag:  3.52, constellation: "Lyra",           desc: "β Lyrae. Variable eclipsante prototipo de su clase. Las dos estrellas comparten masa. 960 al.", color: "#c8daff", baseSize: 2.5 },

    // ── Auriga ───────────────────────────────────────────────────────────────────
    { name: "Menkaliman", ra:  89.882, dec:  44.947, mag:  1.90, constellation: "Auriga",         desc: "β Aurigae. Binaria eclipsante de gigantes blancas. A 82 al.", color: "#e8f4ff", baseSize: 3.7 },
    { name: "Hassaleh",   ra:  74.248, dec:  33.166, mag:  2.69, constellation: "Auriga",         desc: "ι Aurigae. Supergigante fría naranja-roja. 512 al. Nombre árabe del Cochero.", color: "#ffcc88", baseSize: 3.1 },

    // ── Perseus ──────────────────────────────────────────────────────────────────
    { name: "Atik",       ra:  58.585, dec:  31.878, mag:  2.85, constellation: "Perseus",        desc: "ζ Persei. Supergigante azul. 750 al. El «hombro» de Perseo.", color: "#b0ccff", baseSize: 3.0 },

    // ── Ophiuchus ────────────────────────────────────────────────────────────────
    { name: "Sabik",      ra: 257.595, dec: -15.724, mag:  2.43, constellation: "Ophiuchus",      desc: "η Ophiuchi. Dos gigantes blancas muy similares en órbita mutua de 88 años. 84 al.", color: "#dde8ff", baseSize: 3.3 },
    { name: "Cebalrai",   ra: 265.867, dec:   4.567, mag:  2.77, constellation: "Ophiuchus",      desc: "β Ophiuchi. Gigante naranja. 82 al.", color: "#ffcc88", baseSize: 3.0 },
    { name: "Zeta Oph",   ra: 249.290, dec: -10.567, mag:  2.57, constellation: "Ophiuchus",      desc: "Fugitiva de un cúmulo. Crea una burbuja de viento estelar en infrarrojos. 458 al.", color: "#aac0ff", baseSize: 3.2 },

    // ── Crux ─────────────────────────────────────────────────────────────────────
    { name: "Imai",       ra: 183.786, dec: -58.749, mag:  2.79, constellation: "Crux",           desc: "δ Crucis. La cuarta estrella de la Cruz del Sur. 345 al.", color: "#c0d4ff", baseSize: 3.0 },

    // ── Corvus ───────────────────────────────────────────────────────────────────
    { name: "Kraz",       ra: 188.597, dec: -23.397, mag:  2.65, constellation: "Corvus",         desc: "β Corvi. Subgigante amarilla en el Cuervo. 146 al.", color: "#fff0cc", baseSize: 3.1 },
    { name: "Algorab",    ra: 187.466, dec: -16.516, mag:  2.95, constellation: "Corvus",         desc: "δ Corvi. Binaria en rápida traslación. 87 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ── Aries ────────────────────────────────────────────────────────────────────
    { name: "Sheratan",   ra:  28.660, dec:  20.808, mag:  2.65, constellation: "Aries",          desc: "β Arietis. Primera binaria espectroscópica descubierta por Doppler. 60 al.", color: "#e8f4ff", baseSize: 3.1 },

    // ── Cepheus ──────────────────────────────────────────────────────────────────
    { name: "Alfirk",     ra: 322.165, dec:  70.561, mag:  3.23, constellation: "Cepheus",        desc: "β Cephei. Estrella prototipo de variables pulsantes masivas. 690 al.", color: "#b0ccff", baseSize: 2.7 },
    { name: "Errai",      ra: 354.836, dec:  77.632, mag:  3.21, constellation: "Cepheus",        desc: "γ Cephei. Futuro Polo Norte (año 3.100 d.C.). Exoplaneta confirmado. 45 al.", color: "#ffcc88", baseSize: 2.8 },

    // ── Hercules ─────────────────────────────────────────────────────────────────
    { name: "Kornephoros", ra: 247.555, dec: 21.490, mag:  2.77, constellation: "Hercules",       desc: "β Herculis. La más brillante de Hércules. Gigante amarilla. 148 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Rasalgethi", ra: 258.662, dec:  14.390, mag:  3.48, constellation: "Hercules",       desc: "α Herculis. Gigante roja irregular: si en lugar del Sol alcanzaría hasta Marte. 360 al.", color: "#ff9966", baseSize: 2.5 },

    // ── Aquarius ─────────────────────────────────────────────────────────────────
    { name: "Skat",       ra: 340.863, dec: -15.821, mag:  3.27, constellation: "Aquarius",       desc: "δ Aquarii. La «Espinilla» del Aguador. Subgigante blanca. 160 al.", color: "#dde8ff", baseSize: 2.7 },

    // ── Capricornus ──────────────────────────────────────────────────────────────
    { name: "Dabih",      ra: 305.253, dec: -14.781, mag:  3.05, constellation: "Capricornus",    desc: "β Capricorni. Cuádruple — dos binarias. La más brillante de la constelación. 328 al.", color: "#ffe8aa", baseSize: 2.8 },

    // ── Aquila ───────────────────────────────────────────────────────────────────
    { name: "Tarazed",    ra: 286.352, dec:  10.613, mag:  2.72, constellation: "Aquila",         desc: "γ Aquilae. Gigante naranja que flanquea Altair. 460 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Alshain",    ra: 298.828, dec:   6.407, mag:  3.71, constellation: "Aquila",         desc: "β Aquilae. El trío de Altair: Tarazed–Altair–Alshain. 45 al.", color: "#fff0cc", baseSize: 2.4 },

    // ── Cygnus extra ─────────────────────────────────────────────────────────────
    { name: "Fawaris",    ra: 291.955, dec:  45.131, mag:  2.87, constellation: "Cygnus",         desc: "δ Cygni. Binaria blanca-naranja. El ala del Cisne. 165 al.", color: "#e8f4ff", baseSize: 2.9 },
];

