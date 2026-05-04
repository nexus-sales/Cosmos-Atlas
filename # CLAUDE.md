# CLAUDE.md — Cosmos Atlas · Instrucciones del Agente Maestro

> Este archivo es el "Contrato de Ejecución" definitivo. Combina el rigor estructural de Claude, la seguridad técnica de GPT y la excelencia estética de Antigravity.
> Léelo completo antes de cada sesión. Sigue las fases en orden estricto.

---

## 0. Visión del Proyecto
**Objetivo:** Crear la app de astronomía más bella y funcional del mercado (Mobile First).
**Stack:** Next.js 16 (App Router) · React 19 · TS · Supabase · Three.js · Tailwind 4 · Vitest.
**Diseño:** Estética "Cyber-Observatory" (Dark mode, Glassmorphism, Micro-animaciones).

---

## 1. Reglas de Oro (Innegociables)

1. **Build & Test:** Ejecutar `npm run build` y `npm run test` tras cada bloque de trabajo. No se entrega nada roto.
2. **Estética Premium:** Si una UI es simple o genérica, es un error. Usa gradientes sutiles, fuentes modernas y espaciados elegantes. No uses placeholders; genera imágenes reales con herramientas.
3. **TypeScript Total:** Prohibido el uso de `any`. Tipado estricto para Supabase y estados de Three.js.
4. **Política de Evidencia:** Nunca inventes rutas ni APIs. Localiza primero con `rg` o `Select-String`.
5. **Mobile First:** Todo componente debe ser perfecto en 375px antes de escalar a desktop.
6. **IA Activa:** El copiloto IA no solo responde, sino que ofrece acciones ejecutables en la app.

---

## FASE 1 — Saneamiento y Cimientos (Prioridad 1)

### 1.1 Corrección de Encoding (Mojibake)
- **Problema:** Secuencias como `Ã`, `Â`, `â€`, `ðŸ` en archivos clave.
- **Acción:** Reemplazar por UTF-8 correcto. Centralizar nombres de planetas en `src/lib/constants/planets.ts`.
- **Garantía:** Crear test en Vitest para detectar caracteres corruptos en el futuro.

### 1.2 Seguridad Dinámica (CSP)
- **Acción:** Crear `middleware.ts` con sistema de **nonces** dinámicos.
- **Limpieza:** Eliminar `unsafe-inline` de `next.config.ts`. Instalar `zod` para validaciones.

### 1.3 Endurecimiento de API
- **Acción:** Validar `Origin/Referer` y aplicar schemas de Zod en `/api/astronomer`.
- **Proxy:** Verificar confianza de IPs en producción.

---

## FASE 2 — Épicas de Producto (Funcionalidad Core)

### 2.1 Épica: "Visible Tonight"
- Cálculo de **Índice de Observabilidad** (Altitud + Magnitud + Luna + Clima).
- UI de lista con mini-gráficos de trayectoria (Recharts/SVG).

### 2.2 Épica: Ficha Técnica Galáctica
- Drawer móvil con datos astronómicos completos, fotos de NASA/ESA y descripción IA.
- Gráfico de altitud interactivo (altitude vs time).

### 2.3 Épica: Logbook & Eventos
- Sistema de observación personal con Supabase (RLS).
- Alertas de ISS, conjunciones y meteoros.

---

## FASE 3 — Excelencia Estética & UX

### 3.1 Interfaz "Cyber-Observatory"
- Aplicar sistema de diseño basado en transparencia, desenfoque (backdrop-blur) y acentos vibrantes.
- Micro-animaciones en botones y transiciones de estado (Framer Motion).

### 3.2 Feedback Sensorial
- Respuestas visuales (partículas) al interactuar con el mapa.
- Sonidos ambientales opcionales para inmersión.

---

## FASE 4 — IA Agente Avanzada

### 4.1 Chat con Intenciones (Actions)
- El chat debe poder navegar por la app, buscar objetos y activar el modo AR mediante comandos JSON en la respuesta.

### 4.2 Diagnóstico Proactivo
- La IA analiza por qué el usuario no ve un objeto (clima, ubicación, horizonte) y ofrece soluciones reales.

---

## 5. Definición de Hecho (DoD)
- [ ] Build, Test y Lint pasan al 100%.
- [ ] UI impecable en móvil (375px).
- [ ] No hay secretos ni caracteres corruptos.
- [ ] Documentación mínima en el código sobre lógica astronómica.
