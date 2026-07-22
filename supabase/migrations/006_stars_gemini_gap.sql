-- =============================================================================
-- stars_cos tenia 879 filas frente a las 882 del catalogo local
-- (src/data/stars.ts). Diff exacto (script ad-hoc, no de memoria): faltaban
-- Theta Gem, Kappa Gem e Iota Gem -- las 3 en Geminis, mag 3.57-3.78, al
-- borde del corte de ~mag 3.5 que menciona el comentario de stars.ts.
--
-- Impacto real: useCatalogStore.loadFromSupabase reemplaza el array de
-- estrellas completo (no hace merge) en cuanto Supabase responde con datos,
-- asi que estas 3 estrellas se veian un instante en la carga inicial (dato
-- local) y desaparecian en cuanto llegaba la respuesta de Supabase -- mismo
-- patron de drift silencioso que el gap de moons_cos (migracion 005).
--
-- constellation_id = 'Gemini' verificado contra constellations_cos.id
-- (curl, 2026-07-22). visibility/difficulty/base_size tomados de las otras
-- estrellas de Geminis ya presentes (Pollux, Castor, etc: 'both'/'naked_eye').

do $$ begin
    alter table public.stars_cos add constraint stars_cos_name_unique unique (name);
exception when duplicate_object then null;
end $$;

insert into public.stars_cos
  (name, constellation_id, ra, dec, mag_visual, color_hex, base_size, desc_short)
values
  ('Theta Gem', 'Gemini', 103.235, 33.853, 3.60, '#e8f4ff', 2.2, 'Estrella en el brazo de Cástor.'),
  ('Kappa Gem', 'Gemini', 116.111, 24.398, 3.57, '#fff0cc', 2.2, 'Estrella en el brazo de Pólux.'),
  ('Iota Gem',  'Gemini', 111.393, 27.797, 3.78, '#ffcc88', 2.1, 'Estrella en el cuerpo de los gemelos.')
on conflict (name) do nothing;
