-- =============================================================================
-- GRANT de lectura publica para las 4 tablas de contenido que quedaron
-- pendientes en la migracion 002
-- =============================================================================
--
-- kids_content_cos, kids_challenges_cos, kids_quiz_questions_cos y
-- passport_stamps_cos son contenido de referencia (preguntas de quiz, retos,
-- definicion de sellos) -- no datos de usuario -- mismo patron que las 10
-- tablas de catalogo ya corregidas en 002. Confirmado el 2026-07-21 con
-- has_table_privilege() en el SQL Editor del proyecto correcto
-- (pyxmpgkuvkejzgeudclx) que las 4 devolvian false/false para
-- anon/authenticated antes de este GRANT.

grant select on public.kids_content_cos, public.kids_challenges_cos,
  public.kids_quiz_questions_cos, public.passport_stamps_cos
to anon, authenticated;
