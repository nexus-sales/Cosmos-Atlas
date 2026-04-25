/**
 * seed-supabase.ts
 * Puebla las tablas de Supabase con los datos locales de Cosmos Atlas.
 *
 * Requisitos en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← Settings → API → service_role
 *
 * Ejecutar:
 *   npx tsx --env-file=.env.local scripts/seed-supabase.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

import { STARS } from '../src/data/stars'
import { DSOS } from '../src/data/dsos'
import { METEOR_SHOWERS } from '../src/data/meteorShowers'
import { CHALLENGES } from '../src/data/challenges'

// ─── Cargar .env.local manualmente ────────────────────────────────────────────
function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const raw = trimmed.slice(eqIdx + 1).trim()
    const val = raw.replace(/^["']|["']$/g, '') // eliminar comillas opcionales
      if (key && !process.env[key]) process.env[key] = val
    }
  } catch {
    // Si se usa --env-file ya están cargadas, no es error
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Faltan variables de entorno:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

// ─── Lookup IAU de constelaciones ──────────────────────────────────────────────
const IAU_DATA: Record<string, { abbrev: string; name_es: string; name_la: string; name_en: string }> = {
  'Andromeda':          { abbrev: 'And', name_en: 'Andromeda',       name_es: 'Andrómeda',             name_la: 'Andromeda' },
  'Antlia':             { abbrev: 'Ant', name_en: 'Antlia',          name_es: 'Máquina Neumática',      name_la: 'Antlia' },
  'Apus':               { abbrev: 'Aps', name_en: 'Apus',            name_es: 'Ave del Paraíso',        name_la: 'Apus' },
  'Aquarius':           { abbrev: 'Aqr', name_en: 'Aquarius',        name_es: 'Acuario',                name_la: 'Aquarius' },
  'Aquila':             { abbrev: 'Aql', name_en: 'Aquila',          name_es: 'Águila',                 name_la: 'Aquila' },
  'Ara':                { abbrev: 'Ara', name_en: 'Ara',             name_es: 'Altar',                  name_la: 'Ara' },
  'Aries':              { abbrev: 'Ari', name_en: 'Aries',           name_es: 'Aries',                  name_la: 'Aries' },
  'Auriga':             { abbrev: 'Aur', name_en: 'Auriga',          name_es: 'Cochero',                name_la: 'Auriga' },
  'Boötes':             { abbrev: 'Boo', name_en: 'Boötes',          name_es: 'Boyero',                 name_la: 'Boötes' },
  'Caelum':             { abbrev: 'Cae', name_en: 'Caelum',          name_es: 'Buril',                  name_la: 'Caelum' },
  'Camelopardalis':     { abbrev: 'Cam', name_en: 'Camelopardalis',  name_es: 'Jirafa',                 name_la: 'Camelopardalis' },
  'Cancer':             { abbrev: 'Cnc', name_en: 'Cancer',          name_es: 'Cáncer',                 name_la: 'Cancer' },
  'Canes Venatici':     { abbrev: 'CVn', name_en: 'Canes Venatici', name_es: 'Lebreles',               name_la: 'Canes Venatici' },
  'Canis Major':        { abbrev: 'CMa', name_en: 'Canis Major',     name_es: 'Can Mayor',              name_la: 'Canis Major' },
  'Canis Minor':        { abbrev: 'CMi', name_en: 'Canis Minor',     name_es: 'Can Menor',              name_la: 'Canis Minor' },
  'Capricornus':        { abbrev: 'Cap', name_en: 'Capricornus',     name_es: 'Capricornio',            name_la: 'Capricornus' },
  'Carina':             { abbrev: 'Car', name_en: 'Carina',          name_es: 'Quilla',                 name_la: 'Carina' },
  'Cassiopeia':         { abbrev: 'Cas', name_en: 'Cassiopeia',      name_es: 'Casiopea',               name_la: 'Cassiopeia' },
  'Centaurus':          { abbrev: 'Cen', name_en: 'Centaurus',       name_es: 'Centauro',               name_la: 'Centaurus' },
  'Cepheus':            { abbrev: 'Cep', name_en: 'Cepheus',         name_es: 'Cefeo',                  name_la: 'Cepheus' },
  'Cetus':              { abbrev: 'Cet', name_en: 'Cetus',           name_es: 'Ballena',                name_la: 'Cetus' },
  'Chamaeleon':         { abbrev: 'Cha', name_en: 'Chamaeleon',      name_es: 'Camaleón',               name_la: 'Chamaeleon' },
  'Circinus':           { abbrev: 'Cir', name_en: 'Circinus',        name_es: 'Compás',                 name_la: 'Circinus' },
  'Columba':            { abbrev: 'Col', name_en: 'Columba',         name_es: 'Paloma',                 name_la: 'Columba' },
  'Coma Berenices':     { abbrev: 'Com', name_en: 'Coma Berenices',  name_es: 'Cabellera de Berenice',  name_la: 'Coma Berenices' },
  'Corona Australis':   { abbrev: 'CrA', name_en: 'Corona Australis',name_es: 'Corona Austral',         name_la: 'Corona Australis' },
  'Corona Borealis':    { abbrev: 'CrB', name_en: 'Corona Borealis', name_es: 'Corona Boreal',          name_la: 'Corona Borealis' },
  'Corvus':             { abbrev: 'Crv', name_en: 'Corvus',          name_es: 'Cuervo',                 name_la: 'Corvus' },
  'Crater':             { abbrev: 'Crt', name_en: 'Crater',          name_es: 'Copa',                   name_la: 'Crater' },
  'Crux':               { abbrev: 'Cru', name_en: 'Crux',            name_es: 'Cruz del Sur',           name_la: 'Crux' },
  'Cygnus':             { abbrev: 'Cyg', name_en: 'Cygnus',          name_es: 'Cisne',                  name_la: 'Cygnus' },
  'Delphinus':          { abbrev: 'Del', name_en: 'Delphinus',       name_es: 'Delfín',                 name_la: 'Delphinus' },
  'Dorado':             { abbrev: 'Dor', name_en: 'Dorado',          name_es: 'Dorado',                 name_la: 'Dorado' },
  'Draco':              { abbrev: 'Dra', name_en: 'Draco',           name_es: 'Dragón',                 name_la: 'Draco' },
  'Equuleus':           { abbrev: 'Equ', name_en: 'Equuleus',        name_es: 'Caballito',              name_la: 'Equuleus' },
  'Eridanus':           { abbrev: 'Eri', name_en: 'Eridanus',        name_es: 'Erídano',                name_la: 'Eridanus' },
  'Fornax':             { abbrev: 'For', name_en: 'Fornax',          name_es: 'Horno',                  name_la: 'Fornax' },
  'Gemini':             { abbrev: 'Gem', name_en: 'Gemini',          name_es: 'Géminis',                name_la: 'Gemini' },
  'Grus':               { abbrev: 'Gru', name_en: 'Grus',            name_es: 'Grulla',                 name_la: 'Grus' },
  'Hercules':           { abbrev: 'Her', name_en: 'Hercules',        name_es: 'Hércules',               name_la: 'Hercules' },
  'Horologium':         { abbrev: 'Hor', name_en: 'Horologium',      name_es: 'Reloj',                  name_la: 'Horologium' },
  'Hydra':              { abbrev: 'Hya', name_en: 'Hydra',           name_es: 'Hidra',                  name_la: 'Hydra' },
  'Hydrus':             { abbrev: 'Hyi', name_en: 'Hydrus',          name_es: 'Hidra Macho',            name_la: 'Hydrus' },
  'Indus':              { abbrev: 'Ind', name_en: 'Indus',           name_es: 'Indio',                  name_la: 'Indus' },
  'Lacerta':            { abbrev: 'Lac', name_en: 'Lacerta',         name_es: 'Lagarto',                name_la: 'Lacerta' },
  'Leo':                { abbrev: 'Leo', name_en: 'Leo',             name_es: 'León',                   name_la: 'Leo' },
  'Leo Minor':          { abbrev: 'LMi', name_en: 'Leo Minor',       name_es: 'León Menor',             name_la: 'Leo Minor' },
  'Lepus':              { abbrev: 'Lep', name_en: 'Lepus',           name_es: 'Liebre',                 name_la: 'Lepus' },
  'Libra':              { abbrev: 'Lib', name_en: 'Libra',           name_es: 'Libra',                  name_la: 'Libra' },
  'Lupus':              { abbrev: 'Lup', name_en: 'Lupus',           name_es: 'Lobo',                   name_la: 'Lupus' },
  'Lynx':               { abbrev: 'Lyn', name_en: 'Lynx',            name_es: 'Lince',                  name_la: 'Lynx' },
  'Lyra':               { abbrev: 'Lyr', name_en: 'Lyra',            name_es: 'Lira',                   name_la: 'Lyra' },
  'Mensa':              { abbrev: 'Men', name_en: 'Mensa',           name_es: 'Mesa',                   name_la: 'Mensa' },
  'Microscopium':       { abbrev: 'Mic', name_en: 'Microscopium',    name_es: 'Microscopio',            name_la: 'Microscopium' },
  'Monoceros':          { abbrev: 'Mon', name_en: 'Monoceros',       name_es: 'Unicornio',              name_la: 'Monoceros' },
  'Musca':              { abbrev: 'Mus', name_en: 'Musca',           name_es: 'Mosca',                  name_la: 'Musca' },
  'Norma':              { abbrev: 'Nor', name_en: 'Norma',           name_es: 'Escuadra',               name_la: 'Norma' },
  'Octans':             { abbrev: 'Oct', name_en: 'Octans',          name_es: 'Octante',                name_la: 'Octans' },
  'Ophiuchus':          { abbrev: 'Oph', name_en: 'Ophiuchus',       name_es: 'Ofiuco',                 name_la: 'Ophiuchus' },
  'Orion':              { abbrev: 'Ori', name_en: 'Orion',           name_es: 'Orión',                  name_la: 'Orion' },
  'Pavo':               { abbrev: 'Pav', name_en: 'Pavo',            name_es: 'Pavo Real',              name_la: 'Pavo' },
  'Pegasus':            { abbrev: 'Peg', name_en: 'Pegasus',         name_es: 'Pegaso',                 name_la: 'Pegasus' },
  'Perseus':            { abbrev: 'Per', name_en: 'Perseus',         name_es: 'Perseo',                 name_la: 'Perseus' },
  'Phoenix':            { abbrev: 'Phe', name_en: 'Phoenix',         name_es: 'Fénix',                  name_la: 'Phoenix' },
  'Pictor':             { abbrev: 'Pic', name_en: 'Pictor',          name_es: 'Caballete del Pintor',   name_la: 'Pictor' },
  'Pisces':             { abbrev: 'Psc', name_en: 'Pisces',          name_es: 'Piscis',                 name_la: 'Pisces' },
  'Piscis Austrinus':   { abbrev: 'PsA', name_en: 'Piscis Austrinus',name_es: 'Pez Austral',           name_la: 'Piscis Austrinus' },
  'Puppis':             { abbrev: 'Pup', name_en: 'Puppis',          name_es: 'Popa',                   name_la: 'Puppis' },
  'Pyxis':              { abbrev: 'Pyx', name_en: 'Pyxis',           name_es: 'Brújula',                name_la: 'Pyxis' },
  'Reticulum':          { abbrev: 'Ret', name_en: 'Reticulum',       name_es: 'Retículo',               name_la: 'Reticulum' },
  'Sagitta':            { abbrev: 'Sge', name_en: 'Sagitta',         name_es: 'Flecha',                 name_la: 'Sagitta' },
  'Sagittarius':        { abbrev: 'Sgr', name_en: 'Sagittarius',     name_es: 'Sagitario',              name_la: 'Sagittarius' },
  'Scorpius':           { abbrev: 'Sco', name_en: 'Scorpius',        name_es: 'Escorpión',              name_la: 'Scorpius' },
  'Sculptor':           { abbrev: 'Scl', name_en: 'Sculptor',        name_es: 'Escultor',               name_la: 'Sculptor' },
  'Scutum':             { abbrev: 'Sct', name_en: 'Scutum',          name_es: 'Escudo',                 name_la: 'Scutum' },
  'Serpens':            { abbrev: 'Ser', name_en: 'Serpens',         name_es: 'Serpiente',              name_la: 'Serpens' },
  'Sextans':            { abbrev: 'Sex', name_en: 'Sextans',         name_es: 'Sextante',               name_la: 'Sextans' },
  'Taurus':             { abbrev: 'Tau', name_en: 'Taurus',          name_es: 'Tauro',                  name_la: 'Taurus' },
  'Telescopium':        { abbrev: 'Tel', name_en: 'Telescopium',     name_es: 'Telescopio',             name_la: 'Telescopium' },
  'Triangulum':         { abbrev: 'Tri', name_en: 'Triangulum',      name_es: 'Triángulo',              name_la: 'Triangulum' },
  'Triangulum Australe':{ abbrev: 'TrA', name_en: 'Triangulum Australe', name_es: 'Triángulo Austral', name_la: 'Triangulum Australe' },
  'Tucana':             { abbrev: 'Tuc', name_en: 'Tucana',          name_es: 'Tucán',                  name_la: 'Tucana' },
  'Ursa Major':         { abbrev: 'UMa', name_en: 'Ursa Major',      name_es: 'Osa Mayor',              name_la: 'Ursa Major' },
  'Ursa Minor':         { abbrev: 'UMi', name_en: 'Ursa Minor',      name_es: 'Osa Menor',              name_la: 'Ursa Minor' },
  'Vela':               { abbrev: 'Vel', name_en: 'Vela',            name_es: 'Vela',                   name_la: 'Vela' },
  'Virgo':              { abbrev: 'Vir', name_en: 'Virgo',           name_es: 'Virgo',                  name_la: 'Virgo' },
  'Volans':             { abbrev: 'Vol', name_en: 'Volans',          name_es: 'Pez Volador',            name_la: 'Volans' },
  'Vulpecula':          { abbrev: 'Vul', name_en: 'Vulpecula',       name_es: 'Zorro',                  name_la: 'Vulpecula' },
}

// Alias: permite buscar por abreviatura O por nombre completo
const IAU: typeof IAU_DATA = { ...IAU_DATA }
for (const [, v] of Object.entries(IAU_DATA)) {
  if (!IAU[v.abbrev]) IAU[v.abbrev] = v
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function upsert(table: string, rows: object[], conflict: string) {
  const chunks = chunkArray(rows, 100)
  let total = 0
  for (const chunk of chunks) {
    const { error } = await sb.from(table).upsert(chunk, { onConflict: conflict })
    if (error) throw new Error(`[${table}] ${error.message}`)
    total += chunk.length
  }
  console.log(`  ✓ ${table}: ${total} filas`)
}

async function clearAndInsert(table: string, rows: object[]) {
  // Limpia la tabla antes de insertar (idempotente para el seed)
  const { error: delErr } = await sb.from(table).delete().not('id', 'is', null)
  if (delErr) throw new Error(`[${table} delete] ${delErr.message}`)
  const chunks = chunkArray(rows, 100)
  let total = 0
  for (const chunk of chunks) {
    const { error } = await sb.from(table).insert(chunk)
    if (error) throw new Error(`[${table}] ${error.message}`)
    total += chunk.length
  }
  console.log(`  ✓ ${table}: ${total} filas`)
}

// ─── 1. CONSTELACIONES ─────────────────────────────────────────────────────────
async function seedConstellations() {
  const rawNames = new Set<string>()
  STARS.forEach(s => { if (s.constellation) rawNames.add(s.constellation) })
  METEOR_SHOWERS.forEach(s => { if (s.constellation) rawNames.add(s.constellation) })

  // Normalizar: si el nombre es una abreviatura conocida, convertir al nombre completo
  const names = new Set<string>()
  for (const name of rawNames) {
    const iau = IAU[name]
    // Si existe en IAU y tiene name_en diferente al key, es una abreviatura → usar name_en
    const normalized = iau?.name_en && iau.name_en !== name ? iau.name_en : name
    names.add(normalized)
  }

  // Deduplicar por iau_abbrev para evitar conflictos de constraint
  const byAbbrev = new Map<string, object>()
  for (const name of names) {
    const iau = IAU[name]
    if (!iau) console.warn(`  ⚠  Constelación sin IAU: "${name}" — usando fallback`)
    const abbrev = iau?.abbrev ?? name.slice(0, 3).toUpperCase()
    if (!byAbbrev.has(abbrev)) {
      byAbbrev.set(abbrev, {
        id:         name,
        iau_abbrev: abbrev,
        name_en:    iau?.name_en ?? name,
        name_es:    iau?.name_es ?? name,
        name_la:    iau?.name_la ?? name,
      })
    }
  }

  await upsert('constellations_cos', Array.from(byAbbrev.values()), 'id')
}

// ─── 2. ESTRELLAS ──────────────────────────────────────────────────────────────
async function seedStars() {
  const rows = STARS.map(s => {
    // Normalizar constellation_id: si es abreviatura, convertir a nombre completo
    let constId = s.constellation ?? null
    if (constId) {
      const iau = IAU[constId]
      if (iau?.name_en && iau.name_en !== constId) constId = iau.name_en
    }
    return {
      name:             s.name,
      constellation_id: constId,
      ra:               s.ra,
      dec:              s.dec,
      mag_visual:       s.mag,
      color_hex:        s.color,
      base_size:        s.baseSize,
      desc_short:       s.desc,
      difficulty:       s.mag <= 2.0 ? 'naked_eye' : s.mag <= 4.0 ? 'naked_eye' : 'binoculars',
    }
  })

  await clearAndInsert('stars_cos', rows)
}

// ─── 3. OBJETOS DEL CIELO PROFUNDO ─────────────────────────────────────────────
async function seedDSOs() {
  const rows = DSOS.map(d => ({
    id:             d.id,
    name:           d.name,
    catalogue_ids:  [d.id],
    ra:             d.ra,
    dec:            d.dec,
    type:           d.type,
    mag_visual:     d.mag ?? null,
    color_hex:      d.color,
    size_arcmin_major: d.sizeArcmin ?? null,
    desc_short:     d.desc,
    difficulty:     (d.mag ?? 99) <= 4.0
                      ? 'naked_eye'
                      : (d.mag ?? 99) <= 7.0
                        ? 'binoculars'
                        : 'small_telescope',
  }))

  await upsert('deep_sky_objects_cos', rows, 'id') // tiene PK texto
}

// ─── 4. LLUVIAS DE METEOROS ────────────────────────────────────────────────────
async function seedMeteorShowers() {
  const rows = METEOR_SHOWERS.map(s => ({
    id:               s.id,
    name_es:          s.name,
    name_en:          s.name,
    short_name:       s.shortName,
    constellation_id: s.constellation ?? null,
    radiant_ra:       s.radiant.ra,
    radiant_dec:      s.radiant.dec,
    parent_body:      s.parentBody,
    date_start:       s.dateStart,
    date_end:         s.dateEnd,
    peak_date:        s.peakDate,
    zhr_max:          s.thz,
    speed_kms:        s.speed,
    color_hex:        s.color,
    desc_short:       s.description,
  }))

  await upsert('meteor_showers_cos', rows, 'id') // tiene PK texto
}

// ─── 5. RETOS DE OBSERVACIÓN ───────────────────────────────────────────────────
async function seedChallenges() {
  const isDso = (name: string) =>
    /^(M\d+|NGC|IC|LMC|SMC)/i.test(name)

  const rows = CHALLENGES.map((c, i) => ({
    target_id:    c.name,
    target_kind:  isDso(c.name) ? 'dso' : 'star',
    name_es:      c.award,
    hint_es:      c.hint,
    fun_fact_es:  c.fun,
    award_name_es: c.award,
    xp_reward:    50 + i * 10,
    sort_order:   i,
  }))

  await clearAndInsert('challenges_cos', rows)
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Iniciando seed de Cosmos Atlas en Supabase...\n')

  console.log('📍 Constelaciones...')
  await seedConstellations()

  console.log('⭐ Estrellas...')
  await seedStars()

  console.log('🔭 Objetos del cielo profundo...')
  await seedDSOs()

  console.log('🌠 Lluvias de meteoros...')
  await seedMeteorShowers()

  console.log('🏆 Retos de observación...')
  await seedChallenges()

  console.log('\n✅ Seed completado.\n')
}

main().catch(err => {
  console.error('\n❌ Error durante el seed:', err.message)
  process.exit(1)
})
