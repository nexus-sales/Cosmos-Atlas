import { DSO } from '../types/celestial';

export const DSOS: DSO[] = [
    { id: "M42", name: "Nebulosa de Orión", ra: 83.82, dec: -5.39, type: "nebula", mag: 4.0, desc: "Vivero estelar. 1,344 al. Visible a simple vista.", color: "#88ffaa", sizeArcmin: 65 },
    { id: "M45", name: "Pléyades", ra: 56.75, dec: 24.11, type: "cluster", mag: 1.6, desc: "Las Siete Hermanas. 444 al. Mencionadas en la Biblia.", color: "#aaccff", sizeArcmin: 110 },
    { id: "M31", name: "Galaxia de Andrómeda", ra: 10.68, dec: 41.27, type: "galaxy", mag: 3.4, desc: "2.5 millones al. Chocará con la Vía Láctea en 4,500M años.", color: "#ffcc88", sizeArcmin: 190 },
    { id: "M13", name: "Cúmulo de Hércules", ra: 250.42, dec: 36.46, type: "cluster", mag: 5.8, desc: "300,000 estrellas. El Mensaje de Arecibo apunta aquí.", color: "#aaccff", sizeArcmin: 20 },
    { id: "M57", name: "Nebulosa del Anillo", ra: 283.40, dec: 33.03, type: "nebula", mag: 8.8, desc: "Envuelta de estrella moribunda. Más fotografiada del cielo.", color: "#88ffcc", sizeArcmin: 1.5 },
    { id: "M1", name: "Nebulosa del Cangrejo", ra: 83.63, dec: 22.01, type: "nebula", mag: 8.4, desc: "Resto de la supernova de 1054 d.C. vista de día.", color: "#88ffaa", sizeArcmin: 6 },
    { id: "M51", name: "Galaxia del Remolino", ra: 202.47, dec: 47.20, type: "galaxy", mag: 8.4, desc: "Primera espiral observada (1845). 23M años luz.", color: "#ffbb88", sizeArcmin: 11 },
    { id: "M104", name: "Galaxia Sombrero", ra: 189.99, dec: -11.62, type: "galaxy", mag: 8.0, desc: "Agujero negro de 1,000M masas solares.", color: "#ffcc88", sizeArcmin: 9 },
    { id: "M8", name: "Nebulosa Laguna", ra: 271.07, dec: -24.38, type: "nebula", mag: 5.0, desc: "Visible a simple vista en Sagitario. 4,100 al.", color: "#88ffaa", sizeArcmin: 90 },
    { id: "M81", name: "Galaxia de Bode", ra: 149.88, dec: 69.07, type: "galaxy", mag: 6.9, desc: "Espiral a 12M al. Visible con binoculares.", color: "#ffbb88", sizeArcmin: 27 },
    { id: "M44", name: "Pesebre", ra: 130.05, dec: 19.99, type: "cluster", mag: 3.1, desc: "1,000 estrellas. Planetas con agua confirmados.", color: "#aaccff", sizeArcmin: 95 },
    { id: "M27", name: "Nebulosa Mancuerna", ra: 299.90, dec: 22.72, type: "nebula", mag: 7.4, desc: "Primera nebulosa planetaria descubierta (1764).", color: "#88ffcc", sizeArcmin: 8 },
    { id: "ωCen", name: "Omega Centauri", ra: 201.70, dec: -47.48, type: "cluster", mag: 3.7, desc: "10M estrellas. Núcleo de galaxia absorbida.", color: "#aaccff", sizeArcmin: 36 },
    { id: "M33", name: "Galaxia del Triángulo", ra: 23.46, dec: 30.66, type: "galaxy", mag: 5.7, desc: "2.7M al. La más lejana visible a simple vista.", color: "#ffbb88", sizeArcmin: 70 },
    { id: "M20", name: "Nebulosa Trífida", ra: 270.61, dec: -23.03, type: "nebula", mag: 6.3, desc: "Tres lóbulos separados por bandas de polvo oscuro.", color: "#88ffaa", sizeArcmin: 28 },

    // ── Más galaxias ─────────────────────────────────────────────────────────────
    { id: "LMC", name: "Nube de Magallanes Grande", ra: 80.893, dec: -69.756, type: "galaxy", mag: 0.9, desc: "Galaxia satélite de la Vía Láctea. 160.000 al. Visible a ojo desnudo en el hemisferio sur.", color: "#ffcc88", sizeArcmin: 645 },
    { id: "SMC", name: "Nube de Magallanes Pequeña", ra: 13.158, dec: -72.800, type: "galaxy", mag: 2.7, desc: "Galaxia satélite irregular. 200.000 al. Fernand Magallanes la describió en 1519.", color: "#ffcc88", sizeArcmin: 320 },
    { id: "M82", name: "Galaxia del Cigarro", ra: 148.968, dec: 69.681, type: "galaxy", mag: 8.4, desc: "Galaxia estarburst — forma estrellas 10× más rápido que la Vía Láctea. 12M al.", color: "#ff9966", sizeArcmin: 11 },
    { id: "M101", name: "Galaxia del Molinete", ra: 210.802, dec: 54.349, type: "galaxy", mag: 7.9, desc: "Espiral de cara, 101× descubierta por Méchain (1781). 21M al.", color: "#ffbb88", sizeArcmin: 28 },
    { id: "M87", name: "Virgo A", ra: 187.706, dec: 12.391, type: "galaxy", mag: 8.6, desc: "Primera foto de un agujero negro (2019). Chorro relativista de 5.000 al. 53M al.", color: "#ffcc88", sizeArcmin: 7 },
    { id: "M64", name: "Galaxia Ojo Negro", ra: 194.183, dec: 21.683, type: "galaxy", mag: 8.5, desc: "Oscuro anillo de polvo en contraste con el núcleo brillante. 24M al.", color: "#ffbb88", sizeArcmin: 10 },
    { id: "CenA", name: "Centauro A", ra: 201.363, dec: -43.019, type: "galaxy", mag: 7.0, desc: "Radiogalaxia más cercana. Emisora intensa de rayos X. Agujero negro de 55M masas solares. 13M al.", color: "#ffcc88", sizeArcmin: 25 },

    // ── Más cúmulos ───────────────────────────────────────────────────────────────
    { id: "M3", name: "Cúmulo M3", ra: 205.549, dec: 28.377, type: "cluster", mag: 6.2, desc: "500.000 estrellas. El cúmulo globular más rico del hemisferio norte. 33.900 al.", color: "#aaccff", sizeArcmin: 18 },
    { id: "M4", name: "Cúmulo M4", ra: 245.897, dec: -26.526, type: "cluster", mag: 5.9, desc: "El más cercano al Sol de los globulares grandes (7.200 al). Junto a Antares.", color: "#aaccff", sizeArcmin: 36 },
    { id: "M5", name: "Cúmulo M5", ra: 229.638, dec: 2.082, type: "cluster", mag: 5.7, desc: "100.000+ estrellas. Uno de los más antiguos conocidos: 13.000 Ma.", color: "#aaccff", sizeArcmin: 23 },
    { id: "M11", name: "Cúmulo Pato Silvestre", ra: 282.767, dec: -6.272, type: "cluster", mag: 5.8, desc: "2.900 estrellas en solo 25 al. luz de diámetro. El cúmulo abierto más rico. 6.200 al.", color: "#aaccff", sizeArcmin: 14 },
    { id: "M92", name: "Cúmulo M92", ra: 259.281, dec: 43.136, type: "cluster", mag: 6.4, desc: "250.000 estrellas en Hércules. A menudo ignorado por estar cerca del famoso M13.", color: "#aaccff", sizeArcmin: 14 },
    { id: "NGC869", name: "Cúmulo Doble de Perseo", ra: 34.750, dec: 57.128, type: "cluster", mag: 4.3, desc: "h+χ Persei. Dos cúmulos jóvenes separados (200-500 a.l.). Espectaculares en binoculares.", color: "#aaccff", sizeArcmin: 30 },
    { id: "M6", name: "Cúmulo Mariposa", ra: 265.081, dec: -32.250, type: "cluster", mag: 4.2, desc: "Forma de mariposa. 80 estrellas visible a ojo desnudo en Escorpio. 1.600 al.", color: "#aaccff", sizeArcmin: 25 },
    { id: "M7", name: "Cúmulo de Ptolomeo", ra: 268.462, dec: -34.783, type: "cluster", mag: 3.3, desc: "Descrito por Ptolomeo en 130 d.C. Uno de los cúmulos más brillantes del cielo. 1.000 al.", color: "#aaccff", sizeArcmin: 80 },
    { id: "M41", name: "Cúmulo M41", ra: 101.508, dec: -20.750, type: "cluster", mag: 4.5, desc: "¡Bajo Sirio! 100 estrellas con gigante naranja central. Mencionado por Aristóteles. 2.300 al.", color: "#aaccff", sizeArcmin: 38 },
    { id: "M35", name: "Cúmulo M35", ra: 92.225, dec: 24.350, type: "cluster", mag: 5.1, desc: "200 estrellas en Géminis. El vecino NGC 2158 parece polvillo de fondo a 15.000 al.", color: "#aaccff", sizeArcmin: 28 },
    { id: "M36", name: "Cúmulo M36 (Auriga)", ra: 84.075, dec: 34.133, type: "cluster", mag: 6.0, desc: "Joven y compacto en Auriga. 60 estrellas. 4.100 al.", color: "#aaccff", sizeArcmin: 12 },
    { id: "M37", name: "Cúmulo M37 (Auriga)", ra: 88.075, dec: 32.550, type: "cluster", mag: 5.6, desc: "El más rico de los tres Messier de Auriga. 500 estrellas. 4.500 al.", color: "#aaccff", sizeArcmin: 24 },
    { id: "M38", name: "Cúmulo M38 (Auriga)", ra: 82.179, dec: 35.850, type: "cluster", mag: 6.4, desc: "Aspecto de cruz o pi griega visto con telescopio. 4.200 al.", color: "#aaccff", sizeArcmin: 21 },

    // ── Más nebulosas ─────────────────────────────────────────────────────────────
    { id: "M16", name: "Nebulosa del Águila", ra: 274.700, dec: -13.816, type: "nebula", mag: 6.0, desc: "Los «Pilares de la Creación» (Hubble 1995). Vivero estelar activo. 7.000 al.", color: "#88ffaa", sizeArcmin: 7 },
    { id: "M17", name: "Nebulosa del Cisne", ra: 275.108, dec: -16.167, type: "nebula", mag: 6.0, desc: "También llamada Omega o Herradura. Región de formación estelar intensa. 5.500 al.", color: "#88ffcc", sizeArcmin: 11 },
    { id: "N7293", name: "Nebulosa de la Hélice", ra: 337.408, dec: -20.833, type: "nebula", mag: 7.3, desc: "La «hélice de Dios». Nebulosa planetaria más cercana a la Tierra (650 al). 2.5 al de diámetro.", color: "#88ffcc", sizeArcmin: 15 },
    { id: "N7000", name: "Nebulosa América del Norte", ra: 314.821, dec: 44.529, type: "nebula", mag: 4.0, desc: "Su forma recuerda el continente. A 2.200 al en la región de Deneb. Visible con binoculares.", color: "#ff8888", sizeArcmin: 120 },
    { id: "N3372", name: "Nebulosa Eta Carinae", ra: 160.958, dec: -59.867, type: "nebula", mag: 1.0, desc: "La mayor nebulosa brillante de la Vía Láctea. 7.500 al. Eta Car podría explotar pronto.", color: "#ffcc44", sizeArcmin: 120 },
    { id: "IC1805", name: "Nebulosa del Corazón", ra: 38.175, dec: 61.450, type: "nebula", mag: 6.5, desc: "Región de ionización de hidrógeno en Cassiopeia. 7.500 al. Nido de estrellas masivas.", color: "#ff6688", sizeArcmin: 150 },
    { id: "N6992", name: "Nebulosa del Velo (Este)", ra: 314.092, dec: 31.717, type: "nebula", mag: 7.0, desc: "Remanente de supernova del Cisne — explosion hace ~10.000 años. 2.100 al.", color: "#88ddff", sizeArcmin: 60 },
];
