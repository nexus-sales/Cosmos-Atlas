-- =============================================================================
-- Datos de comets_cos -- tabla creada en la migracion 002 pero nunca poblada
-- =============================================================================
--
-- comets_cos tenia 0 filas antes de esta migracion. Los 10 cometas de abajo
-- vienen de src/data/comets.ts (catalogo local ya auditado), con sus
-- elementos orbitales verificados el 2026-07-21 contra la NASA/JPL
-- Small-Body Database (https://ssd-api.jpl.nasa.gov/sbdb.api) -- no de
-- memoria. Detalle de la verificacion:
--
--   - Halley, Wirtanen, Pons-Brooks: coinciden muy bien con JPL: solo
--     diferencias de epoca de ajuste (tp), sin cambios de fondo.
--   - Encke, 67P/C-G, Tempel 2, Schwassmann-Wachmann 3: coinciden en forma
--     de la orbita (e, q, i), pero con tp/om/w referidos a una aparicion
--     distinta -- explicable por evolucion orbital real (perturbaciones de
--     Jupiter) o por una aparicion mas reciente ya observada por JPL.
--   - Los tres cometas C/ (paso unico) mostraron las mayores diferencias,
--     como se esperaba de objetos que se refinan con cada observacion:
--       * C/2023 A3 (Tsuchinshan-ATLAS): CAMBIO DE CLASIFICACION. El archivo
--         local tenia e=0.99997 (eliptica, "vuelve en 80000 anos"). JPL
--         confirma ahora e=1.000095 (hiperbolica) -- no volvera nunca al
--         sistema solar. orbital_period_yr e aphelion_au quedan NULL para
--         este y los otros dos objetos hiperbolicos: un periodo/afelio no
--         existen fisicamente para e>=1.
--       * C/2024 G3 (ATLAS): perihelion_au 28% distinto, inclinacion 20
--         grados distinta -- orbita preliminar (271 dias de arco) ya
--         sustituida por una mejor determinada.
--       * C/2022 E3 (ZTF): diferencias menores, misma clasificacion
--         (hiperbolica) en ambas fuentes.
--
-- 73P/Schwassmann-Wachmann 3 se fragmento en 1995; JPL rastrea 74 fragmentos
-- por separado (des=73P, sin sufijo, es el nucleo/fragmento principal). Esta
-- fila es una simplificacion de un objeto que ya no es un cuerpo unico.
--
-- IMPORTANTE -- gap de conexion real: esta tabla NO esta conectada a la
-- renderizacion de cometas de la app. src/components/sky-map/Comets.tsx
-- importa directamente de src/data/comets.ts (confirmado por grep) y
-- src/stores/useCatalogStore.ts no tiene ningun fetch de comets_cos.
-- Poblar esta tabla documenta el catalogo real para uso futuro (p.ej. un
-- panel de info), pero NO cambia lo que ve el usuario hoy -- eso ya se
-- actualizo por separado en src/data/comets.ts, que es lo que si se renderiza.
--
-- No se verifico la magnitud absoluta (mag_peak / H): JPL no la expone en
-- la respuesta basica del API para cometas (usan M1/K1, poco estandarizado
-- entre cometas); se mantiene el valor ya presente en el archivo local.

insert into public.comets_cos
  (id, name, designation, perihelion_date, perihelion_au, aphelion_au, orbital_period_yr, mag_peak, is_periodic, color_hex, desc_short, fun_fact)
values
  ('1P', 'Cometa Halley', '1P/Halley', '1986-02-08', 0.574864, 35.282, 75.92, 5.5, true, '#88ddff',
    'El cometa más famoso. Visible cada 75-76 años.', 'Próximo paso por el perihelio: 2061.'),
  ('2P', 'Cometa Encke', '2P/Encke', '2023-10-22', 0.337948, 4.101, 3.31, 7.0, true, '#aaddff',
    'Cometa de período más corto conocido.', 'Regresa cada 3.3 años, el más frecuente de los cometas periódicos brillantes.'),
  ('67P', 'Churyumov-Gerasimenko', '67P/C-G', '2015-08-13', 1.243266, 5.681, 6.44, 12.0, true, '#88ccff',
    'Visitado por la sonda Rosetta en 2014-2016.', 'Primer aterrizaje de una sonda (Philae) en un núcleo cometario.'),
  ('C2023A3', 'Tsuchinshan-ATLAS', 'C/2023 A3', '2024-09-27', 0.39143, NULL, NULL, 3.5, false, '#ffffff',
    'Cometa del siglo, visible a simple vista en oct 2024.', 'Órbita hiperbólica confirmada (e>1): no volverá al sistema solar.'),
  ('C2022E3', 'Cometa ZTF', 'C/2022 E3 (ZTF)', '2023-01-12', 1.112244, NULL, NULL, 5.0, false, '#88ffaa',
    'Cometa verde por CO+ ionizado, visible en 2023.', 'Órbita hiperbólica: no volverá al sistema solar.'),
  ('C2024G3', 'Cometa ATLAS', 'C/2024 G3 (ATLAS)', '2025-01-13', 0.093493, NULL, NULL, 2.0, false, '#ffdd88',
    'Cometa rasante solar, brillante en enero 2025.', 'Sobrevivió a un perihelio extremadamente cercano al Sol; órbita hiperbólica, no volverá.'),
  ('73P', 'Schwassmann-Wachmann 3', '73P/S-W 3', '2022-08-25', 0.972305, 5.214, 5.44, 8.5, true, '#aaddff',
    'Cometa fragmentado en múltiples piezas.', 'JPL cataloga 74 fragmentos por separado tras su ruptura de 1995; datos del núcleo/fragmento principal.'),
  ('46P', 'Cometa Wirtanen', '46P/Wirtanen', '2018-12-12', 1.055355, 5.13, 5.44, 7.5, true, '#88ccff',
    'Cometa hiperactivo de período corto.', 'Objetivo original (cancelado) de la misión Rosetta antes de elegir 67P.'),
  ('12P', 'Cometa Pons-Brooks', '12P/Pons-Brooks', '2024-04-21', 0.780861, 33.589, 71.24, 4.5, true, '#ffcc88',
    'El "cometa diabólico", espectacular en 2024.', 'Regresa cada ~71 años; su coma con forma de cuernos le dio su apodo.'),
  ('10P', 'Cometa Tempel 2', '10P/Tempel 2', '2015-11-14', 1.417583, 4.711, 5.36, 10.0, true, '#88ccff',
    'Cometa de la familia de Júpiter.', 'Descubierto en 1873 por Ernst Tempel.')
on conflict (id) do update set
  name = excluded.name,
  designation = excluded.designation,
  perihelion_date = excluded.perihelion_date,
  perihelion_au = excluded.perihelion_au,
  aphelion_au = excluded.aphelion_au,
  orbital_period_yr = excluded.orbital_period_yr,
  mag_peak = excluded.mag_peak,
  is_periodic = excluded.is_periodic,
  color_hex = excluded.color_hex,
  desc_short = excluded.desc_short,
  fun_fact = excluded.fun_fact,
  updated_at = now();
