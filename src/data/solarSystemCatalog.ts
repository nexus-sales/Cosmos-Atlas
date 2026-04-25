export interface SolarSystemBody {
    id: string;
    name: string;
    bodyKind: 'planet' | 'moon';
    parentPlanetId?: string;
    symbol: string;
    color: string;
    shortDesc: string;
    longDesc: string;
    funFact: string;
    mythology?: string;
    observationTips?: string;
    imageUrl?: string;
    thumbUrl?: string;
    orderFromSun?: number;
    planetType?: string;
    moonsCount?: number;
    hasRings?: boolean;
    hasAtmosphere?: boolean;
    atmosphereMain?: string[];
    radiusKm?: number;
    radiusEarth?: number;
    massEarth?: number;
    gravityMs2?: number;
    densityGcc?: number;
    semiMajorAxisAu?: number;
    orbitalPeriodDays?: number;
    rotationPeriodHours?: number;
    axialTiltDeg?: number;
    eccentricity?: number;
    inclinationDeg?: number;
    surfaceTempMinK?: number;
    surfaceTempMaxK?: number;
    surfaceTempAvgK?: number;
    discoveryYear?: number;
    discoverer?: string;
    semiMajorAxisKm?: number;
    magVisual?: number;
}

export interface PlanetSeedRow {
    id: string;
    name_es: string;
    name_en: string;
    symbol: string;
    color_hex: string;
    order_from_sun: number;
    planet_type: string;
    radius_km?: number;
    radius_earth?: number;
    mass_earth?: number;
    gravity_ms2?: number;
    density_gcc?: number;
    semi_major_axis_au?: number;
    orbital_period_days?: number;
    rotation_period_h?: number;
    axial_tilt_deg?: number;
    eccentricity?: number;
    inclination_deg?: number;
    has_atmosphere: boolean;
    atmosphere_main?: string[];
    surface_temp_min_k?: number;
    surface_temp_max_k?: number;
    surface_temp_avg_k?: number;
    moons_count?: number;
    has_rings: boolean;
    desc_short: string;
    desc_long: string;
    fun_fact: string;
    mythology?: string;
    observation_tips?: string;
    image_url?: string;
    thumb_url?: string;
}

export interface MoonSeedRow {
    planet_id: string;
    name: string;
    discovery_year?: number;
    discoverer?: string;
    radius_km?: number;
    orbital_period_days?: number;
    semi_major_axis_km?: number;
    mag_visual?: number;
    is_notable: boolean;
    desc_short: string;
    desc_long: string;
    fun_fact: string;
    image_url?: string;
}

