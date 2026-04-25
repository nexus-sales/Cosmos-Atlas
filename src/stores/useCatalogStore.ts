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

// ─── Datos locales como fallback ─────────────────────────────────────────────
// Se importan de forma diferida para no bloquear el store si cambian.
import { STARS as LOCAL_STARS } from '@/data/stars'
import { DSOS as LOCAL_DSOS } from '@/data/dsos'
import { METEOR_SHOWERS as LOCAL_SHOWERS } from '@/data/meteorShowers'
import { CHALLENGES as LOCAL_CHALLENGES } from '@/data/challenges'

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

// ─── Store ────────────────────────────────────────────────────────────────────

interface CatalogState {
  stars:         Star[]
  dsos:          DSO[]
  meteorShowers: MeteorShower[]
  challenges:    Challenge[]
  /** true cuando los datos ya vinieron de Supabase */
  supabaseLoaded: boolean
  /** Reemplaza el catálogo con datos de Supabase */
  loadFromSupabase: () => Promise<void>
}

export const useCatalog = create<CatalogState>()((set) => ({
  stars:          LOCAL_STARS,
  dsos:           LOCAL_DSOS,
  meteorShowers:  LOCAL_SHOWERS,
  challenges:     LOCAL_CHALLENGES,
  supabaseLoaded: false,

  loadFromSupabase: async () => {
    try {
      // Import dinámico para no incluir el cliente en el bundle del servidor
      const { supabase } = await import('@/lib/supabase')

      const [starsRes, dsosRes, showersRes, challengesRes] = await Promise.all([
        supabase.from('stars_cos').select('*').order('mag_visual'),
        supabase.from('deep_sky_objects_cos').select('*').order('mag_visual'),
        supabase.from('meteor_showers_cos').select('*').order('zhr_max', { ascending: false }),
        supabase.from('challenges_cos').select('*').order('sort_order'),
      ])

      const stars         = starsRes.data?.map(mapStar)
      const dsos          = dsosRes.data?.map(mapDSO)
      const meteorShowers = showersRes.data?.map(mapShower)
      const challenges    = challengesRes.data?.map(mapChallenge)

      set({
        ...(stars?.length         && { stars }),
        ...(dsos?.length          && { dsos }),
        ...(meteorShowers?.length && { meteorShowers }),
        ...(challenges?.length    && { challenges }),
        supabaseLoaded: true,
      })
    } catch (err) {
      // Supabase no disponible → se usan los datos locales sin interrupción
      console.warn('[CatalogStore] Usando datos locales (Supabase no disponible):', err)
    }
  },
}))
