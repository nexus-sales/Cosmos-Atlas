/**
 * useCatalogStore
 *
 * Almacén Zustand (NO persistido) para los datos del catálogo astronómico.
 * - Valor inicial: datos de los archivos .ts locales → renderizado inmediato.
 * - Al montar el CatalogLoader, reemplaza con datos frescos de Supabase.
 *
 * Uso en componentes:
 *   const stars = useCatalog(s => s.stars)
 */

import { create } from 'zustand'
import type { Star, DSO, Challenge } from '@/types/celestial'
import type { MeteorShower } from '@/data/meteorShowers'
import type { SolarSystemBody } from '@/data/solarSystemCatalog'

// ─── Datos locales como fallback de primera visita ─────────────────────────
// Garantizan renderizado inmediato. La caché localStorage los sustituye en
// visitas posteriores; Supabase los reemplaza con datos frescos al cargar.
import { STARS as LOCAL_STARS } from '@/data/stars'
import { DSOS as LOCAL_DSOS } from '@/data/dsos'
import { METEOR_SHOWERS as LOCAL_SHOWERS } from '@/data/meteorShowers'
import { CHALLENGES as LOCAL_CHALLENGES } from '@/data/challenges'
import { LOCAL_SOLAR_SYSTEM_BODIES } from '@/data/solarSystemCatalog'