export const SOLAR_SYSTEM_PLANETS_SEED: PlanetSeedRow[] = [
    {
        id: 'mercury',
        name_es: 'Mercurio',
        name_en: 'Mercury',
        symbol: '☿',
        color_hex: '#b0b0b0',
        order_from_sun: 1,
        planet_type: 'rocky',
        radius_km: 2439.7,
        radius_earth: 0.383,
        mass_earth: 0.0553,
        gravity_ms2: 3.7,
        density_gcc: 5.43,
        semi_major_axis_au: 0.387098,
        orbital_period_days: 87.969,
        rotation_period_h: 1407.6,
        axial_tilt_deg: 0.034,
        eccentricity: 0.20563,
        inclination_deg: 7.005,
        has_atmosphere: false,
        surface_temp_min_k: 100,
        surface_temp_max_k: 700,
        surface_temp_avg_k: 440,
        moons_count: 0,
        has_rings: false,
        desc_short: 'Mundo rocoso extremo, abrasado de día y helado de noche, pegado al resplandor del Sol.',
        desc_long: 'Mercurio es el planeta más cercano al Sol y también uno de los más difíciles de observar por su baja elongación. Tiene una superficie craterizada muy antigua, un núcleo metálico desproporcionadamente grande y casi ninguna atmósfera estable.',
        fun_fact: 'En los cráteres polares de Mercurio hay hielo de agua escondido en sombras permanentes.',
        mythology: 'Debe su nombre al mensajero veloz de los dioses romanos, apropiado para el planeta con el año más corto.',
        observation_tips: 'Búscalo muy bajo al amanecer o al atardecer, con horizonte limpio y sin esperar demasiada altura.',
    },
    {
        id: 'venus',
        name_es: 'Venus',
        name_en: 'Venus',
        symbol: '♀',
        color_hex: '#f0e6c0',
        order_from_sun: 2,
        planet_type: 'rocky',
        radius_km: 6051.8,
        radius_earth: 0.9499,
        mass_earth: 0.815,
        gravity_ms2: 8.87,
        density_gcc: 5.24,
        semi_major_axis_au: 0.723332,
        orbital_period_days: 224.701,
        rotation_period_h: -5832.5,
        axial_tilt_deg: 177.36,
        eccentricity: 0.006772,
        inclination_deg: 3.39458,
        has_atmosphere: true,
        atmosphere_main: ['CO2', 'N2'],
        surface_temp_min_k: 735,
        surface_temp_max_k: 740,
        surface_temp_avg_k: 737,
        moons_count: 0,
        has_rings: false,
        desc_short: 'El faro del crepúsculo: brillante, denso y cubierto por nubes opacas de ácido sulfúrico.',
        desc_long: 'Venus brilla muchísimo porque refleja una gran cantidad de luz solar desde su atmósfera espesa y uniforme. Bajo esas nubes se esconde un efecto invernadero desbocado, con temperaturas suficientes para fundir plomo y presiones aplastantes en la superficie.',
        fun_fact: 'Un día venusiano dura más que su año: gira tan lento que tarda más en rotar que en completar una órbita.',
        mythology: 'Recibe el nombre de la diosa romana del amor y la belleza por su brillo dominante en el cielo.',
        observation_tips: 'Es ideal para principiantes; con telescopio pequeño puedes seguir claramente sus fases como si fuera una mini Luna.',
    },
    {
        id: 'earth',
        name_es: 'Tierra',
        name_en: 'Earth',
        symbol: '⊕',
        color_hex: '#4aa3ff',
        order_from_sun: 3,
        planet_type: 'rocky',
        radius_km: 6371,
        radius_earth: 1,
        mass_earth: 1,
        gravity_ms2: 9.81,
        density_gcc: 5.51,
        semi_major_axis_au: 1,
        orbital_period_days: 365.256,
        rotation_period_h: 23.934,
        axial_tilt_deg: 23.439,
        eccentricity: 0.0167086,
        inclination_deg: 0,
        has_atmosphere: true,
        atmosphere_main: ['N2', 'O2', 'Ar'],
        surface_temp_min_k: 184,
        surface_temp_max_k: 331,
        surface_temp_avg_k: 288,
        moons_count: 1,
        has_rings: false,
        desc_short: 'Nuestro mundo oceánico, con tectónica activa, atmósfera respirable y la única biosfera confirmada.',
        desc_long: 'La Tierra es el punto de referencia de todo el atlas: un planeta rocoso templado, con agua líquida estable y una atmósfera protectora que filtra radiación y regula el clima. Su Luna estabiliza el eje y ayuda a sostener ciclos largos favorables para la vida compleja.',
        fun_fact: 'Vista desde el espacio, la Tierra refleja suficiente luz como para que el brillo azul del océano domine sobre los continentes.',
        mythology: 'En vez de una deidad clásica única, su nombre conserva la idea ancestral de suelo, mundo y hogar.',
        observation_tips: 'No la observamos desde fuera, pero toda la app depende de su rotación, atmósfera y localización del observador.',
    },
    {
        id: 'mars',
        name_es: 'Marte',
        name_en: 'Mars',
        symbol: '♂',
        color_hex: '#c1440e',
        order_from_sun: 4,
        planet_type: 'rocky',
        radius_km: 3389.5,
        radius_earth: 0.532,
        mass_earth: 0.107,
        gravity_ms2: 3.71,
        density_gcc: 3.93,
        semi_major_axis_au: 1.523679,
        orbital_period_days: 686.98,
        rotation_period_h: 24.623,
        axial_tilt_deg: 25.19,
        eccentricity: 0.0934,
        inclination_deg: 1.85,
        has_atmosphere: true,
        atmosphere_main: ['CO2', 'N2', 'Ar'],
        surface_temp_min_k: 130,
        surface_temp_max_k: 308,
        surface_temp_avg_k: 210,
        moons_count: 2,
        has_rings: false,
        desc_short: 'Desierto frío y oxidado, hogar del Monte Olimpo y de valles que superan continentes enteros.',
        desc_long: 'Marte conserva huellas geológicas de un pasado más húmedo y activo. Su atmósfera es tenue, sus tormentas de polvo pueden envolver el planeta entero y su superficie combina volcanes gigantes, deltas fósiles y casquetes polares estacionales.',
        fun_fact: 'El Monte Olimpo mide alrededor de tres veces la altura del Everest y es el volcán más grande conocido del Sistema Solar.',
        mythology: 'Nombrado por el dios romano de la guerra, por su color rojizo semejante a la sangre.',
        observation_tips: 'Luces rojas estables y oposición favorable son la combinación buena; con seeing fino asoman casquetes polares y manchas oscuras.',
    },
    {
        id: 'jupiter',
        name_es: 'Júpiter',
        name_en: 'Jupiter',
        symbol: '♃',
        color_hex: '#c88b3a',
        order_from_sun: 5,
        planet_type: 'gas_giant',
        radius_km: 69911,
        radius_earth: 10.97,
        mass_earth: 317.8,
        gravity_ms2: 24.79,
        density_gcc: 1.33,
        semi_major_axis_au: 5.2044,
        orbital_period_days: 4332.59,
        rotation_period_h: 9.925,
        axial_tilt_deg: 3.13,
        eccentricity: 0.0489,
        inclination_deg: 1.304,
        has_atmosphere: true,
        atmosphere_main: ['H2', 'He'],
        surface_temp_min_k: 110,
        surface_temp_max_k: 165,
        surface_temp_avg_k: 125,
        moons_count: 95,
        has_rings: true,
        desc_short: 'Gigante gaseoso de bandas cambiantes, tormentas colosales y un pequeño sistema planetario propio.',
        desc_long: 'Júpiter domina por masa y gravedad, organiza órbitas a su alrededor y muestra una atmósfera dinámica hecha de bandas, remolinos y tormentas longevas como la Gran Mancha Roja. Sus satélites galileanos ofrecen un espectáculo cambiante incluso con instrumentos modestos.',
        fun_fact: 'Su magnetosfera es tan inmensa que, si pudiéramos verla desde la Tierra, parecería más grande que la Luna llena.',
        mythology: 'Debe su nombre al rey de los dioses romanos, el equivalente de Zeus en la mitología griega.',
        observation_tips: 'Prioriza noches estables; incluso con telescopio pequeño se aprecian bandas y el baile continuo de Io, Europa, Ganímedes y Calisto.',
    },
    {
        id: 'saturn',
        name_es: 'Saturno',
        name_en: 'Saturn',
        symbol: '♄',
        color_hex: '#e8d890',
        order_from_sun: 6,
        planet_type: 'gas_giant',
        radius_km: 58232,
        radius_earth: 9.14,
        mass_earth: 95.16,
        gravity_ms2: 10.44,
        density_gcc: 0.687,
        semi_major_axis_au: 9.5826,
        orbital_period_days: 10759.22,
        rotation_period_h: 10.7,
        axial_tilt_deg: 26.73,
        eccentricity: 0.0565,
        inclination_deg: 2.485,
        has_atmosphere: true,
        atmosphere_main: ['H2', 'He'],
        surface_temp_min_k: 82,
        surface_temp_max_k: 140,
        surface_temp_avg_k: 95,
        moons_count: 146,
        has_rings: true,
        desc_short: 'Planeta anillado por excelencia, liviano, inmenso y visualmente inolvidable al telescopio.',
        desc_long: 'Saturno combina una atmósfera suave en apariencia con un sistema de anillos extremadamente complejo formado por incontables fragmentos de hielo y roca. Su densidad media es tan baja que, en teoría, flotaría en un océano lo bastante grande.',
        fun_fact: 'Los anillos principales son extremadamente anchos pero en muchos tramos apenas tienen un grosor comparable al de una montaña.',
        mythology: 'Lleva el nombre del dios romano de la agricultura y del tiempo cíclico, asociado después al titán Crono.',
        observation_tips: 'Cuando los anillos se abren bien respecto a la Tierra, es uno de los objetivos más agradecidos del cielo para enseñar astronomía.',
    },
    {
        id: 'uranus',
        name_es: 'Urano',
        name_en: 'Uranus',
        symbol: '⛢',
        color_hex: '#7de8e8',
        order_from_sun: 7,
        planet_type: 'ice_giant',
        radius_km: 25362,
        radius_earth: 4.007,
        mass_earth: 14.54,
        gravity_ms2: 8.69,
        density_gcc: 1.27,
        semi_major_axis_au: 19.2184,
        orbital_period_days: 30688.5,
        rotation_period_h: -17.24,
        axial_tilt_deg: 97.77,
        eccentricity: 0.046381,
        inclination_deg: 0.773,
        has_atmosphere: true,
        atmosphere_main: ['H2', 'He', 'CH4'],
        surface_temp_min_k: 49,
        surface_temp_max_k: 76,
        surface_temp_avg_k: 59,
        moons_count: 28,
        has_rings: true,
        desc_short: 'Gigante de hielo azul verdoso, tumbado casi de lado por una antigua colisión monumental.',
        desc_long: 'Urano rota con el eje casi horizontal, así que sus estaciones duran décadas y sus polos llegan a mirar casi directamente al Sol. Aunque a simple vista suele pasar desapercibido, es un laboratorio magnífico para entender la familia de los gigantes de hielo.',
        fun_fact: 'Cada polo puede pasar alrededor de 42 años seguidos recibiendo luz o quedando en oscuridad según la estación.',
        mythology: 'Es uno de los pocos planetas bautizados con un nombre procedente directamente del panteón griego: Urano, dios primordial del cielo.',
        observation_tips: 'Con prismáticos grandes o telescopio pequeño parece una estrella apagada; con más aumento empieza a mostrar un disco diminuto.',
    },
    {
        id: 'neptune',
        name_es: 'Neptuno',
        name_en: 'Neptune',
        symbol: '♆',
        color_hex: '#3f54ba',
        order_from_sun: 8,
        planet_type: 'ice_giant',
        radius_km: 24622,
        radius_earth: 3.883,
        mass_earth: 17.15,
        gravity_ms2: 11.15,
        density_gcc: 1.64,
        semi_major_axis_au: 30.07,
        orbital_period_days: 60182,
        rotation_period_h: 16.11,
        axial_tilt_deg: 28.32,
        eccentricity: 0.008678,
        inclination_deg: 1.77,
        has_atmosphere: true,
        atmosphere_main: ['H2', 'He', 'CH4'],
        surface_temp_min_k: 50,
        surface_temp_max_k: 80,
        surface_temp_avg_k: 72,
        moons_count: 16,
        has_rings: true,
        desc_short: 'Azul profundo, remoto y azotado por algunos de los vientos más violentos conocidos.',
        desc_long: 'Neptuno fue descubierto a partir de perturbaciones matemáticas antes de ser visto al telescopio, un triunfo histórico de la mecánica celeste. Es un gigante de hielo dinámico, oscuro y lejano cuya meteorología extrema sigue sorprendiendo.',
        fun_fact: 'En Neptuno se han medido vientos supersónicos que superan ampliamente la velocidad del sonido terrestre.',
        mythology: 'Su nombre honra al dios romano del mar, en consonancia con su intenso color azul.',
        observation_tips: 'Necesita cielo razonablemente oscuro y localización precisa; suele verse como un punto azulado tenue, no como un planeta obvio.',
    },
];

