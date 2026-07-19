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

**Estado real de acceso (verificado con curl contra la Data API, 2026-07-19):**
`planets_cos`, `stars_cos`, `deep_sky_objects_cos`, `moons_cos`,
`meteor_showers_cos`, `challenges_cos`, `constellations_cos`, `comets_cos`,
`astronomical_events_cos`, `fun_facts_cos` tienen `GRANT SELECT` a
`anon`/`authenticated` (corregido el 2026-07-19, ver migración 002).
`kids_content_cos`, `kids_challenges_cos`, `kids_quiz_questions_cos` y
`passport_stamps_cos` **siguen sin ese grant** — el mismo problema no
corregido todavía.

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
(migración 001, "Modo Diablo"/invitado, usada por
`src/lib/supabase/neuralSync.ts`) y `user_profiles_cos` (arriba, pensada para
usuarios con Supabase Auth real). Ninguna de las dos tiene datos reales hoy.
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
2. Copia el contenido de `supabase/migrations/001_cosmos_atlas_schema.sql`,
   ejecútalo, y luego el de `002_catalog_schema_baseline_and_grants.sql`
3. O con la CLI de Supabase enlazada al proyecto: `supabase db push`

## Pendiente de verificar (no confirmado por este documento)

- Políticas RLS reales de las tablas `*_cos` — no expuestas vía Data API,
  requieren revisión directa en el dashboard (Database → Policies) o
  `information_schema.role_table_grants` / `pg_policies` vía SQL Editor.
- Grant de lectura pública para `kids_content_cos`, `kids_challenges_cos`,
  `kids_quiz_questions_cos`, `passport_stamps_cos` (mismo problema que las
  demás tablas de catálogo, sin corregir).
- Causa raíz exacta de por qué estas tablas se crearon sin los grants
  automáticos que Supabase aplica vía el Table Editor del dashboard.