// ─── Mappers Supabase → tipos de la app ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStar(row: any): Star {
  return {
    name:         row.name,
    constellation: row.constellation_id ?? '',
    ra:           Number(row.ra),
    dec:          Number(row.dec),
    mag:          Number(row.mag_visual),
    color:        row.color_hex ?? '#ffffff',
    baseSize:     Number(row.base_size ?? 1),
    desc:         row.desc_short ?? '',
    kind:         'star',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDSO(row: any): DSO {
  return {
    id:          row.id,
    name:        row.name,
    ra:          Number(row.ra),
    dec:         Number(row.dec),
    type:        row.type,
    mag:         row.mag_visual != null ? Number(row.mag_visual) : 99,
    color:       row.color_hex ?? '#aaaaaa',
    sizeArcmin:  row.size_arcmin_major != null ? Number(row.size_arcmin_major) : undefined,
    desc:        row.desc_short ?? '',
    kind:        'dso',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapShower(row: any): MeteorShower {
  const now      = new Date()
  const year     = now.getFullYear()
  const start    = new Date(`${year}-${(row.date_start as string).slice(5)}`)
  const end      = new Date(`${year}-${(row.date_end as string).slice(5)}`)
  const active   = now >= start && now <= end

  return {
    id:            row.id,
    name:          row.name_es ?? row.name_en ?? row.id,
    shortName:     row.short_name ?? row.id,
    radiant:       { ra: Number(row.radiant_ra), dec: Number(row.radiant_dec) },
    constellation: row.constellation_id ?? '',
    dateStart:     row.date_start,
    dateEnd:       row.date_end,
    peakDate:      row.peak_date,
    thz:           Number(row.zhr_max ?? 10),
    speed:         Number(row.speed_kms ?? 50),
    parentBody:    row.parent_body ?? '',
    description:   row.desc_short ?? '',
    color:         row.color_hex ?? '#ffffff',
    active,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapChallenge(row: any): Challenge {
  return {
    name:  row.target_id,
    hint:  row.hint_es ?? '',
    fun:   row.fun_fact_es ?? '',
    award: row.award_name_es ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlanetCatalog(row: any): SolarSystemBody {
  return {
    id: row.id,
    name: row.name_es,
    bodyKind: 'planet',
    symbol: row.symbol ?? '●',
    color: row.color_hex ?? '#ffffff',
    shortDesc: row.desc_short ?? '',
    longDesc: row.desc_long ?? row.desc_short ?? '',
    funFact: row.fun_fact ?? '',
    mythology: row.mythology ?? undefined,
    observationTips: row.observation_tips ?? undefined,
    imageUrl: row.image_url ?? undefined,
    thumbUrl: row.thumb_url ?? undefined,
    orderFromSun: row.order_from_sun != null ? Number(row.order_from_sun) : undefined,
    planetType: row.planet_type ?? undefined,
    moonsCount: row.moons_count != null ? Number(row.moons_count) : undefined,
    hasRings: row.has_rings ?? false,
    hasAtmosphere: row.has_atmosphere ?? false,
    atmosphereMain: Array.isArray(row.atmosphere_main) ? row.atmosphere_main : undefined,
    radiusKm: row.radius_km != null ? Number(row.radius_km) : undefined,
    radiusEarth: row.radius_earth != null ? Number(row.radius_earth) : undefined,
    massEarth: row.mass_earth != null ? Number(row.mass_earth) : undefined,
    gravityMs2: row.gravity_ms2 != null ? Number(row.gravity_ms2) : undefined,
    densityGcc: row.density_gcc != null ? Number(row.density_gcc) : undefined,
    semiMajorAxisAu: row.semi_major_axis_au != null ? Number(row.semi_major_axis_au) : undefined,
    orbitalPeriodDays: row.orbital_period_days != null ? Number(row.orbital_period_days) : undefined,
    rotationPeriodHours: row.rotation_period_h != null ? Number(row.rotation_period_h) : undefined,
    axialTiltDeg: row.axial_tilt_deg != null ? Number(row.axial_tilt_deg) : undefined,
    eccentricity: row.eccentricity != null ? Number(row.eccentricity) : undefined,
    inclinationDeg: row.inclination_deg != null ? Number(row.inclination_deg) : undefined,
    surfaceTempMinK: row.surface_temp_min_k != null ? Number(row.surface_temp_min_k) : undefined,
    surfaceTempMaxK: row.surface_temp_max_k != null ? Number(row.surface_temp_max_k) : undefined,
    surfaceTempAvgK: row.surface_temp_avg_k != null ? Number(row.surface_temp_avg_k) : undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMoonCatalog(row: any): SolarSystemBody {
  return {
    id: row.id ?? `moon:${row.name}`,
    name: row.name,
    bodyKind: 'moon',
    parentPlanetId: row.planet_id ?? undefined,
    symbol: '☽',
    color: '#d8d6c0',
    shortDesc: row.desc_short ?? '',
    longDesc: row.desc_long ?? row.desc_short ?? '',
    funFact: row.fun_fact ?? '',
    imageUrl: row.image_url ?? undefined,
    radiusKm: row.radius_km != null ? Number(row.radius_km) : undefined,
    orbitalPeriodDays: row.orbital_period_days != null ? Number(row.orbital_period_days) : undefined,
    semiMajorAxisKm: row.semi_major_axis_km != null ? Number(row.semi_major_axis_km) : undefined,
    magVisual: row.mag_visual != null ? Number(row.mag_visual) : undefined,
    observationTips: row.observation_tips ?? undefined,
    discoveryYear: row.discovery_year != null ? Number(row.discovery_year) : undefined,
    discoverer: row.discoverer ?? undefined,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'cosmos_catalog_v2'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

type CatalogData = Pick<CatalogState, 'stars' | 'dsos' | 'meteorShowers' | 'challenges' | 'solarSystemBodies'>

let catalogRefreshPromise: Promise<void> | null = null

function saveCache(data: CatalogData) {
  // Solo guardar si todos los conjuntos principales tienen datos reales
  if (!data.stars.length || !data.dsos.length || !data.solarSystemBodies.length) return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch { /* quota exceeded — ignorar */ }
}

function loadCache(): CatalogData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    // Validar que la caché tiene datos reales antes de usarla
    if (!data?.stars?.length || !data?.dsos?.length) return null
    return data
  } catch { return null }
}

function buildCompleteCatalog(data: Partial<CatalogData>, fallback: CatalogData): CatalogData {
  return {
    stars:             data.stars?.length             ? data.stars             : fallback.stars,
    dsos:              data.dsos?.length              ? data.dsos              : fallback.dsos,
    meteorShowers:     data.meteorShowers?.length     ? data.meteorShowers     : fallback.meteorShowers,
    challenges:        data.challenges?.length        ? data.challenges        : fallback.challenges,
    solarSystemBodies: data.solarSystemBodies?.length ? data.solarSystemBodies : fallback.solarSystemBodies,
  }
}

interface CatalogState {
  stars:         Star[]
  dsos:          DSO[]
  meteorShowers: MeteorShower[]
  challenges:    Challenge[]
  solarSystemBodies: SolarSystemBody[]
  /** true cuando los datos ya vinieron de Supabase */
  supabaseLoaded: boolean
  /** Reemplaza el catálogo con datos de Supabase */
  loadFromSupabase: () => Promise<void>
}

// Estado inicial idéntico en servidor y cliente → sin hydration mismatch.
// La caché de localStorage se aplica en loadFromSupabase (llamado desde useEffect).
export const useCatalog = create<CatalogState>()((set) => ({
  stars:             LOCAL_STARS,
  dsos:              LOCAL_DSOS,
  meteorShowers:     LOCAL_SHOWERS,
  challenges:        LOCAL_CHALLENGES,
  solarSystemBodies: LOCAL_SOLAR_SYSTEM_BODIES,
  supabaseLoaded:    false,

  loadFromSupabase: async () => {
    // ── 1. Intentar caché local primero (respuesta inmediata) ────────────────
    const cached = loadCache()
    if (cached) {
      set({ ...cached })
    }

    if (catalogRefreshPromise) return catalogRefreshPromise

    const fallback = cached ?? {
      stars:             LOCAL_STARS,
      dsos:              LOCAL_DSOS,
      meteorShowers:     LOCAL_SHOWERS,
      challenges:        LOCAL_CHALLENGES,
      solarSystemBodies: LOCAL_SOLAR_SYSTEM_BODIES,
    }

    catalogRefreshPromise = (async () => {
      try {
      // Import dinámico para no incluir el cliente en el bundle del servidor
      const { supabase } = await import('@/lib/supabase')
      if (!supabase) return

      // ── 2. Solo las columnas que el mapa necesita para renderizar ──────────
      //    Las columnas pesadas (desc_long, mythology, etc.) se cargan
      //    bajo demanda en el panel de detalle vía la API.
      const [starsRes, dsosRes, showersRes, challengesRes, planetsRes, moonsRes] = await Promise.all([
        supabase.from('stars_cos').select('name,constellation_id,ra,dec,mag_visual,color_hex,base_size,desc_short').order('mag_visual'),
        supabase.from('deep_sky_objects_cos').select('id,name,ra,dec,type,mag_visual,color_hex,size_arcmin_major,desc_short').order('mag_visual'),
        supabase.from('meteor_showers_cos').select('id,name_es,name_en,short_name,radiant_ra,radiant_dec,constellation_id,date_start,date_end,peak_date,zhr_max,speed_kms,parent_body,desc_short,color_hex').order('zhr_max', { ascending: false }),
        supabase.from('challenges_cos').select('target_id,hint_es,fun_fact_es,award_name_es,sort_order').order('sort_order'),
        supabase.from('planets_cos').select('id,name_es,symbol,color_hex,desc_short,desc_long,mythology,order_from_sun,planet_type,moons_count,has_rings,has_atmosphere,atmosphere_main,radius_km,radius_earth,mass_earth,gravity_ms2,density_gcc,semi_major_axis_au,orbital_period_days,rotation_period_h,axial_tilt_deg,eccentricity,inclination_deg,surface_temp_min_k,surface_temp_max_k,surface_temp_avg_k,image_url,thumb_url,fun_fact,observation_tips').order('order_from_sun'),
        supabase.from('moons_cos').select('id,name,planet_id,desc_short,desc_long,radius_km,orbital_period_days,semi_major_axis_km,mag_visual,image_url,observation_tips,discovery_year,discoverer,fun_fact').order('name'),
      ])

      const errors = [starsRes, dsosRes, showersRes, challengesRes, planetsRes, moonsRes]
        .map(res => res.error)
        .filter(Boolean)

      if (errors.length) {
        console.warn('[CatalogStore] Algunas tablas de Supabase no respondieron:', errors)
      }

      const stars         = starsRes.data?.map(mapStar)
      const dsos          = dsosRes.data?.map(mapDSO)
      const meteorShowers = showersRes.data?.map(mapShower)
      const challenges    = challengesRes.data?.map(mapChallenge)
      const solarSystemBodies = [
        ...(planetsRes.data?.map(mapPlanetCatalog) ?? []),
        ...(moonsRes.data?.map(mapMoonCatalog) ?? []),
      ]

      const next = buildCompleteCatalog({
        ...(stars?.length         && { stars }),
        ...(dsos?.length          && { dsos }),
        ...(meteorShowers?.length && { meteorShowers }),
        ...(challenges?.length    && { challenges }),
        ...(solarSystemBodies.length && { solarSystemBodies }),
      }, fallback)

      // ── 3. Guardar en caché solo si tenemos datos reales ───────────────────
      saveCache(next)

      set({ ...next, supabaseLoaded: true })
      } catch (err) {
      // Supabase no disponible → se usan los datos locales sin interrupción
      console.warn('[CatalogStore] Usando datos locales (Supabase no disponible):', err)
      } finally {
        catalogRefreshPromise = null
      }
    })()

    return catalogRefreshPromise
  },
}))