export const SOLAR_SYSTEM_MOONS_SEED: MoonSeedRow[] = [
    {
        planet_id: 'earth',
        name: 'Luna',
        is_notable: true,
        radius_km: 1737.4,
        orbital_period_days: 27.3217,
        semi_major_axis_km: 384400,
        mag_visual: -12.7,
        desc_short: 'Nuestro satélite natural: cercano, brillante y lleno de relieve visible incluso con prismáticos modestos.',
        desc_long: 'La Luna es el compañero gravitatorio de la Tierra y el objeto celeste más accesible para observar detalle superficial desde casa. Sus mares basálticos, rayos de impacto, montañas y cráteres cambian de aspecto con la iluminación y convierten cada fase en un paisaje distinto.',
        fun_fact: 'Sin la Luna, el eje de la Tierra oscilaría mucho más y el clima a largo plazo sería bastante más caótico.',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
    },
];

export const LOCAL_SOLAR_SYSTEM_BODIES: SolarSystemBody[] = [
    ...SOLAR_SYSTEM_PLANETS_SEED.map((planet) => ({
        id: planet.id,
        name: planet.name_es,
        bodyKind: 'planet' as const,
        symbol: planet.symbol,
        color: planet.color_hex,
        shortDesc: planet.desc_short,
        longDesc: planet.desc_long,
        funFact: planet.fun_fact,
        mythology: planet.mythology,
        observationTips: planet.observation_tips,
        imageUrl: planet.image_url,
        thumbUrl: planet.thumb_url,
        orderFromSun: planet.order_from_sun,
        planetType: planet.planet_type,
        moonsCount: planet.moons_count,
        hasRings: planet.has_rings,
        hasAtmosphere: planet.has_atmosphere,
        atmosphereMain: planet.atmosphere_main,
        radiusKm: planet.radius_km,
        radiusEarth: planet.radius_earth,
        massEarth: planet.mass_earth,
        gravityMs2: planet.gravity_ms2,
        densityGcc: planet.density_gcc,
        semiMajorAxisAu: planet.semi_major_axis_au,
        orbitalPeriodDays: planet.orbital_period_days,
        rotationPeriodHours: planet.rotation_period_h,
        axialTiltDeg: planet.axial_tilt_deg,
        eccentricity: planet.eccentricity,
        inclinationDeg: planet.inclination_deg,
        surfaceTempMinK: planet.surface_temp_min_k,
        surfaceTempMaxK: planet.surface_temp_max_k,
        surfaceTempAvgK: planet.surface_temp_avg_k,
    })),
    ...SOLAR_SYSTEM_MOONS_SEED.map((moon) => ({
        id: `moon:${normalizeCatalogName(moon.name)}`,
        name: moon.name,
        bodyKind: 'moon' as const,
        parentPlanetId: moon.planet_id,
        symbol: '☽',
        color: '#d8d6c0',
        shortDesc: moon.desc_short,
        longDesc: moon.desc_long,
        funFact: moon.fun_fact,
        observationTips: 'Usa aumentos moderados y recorre el terminador: es la zona donde el relieve se vuelve más dramático.',
        imageUrl: moon.image_url,
        radiusKm: moon.radius_km,
        orbitalPeriodDays: moon.orbital_period_days,
        semiMajorAxisKm: moon.semi_major_axis_km,
        magVisual: moon.mag_visual,
    })),
];

export function normalizeCatalogName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

export function getSolarSystemBodyByName(name: string, bodies: SolarSystemBody[]) {
    const normalized = normalizeCatalogName(name);
    return bodies.find((body) => normalizeCatalogName(body.name) === normalized);
}
