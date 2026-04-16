export const KID_FACTS: Record<string, string> = {
    'Sol': 'Es un reactor nuclear gigante en constante explosión. Alberga el 99.8% de la masa de todo el Sistema Solar. ¡Impresionante!',
    'Luna': 'Nuestro escudo orbital. La gravedad aquí es tan baja que si te pesas marcarías 6 veces menos. ¡Ideal para parkour lunar!',
    'Mercurio': 'El planeta extremo. De día se asa a más de 400°C y de noche se congela a -180°C porque no tiene atmósfera que atrape el calor.',
    'Venus': 'Un infierno asfixiante con nubes de ácido sulfúrico. Su atmósfera aplastaría un submarino. Es el mundo más caluroso del vecindario.',
    'Marte': 'El Planeta Rojo. Tiene cañones que harían que el Gran Cañón parezca una zanja y alberga volcanes extintos del tamaño de continentes.',
    'Júpiter': 'El titán del Sistema Solar. Su Gran Mancha Roja es un colosal huracán de alta velocidad que lleva siglos activo sin detenerse.',
    'Saturno': 'Su densidad es tan baja que si encontraras un océano lo bastante grande, ¡este gigantesco planeta flotaría como una pelota inflable!',
    'Urano': 'Un gigante de hielo misterioso. Orbita volcado de lado, posiblemente porque hace millones de años sufrió un impacto titánico.',
    'Neptuno': 'El reino del hielo tempestuoso. Custodia los confines del Sistema Solar con vientos sónicos feroces de más de 2000 km/h.',
    'Plutón': 'Fue desclasificado como planeta, pero sigue siendo el rey del Cinturón de Kuiper, con enormes llanuras de nitrógeno helado puro.',
    'M31': 'La Galaxia de Andrómeda. Es una inmensa espiral que viaja a toda velocidad hacia nosotros. ¡Choque interestelar en 4 mil millones de años!',
    'M42': 'La Nebulosa de Orión. Es un campo de formación estelar, una auténtica fábrica galáctica donde las estrellas despiertan de su letargo.',
    'M45': 'Las Pléyades son un espectacular cúmulo abierto muy joven. Apenas tienen 100 millones de años, ¡son unas adolescentes en edad cósmica!',
    'Sirio': 'La estrella de primera magnitud. No está sola: tiene un compañero denso y súper masivo del tamaño de la Tierra quemándose en silencio.',
    'Polaris': 'La legendaria Estrella del Norte. Ha sido la baliza de navegación definitiva de la humanidad durante toda su historia exploradora.',
    'Betelgeuse': 'Una roja supergigante al borde de su vida. Es una bomba de relojería cósmica lista para explotar en una brillante y épica supernova.',
};

const GENERIC_PLANETS = [
    'Este misterioso exoplaneta vaga por la galaxia a miles de kilómetros por segundo. ¿Tendrá núcleo rocoso?',
    'Un cuerpo orbital a la deriva. Quizás esconda minerales exóticos o tormentas eternas que nunca hemos visto.',
    'Un mundo completamente inexplorado orbitando una estrella lejana. Algún día enviaremos una sonda a analizarlo.',
];

const GENERIC_STARS = [
    'Un inmenso reactor de plasma quemando hidrógeno a cientos de años luz de nosotros.',
    'La inmensidad del cosmos está llena de estas esferas de gas brillante, solas en el abismo oscuro.',
    'Sigue emitiendo radiación y luz a través del espacio profundo, quizás iluminando civilizaciones perdidas.',
    'A simple vista parece un píxel más en el cielo, pero es millones de veces más caliente que lava pura.',
    'Una brutal bola de fuego termonuclear aguantando la presión aplastante de su propia gravedad.',
];

const GENERIC_DSOS = [
    'Una antigua formación cósmica remanente del Big Bang. El espacio profundo oculta maravillas como ésta.',
    'Anomalía gravitacional detectada. Estas acumulaciones de materia dominan el borde exterior de nuestra visión.',
    'Cúmulos y nebulosas donde las leyes de la física se ponen a prueba bajo temperaturas de cero absoluto.',
];

export const getKidFact = (name: string, isStar: boolean, isPlanet: boolean): string => {
    const fact = KID_FACTS[name] || KID_FACTS[name.split(' ')[0]];
    if (fact) return fact;

    // Use a simple hash of the name to predictably pick a generic fact (pseudo-random per object, but consistent so it doesn't change every render)
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);

    if (isPlanet) return GENERIC_PLANETS[hash % GENERIC_PLANETS.length];
    if (isStar) return GENERIC_STARS[hash % GENERIC_STARS.length];
    return GENERIC_DSOS[hash % GENERIC_DSOS.length];
};
