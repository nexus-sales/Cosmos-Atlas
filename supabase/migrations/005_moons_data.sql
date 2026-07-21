-- =============================================================================
-- Datos de moons_cos -- de 1 fila (solo la Luna) a las lunas "notables" de
-- cada planeta ya existente en planets_cos, sin anadir planetas nuevos
-- =============================================================================
--
-- Verificado el 2026-07-21, no de memoria:
--   - radius_km, orbital_period_days, semi_major_axis_km: NASA/JPL
--     "Planetary Satellite Physical Parameters" y "Mean Orbital Parameters"
--     (https://ssd.jpl.nasa.gov/sats/phys_par/ y /sats/elem/).
--   - discovery_year / discoverer: cruzados contra astronomy.com,
--     NASA Science (science.nasa.gov) y Wikipedia -- fechas de Cassini
--     confirmadas una por una (Iapetus 1671, Rhea 1672, Tethys/Dione 1684,
--     mismo dia), igual que Herschel (Mimas/Enceladus 1789, Titania/Oberon
--     1787) y Lassell (Triton 1846, Ariel/Umbriel 1851).
--   - mag_visual: valores de referencia estandar (brillo aparente medio),
--     NO verificados con el mismo rigor que los datos fisicos/orbitales de
--     arriba -- son cifras de uso comun en planetarios, no de una consulta
--     API en vivo. Iapetus en particular varia mucho (10.2 a 11.9) segun el
--     hemisferio iluminado por su albedo dispar; se usa un valor medio.
--
-- Criterio de seleccion ("notable"): no se intenta anadir las 288 lunas
-- conocidas del sistema solar (Jupiter solo tiene ~95). Se anaden las lunas
-- mayores/clasicas de cada planeta que ya tiene lunas_count > 0 en
-- planets_cos: las 2 de Marte (todas), las 4 galileanas de Jupiter, las 7
-- lunas clasicas de Saturno (descubiertas antes del s.XX), las 5 lunas
-- mayores de Urano, y Triton en Neptuno (con mucha diferencia la mas
-- notable, unica luna grande de un planeta gigante en orbita retrograda).
-- Mercurio y Venus no tienen lunas (0 en planets_cos), no aplica.
--
-- Bug relacionado, corregido en el mismo commit que esta migracion:
-- src/stores/useCatalogStore.ts pedia una columna `observation_tips` que
-- NUNCA existio en moons_cos (si existe en planets_cos, de ahi el
-- copy-paste) -- la query fallaba siempre con 42703 y la app caia en
-- silencio al catalogo local de una sola luna. Confirmado con curl antes
-- y despues del fix.

-- moons_cos usa un uuid aleatorio como PK -- sin esta restriccion,
-- ON CONFLICT no tiene forma de detectar duplicados si esta migracion
-- se corre mas de una vez.
do $$ begin
    alter table public.moons_cos add constraint moons_cos_planet_name_unique unique (planet_id, name);
exception when duplicate_object then null;
end $$;

insert into public.moons_cos
  (planet_id, name, discovery_year, discoverer, radius_km, orbital_period_days, semi_major_axis_km, mag_visual, is_notable, desc_short, fun_fact)
values
  ('mars', 'Fobos', 1877, 'Asaph Hall', 11.08, 0.3187, 9375, 11.8, true,
    'La mayor de las dos lunas de Marte, de forma irregular y muy cercana a su planeta.',
    'Orbita tan rápido y tan cerca que se acerca lentamente a Marte; se espera que se desintegre o choque contra el planeta en unos 30-50 millones de años.'),
  ('mars', 'Deimos', 1877, 'Asaph Hall', 6.2, 1.2625, 23457, 12.9, true,
    'La más pequeña y lejana de las dos lunas marcianas, probablemente un asteroide capturado.',
    'Desde la superficie de Marte se vería poco más grande que una estrella brillante.'),
  ('jupiter', 'Ío', 1610, 'Galileo Galilei', 1821.49, 1.762732, 421800, 5.0, true,
    'La luna galileana más interna, el cuerpo con mayor actividad volcánica conocida del Sistema Solar.',
    'Sus volcanes existen por el calentamiento de marea causado por el tira y afloja gravitatorio entre Júpiter, Europa y Ganímedes.'),
  ('jupiter', 'Europa', 1610, 'Galileo Galilei', 1560.80, 3.525463, 671100, 5.3, true,
    'Superficie helada extremadamente lisa que oculta un océano de agua líquida bajo el hielo.',
    'Es uno de los lugares con más posibilidades de albergar condiciones habitables fuera de la Tierra.'),
  ('jupiter', 'Ganímedes', 1610, 'Galileo Galilei', 2631.20, 7.155588, 1070400, 4.6, true,
    'La luna más grande del Sistema Solar, mayor incluso que el planeta Mercurio.',
    'Es la única luna conocida con campo magnético propio, generado por un núcleo de hierro fundido.'),
  ('jupiter', 'Calisto', 1610, 'Galileo Galilei', 2410.30, 16.690440, 1882700, 5.6, true,
    'La más externa de las lunas galileanas, con la superficie más craterizada del Sistema Solar.',
    'Apenas sufre calentamiento de marea, por lo que su superficie antigua conserva miles de millones de años de impactos.'),
  ('saturn', 'Mimas', 1789, 'William Herschel', 198.20, 0.942422, 186000, 12.9, true,
    'Pequeña luna helada dominada por un cráter de impacto gigantesco.',
    'El cráter Herschel le da un parecido tan marcado con la "Estrella de la Muerte" que se volvió célebre en internet.'),
  ('saturn', 'Encélado', 1789, 'William Herschel', 252.10, 1.370218, 238400, 11.7, true,
    'Pequeña luna helada con géiseres activos de agua que brotan de su polo sur.',
    'Sus géiseres alimentan el anillo E de Saturno y sugieren un océano subsuperficial con posibles condiciones habitables.'),
  ('saturn', 'Tetis', 1684, 'Giovanni Domenico Cassini', 531.10, 1.887802, 295000, 10.2, true,
    'Luna helada de baja densidad, con un cañón gigantesco (Itaca Chasma) que recorre buena parte de su superficie.',
    'Es tan poco densa que probablemente esté compuesta casi por completo de hielo de agua.'),
  ('saturn', 'Dione', 1684, 'Giovanni Domenico Cassini', 561.40, 2.736916, 377700, 10.4, true,
    'Luna helada con acantilados brillantes de hielo visibles como "líneas de araña" en su hemisferio final.',
    'Comparte su órbita con dos lunas troyanas mucho más pequeñas, Helena y Polideuces.'),
  ('saturn', 'Rea', 1672, 'Giovanni Domenico Cassini', 763.50, 4.517503, 527200, 9.7, true,
    'La segunda luna más grande de Saturno, una bola de hielo y roca muy craterizada.',
    'Podría tener un tenue anillo propio de partículas de hielo, algo nunca confirmado en otra luna.'),
  ('saturn', 'Titán', 1655, 'Christiaan Huygens', 2574.76, 15.945448, 1221900, 8.2, true,
    'La luna más grande de Saturno y la única del Sistema Solar con una atmósfera densa y lagos líquidos en superficie.',
    'Sus lagos y ríos no son de agua sino de metano y etano líquidos, a una temperatura superficial de unos -179°C.'),
  ('saturn', 'Jápeto', 1671, 'Giovanni Domenico Cassini', 734.30, 79.331002, 3561700, 11.0, true,
    'Luna de dos caras: un hemisferio oscuro como el carbón y el opuesto brillante como la nieve.',
    'Esa diferencia de albedo tan marcada hizo que Cassini solo pudiera verla en una parte de su órbita durante décadas.'),
  ('uranus', 'Miranda', 1948, 'Gerard Kuiper', 235.8, 1.413479, 129846, 15.8, true,
    'La más pequeña e interna de las cinco lunas mayores de Urano, con un terreno extremadamente fracturado.',
    'Tiene el acantilado más alto conocido del Sistema Solar, Verona Rupes, de hasta 20 km de altura.'),
  ('uranus', 'Ariel', 1851, 'William Lassell', 578.9, 2.520379, 190929, 14.4, true,
    'La luna más brillante y de superficie más joven de Urano, con extensos cañones y valles.',
    'Su superficie relativamente poco craterizada sugiere actividad geológica pasada que renovó buena parte del terreno.'),
  ('uranus', 'Umbriel', 1851, 'William Lassell', 584.7, 4.144177, 265986, 15.3, true,
    'La luna más oscura de las cinco mayores de Urano, muy craterizada y con un enigmático anillo brillante.',
    'El cráter Wunda, un anillo claro sobre fondo oscuro, sigue sin tener una explicación definitiva.'),
  ('uranus', 'Titania', 1787, 'William Herschel', 788.9, 8.705869, 436298, 13.9, true,
    'La luna más grande de Urano, con enormes cañones de fractura tectónica.',
    'Debe su nombre, como el resto de lunas uranianas, a personajes de Shakespeare -- la reina de las hadas en "El sueño de una noche de verano".'),
  ('uranus', 'Oberón', 1787, 'William Herschel', 761.4, 13.463237, 583511, 14.1, true,
    'La luna más externa y una de las más antiguas y craterizadas de Urano.',
    'Muestra montañas de hasta 6 km de altura y un misterioso material oscuro en el fondo de algunos cráteres.'),
  ('neptune', 'Tritón', 1846, 'William Lassell', 1352.60, 5.876994, 354800, 13.5, true,
    'Con diferencia la luna más grande de Neptuno, en una insólita órbita retrógrada.',
    'Su órbita retrógrada sugiere que es un objeto del cinturón de Kuiper capturado por la gravedad de Neptuno, no formado junto a él.')
on conflict (planet_id, name) do nothing;
