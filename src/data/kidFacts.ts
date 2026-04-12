export const KID_FACTS: Record<string, string> = {
    'Sol': 'Es nuestra estrella. Es 109 veces más ancho que la Tierra y genera luz y calor mediante reacciones nucleares en su núcleo.',
    'Luna': 'Es nuestro satélite natural. Como tiene menos gravedad, pesarías seis veces menos allí y podrías saltar asombrosamente alto.',
    'Mercurio': 'Es el planeta más cercano al Sol. No tiene atmósfera para atrapar el calor, por lo que sus noches son extremadamente heladas.',
    'Venus': 'Tiene una atmósfera tan densa que atrapa el calor del Sol. Es el planeta más caliente, con temperaturas que derretirían el plomo.',
    'Marte': 'Se llama el Planeta Rojo por el óxido de hierro en su suelo. Alberga el Monte Olimpo, el volcán más alto conocido en el sistema solar.',
    'Júpiter': 'Es un gigante gaseoso tan masivo que en su interior cabrían 1.300 Tierras. Su Gran Mancha Roja es una tormenta gigante.',
    'Saturno': 'Es famoso por sus complejos anillos, formados por miles de millones de fragmentos de hielo y roca que orbitan el planeta.',
    'Urano': 'Es un gigante de hielo que orbita inclinado sobre su costado. Esto hace que sus estaciones duren más de 20 años.',
    'Neptuno': 'Es el planeta más alejado del Sol. Sus vientos son los más veloces detectados, alcanzando los 2.000 kilómetros por hora.',
    'Plutón': 'Fue reclasificado como planeta enano en 2006. Se encuentra en el Cinturón de Kuiper, una zona llena de objetos helados.',
    'M31': 'La Galaxia de Andrómeda contiene casi un billón de estrellas y es el objeto más lejano que podemos ver a simple vista.',
    'M42': 'La Nebulosa de Orión es una guardería estelar; una inmensa nube de gas y polvo donde se están formando nuevas estrellas.',
    'M45': 'Las Pléyades son un cúmulo abierto de estrellas jóvenes que nacieron juntas hace unos 100 millones de años.',
    'Sirio': 'Es la estrella más brillante de nuestro cielo. En realidad es un sistema doble, con una estrella pequeña llamada enana blanca.',
    'Polaris': 'La Estrella del Norte se encuentra casi exactamente sobre el eje de rotación de la Tierra, por eso siempre señala el Norte.',
    'Betelgeuse': 'Es una supergigante roja que pronto, en términos astronómicos, explotará como una supernova iluminando nuestro cielo.',
};

export const getKidFact = (name: string): string | null => {
    return KID_FACTS[name] || KID_FACTS[name.split(' ')[0]] || null;
};
