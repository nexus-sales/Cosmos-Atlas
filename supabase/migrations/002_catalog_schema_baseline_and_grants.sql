-- =============================================================================
-- Baseline del esquema real *_cos + GRANTs de lectura publica
-- =============================================================================
--
-- PROCEDENCIA (leer antes de confiar en este archivo):
--
-- Este archivo NO es un pg_dump ni un `supabase db diff`. Se reconstruyo el
-- 2026-07-19 introspeccionando el proyecto en vivo via la Data API de
-- PostgREST (endpoint OpenAPI de /rest/v1/), porque no habia acceso directo
-- a Postgres (sin password de conexion, sin CLI enlazada). El proceso:
--
--   1. GET /rest/v1/ con la service-role key -> devuelve un spec OpenAPI con
--      columnas, tipos, defaults, PK y FK anotados por tabla.
--   2. Un script convirtio ese spec en las sentencias CREATE TYPE / CREATE
--      TABLE de abajo, con orden topologico segun las FK detectadas.
--
-- QUE SI captura este archivo (con confianza razonable):
--   - Nombres de columna, tipos, NOT NULL, defaults, PRIMARY KEY, FOREIGN KEY.
--   - Los 10 tipos ENUM personalizados usados por estas tablas.
--
-- QUE NO captura (limite honesto, no encontrado por ningun medio disponible):
--   - Politicas RLS de las tablas *_cos (SI se enable/disable row level
--     security, y con que condiciones) -- information_schema/pg_policies no
--     se expone via la Data API. Verificar a mano en el dashboard
--     (Database > Policies) antes de asumir que estas tablas tienen la
--     misma proteccion que `profiles` (migracion 001).
--   - Indices mas alla de la PK, check constraints, triggers, y el cuerpo de
--     las funciones RPC (`search_celestial_objects`, `get_user_stats`,
--     `get_object_rating`, `get_kids_content`) -- solo se sabe que existen
--     via el listado de rutas /rpc/*, no su definicion.
--
-- GRANTS -- procedencia y alcance exacto:
--
-- El 2026-07-19 se detecto que la anon/publishable key devolvia 401
-- "permission denied" en las tablas de catalogo de solo lectura (confirmado
-- con curl contra /rest/v1/<tabla>?select=*&limit=1 antes/despues). El GRANT
-- de abajo se corrio manualmente en el SQL Editor de Supabase -- no por este
-- repo ni por ninguna CLI -- por eso quedaba sin versionar hasta ahora.
-- No se conoce el texto SQL literal ejecutado con certeza (no hay acceso al
-- historial del SQL Editor); lo de abajo es la sentencia que se propuso, y
-- se confirmo por comportamiento observable que el efecto coincide: las 10
-- tablas listadas pasaron de 401 a 200 con la anon key, y ninguna otra tabla
-- probada (kids_content_cos, kids_challenges_cos, kids_quiz_questions_cos,
-- passport_stamps_cos, profiles, user_profiles_cos, observations_cos,
-- user_favorites_cos) cambio de estado -- siguen en 401 tras el cambio,
-- consistente con que el GRANT fue exactamente este alcance y no mas amplio.
-- Verificacion definitiva pendiente via:
--   SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name IN (...);
--
-- Sobre la causa raiz: no es el cambio de plataforma de Supabase de GRANTs
-- explicitos para la Data API (rollout: opt-in 2026-04-28, default proyectos
-- nuevos 2026-05-30, forzado en proyectos existentes recien el 2026-10-30,
-- que aun no aplica hoy, y que ademas NO revoca grants de tablas ya
-- existentes segun el propio changelog de Supabase). El `iat` de la key
-- legacy de este proyecto es 2025-07-17, muy anterior a esa ventana. La
-- explicacion mas probable es que estas tablas *_cos se crearon (via SQL
-- Editor, no via el Table Editor del dashboard) sin heredar los grants
-- automaticos que si aplica el flujo de la UI -- sin confirmar aun cuando
-- exactamente se crearon estas tablas dentro de la vida del proyecto.
--
-- Tablas *_cos con el mismo patron probable pero SIN confirmar ni corregir
-- todavia (siguen en 401 con anon key a fecha de este commit):
-- kids_content_cos, kids_challenges_cos, kids_quiz_questions_cos,
-- passport_stamps_cos -- son de solo-lectura publica por diseno (contenido,
-- no datos de usuario), candidatas a la misma correccion cuando se decida.
--
-- =============================================================================

-- --- Tipos ENUM personalizados ----------------------------------------------

do $$ begin
    create type public.award_tier as enum ('bronze', 'silver', 'gold', 'platinum', 'diamond');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.celestial_kind as enum ('star', 'dso', 'planet', 'comet', 'asteroid');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.cluster_subtype as enum ('globular', 'open');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.difficulty_level as enum ('naked_eye', 'binoculars', 'small_telescope', 'large_telescope', 'astrophotography');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.dso_type as enum ('galaxy', 'nebula', 'cluster', 'supernova_remnant', 'dark_nebula', 'planetary_nebula');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.galaxy_subtype as enum ('spiral', 'barred_spiral', 'elliptical', 'lenticular', 'irregular', 'dwarf', 'starburst', 'active');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.nebula_subtype as enum ('emission', 'reflection', 'dark', 'planetary', 'supernova_remnant', 'bipolar');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.observation_status as enum ('seen', 'attempted', 'wishlist');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.spectral_class as enum ('O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y', 'W', 'C', 'S');
exception when duplicate_object then null;
end $$;

do $$ begin
    create type public.visibility_hemi as enum ('both', 'north', 'south');
exception when duplicate_object then null;
end $$;

-- --- Tablas de catalogo (solo lectura publica por diseno) -------------------

create table if not exists public.astronomical_events_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    event_date date NOT NULL,
    event_type text NOT NULL,
    title_es text NOT NULL,
    title_en text,
    description_es text NOT NULL,
    description_en text,
    visibility public.visibility_hemi DEFAULT 'both',
    is_notable boolean DEFAULT false,
    related_object_id text,
    related_object_kind public.celestial_kind,
    source_url text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.challenges_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    target_id text NOT NULL,
    target_kind public.celestial_kind NOT NULL,
    name_es text NOT NULL,
    name_en text,
    hint_es text NOT NULL,
    hint_en text,
    fun_fact_es text NOT NULL,
    fun_fact_en text,
    difficulty public.difficulty_level DEFAULT 'naked_eye',
    xp_reward integer DEFAULT 50,
    award_name_es text,
    award_tier public.award_tier,
    award_icon text,
    is_active boolean DEFAULT true,
    sort_order smallint DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.comets_cos (
    id text NOT NULL,
    name text NOT NULL,
    designation text,
    discoverer text,
    discovery_date date,
    perihelion_date date,
    perihelion_au numeric,
    aphelion_au numeric,
    orbital_period_yr numeric,
    mag_peak numeric,
    is_periodic boolean DEFAULT false,
    color_hex text DEFAULT '#aaffee',
    desc_short text DEFAULT '',
    desc_long text,
    fun_fact text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.constellations_cos (
    id text NOT NULL,
    iau_abbrev character(3) NOT NULL,
    name_es text NOT NULL,
    name_en text NOT NULL,
    name_la text NOT NULL,
    genitive_la text,
    mythology text,
    history text,
    best_season text,
    visibility public.visibility_hemi DEFAULT 'both',
    area_sq_deg numeric,
    brightest_star text,
    ra_center numeric,
    dec_center numeric,
    fun_fact text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.deep_sky_objects_cos (
    id text NOT NULL,
    name text NOT NULL,
    catalogue_ids text[] NOT NULL,
    constellation_id text,
    ra numeric NOT NULL,
    dec numeric NOT NULL,
    type public.dso_type NOT NULL,
    subtype text,
    galaxy_subtype public.galaxy_subtype,
    cluster_subtype public.cluster_subtype,
    nebula_subtype public.nebula_subtype,
    mag_visual numeric,
    mag_surface numeric,
    size_arcmin_major numeric,
    size_arcmin_minor numeric,
    position_angle numeric,
    distance_mly numeric,
    redshift_z numeric,
    radial_velocity numeric,
    stars_count integer,
    age_gyr numeric,
    color_hex text DEFAULT '#ffcc88',
    desc_short text DEFAULT '',
    desc_long text,
    history text,
    fun_fact text,
    observation_tips text,
    visibility public.visibility_hemi DEFAULT 'both',
    difficulty public.difficulty_level DEFAULT 'binoculars',
    best_instrument text,
    image_url text,
    thumb_url text,
    image_credit text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (constellation_id) REFERENCES public.constellations_cos(id)
);

create table if not exists public.fun_facts_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    related_object_id text,
    related_object_kind public.celestial_kind,
    audience text DEFAULT 'general',
    language character(2) DEFAULT 'es'::bpchar,
    fact_text text NOT NULL,
    source text,
    verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.kids_challenges_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    target_id text NOT NULL,
    target_kind public.celestial_kind NOT NULL,
    name_kids text NOT NULL,
    hint_kids text NOT NULL,
    success_message text NOT NULL,
    fun_fact_kids text NOT NULL,
    xp_reward integer DEFAULT 30,
    award_icon text,
    award_name text,
    age_min smallint DEFAULT 5,
    age_max smallint DEFAULT 12,
    sort_order smallint DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.kids_content_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    object_id text NOT NULL,
    object_kind public.celestial_kind NOT NULL,
    name_simple text NOT NULL,
    desc_kids text NOT NULL,
    analogy text,
    wow_fact text,
    fun_fact_kids text,
    activity text,
    draw_hint text,
    emoji text,
    sound_url text,
    video_url text,
    image_url text,
    image_credit text,
    age_min smallint DEFAULT 5,
    age_max smallint DEFAULT 12,
    is_featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.kids_quiz_questions_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    object_id text,
    object_kind public.celestial_kind,
    question text NOT NULL,
    answer_correct text NOT NULL,
    answer_wrong_1 text NOT NULL,
    answer_wrong_2 text NOT NULL,
    answer_wrong_3 text,
    explanation text,
    emoji text,
    difficulty smallint DEFAULT 1,
    age_min smallint DEFAULT 5,
    age_max smallint DEFAULT 12,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.meteor_showers_cos (
    id text NOT NULL,
    name_es text NOT NULL,
    name_en text NOT NULL,
    short_name character(3) NOT NULL,
    constellation_id text,
    radiant_ra numeric NOT NULL,
    radiant_dec numeric NOT NULL,
    parent_body text,
    date_start date NOT NULL,
    date_end date NOT NULL,
    peak_date date NOT NULL,
    zhr_max smallint NOT NULL,
    speed_kms smallint NOT NULL,
    color_hex text DEFAULT '#44aaff',
    visibility public.visibility_hemi DEFAULT 'both',
    desc_short text DEFAULT '',
    desc_long text,
    fun_fact text,
    observation_tips text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (constellation_id) REFERENCES public.constellations_cos(id)
);

create table if not exists public.planets_cos (
    id text NOT NULL,
    name_es text NOT NULL,
    name_en text NOT NULL,
    symbol text NOT NULL,
    color_hex text NOT NULL,
    order_from_sun smallint NOT NULL,
    planet_type text NOT NULL,
    radius_km numeric,
    radius_earth numeric,
    mass_earth numeric,
    gravity_ms2 numeric,
    density_gcc numeric,
    semi_major_axis_au numeric,
    orbital_period_days numeric,
    rotation_period_h numeric,
    axial_tilt_deg numeric,
    eccentricity numeric,
    inclination_deg numeric,
    has_atmosphere boolean DEFAULT false,
    atmosphere_main text[],
    surface_temp_min_k numeric,
    surface_temp_max_k numeric,
    surface_temp_avg_k numeric,
    moons_count smallint,
    has_rings boolean DEFAULT false,
    desc_short text DEFAULT '',
    desc_long text,
    fun_fact text,
    mythology text,
    observation_tips text,
    image_url text,
    thumb_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.moons_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    planet_id text NOT NULL,
    name text NOT NULL,
    discovery_year smallint,
    discoverer text,
    radius_km numeric,
    orbital_period_days numeric,
    semi_major_axis_km numeric,
    mag_visual numeric,
    is_notable boolean DEFAULT false,
    desc_short text DEFAULT '',
    desc_long text,
    fun_fact text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (planet_id) REFERENCES public.planets_cos(id)
);

create table if not exists public.passport_stamps_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    slug text NOT NULL,
    name_es text NOT NULL,
    name_en text,
    description_es text NOT NULL,
    category text NOT NULL,
    icon text,
    tier public.award_tier DEFAULT 'bronze',
    xp_reward integer DEFAULT 100,
    condition_type text NOT NULL,
    condition_value integer DEFAULT 1,
    is_secret boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.stars_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    catalogue_id text,
    name text NOT NULL,
    bayer_designation text,
    flamsteed_number text,
    constellation_id text,
    ra numeric NOT NULL,
    dec numeric NOT NULL,
    mag_visual numeric NOT NULL,
    mag_absolute numeric,
    distance_ly numeric,
    parallax_mas numeric,
    spectral_class public.spectral_class,
    spectral_full text,
    color_hex text DEFAULT '#ffffff',
    base_size numeric DEFAULT 3.0,
    luminosity_solar numeric,
    radius_solar numeric,
    mass_solar numeric,
    temperature_k integer,
    age_gyr numeric,
    is_variable boolean DEFAULT false,
    variable_type text,
    is_multiple boolean DEFAULT false,
    components_count smallint,
    has_exoplanets boolean DEFAULT false,
    exoplanets_count smallint,
    desc_short text DEFAULT '',
    desc_long text,
    mythology text,
    fun_fact text,
    observation_tips text,
    visibility public.visibility_hemi DEFAULT 'both',
    difficulty public.difficulty_level DEFAULT 'naked_eye',
    image_url text,
    thumb_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (constellation_id) REFERENCES public.constellations_cos(id)
);

-- --- Tablas de usuario / gamificacion (RLS sin verificar -- ver nota arriba) --

create table if not exists public.user_profiles_cos (
    id uuid NOT NULL,
    username text,
    display_name text,
    avatar_url text,
    bio text,
    location text,
    lat numeric,
    lon numeric,
    timezone text,
    preferred_lang character(2) DEFAULT 'es'::bpchar,
    is_public boolean DEFAULT true,
    total_xp integer DEFAULT 0,
    observer_level smallint DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

create table if not exists public.kids_challenge_progress_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    completed_at timestamptz,
    xp_earned integer DEFAULT 0,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id),
    FOREIGN KEY (challenge_id) REFERENCES public.kids_challenges_cos(id)
);

create table if not exists public.object_comments_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    object_id text NOT NULL,
    object_kind public.celestial_kind NOT NULL,
    body text NOT NULL,
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id)
);

create table if not exists public.object_ratings_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    object_id text NOT NULL,
    object_kind public.celestial_kind NOT NULL,
    rating smallint NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id)
);

create table if not exists public.observations_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    object_id text NOT NULL,
    object_kind public.celestial_kind NOT NULL,
    status public.observation_status DEFAULT 'seen',
    observed_at timestamptz,
    lat numeric,
    lon numeric,
    altitude_m numeric,
    instrument text,
    magnification numeric,
    seeing smallint,
    transparency smallint,
    naked_eye_lim numeric,
    notes text,
    image_url text,
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id)
);

create table if not exists public.user_challenge_progress_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    challenge_id uuid NOT NULL,
    completed_at timestamptz,
    xp_earned integer DEFAULT 0,
    notes text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id),
    FOREIGN KEY (challenge_id) REFERENCES public.challenges_cos(id)
);

create table if not exists public.user_favorites_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    object_id text NOT NULL,
    object_kind public.celestial_kind NOT NULL,
    added_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id)
);

create table if not exists public.user_passport_stamps_cos (
    id uuid DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    stamp_id uuid NOT NULL,
    earned_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.user_profiles_cos(id),
    FOREIGN KEY (stamp_id) REFERENCES public.passport_stamps_cos(id)
);

-- --- GRANTs de lectura publica (confirmados por comportamiento, ver nota) ---
-- Alcance exacto: las 10 tablas que se verifico con curl que pasaron de 401
-- a 200 con la anon/publishable key. NO se extiende a kids_*/passport_stamps_cos
-- (siguen en 401, sin confirmar) ni a las tablas de usuario (deben quedar
-- detras de RLS explicita, no de un GRANT publico de solo-lectura).

grant select on public.planets_cos, public.stars_cos, public.deep_sky_objects_cos,
  public.moons_cos, public.meteor_showers_cos, public.challenges_cos,
  public.constellations_cos, public.comets_cos, public.astronomical_events_cos,
  public.fun_facts_cos
to anon, authenticated;
