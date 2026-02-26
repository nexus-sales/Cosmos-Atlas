import { DSO } from '../types/celestial';

export const DSOS: DSO[] = [
    // --- NEBULOSAS ---
    { id: "M42", name: "Nebulosa de Orión", ra: 83.82, dec: -5.39, type: "nebula", mag: 4.0, desc: "Gran vivero estelar en la espada de Orión. 1,344 al.", color: "#88ffcc", sizeArcmin: 60, kind: "dso" },
    { id: "M1", name: "Nebulosa del Cangrejo", ra: 83.63, dec: 22.01, type: "nebula", mag: 8.4, desc: "Resto de la supernova de 1054 d.C. visible de día.", color: "#88ffaa", sizeArcmin: 6, kind: "dso" },
    { id: "M57", name: "Nebulosa del Anillo", ra: 283.40, dec: 33.03, type: "nebula", mag: 8.8, desc: "Nebulosa planetaria en Lyra. Capas de gas en expansión.", color: "#88ffcc", sizeArcmin: 1.5, kind: "dso" },
    { id: "M16", name: "Nebulosa del Águila", ra: 274.7, dec: -13.8, type: "nebula", mag: 6.0, desc: "Hogar de los 'Pilares de la Creación'.", color: "#88ffcc", sizeArcmin: 7, kind: "dso" },
    { id: "M20", name: "Nebulosa Trífida", ra: 270.5, dec: -23.0, type: "nebula", mag: 6.3, desc: "Nebulosa de emisión, reflexión y oscura.", color: "#ff88ff", sizeArcmin: 28, kind: "dso" },
    { id: "M8", name: "Nebulosa de la Laguna", ra: 270.9, dec: -24.4, type: "nebula", mag: 6.0, desc: "Nube interestelar gigante en Sagitario.", color: "#ff88aa", sizeArcmin: 90, kind: "dso" },
    { id: "NGC7293", name: "Nebulosa de la Hélice", ra: 337.41, dec: -20.84, type: "nebula", mag: 7.6, desc: "El 'Ojo de Dios'. Una de las planetarias más cercanas.", color: "#88ffcc", sizeArcmin: 25, kind: "dso" },

    // --- GALAXIAS ---
    { id: "M31", name: "Galaxia de Andrómeda", ra: 10.68, dec: 41.27, type: "galaxy", mag: 3.4, desc: "Nuestra vecina gigante. Visible a simple vista en cielos oscuros.", color: "#ffcc88", sizeArcmin: 190, kind: "dso" },
    { id: "M33", name: "Galaxia del Triángulo", ra: 23.46, dec: 30.66, type: "galaxy", mag: 5.7, desc: "Tercer miembro del Grupo Local. Espiral pura.", color: "#ffcc88", sizeArcmin: 71, kind: "dso" },
    { id: "M51", name: "Galaxia del Remolino", ra: 202.47, dec: 47.20, type: "galaxy", mag: 8.4, desc: "Galaxia espiral interactuando con su vecina NGC 5195.", color: "#ffbb88", sizeArcmin: 11, kind: "dso" },
    { id: "M104", name: "Galaxia Sombrero", ra: 189.99, dec: -11.62, type: "galaxy", mag: 8.0, desc: "Famosa por su brillante núcleo y banda de polvo oscura.", color: "#ffcc88", sizeArcmin: 9, kind: "dso" },
    { id: "M81", name: "Galaxia de Bode", ra: 148.89, dec: 69.07, type: "galaxy", mag: 6.9, desc: "Galaxia espiral perfecta en la Osa Mayor.", color: "#ffcc88", sizeArcmin: 27, kind: "dso" },
    { id: "M82", name: "Galaxia del Cigarro", ra: 148.97, dec: 69.68, type: "galaxy", mag: 8.4, desc: "Galaxia con estallido estelar (starburst).", color: "#ff8888", sizeArcmin: 9, kind: "dso" },
    { id: "M101", name: "Galaxia del Molinete", ra: 210.8, dec: 54.35, type: "galaxy", mag: 7.9, desc: "Espiral gigante vista de frente. Muchos cúmulos HII.", color: "#ffbb88", sizeArcmin: 22, kind: "dso" },
    { id: "M87", name: "Virgo A", ra: 187.71, dec: 12.39, type: "galaxy", mag: 8.6, desc: "Galaxia elíptica gigante con un chorro relativista.", color: "#ffddaa", sizeArcmin: 7, kind: "dso" },
    { id: "LMC", name: "Gran Nube de Magallanes", ra: 80.89, dec: -69.76, type: "galaxy", mag: 0.9, desc: "Galaxia satélite de la Vía Láctea. Hemisferio Sur.", color: "#ffccaa", sizeArcmin: 650, kind: "dso" },
    { id: "SMC", name: "Pequeña Nube de Magallanes", ra: 13.19, dec: -72.80, type: "galaxy", mag: 2.7, desc: "Visible en el Hemisferio Sur como una nube brillante.", color: "#ffccaa", sizeArcmin: 280, kind: "dso" },
    { id: "M106", name: "Galaxia M106", ra: 184.74, dec: 47.30, type: "galaxy", mag: 8.4, desc: "Contiene un megamáser de vapor de agua.", color: "#ffcc88", sizeArcmin: 18, kind: "dso" },

    // --- CÚMULOS ---
    { id: "M45", name: "Pléyades", ra: 56.75, dec: 24.11, type: "cluster", mag: 1.6, desc: "Cúmulo abierto joven envuelto en nebulosidad azul.", color: "#aaccff", sizeArcmin: 110, kind: "dso" },
    { id: "M13", name: "Cúmulo de Hércules", ra: 250.42, dec: 36.46, type: "cluster", mag: 5.8, desc: "El cúmulo globular más espectacular del norte.", color: "#aaccff", sizeArcmin: 20, kind: "dso" },
    { id: "M44", name: "El Pesebre", ra: 130.1, dec: 19.66, type: "cluster", mag: 3.7, desc: "Cúmulo abierto visible a simple vista en Cáncer.", color: "#aaccff", sizeArcmin: 95, kind: "dso" },
    { id: "M3", name: "Cúmulo M3", ra: 205.55, dec: 28.38, type: "cluster", mag: 6.2, desc: "Contiene medio millón de estrellas.", color: "#ffffaa", sizeArcmin: 18, kind: "dso" },
    { id: "M7", name: "Cúmulo de Ptolomeo", ra: 268.45, dec: -34.82, type: "cluster", mag: 3.3, desc: "Cúmulo brillante cerca de la cola del Escorpión.", color: "#aaccff", sizeArcmin: 80, kind: "dso" },
    { id: "NGC869", name: "Cúmulo Doble de Perseo", ra: 34.75, dec: 57.14, type: "cluster", mag: 3.7, desc: "Dos cúmulos abiertos espectaculares.", color: "#aaccee", sizeArcmin: 30, kind: "dso" }
];
