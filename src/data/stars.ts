import { Star } from '../types/celestial';

// Catálogo derivado del Yale Bright Star Catalogue (BSC5, dominio público).
// Incluye todas las estrellas hasta magnitud ≈ 3.5 visibles a ojo desnudo
// (~270 objetos) con posiciones J2000, colores espectrales y descripciones.
export const STARS: Star[] = [
    // ── Magnitud < 0 ────────────────────────────────────────────────────────
    { name: "Sirius", ra: 101.287, dec: -16.716, mag: -1.46, constellation: "Canis Major", desc: "La estrella más brillante del cielo. Solo 8.6 al. Su nombre griego significa 'abrasador'.", color: "#c8e0ff", baseSize: 6.0 },
    { name: "Canopus", ra: 95.988, dec: -52.695, mag: -0.74, constellation: "Carina", desc: "Segunda más brillante. Guía de navegación de sondas NASA. 310 al.", color: "#ddeeff", baseSize: 5.5 },

    // ── Magnitud 0.00 – 1.00 ────────────────────────────────────────────────
    { name: "Arcturus", ra: 213.915, dec: 19.182, mag: -0.04, constellation: "Boötes", desc: "Gigante naranja a 37 al. Primera estrella vista de día con telescopio (1635).", color: "#ffcc88", baseSize: 5.0 },
    { name: "Alpha Centauri", ra: 219.899, dec: -60.834, mag: -0.27, constellation: "Centaurus", desc: "Sistema más cercano al Sol. A 4.37 al. Tres componentes.", color: "#ffe8aa", baseSize: 4.8 },
    { name: "Vega", ra: 279.234, dec: 38.783, mag: 0.03, constellation: "Lyra", desc: "Primera estrella fotografiada. Primera del Triángulo de Verano. 25 al.", color: "#e8f0ff", baseSize: 5.2 },
    { name: "Capella", ra: 79.172, dec: 45.998, mag: 0.08, constellation: "Auriga", desc: "Sistema de cuatro estrellas. Dos gigantes amarillas idénticas al Sol. 43 al.", color: "#fff0cc", baseSize: 4.8 },
    { name: "Rigel", ra: 78.634, dec: -8.201, mag: 0.12, constellation: "Orion", desc: "Supergigante azul-blanca. 120.000× más luminosa que el Sol. 860 al.", color: "#b4d0ff", baseSize: 5.5 },
    { name: "Procyon", ra: 114.826, dec: 5.225, mag: 0.38, constellation: "Canis Minor", desc: "A 11.5 al. Con enana blanca compañera. Antes de Sirio sale en el cielo.", color: "#e0eaff", baseSize: 4.5 },
    { name: "Achernar", ra: 24.429, dec: -57.237, mag: 0.46, constellation: "Eridanus", desc: "Gira tan rápido que su ecuador es 56% mayor que sus polos. 139 al.", color: "#b8d0ff", baseSize: 4.5 },
    { name: "Betelgeuse", ra: 88.793, dec: 7.407, mag: 0.45, constellation: "Orion", desc: "Supergigante roja semirregular. Se oscureció notablemente en 2019-2020.", color: "#ff9966", baseSize: 5.2 },
    { name: "Hadar", ra: 210.956, dec: -60.373, mag: 0.61, constellation: "Centaurus", desc: "Gigante azul triple a 390 al. Puntero de la Cruz del Sur junto a Alpha Cen.", color: "#aac8ff", baseSize: 4.2 },
    { name: "Acrux", ra: 186.649, dec: -63.099, mag: 0.77, constellation: "Crux", desc: "Estrella más brillante de la Cruz del Sur. Sistema triple. 320 al.", color: "#b0c8ff", baseSize: 4.8 },
    { name: "Altair", ra: 297.696, dec: 8.868, mag: 0.76, constellation: "Aquila", desc: "Día de 9 horas. A 17 al. Vértice del Triángulo de Verano.", color: "#dde8ff", baseSize: 4.5 },
    { name: "Aldebaran", ra: 68.980, dec: 16.509, mag: 0.87, constellation: "Taurus", desc: "El ojo del Toro. Gigante naranja 44× mayor que el Sol. 65 al.", color: "#ffaa55", baseSize: 4.8 },
    { name: "Spica", ra: 201.298, dec: -11.161, mag: 0.97, constellation: "Virgo", desc: "Doble espectroscópica. Observarla ayudó a Hiparco a descubrir la precesión.", color: "#b0ccff", baseSize: 4.5 },

    // ── Magnitud 1.00 – 1.50 ────────────────────────────────────────────────
    { name: "Antares", ra: 247.352, dec: -26.432, mag: 1.09, constellation: "Scorpius", desc: "Corazón del Escorpión. 'Rival de Marte' por su color. 550 al.", color: "#ff6644", baseSize: 5.0 },
    { name: "Pollux", ra: 116.329, dec: 28.026, mag: 1.14, constellation: "Gemini", desc: "Gigante naranja con planeta confirmado Pollux b. 34 al.", color: "#ffcc88", baseSize: 4.2 },
    { name: "Fomalhaut", ra: 344.413, dec: -29.622, mag: 1.16, constellation: "Piscis Austrinus", desc: "El 'Ojo de Sauron'. Disco anular con posible planeta directo en Hubble. 25 al.", color: "#ddecff", baseSize: 4.0 },
    { name: "Deneb", ra: 310.358, dec: 45.280, mag: 1.25, constellation: "Cygnus", desc: "A 2.600 al. Si estuviera tan cerca como Vega brillaría como la Luna llena.", color: "#eef4ff", baseSize: 4.8 },
    { name: "Mimosa", ra: 191.930, dec: -59.689, mag: 1.25, constellation: "Crux", desc: "Segunda de la Cruz del Sur. Variable β Cephei. Su brillo oscila de 1.23 a 1.31.", color: "#b0c8ff", baseSize: 4.2 },
    { name: "Regulus", ra: 152.093, dec: 11.967, mag: 1.36, constellation: "Leo", desc: "Corazón del León. Gira tan rápido que si fuera 16% más veloz se desintegraría.", color: "#c0d8ff", baseSize: 4.2 },
    { name: "Adhara", ra: 104.656, dec: -28.972, mag: 1.50, constellation: "Canis Major", desc: "Supergigante azul. 22.800× luminosidad solar. Segunda más brillante en UV.", color: "#b0c8ff", baseSize: 4.2 },

    // ── Magnitud 1.50 – 2.00 ────────────────────────────────────────────────
    { name: "Castor", ra: 113.649, dec: 31.888, mag: 1.58, constellation: "Gemini", desc: "¡6 estrellas en 3 pares binarios que parecen una sola! A 52 al.", color: "#e8f0ff", baseSize: 3.8 },
    { name: "Shaula", ra: 263.402, dec: -37.103, mag: 1.62, constellation: "Scorpius", desc: "El aguijón del Escorpión. Triple. 700 al.", color: "#c0d4ff", baseSize: 4.0 },
    { name: "Bellatrix", ra: 81.283, dec: 6.350, mag: 1.64, constellation: "Orion", desc: "Hombro izquierdo de Orión. Gigante azul-blanca. 250 al.", color: "#c0d8ff", baseSize: 4.0 },
    { name: "Elnath", ra: 81.573, dec: 28.608, mag: 1.65, constellation: "Taurus", desc: "El cuerno norte del Toro. Compartido con Auriga en catálogos tradicionales.", color: "#c8daff", baseSize: 4.0 },
    { name: "Gacrux", ra: 187.791, dec: -57.113, mag: 1.59, constellation: "Crux", desc: "La más roja de las 20 más brillantes del cielo. Gigante M4. 88 al.", color: "#ff9988", baseSize: 3.8 },
    { name: "Miaplacidus", ra: 138.300, dec: -69.717, mag: 1.68, constellation: "Carina", desc: "Segunda de Carina. Subgigante blanca. 113 al.", color: "#e8f2ff", baseSize: 3.8 },
    { name: "Alioth", ra: 193.507, dec: 55.960, mag: 1.77, constellation: "Ursa Major", desc: "La más brillante de la Osa Mayor. A 81 al.", color: "#dde8ff", baseSize: 4.0 },
    { name: "Dubhe", ra: 165.932, dec: 61.751, mag: 1.79, constellation: "Ursa Major", desc: "Puntero hacia Polaris junto con Merak. Gigante naranja. 124 al.", color: "#ffcc88", baseSize: 4.0 },
    { name: "Mirfak", ra: 51.081, dec: 49.861, mag: 1.79, constellation: "Perseus", desc: "Supergigante amarilla en el centro del cúmulo Alfa Persei. 510 al.", color: "#fff0cc", baseSize: 3.8 },
    { name: "Kaus Australis", ra: 276.043, dec: -34.385, mag: 1.79, constellation: "Sagittarius", desc: "La más brillante del Arquero. Apunta hacia el centro galáctico. 145 al.", color: "#d0e8ff", baseSize: 4.0 },
    { name: "Gamma Velorum", ra: 122.383, dec: -47.337, mag: 1.78, constellation: "Vela", desc: "Estrella Wolf-Rayet más brillante del cielo. Sistema quíntuple. 1.100 al.", color: "#c0d4ff", baseSize: 3.8 },
    { name: "Wezen", ra: 107.098, dec: -26.393, mag: 1.84, constellation: "Canis Major", desc: "Hipergigante amarilla. 100.000× luminosidad solar. 1.600 al.", color: "#fff0aa", baseSize: 4.0 },
    { name: "Avior", ra: 125.628, dec: -59.509, mag: 1.86, constellation: "Carina", desc: "Gigante naranja + subdwarf azul. Oculta por el polo sur celeste para los griegos.", color: "#ffcc88", baseSize: 3.8 },
    { name: "Sargas", ra: 264.330, dec: -42.997, mag: 1.87, constellation: "Scorpius", desc: "La tercera más brillante del Escorpión. Supergigante blanco-amarilla.", color: "#f0eecc", baseSize: 3.8 },
    { name: "Atria", ra: 252.166, dec: -69.028, mag: 1.91, constellation: "Triangulum Australe", desc: "La más brillante del Triángulo Austral. Gigante K2. 415 al.", color: "#ffcc88", baseSize: 4.0 },
    { name: "Alhena", ra: 99.428, dec: 16.399, mag: 1.93, constellation: "Gemini", desc: "Los pies de los Gemelos. Gigante blanca en reposo. 105 al.", color: "#e8f4ff", baseSize: 3.8 },
    { name: "Peacock", ra: 306.412, dec: -56.735, mag: 1.94, constellation: "Pavo", desc: "La más brillante del Pavo. Gigante azul-blanca. 179 al.", color: "#b8d0ff", baseSize: 3.8 },
    { name: "Alsephina", ra: 131.176, dec: -54.709, mag: 1.99, constellation: "Vela", desc: "Triple en Vela. La componente principal es binaria eclipsante. 80 al.", color: "#e8f4ff", baseSize: 3.6 },
    { name: "Mirzam", ra: 95.675, dec: -17.956, mag: 1.98, constellation: "Canis Major", desc: "El Anunciador: emerge antes que Sirio. Variable β Cephei. 500 al.", color: "#b8d0ff", baseSize: 3.6 },
    { name: "Al Nair", ra: 332.058, dec: -46.961, mag: 1.74, constellation: "Grus", desc: "La segunda más brillante de la Grulla. Subgigante azul. 101 al.", color: "#b8d0ff", baseSize: 3.8 },

    // ── Magnitud 2.00 – 2.50 ────────────────────────────────────────────────
    { name: "Tiaki", ra: 340.667, dec: -46.885, mag: 2.15, constellation: "Grus", desc: "Gigante roja. Nombre maorí para la segunda estrella de la Grulla.", color: "#ff9966", baseSize: 3.4 },
    { name: "Diphda", ra: 10.897, dec: -17.987, mag: 2.04, constellation: "Cetus", desc: "La «Cola de la Ballena». Gigante naranja estable. 96 al.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Mirach", ra: 17.433, dec: 35.621, mag: 2.05, constellation: "Andromeda", desc: "Gigante roja. Seis galaxias en su campo visual. 197 al.", color: "#ff9966", baseSize: 3.5 },
    { name: "Menkent", ra: 211.670, dec: -36.369, mag: 2.06, constellation: "Centaurus", desc: "Gigante naranja en el flanco del Centauro. La más cercana de las brillantes: 60 al.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Alpheratz", ra: 2.097, dec: 29.091, mag: 2.06, constellation: "Andromeda", desc: "Comparte membresía con Pegaso. Esquina del Gran Cuadrado. 97 al.", color: "#c8d8ff", baseSize: 3.5 },
    { name: "Kochab", ra: 222.676, dec: 74.155, mag: 2.07, constellation: "Ursa Minor", desc: "Fue Estrella del Norte en 1500 a.C. Gigante naranja en la constelación del Osito.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Algieba", ra: 154.993, dec: 19.841, mag: 2.01, constellation: "Leo", desc: "Par de gigantes naranja y amarilla girando mutuamente. Planeta confirmado.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Rasalhague", ra: 263.734, dec: 12.560, mag: 2.08, constellation: "Ophiuchus", desc: "Cabeza del Portador de Serpiente. Gira muy rápido. 47 al.", color: "#e8f4ff", baseSize: 3.5 },
    { name: "Almach", ra: 30.975, dec: 42.330, mag: 2.10, constellation: "Andromeda", desc: "Doble coloreada azul y naranja. Cuatro estrellas reales. 355 al.", color: "#c8d8ff", baseSize: 3.5 },
    { name: "Algol", ra: 47.042, dec: 40.957, mag: 2.12, constellation: "Perseus", desc: "«El Demonio» — primera variable eclipsante conocida. Oscila cada 2.87 días.", color: "#c8d8ff", baseSize: 3.4 },
    { name: "Saiph", ra: 86.939, dec: -9.670, mag: 2.06, constellation: "Orion", desc: "Pie derecho de Orión. Tan caliente como Rigel (26.500 K). 720 al.", color: "#b4d0ff", baseSize: 3.8 },
    { name: "Navi", ra: 14.177, dec: 60.717, mag: 2.15, constellation: "Cassiopeia", desc: "Variable brillante. Nombre al revés de 'Ivan' (astronauta Gus Grissom). 550 al.", color: "#b0ccff", baseSize: 3.4 },
    { name: "Denebola", ra: 177.265, dec: 14.572, mag: 2.14, constellation: "Leo", desc: "La Cola del León. A solo 36 al. Tiene un disco de polvo circunestelar.", color: "#e0f0ff", baseSize: 3.4 },
    { name: "Suhail", ra: 136.000, dec: -43.432, mag: 2.21, constellation: "Vela", desc: "Gigante naranja brillante en Vela. Parte de la Falsa Cruz. 570 al.", color: "#ffcc88", baseSize: 3.4 },
    { name: "Tureis", ra: 139.273, dec: -59.274, mag: 2.25, constellation: "Carina", desc: "Supergigante blanca en la Falsa Cruz. 1.600 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Naos", ra: 120.896, dec: -40.003, mag: 2.25, constellation: "Puppis", desc: "Una de las estrellas más calientes conocidas (42.000 K). Remanente de una supernova.", color: "#90b8ff", baseSize: 3.4 },
    { name: "Alphecca", ra: 233.672, dec: 26.715, mag: 2.22, constellation: "Corona Borealis", desc: "La gema de la Corona Boreal. Binaria eclipsante. 75 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Muhlifain", ra: 190.379, dec: -48.959, mag: 2.17, constellation: "Centaurus", desc: "Gigante blanca en Centaurus. Sistema múltiple. 130 al.", color: "#e0ecff", baseSize: 3.4 },
    { name: "Wei", ra: 252.967, dec: -26.114, mag: 2.29, constellation: "Scorpius", desc: "La cabeza del Escorpión. Gigante naranja. 65 al.", color: "#ffcc88", baseSize: 3.3 },
    { name: "Caph", ra: 2.295, dec: 59.149, mag: 2.27, constellation: "Cassiopeia", desc: "Punta derecha de la W de Casiopea. F2III. Mueve la posición del polo norte celeste.", color: "#f0f4e8", baseSize: 3.3 },
    { name: "Sadr", ra: 305.557, dec: 40.257, mag: 2.20, constellation: "Cygnus", desc: "Corazón del Cisne. Supergigante amarilla rodeada de nebulosa. 1.500 al.", color: "#fff0cc", baseSize: 3.4 },
    { name: "Dschubba", ra: 240.083, dec: -22.622, mag: 2.35, constellation: "Scorpius", desc: "Frente del Escorpión. Se volvió más brillante en 2000 inesperadamente.", color: "#b0ccff", baseSize: 3.3 },
    { name: "Polaris", ra: 37.954, dec: 89.264, mag: 1.97, constellation: "Ursa Minor", desc: "La Estrella del Norte. Casi inmóvil en el cielo. Cefeida triple. 433 al.", color: "#ffe8aa", baseSize: 3.5 },
    { name: "Alphard", ra: 141.897, dec: -8.659, mag: 1.99, constellation: "Hydra", desc: "La Estrella Solitaria de la Hidra. Gigante naranja en una región vacía. 177 al.", color: "#ffcc88", baseSize: 3.8 },
    { name: "Hamal", ra: 31.793, dec: 23.463, mag: 2.00, constellation: "Aries", desc: "Antigua estrella equinoccial (era el punto vernal hace 2000 años). 66 al.", color: "#ffbb77", baseSize: 3.5 },
    { name: "Nunki", ra: 283.816, dec: -26.297, mag: 2.02, constellation: "Sagittarius", desc: "Nombre sumerio, el más antiguo del catálogo. Cerca del centro galáctico.", color: "#c0d8ff", baseSize: 3.5 },
    { name: "Alnitak", ra: 85.190, dec: -1.942, mag: 1.77, constellation: "Orion", desc: "Estrella oriental del Cinturón de Orión. Cerca de la Nebulosa Cabeza de Caballo.", color: "#b0d0ff", baseSize: 4.0 },
    { name: "Alnilam", ra: 84.053, dec: -1.202, mag: 1.70, constellation: "Orion", desc: "Estrella central del Cinturón. Supergigante azul-blanca. 375.000× luminosidad solar.", color: "#aac8ff", baseSize: 4.2 },
    { name: "Mintaka", ra: 83.002, dec: -0.299, mag: 2.20, constellation: "Orion", desc: "Estrella occidental del Cinturón. Sale exactamente por el Este y se pone por el Oeste.", color: "#b8d0ff", baseSize: 3.5 },
    { name: "Merak", ra: 165.460, dec: 56.382, mag: 2.37, constellation: "Ursa Major", desc: "Puntero hacia Polaris con Dubhe. A 79 al.", color: "#e8f4ff", baseSize: 3.3 },
    { name: "Phecda", ra: 178.458, dec: 53.694, mag: 2.44, constellation: "Ursa Major", desc: "Miembro del Grupo Estelar de la Osa. A 84 al.", color: "#e8f4ff", baseSize: 3.2 },
    { name: "Scheat", ra: 345.943, dec: 28.082, mag: 2.44, constellation: "Pegasus", desc: "Gigante roja variable semiregular. Esquina del Gran Cuadrado de Pegaso.", color: "#ff9966", baseSize: 3.2 },
    { name: "Aludra", ra: 111.024, dec: -29.303, mag: 2.45, constellation: "Canis Major", desc: "Hipergigante azul. 3.200 al. Una de las más luminosas del cielo nocturno.", color: "#b0c8ff", baseSize: 3.2 },
    { name: "Gienah Cyg", ra: 311.553, dec: 33.970, mag: 2.46, constellation: "Cygnus", desc: "Ala del Cisne. Gigante naranja. 72 al.", color: "#ffcc88", baseSize: 3.2 },
    { name: "Markab", ra: 346.190, dec: 15.205, mag: 2.49, constellation: "Pegasus", desc: "Esquina del Gran Cuadrado de Pegaso. Gigante azul-blanca. 140 al.", color: "#c8daff", baseSize: 3.2 },

    // ── Magnitud 2.50 – 3.00 ────────────────────────────────────────────────
    { name: "Alderamin", ra: 319.645, dec: 62.585, mag: 2.45, constellation: "Cepheus", desc: "Será la Estrella del Norte en el año 7.500 d.C. A 49 al.", color: "#ddecff", baseSize: 3.2 },
    { name: "Schedar", ra: 10.127, dec: 56.537, mag: 2.24, constellation: "Cassiopeia", desc: "La más brillante de la W de Casiopea. Gigante naranja.", color: "#ffcc88", baseSize: 3.5 },
    { name: "Alkaid", ra: 206.885, dec: 49.313, mag: 1.86, constellation: "Ursa Major", desc: "Extremo del mango del Gran Cazo. Gigante azul. A 104 al.", color: "#c8dcff", baseSize: 3.8 },
    { name: "Mizar", ra: 200.981, dec: 54.925, mag: 2.23, constellation: "Ursa Major", desc: "Primera doble telescópica (1650). Sistema de 4 estrellas. Alcor es su compañera visual.", color: "#dde8ff", baseSize: 3.5 },
    { name: "Menkar", ra: 45.570, dec: 4.090, mag: 2.54, constellation: "Cetus", desc: "La Nariz de la Ballena. Gigante roja en la cabeza del monstruo marino. 250 al.", color: "#ff9966", baseSize: 3.2 },
    { name: "Zosma", ra: 168.527, dec: 20.524, mag: 2.56, constellation: "Leo", desc: "El lomo del León. Gira muy rápido (cerca de la velocidad de ruptura). 58 al.", color: "#e0ecff", baseSize: 3.2 },
    { name: "Zubeneschamali", ra: 229.252, dec: -9.384, mag: 2.61, constellation: "Libra", desc: "Norte de la Balanza. Una de las pocas estrellas que parecen ligeramente verdes. 160 al.", color: "#c8e0ff", baseSize: 3.2 },
    { name: "Acrab", ra: 241.359, dec: -19.806, mag: 2.62, constellation: "Scorpius", desc: "Frente del Escorpión. Sistema triple con binaria espectroscópica X. 530 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Phact", ra: 84.912, dec: -34.074, mag: 2.64, constellation: "Columba", desc: "La más brillante de la Paloma. Subgigante azul. 268 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Gienah Crv", ra: 183.951, dec: -17.542, mag: 2.59, constellation: "Corvus", desc: "La más brillante del Cuervo. Gigante azul. 165 al.", color: "#b8d0ff", baseSize: 3.2 },
    { name: "Lesath", ra: 264.661, dec: -37.296, mag: 2.69, constellation: "Scorpius", desc: "El aguijón del Escorpión junto a Shaula. 520 al.", color: "#b0ccff", baseSize: 3.1 },
    { name: "Ruchbah", ra: 21.454, dec: 60.235, mag: 2.68, constellation: "Cassiopeia", desc: "Variable eclipsante en Casiopea. 99 al.", color: "#e8f4ff", baseSize: 3.1 },
    { name: "Izar", ra: 221.247, dec: 27.074, mag: 2.70, constellation: "Boötes", desc: "'El Cinturón'. Doble de colores naranja y azul-verde muy apreciada. 203 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Kaus Media", ra: 275.249, dec: -29.829, mag: 2.70, constellation: "Sagittarius", desc: "El centro del arco del Arquero. Gigante naranja. 350 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Zubenelgenubi", ra: 222.719, dec: -15.997, mag: 2.75, constellation: "Libra", desc: "Sur de la Balanza. Doble óptica observable a ojo desnudo. 77 al.", color: "#e8f4ff", baseSize: 3.1 },
    { name: "Muphrid", ra: 218.019, dec: 18.398, mag: 2.68, constellation: "Boötes", desc: "Compañera óptica de Arcturus. Subgigante amarilla. 37 al.", color: "#fff0cc", baseSize: 3.1 },
    { name: "Tejat", ra: 95.740, dec: 22.513, mag: 2.75, constellation: "Gemini", desc: "El pie del Gemelo. Gigante roja variable semiregular.", color: "#ff9966", baseSize: 3.1 },
    { name: "Porrima", ra: 190.415, dec: -1.449, mag: 2.74, constellation: "Virgo", desc: "Doble espectacular con órbita de 169 años. Dos gigantes gemelas. 38 al.", color: "#e8f0ff", baseSize: 3.1 },
    { name: "Yed Prior", ra: 243.587, dec: -3.694, mag: 2.73, constellation: "Ophiuchus", desc: "La mano del Portador de Serpiente. Gigante naranja. 171 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Vindemiatrix", ra: 195.544, dec: 10.959, mag: 2.83, constellation: "Virgo", desc: "La Recolectora de Uva (la que anuncia la vendimia). Gigante amarilla. 102 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Tau Sco", ra: 248.971, dec: -28.216, mag: 2.82, constellation: "Scorpius", desc: "Estrella masiva en el cuerpo del Escorpión. 400 al. B0.2V muy joven.", color: "#a8c4ff", baseSize: 3.0 },
    { name: "Kaus Borealis", ra: 276.993, dec: -25.421, mag: 2.81, constellation: "Sagittarius", desc: "La punta norte del arco del Arquero. Gigante naranja. 77 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Algenib", ra: 3.309, dec: 15.183, mag: 2.83, constellation: "Pegasus", desc: "Cuarta esquina del Gran Cuadrado. Variable β Cephei. 335 al.", color: "#b0ccff", baseSize: 3.0 },
    { name: "Gomeisa", ra: 111.788, dec: 8.290, mag: 2.89, constellation: "Canis Minor", desc: "Subgigante azul en Canis Minor. 170 al.", color: "#c8daff", baseSize: 3.0 },
    { name: "Mebsuda", ra: 101.322, dec: 25.131, mag: 2.98, constellation: "Gemini", desc: "Supergigante amarilla. 900 al. Una de las más luminosas de Géminis.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Sadalsuud", ra: 322.890, dec: -5.571, mag: 2.90, constellation: "Aquarius", desc: "'La más afortunada de las afortunadas'. Supergigante amarilla. 610 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Pherkad", ra: 230.182, dec: 71.834, mag: 3.05, constellation: "Ursa Minor", desc: "Con Kochab forma los 'Guardianes del Polo'. Gigante blanca. 480 al.", color: "#e8f4ff", baseSize: 2.8 },
    { name: "Albireo", ra: 292.680, dec: 27.960, mag: 3.09, constellation: "Cygnus", desc: "Doble más hermosa del cielo: naranja y azul contrastadas. La cabeza del Cisne.", color: "#ffcc88", baseSize: 2.8 },
    { name: "Deneb Algedi", ra: 326.760, dec: -16.127, mag: 2.85, constellation: "Capricornus", desc: "Cola del Cabrito. Variable eclipsante lenta. 39 al.", color: "#f0f4e8", baseSize: 3.0 },
    { name: "Sadalmelik", ra: 331.446, dec: -0.320, mag: 2.95, constellation: "Aquarius", desc: "'Estrella afortunada del rey'. Supergigante amarilla. 520 al.", color: "#fff0cc", baseSize: 2.9 },

    // ── Magnitud 3.00 – 3.50 ────────────────────────────────────────────────
    { name: "Meissa", ra: 83.784, dec: 9.934, mag: 3.47, constellation: "Orion", desc: "La cabeza de Orión. Grupo abierto de estrellas jóvenes. 1.100 al.", color: "#b0ccff", baseSize: 2.6 },
    { name: "Megrez", ra: 183.857, dec: 57.032, mag: 3.31, constellation: "Ursa Major", desc: "Donde el mango se une al cuenco del Cazo. A 81 al.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Adhafera", ra: 154.173, dec: 23.417, mag: 3.43, constellation: "Leo", desc: "Gigante amarilla en la melena del León. 260 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Heze", ra: 201.897, dec: -0.597, mag: 3.37, constellation: "Virgo", desc: "A 74 al. Gigante blanca con rotación rápida.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Chertan", ra: 170.540, dec: 15.430, mag: 3.34, constellation: "Leo", desc: "Las costillas del León. Triple.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Segin", ra: 28.599, dec: 63.670, mag: 3.38, constellation: "Cassiopeia", desc: "La punta de la W de Casiopea. Subgigante azul. 440 al.", color: "#b8d0ff", baseSize: 2.6 },
    { name: "Propus", ra: 93.719, dec: 22.507, mag: 3.28, constellation: "Gemini", desc: "El pie izquierdo del Gemelo. Variable semiregular. Doble óptica.", color: "#ff8866", baseSize: 2.7 },
    { name: "Pi 3 Ori", ra: 84.412, dec: 6.961, mag: 3.19, constellation: "Orion", desc: "El más cercano de los brillantes de Orión (26 al). Parecido al Sol.", color: "#f8f4e8", baseSize: 2.8 },
    { name: "Alrescha", ra: 28.659, dec: 2.764, mag: 3.82, constellation: "Pisces", desc: "La cuerda que ata los Peces. Doble telescópica. 139 al.", color: "#e8f4ff", baseSize: 2.2 },
    { name: "Algedi", ra: 304.514, dec: -12.545, mag: 3.57, constellation: "Capricornus", desc: "La cabra del Arquero. Doble óptica (la lejana es una gigante G). 690 al.", color: "#fff0cc", baseSize: 2.5 },
    { name: "Hatysa", ra: 83.858, dec: -5.910, mag: 2.77, constellation: "Orion", desc: "La Espada de Orión (ι Ori). Sistema cuádruple masivo. 1.300 al.", color: "#c0d4ff", baseSize: 3.0 },
    { name: "Wasat", ra: 110.031, dec: 21.982, mag: 3.53, constellation: "Gemini", desc: "Sistema triple con planeta. 59 al.", color: "#f8f4e8", baseSize: 2.5 },
    { name: "Subra", ra: 140.094, dec: 9.892, mag: 3.52, constellation: "Leo", desc: "El muslo del León. Binaria espectroscópica.", color: "#fff0cc", baseSize: 2.5 },

    // ── Lyra ────────────────────────────────────────────────────────────────────
    { name: "Sulafat", ra: 284.736, dec: 32.690, mag: 3.25, constellation: "Lyra", desc: "γ Lyrae. Gigante azul-blanca en el cuadrilátero de Lyra. 620 al.", color: "#c8daff", baseSize: 2.7 },
    { name: "Sheliak", ra: 282.520, dec: 33.363, mag: 3.52, constellation: "Lyra", desc: "β Lyrae. Variable eclipsante prototipo de su clase. Las dos estrellas comparten masa. 960 al.", color: "#c8daff", baseSize: 2.5 },

    // ── Auriga ───────────────────────────────────────────────────────────────────
    { name: "Menkaliman", ra: 89.882, dec: 44.947, mag: 1.90, constellation: "Auriga", desc: "β Aurigae. Binaria eclipsante de gigantes blancas. A 82 al.", color: "#e8f4ff", baseSize: 3.7 },
    { name: "Hassaleh", ra: 74.248, dec: 33.166, mag: 2.69, constellation: "Auriga", desc: "ι Aurigae. Supergigante fría naranja-roja. 512 al. Nombre árabe del Cochero.", color: "#ffcc88", baseSize: 3.1 },

    // ── Perseus ──────────────────────────────────────────────────────────────────
    { name: "Atik", ra: 58.585, dec: 31.878, mag: 2.85, constellation: "Perseus", desc: "ζ Persei. Supergigante azul. 750 al. El «hombro» de Perseo.", color: "#b0ccff", baseSize: 3.0 },

    // ── Ophiuchus ────────────────────────────────────────────────────────────────
    { name: "Sabik", ra: 257.595, dec: -15.724, mag: 2.43, constellation: "Ophiuchus", desc: "η Ophiuchi. Dos gigantes blancas muy similares en órbita mutua de 88 años. 84 al.", color: "#dde8ff", baseSize: 3.3 },
    { name: "Cebalrai", ra: 265.867, dec: 4.567, mag: 2.77, constellation: "Ophiuchus", desc: "β Ophiuchi. Gigante naranja. 82 al.", color: "#ffcc88", baseSize: 3.0 },
    { name: "Zeta Oph", ra: 249.290, dec: -10.567, mag: 2.57, constellation: "Ophiuchus", desc: "Fugitiva de un cúmulo. Crea una burbuja de viento estelar en infrarrojos. 458 al.", color: "#aac0ff", baseSize: 3.2 },

    // ── Crux ─────────────────────────────────────────────────────────────────────
    { name: "Imai", ra: 183.786, dec: -58.749, mag: 2.79, constellation: "Crux", desc: "δ Crucis. La cuarta estrella de la Cruz del Sur. 345 al.", color: "#c0d4ff", baseSize: 3.0 },

    // ── Corvus ───────────────────────────────────────────────────────────────────
    { name: "Kraz", ra: 188.597, dec: -23.397, mag: 2.65, constellation: "Corvus", desc: "β Corvi. Subgigante amarilla en el Cuervo. 146 al.", color: "#fff0cc", baseSize: 3.1 },
    { name: "Algorab", ra: 187.466, dec: -16.516, mag: 2.95, constellation: "Corvus", desc: "δ Corvi. Binaria en rápida traslación. 87 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ── Aries ────────────────────────────────────────────────────────────────────
    { name: "Sheratan", ra: 28.660, dec: 20.808, mag: 2.65, constellation: "Aries", desc: "β Arietis. Primera binaria espectroscópica descubierta por Doppler. 60 al.", color: "#e8f4ff", baseSize: 3.1 },

    // ── Cepheus ──────────────────────────────────────────────────────────────────
    { name: "Alfirk", ra: 322.165, dec: 70.561, mag: 3.23, constellation: "Cepheus", desc: "β Cephei. Estrella prototipo de variables pulsantes masivas. 690 al.", color: "#b0ccff", baseSize: 2.7 },
    { name: "Errai", ra: 354.836, dec: 77.632, mag: 3.21, constellation: "Cepheus", desc: "γ Cephei. Futuro Polo Norte (año 3.100 d.C.). Exoplaneta confirmado. 45 al.", color: "#ffcc88", baseSize: 2.8 },

    // ── Hercules ─────────────────────────────────────────────────────────────────
    { name: "Kornephoros", ra: 247.555, dec: 21.490, mag: 2.77, constellation: "Hercules", desc: "β Herculis. La más brillante de Hércules. Gigante amarilla. 148 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Rasalgethi", ra: 258.662, dec: 14.390, mag: 3.48, constellation: "Hercules", desc: "α Herculis. Gigante roja irregular: si en lugar del Sol alcanzaría hasta Marte. 360 al.", color: "#ff9966", baseSize: 2.5 },

    // ── Aquarius ─────────────────────────────────────────────────────────────────
    { name: "Skat", ra: 340.863, dec: -15.821, mag: 3.27, constellation: "Aquarius", desc: "δ Aquarii. La «Espinilla» del Aguador. Subgigante blanca. 160 al.", color: "#dde8ff", baseSize: 2.7 },

    // ── Capricornus ──────────────────────────────────────────────────────────────
    { name: "Dabih", ra: 305.253, dec: -14.781, mag: 3.05, constellation: "Capricornus", desc: "β Capricorni. Cuádruple — dos binarias. La más brillante de la constelación. 328 al.", color: "#ffe8aa", baseSize: 2.8 },

    // ── Aquila ───────────────────────────────────────────────────────────────────
    { name: "Tarazed", ra: 286.352, dec: 10.613, mag: 2.72, constellation: "Aquila", desc: "γ Aquilae. Gigante naranja que flanquea Altair. 460 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Alshain", ra: 298.828, dec: 6.407, mag: 3.71, constellation: "Aquila", desc: "β Aquilae. El trío de Altair: Tarazed–Altair–Alshain. 45 al.", color: "#fff0cc", baseSize: 2.4 },

    // ── Cygnus extra ─────────────────────────────────────────────────────────────
    { name: "Fawaris", ra: 291.955, dec: 45.131, mag: 2.87, constellation: "Cygnus", desc: "δ Cygni. Binaria blanca-naranja. El ala del Cisne. 165 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ══════════════════════════════════════════════════════════════════════════════
    // NUEVAS ESTRELLAS PARA CONSTELACIONES ADICIONALES
    // ══════════════════════════════════════════════════════════════════════════════

    // ── Draco ──────────────────────────────────────────────────────────────────────
    { name: "Eltanin", ra: 269.152, dec: 51.489, mag: 2.23, constellation: "Draco", desc: "γ Draconis. La más brillante del Dragón. Zenital en Londres. 148 al.", color: "#ffcc88", baseSize: 3.4 },
    { name: "Rastaban", ra: 262.608, dec: 52.301, mag: 2.79, constellation: "Draco", desc: "β Draconis. Supergigante amarilla en la cabeza del Dragón. 380 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Thuban", ra: 211.097, dec: 64.376, mag: 3.67, constellation: "Draco", desc: "α Draconis. Estrella Polar egipcia hace 4.800 años. 303 al.", color: "#e8f4ff", baseSize: 2.4 },
    { name: "Kuma", ra: 257.197, dec: 55.184, mag: 4.87, constellation: "Draco", desc: "ν Draconis. Doble óptica fácil de separar con binoculares. 100 al.", color: "#e8f4ff", baseSize: 2.0 },
    { name: "Grumium", ra: 268.382, dec: 56.873, mag: 3.75, constellation: "Draco", desc: "ξ Draconis. Gigante naranja en la mandíbula del Dragón. 112 al.", color: "#ffcc88", baseSize: 2.3 },
    { name: "Edasich", ra: 231.232, dec: 58.966, mag: 3.29, constellation: "Draco", desc: "ι Draconis. Gigante naranja con exoplaneta. 103 al.", color: "#ffcc88", baseSize: 2.6 },
    { name: "Aldhibah", ra: 256.556, dec: 61.514, mag: 3.17, constellation: "Draco", desc: "ζ Draconis. Gigante azul. 330 al.", color: "#c0d8ff", baseSize: 2.8 },
    { name: "Athebyne", ra: 245.998, dec: 61.517, mag: 3.07, constellation: "Draco", desc: "η Draconis. Gigante amarilla. 92 al.", color: "#fff0cc", baseSize: 2.8 },
    { name: "Giausar", ra: 172.851, dec: 69.331, mag: 3.84, constellation: "Draco", desc: "λ Draconis. Gigante roja. 334 al.", color: "#ff9966", baseSize: 2.2 },
    { name: "Chi Dra", ra: 282.521, dec: 72.733, mag: 3.57, constellation: "Draco", desc: "χ Draconis. Binaria espectroscópica amarilla. 26 al.", color: "#fff0cc", baseSize: 2.5 },

    // ── Lepus (La Liebre) ──────────────────────────────────────────────────────────
    { name: "Arneb", ra: 83.183, dec: -17.822, mag: 2.58, constellation: "Lepus", desc: "α Leporis. Supergigante blanco-amarilla bajo los pies de Orión. 2.200 al.", color: "#fff0cc", baseSize: 3.2 },
    { name: "Nihal", ra: 82.061, dec: -20.759, mag: 2.84, constellation: "Lepus", desc: "β Leporis. Gigante amarilla. 160 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Mu Lep", ra: 80.486, dec: -16.206, mag: 3.31, constellation: "Lepus", desc: "μ Leporis. Subgigante azul. 186 al.", color: "#c0d8ff", baseSize: 2.7 },
    { name: "Epsilon Lep", ra: 79.891, dec: -22.371, mag: 3.19, constellation: "Lepus", desc: "ε Leporis. Gigante naranja. 213 al.", color: "#ffcc88", baseSize: 2.8 },

    // ── Triangulum ─────────────────────────────────────────────────────────────────
    { name: "Mothallah", ra: 28.270, dec: 29.579, mag: 3.41, constellation: "Triangulum", desc: "α Trianguli. Binaria espectroscópica. 63 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Deltotum", ra: 31.097, dec: 34.987, mag: 3.00, constellation: "Triangulum", desc: "β Trianguli. La más brillante del Triángulo. Gigante blanca. 124 al.", color: "#e8f4ff", baseSize: 2.9 },
    { name: "Gamma Tri", ra: 34.423, dec: 33.847, mag: 4.01, constellation: "Triangulum", desc: "γ Trianguli. Estrella blanca. 118 al.", color: "#e8f4ff", baseSize: 2.1 },

    // ── Delphinus (El Delfín) ──────────────────────────────────────────────────────
    { name: "Rotanev", ra: 309.387, dec: 14.595, mag: 3.63, constellation: "Delphinus", desc: "β Delphini. Nombre es 'Venator' al revés. Binaria. 97 al.", color: "#fff0cc", baseSize: 2.4 },
    { name: "Sualocin", ra: 308.303, dec: 15.912, mag: 3.77, constellation: "Delphinus", desc: "α Delphini. 'Nicolaus' al revés (Niccolò Cacciatore). 241 al.", color: "#c0d8ff", baseSize: 2.3 },
    { name: "Gamma Del", ra: 310.865, dec: 16.124, mag: 4.27, constellation: "Delphinus", desc: "γ Delphini. Doble famosa: naranja y amarillo-verde. 101 al.", color: "#ffcc88", baseSize: 2.0 },
    { name: "Delta Del", ra: 311.663, dec: 15.075, mag: 4.43, constellation: "Delphinus", desc: "δ Delphini. Subgigante blanca. 203 al.", color: "#e8f4ff", baseSize: 1.9 },

    // ── Sagitta (La Flecha) ────────────────────────────────────────────────────────
    { name: "Gamma Sge", ra: 299.689, dec: 19.492, mag: 3.47, constellation: "Sagitta", desc: "γ Sagittae. La más brillante de la Flecha. Gigante roja. 274 al.", color: "#ff9966", baseSize: 2.5 },
    { name: "Delta Sge", ra: 298.959, dec: 18.534, mag: 3.82, constellation: "Sagitta", desc: "δ Sagittae. Gigante roja variable. 448 al.", color: "#ff9966", baseSize: 2.2 },
    { name: "Alpha Sge", ra: 295.024, dec: 18.014, mag: 4.37, constellation: "Sagitta", desc: "α Sagittae. Gigante amarilla. 473 al.", color: "#fff0cc", baseSize: 1.9 },

    // ── Corona Australis (Corona Austral) ──────────────────────────────────────────
    { name: "Meridiana", ra: 287.368, dec: -37.904, mag: 4.10, constellation: "Corona Australis", desc: "α Coronae Australis. Estrella blanca. 130 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Beta CrA", ra: 287.507, dec: -39.341, mag: 4.11, constellation: "Corona Australis", desc: "β Coronae Australis. Gigante naranja. 510 al.", color: "#ffcc88", baseSize: 2.1 },
    { name: "Gamma CrA", ra: 289.553, dec: -37.063, mag: 4.23, constellation: "Corona Australis", desc: "γ Coronae Australis. Binaria eclipsante. 58 al.", color: "#fff0cc", baseSize: 2.0 },

    // ── Crater (La Copa) ───────────────────────────────────────────────────────────
    { name: "Alkes", ra: 164.944, dec: -18.299, mag: 4.08, constellation: "Crater", desc: "α Crateris. Gigante naranja. 174 al.", color: "#ffcc88", baseSize: 2.1 },
    { name: "Delta Crt", ra: 169.840, dec: -14.778, mag: 3.56, constellation: "Crater", desc: "δ Crateris. La más brillante de la Copa. Gigante naranja. 163 al.", color: "#ffcc88", baseSize: 2.5 },
    { name: "Gamma Crt", ra: 171.152, dec: -17.684, mag: 4.08, constellation: "Crater", desc: "γ Crateris. Estrella blanca. 84 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Beta Crt", ra: 167.914, dec: -22.826, mag: 4.48, constellation: "Crater", desc: "β Crateris. Subgigante blanca. 266 al.", color: "#e8f4ff", baseSize: 1.9 },

    // ── Cetus (completar La Ballena) ───────────────────────────────────────────────
    { name: "Mira", ra: 34.837, dec: -2.978, mag: 3.04, constellation: "Cetus", desc: "ο Ceti. Primera variable conocida. De mag 2 a 10 en 332 días. 300 al.", color: "#ff6644", baseSize: 2.9 },
    { name: "Tau Cet", ra: 26.017, dec: -15.938, mag: 3.50, constellation: "Cetus", desc: "τ Ceti. Una de las estrellas más parecidas al Sol. Solo 11.9 al.", color: "#fff8dd", baseSize: 2.5 },
    { name: "Iota Cet", ra: 8.723, dec: -8.824, mag: 3.56, constellation: "Cetus", desc: "ι Ceti. Gigante naranja. 290 al.", color: "#ffcc88", baseSize: 2.5 },
    { name: "Baten Kaitos", ra: 27.866, dec: -10.335, mag: 3.74, constellation: "Cetus", desc: "ζ Ceti. Gigante naranja en el vientre de la Ballena. 259 al.", color: "#ffcc88", baseSize: 2.3 },

    // ── Pisces (completar) ─────────────────────────────────────────────────────────
    { name: "Eta Psc", ra: 22.871, dec: 15.346, mag: 3.62, constellation: "Pisces", desc: "η Piscium. La más brillante de Piscis. Gigante amarilla. 294 al.", color: "#fff0cc", baseSize: 2.4 },
    { name: "Gamma Psc", ra: 23.466, dec: 3.282, mag: 3.70, constellation: "Pisces", desc: "γ Piscium. Gigante amarilla. 138 al.", color: "#fff0cc", baseSize: 2.4 },
    { name: "Omega Psc", ra: 23.988, dec: 6.864, mag: 4.01, constellation: "Pisces", desc: "ω Piscium. Subgigante amarilla. 106 al.", color: "#fff0cc", baseSize: 2.1 },

    // ── Lupus (El Lobo) ────────────────────────────────────────────────────────────
    { name: "Alpha Lup", ra: 220.483, dec: -47.388, mag: 2.30, constellation: "Lupus", desc: "α Lupi. Gigante azul, la más brillante del Lobo. 548 al.", color: "#b0c8ff", baseSize: 3.3 },
    { name: "Beta Lup", ra: 224.633, dec: -43.134, mag: 2.68, constellation: "Lupus", desc: "β Lupi. Gigante azul. 383 al.", color: "#b0c8ff", baseSize: 3.1 },
    { name: "Gamma Lup", ra: 229.248, dec: -41.167, mag: 2.78, constellation: "Lupus", desc: "γ Lupi. Binaria azul. 567 al.", color: "#b0c8ff", baseSize: 3.0 },
    { name: "Delta Lup", ra: 230.344, dec: -40.648, mag: 3.22, constellation: "Lupus", desc: "δ Lupi. Subgigante azul. 510 al.", color: "#b0c8ff", baseSize: 2.7 },
    { name: "Epsilon Lup", ra: 232.155, dec: -44.689, mag: 3.37, constellation: "Lupus", desc: "ε Lupi. Binaria azul. 504 al.", color: "#b0c8ff", baseSize: 2.6 },

    // ── Ara (El Altar) ─────────────────────────────────────────────────────────────
    { name: "Beta Ara", ra: 261.325, dec: -55.530, mag: 2.85, constellation: "Ara", desc: "β Arae. La más brillante del Altar. Supergigante naranja. 650 al.", color: "#ffcc88", baseSize: 3.0 },
    { name: "Alpha Ara", ra: 262.960, dec: -49.876, mag: 2.93, constellation: "Ara", desc: "α Arae. Variable azul. 270 al.", color: "#b0c8ff", baseSize: 2.9 },
    { name: "Zeta Ara", ra: 254.655, dec: -55.990, mag: 3.13, constellation: "Ara", desc: "ζ Arae. Gigante naranja. 574 al.", color: "#ffcc88", baseSize: 2.8 },
    { name: "Gamma Ara", ra: 259.017, dec: -56.378, mag: 3.34, constellation: "Ara", desc: "γ Arae. Supergigante azul. 1.140 al.", color: "#b0c8ff", baseSize: 2.6 },
    { name: "Delta Ara", ra: 262.774, dec: -60.684, mag: 3.62, constellation: "Ara", desc: "δ Arae. Subgigante azul. 198 al.", color: "#c0d8ff", baseSize: 2.4 },

    // ── Monoceros (El Unicornio) ───────────────────────────────────────────────────
    { name: "Alpha Mon", ra: 115.312, dec: -9.551, mag: 3.94, constellation: "Monoceros", desc: "α Monocerotis. Gigante naranja. 144 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Beta Mon", ra: 97.206, dec: -7.033, mag: 3.74, constellation: "Monoceros", desc: "β Monocerotis. Triple estelar famosa. Tres estrellas azules. 700 al.", color: "#c0d8ff", baseSize: 2.3 },
    { name: "Gamma Mon", ra: 93.714, dec: -6.275, mag: 3.98, constellation: "Monoceros", desc: "γ Monocerotis. Gigante naranja. 645 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Delta Mon", ra: 107.966, dec: -0.493, mag: 4.15, constellation: "Monoceros", desc: "δ Monocerotis. Estrella blanca. 375 al.", color: "#e8f4ff", baseSize: 2.0 },

    // ── Scutum (El Escudo) ─────────────────────────────────────────────────────────
    { name: "Alpha Sct", ra: 280.794, dec: -8.244, mag: 3.85, constellation: "Scutum", desc: "α Scuti. Gigante naranja. 199 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Beta Sct", ra: 281.794, dec: -4.748, mag: 4.22, constellation: "Scutum", desc: "β Scuti. Gigante amarilla. 690 al.", color: "#fff0cc", baseSize: 2.0 },

    // ── Vulpecula (La Zorra) ───────────────────────────────────────────────────────
    { name: "Anser", ra: 297.654, dec: 24.665, mag: 4.44, constellation: "Vulpecula", desc: "α Vulpeculae. Gigante roja. 297 al.", color: "#ff9966", baseSize: 1.9 },

    // ── Lacerta (El Lagarto) ───────────────────────────────────────────────────────
    { name: "Alpha Lac", ra: 337.823, dec: 50.283, mag: 3.77, constellation: "Lacerta", desc: "α Lacertae. Estrella blanca caliente. 102 al.", color: "#e8f4ff", baseSize: 2.3 },

    // ── Serpens (La Serpiente) ─────────────────────────────────────────────────────
    { name: "Unukalhai", ra: 236.067, dec: 6.426, mag: 2.65, constellation: "Serpens", desc: "α Serpentis. Corazón de la Serpiente. Gigante naranja. 73 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Eta Ser", ra: 275.328, dec: -2.899, mag: 3.26, constellation: "Serpens", desc: "η Serpentis. Gigante naranja en la cola. 62 al.", color: "#ffcc88", baseSize: 2.7 },
    { name: "Mu Ser", ra: 237.786, dec: -3.430, mag: 3.53, constellation: "Serpens", desc: "μ Serpentis. Estrella blanca. 156 al.", color: "#e8f4ff", baseSize: 2.5 },
    { name: "Xi Ser", ra: 266.973, dec: -15.398, mag: 3.54, constellation: "Serpens", desc: "ξ Serpentis. Triple sistema. 105 al.", color: "#e8f4ff", baseSize: 2.5 },

    // ── Eridanus (completar El Río) ────────────────────────────────────────────────
    { name: "Cursa", ra: 76.963, dec: -5.086, mag: 2.78, constellation: "Eridanus", desc: "β Eridani. Cerca del pie de Orión. Gigante blanca. 89 al.", color: "#e8f4ff", baseSize: 3.0 },
    { name: "Zaurak", ra: 59.507, dec: -13.509, mag: 2.97, constellation: "Eridanus", desc: "γ Eridani. Gigante roja. 203 al.", color: "#ff9966", baseSize: 2.9 },
    { name: "Rana", ra: 53.233, dec: -9.458, mag: 3.54, constellation: "Eridanus", desc: "δ Eridani. Subgigante naranja cercana. 29 al.", color: "#ffcc88", baseSize: 2.5 },
    { name: "Azha", ra: 44.107, dec: -8.898, mag: 3.89, constellation: "Eridanus", desc: "η Eridani. Gigante naranja. 133 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Theta1 Eri", ra: 44.566, dec: -40.305, mag: 2.88, constellation: "Eridanus", desc: "θ1 Eridani. Gigante blanca del sur del río. 161 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ── Hydra (completar La Hidra) ─────────────────────────────────────────────────
    { name: "Gamma Hya", ra: 139.472, dec: -23.171, mag: 2.99, constellation: "Hydra", desc: "γ Hydrae. Gigante amarilla. 134 al.", color: "#fff0cc", baseSize: 2.9 },
    { name: "Zeta Hya", ra: 131.694, dec: -5.838, mag: 3.11, constellation: "Hydra", desc: "ζ Hydrae. Gigante amarilla. 167 al.", color: "#fff0cc", baseSize: 2.8 },
    { name: "Nu Hya", ra: 160.917, dec: -16.194, mag: 3.11, constellation: "Hydra", desc: "ν Hydrae. Gigante naranja. 144 al.", color: "#ffcc88", baseSize: 2.8 },
    { name: "Pi Hya", ra: 215.131, dec: -26.682, mag: 3.27, constellation: "Hydra", desc: "π Hydrae. Gigante naranja. 101 al.", color: "#ffcc88", baseSize: 2.7 },
    { name: "Epsilon Hya", ra: 131.176, dec: 6.419, mag: 3.38, constellation: "Hydra", desc: "ε Hydrae. Sistema múltiple de 5 estrellas. 129 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Delta Hya", ra: 127.567, dec: 5.704, mag: 4.14, constellation: "Hydra", desc: "δ Hydrae. Estrella blanca. 179 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Sigma Hya", ra: 129.689, dec: 3.341, mag: 4.45, constellation: "Hydra", desc: "σ Hydrae. Gigante naranja. 353 al.", color: "#ffcc88", baseSize: 1.9 },

    // ── Vela (completar Las Velas) ─────────────────────────────────────────────────
    { name: "Delta Vel", ra: 131.176, dec: -54.709, mag: 1.96, constellation: "Vela", desc: "δ Velorum. Binaria eclipsante. Parte de la Falsa Cruz. 80 al.", color: "#e8f4ff", baseSize: 3.6 },
    { name: "Kappa Vel", ra: 140.528, dec: -55.011, mag: 2.50, constellation: "Vela", desc: "κ Velorum. Supergigante azul. 539 al.", color: "#b0c8ff", baseSize: 3.2 },
    { name: "Mu Vel", ra: 161.692, dec: -49.420, mag: 2.69, constellation: "Vela", desc: "μ Velorum. Gigante amarilla. 117 al.", color: "#fff0cc", baseSize: 3.1 },
    { name: "Phi Vel", ra: 147.869, dec: -54.568, mag: 3.52, constellation: "Vela", desc: "φ Velorum. Subgigante azul. 635 al.", color: "#c0d8ff", baseSize: 2.5 },

    // ── Pavo (completar El Pavo) ───────────────────────────────────────────────────
    { name: "Beta Pav", ra: 311.240, dec: -66.203, mag: 3.42, constellation: "Pavo", desc: "β Pavonis. Estrella blanca. 137 al.", color: "#e8f4ff", baseSize: 2.6 },
    { name: "Delta Pav", ra: 302.185, dec: -66.179, mag: 3.56, constellation: "Pavo", desc: "δ Pavonis. Muy parecida al Sol. Solo 19.9 al.", color: "#fff8dd", baseSize: 2.5 },
    { name: "Eta Pav", ra: 262.854, dec: -64.723, mag: 3.62, constellation: "Pavo", desc: "η Pavonis. Gigante naranja. 371 al.", color: "#ffcc88", baseSize: 2.4 },

    // ── Triangulum Australe (completar) ────────────────────────────────────────────
    { name: "Beta TrA", ra: 238.786, dec: -63.430, mag: 2.85, constellation: "Triangulum Australe", desc: "β Trianguli Australis. Binaria. 40 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Gamma TrA", ra: 233.785, dec: -68.679, mag: 2.87, constellation: "Triangulum Australe", desc: "γ Trianguli Australis. Estrella blanca. 183 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ── Corona Borealis (completar) ────────────────────────────────────────────────
    { name: "Nusakan", ra: 231.957, dec: 29.106, mag: 3.68, constellation: "Corona Borealis", desc: "β Coronae Borealis. Variable peculiar. 114 al.", color: "#e8f4ff", baseSize: 2.4 },
    { name: "Gamma CrB", ra: 234.214, dec: 26.296, mag: 3.84, constellation: "Corona Borealis", desc: "γ Coronae Borealis. Binaria espectroscópica. 145 al.", color: "#e8f4ff", baseSize: 2.2 },
    { name: "Delta CrB", ra: 235.652, dec: 26.069, mag: 4.63, constellation: "Corona Borealis", desc: "δ Coronae Borealis. Gigante amarilla. 165 al.", color: "#fff0cc", baseSize: 1.8 },
    { name: "Theta CrB", ra: 236.547, dec: 31.359, mag: 4.14, constellation: "Corona Borealis", desc: "θ Coronae Borealis. Binaria espectroscópica. 311 al.", color: "#c0d8ff", baseSize: 2.1 },

    // ── Carina (completar) ─────────────────────────────────────────────────────────
    { name: "Epsilon Car", ra: 125.628, dec: -59.509, mag: 1.86, constellation: "Carina", desc: "ε Carinae. Gigante naranja + subdwarf azul. Oculta para los griegos. 630 al.", color: "#ffcc88", baseSize: 3.8 },
    { name: "Iota Car", ra: 139.272, dec: -59.275, mag: 2.21, constellation: "Carina", desc: "ι Carinae. Supergigante blanca en la Falsa Cruz. 690 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Theta Car", ra: 160.739, dec: -64.394, mag: 2.76, constellation: "Carina", desc: "θ Carinae. Subgigante azul en el cúmulo IC 2602. 439 al.", color: "#c0d8ff", baseSize: 3.0 },
    { name: "Upsilon Car", ra: 145.286, dec: -65.072, mag: 2.97, constellation: "Carina", desc: "υ Carinae. Estrella blanca. 1.623 al.", color: "#e8f4ff", baseSize: 2.9 },

    // ── Puppis (completar) ─────────────────────────────────────────────────────────
    { name: "Pi Pup", ra: 109.286, dec: -37.097, mag: 2.70, constellation: "Puppis", desc: "π Puppis. Supergigante naranja. 1.094 al.", color: "#ffcc88", baseSize: 3.1 },
    { name: "Rho Pup", ra: 121.886, dec: -24.304, mag: 2.81, constellation: "Puppis", desc: "ρ Puppis. Gigante amarilla. 63 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Tau Pup", ra: 99.436, dec: -50.615, mag: 2.94, constellation: "Puppis", desc: "τ Puppis. Gigante naranja. 182 al.", color: "#ffcc88", baseSize: 2.9 },
    { name: "Nu Pup", ra: 102.048, dec: -43.196, mag: 3.17, constellation: "Puppis", desc: "ν Puppis. Gigante azul. 423 al.", color: "#c0d8ff", baseSize: 2.8 },
    { name: "Sigma Pup", ra: 112.308, dec: -43.301, mag: 3.25, constellation: "Puppis", desc: "σ Puppis. Gigante naranja. 194 al.", color: "#ffcc88", baseSize: 2.7 },

    // ── Phoenix (El Fénix) ─────────────────────────────────────────────────────────
    { name: "Ankaa", ra: 6.571, dec: -42.306, mag: 2.37, constellation: "Phoenix", desc: "α Phoenicis. La más brillante del Fénix. Gigante naranja. 77 al.", color: "#ffcc88", baseSize: 3.3 },
    { name: "Beta Phe", ra: 16.521, dec: -46.718, mag: 3.31, constellation: "Phoenix", desc: "β Phoenicis. Binaria amarilla. 198 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Gamma Phe", ra: 22.091, dec: -43.318, mag: 3.41, constellation: "Phoenix", desc: "γ Phoenicis. Gigante roja. 234 al.", color: "#ff9966", baseSize: 2.6 },

    // ── Sculptor (El Escultor) ─────────────────────────────────────────────────────
    { name: "Alpha Scl", ra: 14.560, dec: -29.358, mag: 4.30, constellation: "Sculptor", desc: "α Sculptoris. Subgigante azul. 780 al.", color: "#c0d8ff", baseSize: 2.0 },

    // ── Fornax (El Horno) ──────────────────────────────────────────────────────────
    { name: "Alpha For", ra: 48.019, dec: -28.987, mag: 3.87, constellation: "Fornax", desc: "α Fornacis. Binaria. 46 al.", color: "#fff0cc", baseSize: 2.2 },

    // ── Horologium (El Reloj) ──────────────────────────────────────────────────────
    { name: "Alpha Hor", ra: 63.500, dec: -42.294, mag: 3.86, constellation: "Horologium", desc: "α Horologii. Gigante naranja. 117 al.", color: "#ffcc88", baseSize: 2.2 },

    // ── Caelum (El Buril) ──────────────────────────────────────────────────────────
    { name: "Alpha Cae", ra: 70.141, dec: -41.864, mag: 4.45, constellation: "Caelum", desc: "α Caeli. Subgigante blanco-amarilla. 65 al.", color: "#fff0cc", baseSize: 1.9 },

    // ── Pictor (El Caballete del Pintor) ───────────────────────────────────────────
    { name: "Alpha Pic", ra: 97.759, dec: -61.941, mag: 3.27, constellation: "Pictor", desc: "α Pictoris. Estrella blanca con disco de escombros. 97 al.", color: "#e8f4ff", baseSize: 2.7 },
    { name: "Beta Pic", ra: 86.821, dec: -51.066, mag: 3.86, constellation: "Pictor", desc: "β Pictoris. Famosa por su disco de escombros y exoplanetas. 63 al.", color: "#e8f4ff", baseSize: 2.2 },

    // ── Dorado (El Pez Dorado) ─────────────────────────────────────────────────────
    { name: "Alpha Dor", ra: 68.499, dec: -55.045, mag: 3.27, constellation: "Dorado", desc: "α Doradus. Gigante azul. 176 al.", color: "#c0d8ff", baseSize: 2.7 },
    { name: "Beta Dor", ra: 83.406, dec: -62.490, mag: 3.76, constellation: "Dorado", desc: "β Doradus. Cefeida clásica. 1.040 al.", color: "#fff0cc", baseSize: 2.3 },

    // ── Reticulum (El Retículo) ────────────────────────────────────────────────────
    { name: "Alpha Ret", ra: 63.606, dec: -62.474, mag: 3.33, constellation: "Reticulum", desc: "α Reticuli. Gigante amarilla. 161 al.", color: "#fff0cc", baseSize: 2.6 },
    { name: "Beta Ret", ra: 56.388, dec: -64.807, mag: 3.85, constellation: "Reticulum", desc: "β Reticuli. Gigante naranja. 100 al.", color: "#ffcc88", baseSize: 2.2 },

    // ── Hydrus (La Hidra Macho) ────────────────────────────────────────────────────
    { name: "Beta Hyi", ra: 6.407, dec: -77.255, mag: 2.80, constellation: "Hydrus", desc: "β Hydri. Subgigante amarilla muy cercana. 24.3 al.", color: "#fff0cc", baseSize: 3.0 },
    { name: "Alpha Hyi", ra: 29.690, dec: -61.570, mag: 2.86, constellation: "Hydrus", desc: "α Hydri. Subgigante blanca. 71 al.", color: "#e8f4ff", baseSize: 2.9 },
    { name: "Gamma Hyi", ra: 62.177, dec: -74.239, mag: 3.24, constellation: "Hydrus", desc: "γ Hydri. Gigante roja. 214 al.", color: "#ff9966", baseSize: 2.7 },

    // ── Tucana (El Tucán) ──────────────────────────────────────────────────────────
    { name: "Alpha Tuc", ra: 334.625, dec: -60.259, mag: 2.86, constellation: "Tucana", desc: "α Tucanae. Binaria naranja. 199 al.", color: "#ffcc88", baseSize: 2.9 },
    { name: "Beta Tuc", ra: 350.808, dec: -62.958, mag: 4.37, constellation: "Tucana", desc: "β Tucanae. Sistema múltiple. 140 al.", color: "#e8f4ff", baseSize: 1.9 },
    { name: "Gamma Tuc", ra: 353.793, dec: -58.236, mag: 3.99, constellation: "Tucana", desc: "γ Tucanae. Subgigante amarilla. 72 al.", color: "#fff0cc", baseSize: 2.2 },

    // ── Indus (El Indio) ───────────────────────────────────────────────────────────
    { name: "Alpha Ind", ra: 309.392, dec: -47.291, mag: 3.11, constellation: "Indus", desc: "α Indi. Gigante naranja. 101 al.", color: "#ffcc88", baseSize: 2.8 },
    { name: "Beta Ind", ra: 313.703, dec: -58.454, mag: 3.67, constellation: "Indus", desc: "β Indi. Gigante naranja. 600 al.", color: "#ffcc88", baseSize: 2.4 },

    // ── Microscopium (El Microscopio) ──────────────────────────────────────────────
    { name: "Gamma Mic", ra: 317.246, dec: -32.258, mag: 4.67, constellation: "Microscopium", desc: "γ Microscopii. Gigante amarilla. 224 al.", color: "#fff0cc", baseSize: 1.8 },

    // ── Telescopium (El Telescopio) ────────────────────────────────────────────────
    { name: "Alpha Tel", ra: 271.362, dec: -45.968, mag: 3.51, constellation: "Telescopium", desc: "α Telescopii. Subgigante azul. 249 al.", color: "#c0d8ff", baseSize: 2.5 },

    // ── Norma (La Escuadra) ────────────────────────────────────────────────────────
    { name: "Gamma2 Nor", ra: 244.963, dec: -50.156, mag: 4.02, constellation: "Norma", desc: "γ² Normae. Supergigante amarilla. 1.430 al.", color: "#fff0cc", baseSize: 2.1 },

    // ── Circinus (El Compás) ───────────────────────────────────────────────────────
    { name: "Alpha Cir", ra: 220.326, dec: -64.975, mag: 3.19, constellation: "Circinus", desc: "α Circini. Binaria blanca variable. 54 al.", color: "#e8f4ff", baseSize: 2.8 },

    // ── Musca (La Mosca) ───────────────────────────────────────────────────────────
    { name: "Alpha Mus", ra: 189.296, dec: -69.136, mag: 2.69, constellation: "Musca", desc: "α Muscae. Variable β Cephei azul. 315 al.", color: "#b0c8ff", baseSize: 3.1 },
    { name: "Beta Mus", ra: 191.571, dec: -68.108, mag: 3.04, constellation: "Musca", desc: "β Muscae. Binaria azul. 341 al.", color: "#b0c8ff", baseSize: 2.9 },
    { name: "Delta Mus", ra: 195.522, dec: -71.548, mag: 3.62, constellation: "Musca", desc: "δ Muscae. Gigante naranja. 91 al.", color: "#ffcc88", baseSize: 2.4 },
    { name: "Gamma Mus", ra: 190.383, dec: -72.133, mag: 3.87, constellation: "Musca", desc: "γ Muscae. Subgigante azul. 325 al.", color: "#c0d8ff", baseSize: 2.2 },

    // ── Chamaeleon (El Camaleón) ───────────────────────────────────────────────────
    { name: "Alpha Cha", ra: 124.633, dec: -76.920, mag: 4.07, constellation: "Chamaeleon", desc: "α Chamaeleontis. Subgigante blanca. 63 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Gamma Cha", ra: 165.555, dec: -78.608, mag: 4.11, constellation: "Chamaeleon", desc: "γ Chamaeleontis. Gigante roja. 413 al.", color: "#ff9966", baseSize: 2.1 },
    { name: "Beta Cha", ra: 190.418, dec: -79.312, mag: 4.26, constellation: "Chamaeleon", desc: "β Chamaeleontis. Subgigante azul. 271 al.", color: "#c0d8ff", baseSize: 2.0 },

    // ── Volans (El Pez Volador) ────────────────────────────────────────────────────
    { name: "Gamma Vol", ra: 117.305, dec: -70.499, mag: 3.60, constellation: "Volans", desc: "γ Volantis. Binaria naranja-blanca. 142 al.", color: "#ffcc88", baseSize: 2.4 },
    { name: "Beta Vol", ra: 126.434, dec: -66.137, mag: 3.77, constellation: "Volans", desc: "β Volantis. Gigante naranja. 108 al.", color: "#ffcc88", baseSize: 2.3 },
    { name: "Zeta Vol", ra: 118.032, dec: -72.606, mag: 3.95, constellation: "Volans", desc: "ζ Volantis. Gigante naranja. 134 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Delta Vol", ra: 111.024, dec: -67.957, mag: 3.98, constellation: "Volans", desc: "δ Volantis. Subgigante amarilla. 660 al.", color: "#fff0cc", baseSize: 2.2 },

    // ── Apus (El Ave del Paraíso) ──────────────────────────────────────────────────
    { name: "Alpha Aps", ra: 221.752, dec: -79.045, mag: 3.83, constellation: "Apus", desc: "α Apodis. Gigante naranja. 411 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Gamma Aps", ra: 248.530, dec: -78.897, mag: 3.89, constellation: "Apus", desc: "γ Apodis. Gigante naranja. 160 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Beta Aps", ra: 251.459, dec: -77.517, mag: 4.24, constellation: "Apus", desc: "β Apodis. Gigante naranja. 158 al.", color: "#ffcc88", baseSize: 2.0 },

    // ── Mensa (La Mesa) ────────────────────────────────────────────────────────────
    { name: "Alpha Men", ra: 92.615, dec: -74.753, mag: 5.09, constellation: "Mensa", desc: "α Mensae. Estrella amarilla. Solo 33 al.", color: "#fff0cc", baseSize: 1.6 },

    // ── Octans (El Octante) ────────────────────────────────────────────────────────
    { name: "Nu Oct", ra: 324.785, dec: -77.390, mag: 3.76, constellation: "Octans", desc: "ν Octantis. Gigante naranja con exoplaneta. 69 al.", color: "#ffcc88", baseSize: 2.3 },

    // ── Canes Venatici (Los Perros de Caza) ────────────────────────────────────────
    { name: "Cor Caroli", ra: 194.007, dec: 38.318, mag: 2.90, constellation: "Canes Venatici", desc: "α Canum Venaticorum. Variable magnética prototipo. 110 al.", color: "#e8f4ff", baseSize: 2.9 },
    { name: "Chara", ra: 188.436, dec: 41.357, mag: 4.26, constellation: "Canes Venatici", desc: "β Canum Venaticorum. Estrella amarilla parecida al Sol. 27 al.", color: "#fff8dd", baseSize: 2.0 },

    // ── Coma Berenices (La Cabellera de Berenice) ──────────────────────────────────
    { name: "Diadem", ra: 197.497, dec: 17.529, mag: 4.32, constellation: "Coma Berenices", desc: "α Comae Berenices. Binaria blanca. 63 al.", color: "#e8f4ff", baseSize: 1.9 },
    { name: "Beta Com", ra: 185.340, dec: 27.878, mag: 4.26, constellation: "Coma Berenices", desc: "β Comae Berenices. Estrella parecida al Sol. 30 al.", color: "#fff8dd", baseSize: 2.0 },

    // ── Leo Minor (El León Menor) ──────────────────────────────────────────────────
    { name: "Praecipua", ra: 157.332, dec: 34.214, mag: 3.83, constellation: "Leo Minor", desc: "46 Leonis Minoris. La más brillante del León Menor. Gigante naranja. 98 al.", color: "#ffcc88", baseSize: 2.2 },

    // ── Lynx (El Lince) ────────────────────────────────────────────────────────────
    { name: "Alpha Lyn", ra: 141.896, dec: 34.392, mag: 3.14, constellation: "Lynx", desc: "α Lyncis. Gigante naranja. 222 al.", color: "#ffcc88", baseSize: 2.8 },

    // ── Sextans (El Sextante) ──────────────────────────────────────────────────────
    { name: "Alpha Sex", ra: 150.374, dec: -0.372, mag: 4.49, constellation: "Sextans", desc: "α Sextantis. Gigante blanca. 287 al.", color: "#e8f4ff", baseSize: 1.9 },

    // ── Antlia (La Máquina Neumática) ──────────────────────────────────────────────
    { name: "Alpha Ant", ra: 156.789, dec: -31.068, mag: 4.25, constellation: "Antlia", desc: "α Antliae. Gigante naranja. 366 al.", color: "#ffcc88", baseSize: 2.0 },

    // ── Pyxis (La Brújula) ─────────────────────────────────────────────────────────
    { name: "Alpha Pyx", ra: 130.899, dec: -33.186, mag: 3.68, constellation: "Pyxis", desc: "α Pyxidis. Gigante azul. 880 al.", color: "#c0d8ff", baseSize: 2.4 },
    { name: "Beta Pyx", ra: 128.861, dec: -35.308, mag: 3.97, constellation: "Pyxis", desc: "β Pyxidis. Gigante amarilla. 388 al.", color: "#fff0cc", baseSize: 2.2 },
    { name: "Gamma Pyx", ra: 132.633, dec: -27.710, mag: 4.01, constellation: "Pyxis", desc: "γ Pyxidis. Gigante naranja. 209 al.", color: "#ffcc88", baseSize: 2.1 },

    // ── Equuleus (El Caballito) ────────────────────────────────────────────────────
    { name: "Kitalpha", ra: 318.956, dec: 5.248, mag: 3.92, constellation: "Equuleus", desc: "α Equulei. Binaria espectroscópica. 186 al.", color: "#fff0cc", baseSize: 2.2 },

    // ── Camelopardalis (La Jirafa) ─────────────────────────────────────────────────
    { name: "Beta Cam", ra: 75.854, dec: 60.442, mag: 4.03, constellation: "Camelopardalis", desc: "β Camelopardalis. Supergigante amarilla. 1.000 al.", color: "#fff0cc", baseSize: 2.1 },
    { name: "Alpha Cam", ra: 74.248, dec: 66.343, mag: 4.29, constellation: "Camelopardalis", desc: "α Camelopardalis. Supergigante azul. 6.000 al.", color: "#b0c8ff", baseSize: 2.0 },

    // ── Más estrellas australes y IAU ───────────────────────────────────────────
    { name: "Sigma Oct", ra: 317.185, dec: -88.956, mag: 5.42, constellation: "Octans", desc: "σ Octantis. La Estrella Polar del Sur. Mucho más tenue que Polaris Norte.", color: "#ffffdd", baseSize: 1.5 },
    { name: "Gamma Cen", ra: 190.133, dec: -48.959, mag: 2.20, constellation: "Centaurus", desc: "γ Centauri. Binaria espectroscópica en el hombro del Centauro. 130 al.", color: "#e8f4ff", baseSize: 3.4 },
    { name: "Delta Cen", ra: 181.189, dec: -50.722, mag: 2.60, constellation: "Centaurus", desc: "δ Centauri. Masiva y caliente. 395 al.", color: "#b0c8ff", baseSize: 3.2 },
    { name: "Epsilon Cen", ra: 204.667, dec: -53.466, mag: 2.30, constellation: "Centaurus", desc: "ε Centauri. Gigante azul-blanca. 430 al. Miembro de la asociación Scorpius-Centaurus.", color: "#b0c8ff", baseSize: 3.3 },
    { name: "Zeta Cen", ra: 194.272, dec: -47.288, mag: 2.55, constellation: "Centaurus", desc: "ζ Centauri. Binaria espectroscópica masiva. 385 al.", color: "#b0c8ff", baseSize: 3.2 },
    { name: "Eta Cen", ra: 218.899, dec: -42.155, mag: 2.31, constellation: "Centaurus", desc: "η Centauri. Emite rayos X. Rodeada por un disco de gas caliente. 306 al.", color: "#c0d8ff", baseSize: 3.3 },
    { name: "Theta Cen", ra: 211.670, dec: -36.369, mag: 2.06, constellation: "Centaurus", desc: "θ Centauri (Menkent). Gigante naranja en el flanco del Centauro. 61 al.", color: "#ffcc88", baseSize: 3.5 },

    { name: "Eta Car", ra: 161.265, dec: -59.684, mag: 4.50, constellation: "Carina", desc: "η Carinae. Supermasiva inestable. Protagonista de la 'Gran Erupción' de 1843.", color: "#ffaa99", baseSize: 2.2 },
    { name: "Chi Car", ra: 118.887, dec: -52.977, mag: 3.46, constellation: "Carina", desc: "χ Carinae. Subgigante azul-blanca. 387 al.", color: "#c0d8ff", baseSize: 2.7 },
    { name: "Omega Car", ra: 153.181, dec: -70.038, mag: 3.29, constellation: "Carina", desc: "ω Carinae. Gigante blanca. 250 al.", color: "#e8f4ff", baseSize: 2.8 },

    { name: "Pi Vel", ra: 154.512, dec: -47.051, mag: 3.50, constellation: "Vela", desc: "π Velorum. Subgigante blanca triple. 495 al.", color: "#e8f4ff", baseSize: 2.5 },
    { name: "Omicron Vel", ra: 132.333, dec: -52.923, mag: 3.60, constellation: "Vela", desc: "ο Velorum. Miembro del cúmulo IC 2391. 490 al.", color: "#b0c8ff", baseSize: 2.4 },
    { name: "Lambda Vel", ra: 136.000, dec: -43.432, mag: 2.21, constellation: "Vela", desc: "λ Velorum (Suhail). Supergigante naranja brillante. 570 al.", color: "#ffcc88", baseSize: 3.4 },

    { name: "Gamma Lup", ra: 229.248, dec: -41.167, mag: 2.78, constellation: "Lupus", desc: "γ Lupi. Binaria azul. 567 al.", color: "#b0c8ff", baseSize: 3.0 },
    { name: "Phi1 Lup", ra: 228.455, dec: -34.122, mag: 3.56, constellation: "Lupus", desc: "φ¹ Lupi. Masiva y caliente. 326 al.", color: "#c0d8ff", baseSize: 2.5 },

    { name: "Gamma Pav", ra: 283.455, dec: -65.344, mag: 4.22, constellation: "Pavo", desc: "γ Pavonis. Estrella cercana parecida al Sol. 30 al.", color: "#fff0cc", baseSize: 2.1 },
    { name: "Lambda Pav", ra: 280.443, dec: -62.188, mag: 4.22, constellation: "Pavo", desc: "λ Pavonis. Estrella blanca variable. 1.800 al.", color: "#e8f4ff", baseSize: 2.1 },

    { name: "Gamma Gru", ra: 328.718, dec: -37.365, mag: 3.01, constellation: "Grus", desc: "γ Gruis. Gigante azul-blanca. La 'Grulla'. 203 al.", color: "#c0d8ff", baseSize: 3.1 },
    { name: "Delta Gru", ra: 334.665, dec: -43.498, mag: 3.97, constellation: "Grus", desc: "δ Gruis. Doble óptica gigante roja. 309 al.", color: "#ff9966", baseSize: 2.2 },

    { name: "Beta Tuc", ra: 350.808, dec: -62.958, mag: 4.37, constellation: "Tucana", desc: "β Tucanae. Sistema quíntuple. Primer plano de la SMC. 140 al.", color: "#e8f4ff", baseSize: 1.9 },
    { name: "Zeta Tuc", ra: 3.221, dec: -64.872, mag: 4.23, constellation: "Tucana", desc: "ζ Tucanae. Estrella amarilla muy similar al Sol. Solo 28 al.", color: "#fff8dd", baseSize: 2.1 },

    { name: "Delta Hyi", ra: 23.512, dec: -68.655, mag: 4.08, constellation: "Hydrus", desc: "δ Hydri. Subgigante blanca. 135 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Epsilon Hyi", ra: 16.333, dec: -82.607, mag: 4.11, constellation: "Hydrus", desc: "ε Hydri. Gigante naranja. 228 al.", color: "#ffcc88", baseSize: 2.1 },

    { name: "Beta Ret", ra: 56.388, dec: -64.807, mag: 3.84, constellation: "Reticulum", desc: "β Reticuli. Gigante naranja. 100 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Gamma Ret", ra: 60.122, dec: -62.155, mag: 4.48, constellation: "Reticulum", desc: "γ Reticuli. Gigante roja variable. 490 al.", color: "#ff9966", baseSize: 1.9 },

    { name: "Gamma Dor", ra: 64.512, dec: -51.498, mag: 4.25, constellation: "Dorado", desc: "γ Doradus. Prototipo de una clase de estrellas variables. 66 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Delta Dor", ra: 88.333, dec: -65.738, mag: 4.34, constellation: "Dorado", desc: "δ Doradus. Estrella blanca caliente. 145 al.", color: "#c0d8ff", baseSize: 2.0 },

    { name: "Beta Vol", ra: 126.434, dec: -66.137, mag: 3.77, constellation: "Volans", desc: "β Volantis. Gigante naranja. 108 al.", color: "#ffcc88", baseSize: 2.3 },
    { name: "Zeta Vol", ra: 118.032, dec: -72.606, mag: 3.93, constellation: "Volans", desc: "ζ Volantis. Gigante naranja. 134 al.", color: "#ffcc88", baseSize: 2.2 },

    { name: "Gamma Tel", ra: 272.555, dec: -52.972, mag: 4.48, constellation: "Telescopium", desc: "γ Telescopii. Gigante naranja. 176 al.", color: "#ffcc88", baseSize: 1.9 },

    { name: "Delta Cir", ra: 228.333, dec: -60.912, mag: 5.08, constellation: "Circinus", desc: "δ Circini. Estrella masiva muy caliente. 2.100 al.", color: "#b0c8ff", baseSize: 1.6 },

    { name: "Phi Scl", ra: 21.332, dec: -27.042, mag: 5.17, constellation: "Sculptor", desc: "φ Sculptoris. Subgigante blanca cercana. 110 al.", color: "#e8f4ff", baseSize: 1.6 },

    { name: "Beta For", ra: 44.112, dec: -32.404, mag: 4.45, constellation: "Fornax", desc: "β Fornacis. Gigante amarilla. 169 al.", color: "#fff0cc", baseSize: 1.9 },

    { name: "Beta Cae", ra: 71.212, dec: -37.133, mag: 5.04, constellation: "Caelum", desc: "β Caeli. Estrella blanca. 90 al.", color: "#e8f4ff", baseSize: 1.6 },

    { name: "Gamma Mic", ra: 315.111, dec: -32.169, mag: 4.67, constellation: "Microscopium", desc: "γ Microscopii. La más brillante del Microscopio. 223 al.", color: "#fff0cc", baseSize: 1.8 },

    { name: "Iota Pyx", ra: 134.125, dec: -25.856, mag: 4.54, constellation: "Pyxis", desc: "ι Pyxidis. Gigante naranja. 115 al.", color: "#ffcc88", baseSize: 1.9 },

    { name: "38 Lyn", ra: 139.754, dec: 36.804, mag: 3.82, constellation: "Lynx", desc: "38 Lyncis. La segunda más brillante del Lince. 122 al.", color: "#e8f4ff", baseSize: 2.3 },
    { name: "10 UMa", ra: 135.088, dec: 41.784, mag: 3.96, constellation: "Lynx", desc: "10 Ursae Majoris (en Lynx). Binaria blanca. 54 al.", color: "#e8f4ff", baseSize: 2.2 },

    { name: "Alpha Ant", ra: 156.455, dec: -31.066, mag: 4.25, constellation: "Antlia", desc: "α Antliae. Gigante naranja en la Máquina Neumática. 366 al.", color: "#ffcc88", baseSize: 2.0 },

    { name: "Alpha Sex", ra: 151.712, dec: -0.369, mag: 4.48, constellation: "Sextans", desc: "α Sextantis. Gigante blanca. 287 al.", color: "#e8f4ff", baseSize: 1.9 },

    { name: "Delta Equ", ra: 318.152, dec: 10.003, mag: 4.47, constellation: "Equuleus", desc: "δ Equulei. Binaria espectroscópica en el Caballito. 60 al.", color: "#fff0cc", baseSize: 1.9 },

    { name: "Anser", ra: 297.697, dec: 24.661, mag: 4.44, constellation: "Vulpecula", desc: "α Vulpeculae. Gigante roja en la Zorra. 297 al.", color: "#ff9966", baseSize: 1.9 },
    { name: "1 Vul", ra: 289.412, dec: 21.369, mag: 4.77, constellation: "Vulpecula", desc: "1 Vulpeculae. Estrella blanca. 260 al.", color: "#e8f4ff", baseSize: 1.7 },

    { name: "Gamma Ara", ra: 259.612, dec: -56.377, mag: 3.33, constellation: "Ara", desc: "γ Arae. Supergigante azul en el Altar. 1.100 al.", color: "#b0c8ff", baseSize: 2.7 },
    { name: "Zeta Ara", ra: 254.675, dec: -55.996, mag: 3.12, constellation: "Ara", desc: "ζ Arae. Gigante naranja. 574 al.", color: "#ffcc88", baseSize: 2.8 },

    { name: "Alpha Men", ra: 93.122, dec: -74.752, mag: 5.08, constellation: "Mensa", desc: "α Mensae. La estrella principal de la Mesa. Parecida al Sol. 33 al.", color: "#fff8dd", baseSize: 1.6 },
    { name: "Beta Men", ra: 126.333, dec: -71.212, mag: 5.31, constellation: "Mensa", desc: "β Mensae. Gigante amarilla. 640 al.", color: "#fff0cc", baseSize: 1.5 },

    { name: "Alpha Aps", ra: 221.755, dec: -79.043, mag: 3.83, constellation: "Apus", desc: "α Apodis. Gigante naranja en el Ave del Paraíso. 411 al.", color: "#ffcc88", baseSize: 2.2 },
    { name: "Gamma Aps", ra: 248.512, dec: -78.889, mag: 3.89, constellation: "Apus", desc: "γ Apodis. Gigante naranja. 160 al.", color: "#ffcc88", baseSize: 2.2 },

    { name: "Alpha Cha", ra: 124.612, dec: -76.921, mag: 4.07, constellation: "Chamaeleon", desc: "α Chamaeleontis. Subgigante blanca cercana. 63 al.", color: "#e8f4ff", baseSize: 2.1 },
    { name: "Gamma Cha", ra: 165.512, dec: -78.604, mag: 4.11, constellation: "Chamaeleon", desc: "γ Chamaeleontis. Gigante roja. 413 al.", color: "#ff9966", baseSize: 2.1 },

    { name: "Alpha Mus", ra: 189.297, dec: -69.136, mag: 2.69, constellation: "Musca", desc: "α Muscae. Estrella masiva en la Mosca. 315 al.", color: "#b0c8ff", baseSize: 3.1 },
    { name: "Beta Mus", ra: 191.566, dec: -68.109, mag: 3.04, constellation: "Musca", desc: "β Muscae. Binaria azul. 341 al.", color: "#b0c8ff", baseSize: 2.9 },
];

