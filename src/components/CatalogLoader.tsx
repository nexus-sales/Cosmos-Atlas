'use client'

/**
 * CatalogLoader
 * Componente invisible que carga los datos del catálogo desde Supabase
 * al montar la app. No bloquea el renderizado — los datos locales se usan
 * como fallback mientras llega la respuesta.
 */

import { useEffect } from 'react'
import { useCatalog } from '@/stores/useCatalogStore'
import { useBootStore } from '@/stores/useBootStore'

export default function CatalogLoader() {
  const loadFromSupabase = useCatalog(s => s.loadFromSupabase)

  const markDone = useBootStore(s => s.markDone)

  useEffect(() => {
    // El mapa ya funciona con el catálogo local o en caché: no se espera a
    // Supabase más de lo razonable para dar el paso por hecho en la portada.
    const fallback = setTimeout(() => markDone('catalog'), 2500)
    void Promise.resolve(loadFromSupabase()).finally(() => {
      clearTimeout(fallback)
      markDone('catalog')
    })
    return () => clearTimeout(fallback)
  }, [loadFromSupabase, markDone])

  return null
}
