'use client'

/**
 * CatalogLoader
 * Componente invisible que carga los datos del catálogo desde Supabase
 * al montar la app. No bloquea el renderizado — los datos locales se usan
 * como fallback mientras llega la respuesta.
 */

import { useEffect } from 'react'
import { useCatalog } from '@/stores/useCatalogStore'

export default function CatalogLoader() {
  const loadFromSupabase = useCatalog(s => s.loadFromSupabase)

  useEffect(() => {
    loadFromSupabase()
  }, [loadFromSupabase])

  return null
}
