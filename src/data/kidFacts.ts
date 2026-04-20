export const KID_FACTS: Record<string, string> = {
    'Sol': 'Es una central de fusión termonuclear de proporciones épicas. Contiene el 99.8% de la masa total de nuestro sistema y su núcleo alcanza los 15 millones de grados. ¡Toda nuestra tecnología funciona gracias a su radiación!',
    'Luna': 'Nuestro centinela orbital. Estabiliza el eje de la Tierra, permitiendo que la vida prospere. Sin ella, los días durarían solo 6 horas y el clima sería un caos absoluto. ¡Es nuestra protectora silenciosa!',
    'Mercurio': 'Un núcleo de hierro gigante envuelto en una fina corteza de roca. Es tan denso que es el segundo planeta más compacto del sistema. Sus cráteres en los polos esconden hielo que nunca ha visto la luz del Sol.',
    'Venus': 'El gemelo malvado de la Tierra. Su efecto invernadero es tan extremo que las sondas que aterrizan allí solo sobreviven unos minutos antes de derretirse por los 470 grados continuos.',
    'Marte': 'El mundo de los récords geológicos. Alberga el Monte Olimpo, un volcán tres veces más alto que el Everest, y Valles Marineris, un cañón tan largo como toda Europa.',
    'Júpiter': 'Un escudo gravitatorio masivo. Su inmensa gravedad desvía cometas y asteroides que de otro modo impactarían contra la Tierra. Es, literalmente, el guardaespaldas del Sistema Solar.',
    'Saturno': 'Una joya de la ingeniería cósmica. Sus anillos están compuestos por billones de fragmentos de hielo y roca pulverizada, algunos del tamaño de montañas, orbitando a velocidades increíbles.',
    'Urano': 'El gigante que rueda. Debido a una colisión titánica en el pasado, su eje está tan inclinado que sus polos apuntan directamente al Sol durante 42 años seguidos cada temporada.',
    'Neptuno': 'Un mundo de diamantes líquidos y vientos supersónicos. En sus profundidades, la presión es tan brutal que los científicos creen que literalmente llueven diamantes del cielo.',
    'Plutón': 'El centinela del Cinturón de Kuiper. Aunque es pequeño, tiene una atmósfera azul y montañas de hielo de agua tan duras como el granito. ¡Es un mundo geológicamente vivo!',
    'Sirio': 'La Joya del Can Mayor. Brilla con una luz blanquiazul intensa porque es dos veces más masiva que el Sol y 25 veces más luminosa. ¡Es el faro más brillante de nuestra vecindad!',
    'Betelgeuse': 'Una supergigante roja al borde del colapso. Si la pusiéramos en el lugar del Sol, llegaría hasta la órbita de Júpiter. Estamos esperando que explote como supernova en cualquier milenio.',
    'Polaris': 'Tres estrellas en una. Aunque parece solitaria, es un sistema triple que coincide casi perfectamente con el eje de rotación de la Tierra. ¡Ha guiado a la humanidad por milenios!',
    'M31': 'Andrómeda, una metrópolis de un billón de estrellas. Se está acercando a nosotros a 400.000 kilómetros por hora. En el futuro remoto, nuestra Vía Láctea y ella se fusionarán en una sola supergalaxia.',
    'M42': 'Una maternidad estelar. Los gases que ves brillan porque están siendo bombardeados por la luz ultravioleta de estrellas bebé recién nacidas en su interior. ¡El nacimiento de soles!',
    'M45': 'Las Siete Hermanas. Un grupo de estrellas jóvenes nacidas juntas de la misma nube de gas hace apenas 100 millones de años. Son las "estrellas de rock" de nuestra galaxia por su brillo azul.',
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
