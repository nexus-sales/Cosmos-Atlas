# Cosmos Atlas — Esquema de Base de Datos Supabase

> Este documento describe el esquema **real** en producción, reconstruido el
> 2026-07-19 por introspección viva (Data API / OpenAPI de PostgREST), no el
> esquema planeado originalmente. Ver la cabecera de
> `migrations/002_catalog_schema_baseline_and_grants.sql` para el detalle
> completo de procedencia y lo que NO se pudo verificar (políticas RLS de las
> tablas `*_cos`, índices más allá de la PK, triggers, cuerpo de las
> funciones RPC).

## Mapa del esquema real

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CATALOGO ASTRONOMICO (*_cos) — solo lectura publica         │
│                                                                               │
│  constellations_cos ◄── stars_cos       deep_sky_objects_cos ──► constellations_cos │
│       │                                         │                            │
│       └──── meteor_showers_cos      planets_cos ┤                            │
│                                      moons_cos ◄─┘                            │
│  comets_cos   astronomical_events_cos   fun_facts_cos   challenges_cos        │
│  kids_content_cos   kids_challenges_cos   kids_quiz_questions_cos             │
│  passport_stamps_cos (definicion de sellos, no los sellos ganados)           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│              GAMIFICACION / USUARIOS (*_cos) — sin auth real hoy             │
│                                                                               │
│  user_profiles_cos ──┬── observations_cos                                   │
│                       ├── user_favorites_cos                                 │
│                       ├── object_ratings_cos                                 │
│                       ├── object_comments_cos                                │
│                       ├── user_challenge_progress_cos ◄── challenges_cos     │
│                       ├── kids_challenge_progress_cos ◄── kids_challenges_cos│
│                       └── user_passport_stamps_cos    ◄── passport_stamps_cos│
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  profiles (Modo Diablo / invitado — tabla aparte, migracion 001, sin        │
│  relacion con user_profiles_cos. Ver limitacion conocida abajo)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

Nota: los nombres reales llevan el sufijo `_cos` (`stars_cos`, `deep_sky_objects_cos`,
etc.), a diferencia de una versión anterior de este documento que describía
`stars`, `deep_sky_objects`, `user_profiles`, `observations`... sin sufijo —
ese esquema sin sufijo **nunca se implementó**; el código de la app
(`src/stores/useCatalogStore.ts`) siempre consultó las tablas `*_cos`.

---

## Tablas del catálogo (solo lectura pública)

| Tabla | Descripción |
|---|---|
| `constellations_cos` | Constelaciones con mitología, historia y arte |
| `stars_cos` | Catálogo de estrellas con datos físicos |
| `deep_sky_objects_cos` | Nebulosas, galaxias, cúmulos |
| `planets_cos` | Planetas del Sistema Solar |
| `moons_cos` | Lunas notables |
| `meteor_showers_cos` | Lluvias de meteoros anuales |
| `comets_cos` | Cometas periódicos y de paso |
| `astronomical_events_cos` | Eclipses, oposiciones, conjunciones por fecha |
| `fun_facts_cos` | Curiosidades por audiencia |
| `challenges_cos` | Retos de observación con recompensa XP |
| `kids_content_cos` | Contenido del modo niños (analogías, datos, actividades) |
| `kids_challenges_cos` | Retos del modo niños |
| `kids_quiz_questions_cos` | Preguntas de quiz del modo niños |
| `passport_stamps_cos` | Definición de sellos/logros (no los ganados) |

**Estado real de acceso (verificado con curl contra la Data API):** las 14
tablas de esta sección tienen `GRANT SELECT` a `anon`/`authenticated` —
`planets_cos`, `stars_cos`, `deep_sky_objects_cos`, `moons_cos`,
`meteor_showers_cos`, `challenges_cos`, `constellations_cos`, `comets_cos`,
`astronomical_events_cos`, `fun_facts_cos` corregidas el 2026-07-19 (migración
002); `kids_content_cos`, `kids_challenges_cos`, `kids_quiz_questions_cos` y
`passport_stamps_cos` corregidas el 2026-07-21 (migración 003). Confirmado
dos veces: por curl (401→200) y por `has_table_privilege()` en el SQL Editor
del proyecto correcto.

**Estado real de datos (verificado 2026-07-21, conteo exacto vía Data API):**
`constellations_cos` (88), `stars_cos` (882, migración 006 — Theta/Kappa/Iota
Gem, ver más abajo), `deep_sky_objects_cos` (135), `planets_cos` (8),
`meteor_showers_cos` (10), `challenges_cos` (10), `comets_cos` (10, migración
004) y `moons_cos` (20, migración 005 — 1 luna de Marte×2, Júpiter×4,
Saturno×7, Urano×5, Neptuno×1, más la Luna ya existente) tienen datos reales.
**Vacías (0 filas):** `astronomical_events_cos`, `fun_facts_cos`,
`kids_content_cos`, `kids_challenges_cos`, `kids_quiz_questions_cos`,
`passport_stamps_cos` — el esquema y los grants existen, pero nadie ha
cargado contenido todavía.

