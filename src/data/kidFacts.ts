export const KID_FACTS: Record<string, string> = {
    'Sol': '¡Es una bola de fuego gigante! Cabrían un millón de Tierras dentro de él.',
    'Luna': '¡No tiene aire ni sonido! Si saltaras allí, llegarías mucho más alto que en la Tierra.',
    'Mercurio': 'Es el planeta más rápido. ¡Un año allí dura solo 88 días!',
    'Venus': '¡Es el planeta más caluroso! Hace tanto calor que podrías cocinar una pizza en el suelo en segundos.',
    'Marte': 'Es el "Planeta Rojo". Tiene el volcán más grande de todo el sistema solar: ¡el Monte Olimpo!',
    'Júpiter': 'Es tan grande que todos los demás planetas cabrían dentro de él. ¡Y tiene una tormenta que dura 300 años!',
    'Saturno': 'Sus anillos están hechos de trozos de hielo y roca. ¡Son como una autopista espacial brillante!',
    'Urano': '¡Gira de lado! Es como una pelota rodando por el espacio, y hace un frío helado.',
    'Neptuno': 'Es el planeta de los vientos súper rápidos. ¡Soplan más fuerte que un coche de carreras de Fórmula 1!',
    'Plutón': 'Es un "planeta enano". Es tan pequeño que es más chico que nuestra Luna.',
    'M31': 'La galaxia de Andrómeda es nuestra vecina. ¡Tiene un billón de estrellas!',
    'M42': 'La Gran Nebulosa de Orión es una "guardería estelar". ¡Aquí están naciendo bebés estrella justo ahora!',
    'M45': 'Las Pléyades son siete hermanas estrella que viajan juntas por el espacio.',
    'Sirio': 'Es la estrella más brillante del cielo nocturno. ¡Brilla como un diamante azul!',
    'Polaris': 'Es la Estrella del Norte. Los marineros de antes la usaban como un GPS natural para no perderse.',
    'Betelgeuse': 'Es una estrella supergigante roja. ¡Si estuviera en lugar del Sol, llegaría hasta Júpiter!',
};

export const getKidFact = (name: string): string | null => {
    return KID_FACTS[name] || KID_FACTS[name.split(' ')[0]] || null;
};