**Bug corregido (migración 006):** `stars_cos` tenía 879 filas frente a las
882 de `src/data/stars.ts`. Faltaban Theta Gem, Kappa Gem e Iota Gem (mag
3.57–3.78, al borde del corte de ~3.5 que menciona el comentario del archivo
local) — como `useCatalogStore.loadFromSupabase` reemplaza el array completo
de estrellas en cuanto Supabase responde, estas 3 se veían un instante en la
carga inicial y desaparecían al llegar la respuesta de Supabase. Mismo patrón
de drift silencioso que el gap de `moons_cos` (migración 005).

`moons_cos` cubre las lunas "notables" (mayores/clásicas) de cada planeta
que ya tiene lunas en `planets_cos` — no las 288 lunas conocidas del sistema
solar (solo Júpiter tiene ~95). Mercurio y Venus no tienen lunas, no aplica.

**Bug corregido (migración 005):** `src/stores/useCatalogStore.ts` pedía una
columna `observation_tips` en su query a `moons_cos` que nunca existió ahí
(sí existe en `planets_cos`, de donde se copió por error) — la query fallaba
siempre con `42703` y la app caía en silencio al catálogo local de una sola
luna. Confirmado con curl antes (400) y después (200) del fix.

**Gap de conexión — `comets_cos` no alimenta la app todavía:**
`src/components/sky-map/Comets.tsx` importa directamente de
`src/data/comets.ts` (el catálogo local), no de Supabase — y
`src/stores/useCatalogStore.ts` no tiene ningún fetch de `comets_cos`. Poblar
la tabla (migración 004) documenta el catálogo real para uso futuro, pero
**no cambia lo que renderiza la app hoy**. Además, el esquema de `comets_cos`
no tiene columnas para elementos keplerianos completos (e, i, om, w) — solo
`perihelion_au`/`aphelion_au`/`orbital_period_yr`/`perihelion_date` — así que
no podría sustituir a `comets.ts` para el cálculo de posición real aunque se
conectara.

---

## Tablas de usuarios y gamificación

| Tabla | Descripción |
|---|---|
| `user_profiles_cos` | Perfil del observador (username, ubicación, XP, nivel) |
| `observations_cos` | Diario de observaciones |
| `user_favorites_cos` | Objetos favoritos del usuario |
| `object_ratings_cos` | Valoraciones 1–5 de objetos celestes |
| `object_comments_cos` | Comentarios públicos sobre objetos |
| `user_challenge_progress_cos` | Progreso de retos por usuario |
| `kids_challenge_progress_cos` | Progreso de retos del modo niños |
| `user_passport_stamps_cos` | Sellos ganados por cada usuario |

Todas confirmadas **vacías** (0 filas) a fecha de 2026-07-19 — coherente con
que la app nunca ha implementado ningún flujo de Supabase Auth (`grep` sin
resultados para `supabase.auth.*` en todo `src/`), así que ningún `user_id`
real se ha podido escribir nunca en ellas.

## Limitación conocida: `profiles` vs `user_profiles_cos`

Existen **dos tablas de perfil distintas y no relacionadas**: `profiles`
(migración 001, "Modo Diablo"/invitado) y `user_profiles_cos` (arriba,
pensada para usuarios con Supabase Auth real). Ninguna de las dos tiene
datos reales hoy. El único código que escribía en `profiles`
(`src/lib/supabase/neuralSync.ts`) se eliminó — disparaba llamadas de red
que siempre fallaban en silencio por este mismo motivo de permisos, sin
ningún flujo de Supabase Auth que las respaldara.
Además, `profiles` devuelve `permission denied` incluso con la service-role
key — un problema de GRANT más profundo que el de las tablas de catálogo,
sin corregir todavía.

---

## Vistas y funciones RPC detectadas (sin definición capturada)

Vistas: `top_rated_objects`, `user_leaderboard`, `user_object_summary`.
Funciones RPC expuestas: `search_celestial_objects`, `get_user_stats`,
`get_object_rating`, `get_kids_content`. Ninguna tiene su definición SQL
capturada en este repo — solo se sabe que existen por el listado de rutas de
la Data API.

---

## Cómo aplicar las migraciones

1. Abre el **SQL Editor** en tu proyecto de Supabase
2. Copia y ejecuta en orden: `001_cosmos_atlas_schema.sql`,
   `002_catalog_schema_baseline_and_grants.sql`,
   `003_kids_and_passport_public_grants.sql`,
   `004_comets_data.sql`,
   `005_moons_data.sql`
3. O con la CLI de Supabase enlazada al proyecto: `supabase db push`

## Verificado

- **Grants de las 14 tablas de catálogo** (10 de la migración 002 + 4 de la
  003): confirmados el 2026-07-21 con
  `has_table_privilege('anon'/'authenticated', 'public.<tabla>', 'SELECT')`
  corrido en el SQL Editor del proyecto correcto — las 14 devuelven `true`
  para ambos roles, y por curl (401→200) contra la Data API real.

## Pendiente de verificar (no confirmado por este documento)

- Políticas RLS reales de las tablas `*_cos` — no expuestas vía Data API,
  requieren revisión directa en el dashboard (Database → Policies).
- Causa raíz exacta de por qué estas tablas se crearon sin los grants
  automáticos que Supabase aplica vía el Table Editor del dashboard.
