import { NextResponse } from 'next/server';
import { z } from 'zod';

// --- Zod Schemas -------------------------------------------------------------

const observerSchema = z.object({
  // Redondeamos a 1 decimal para proteger la PII (precisión ~11km)
  lat: z.number().min(-90).max(90).transform(v => Math.round(v * 10) / 10),
  lon: z.number().min(-180).max(180).transform(v => Math.round(v * 10) / 10),
}).optional();

const astronomerContextSchema = z.object({
  objectId: z.string().max(120).optional(),
  objectKind: z.string().max(40).optional(),
  objectName: z.string().max(120).optional(),
  objectType: z.string().max(80).optional(),
  visibility: z.string().max(180).optional(),
  magnitude: z.string().max(120).optional(),
  coordinates: z.string().max(160).optional(),
  bortleScale: z.number().int().min(1).max(9).optional(),
  observer: observerSchema,
  time: z.string().max(80).optional(),
  summary: z.string().max(900).optional(),
  observingAdvice: z.string().max(500).optional(),
  visibilityWindow: z.string().max(220).optional(),
  description: z.string().max(900).optional(),
  longDescription: z.string().max(1400).optional(),
  mythology: z.string().max(900).optional(),
  observationTips: z.string().max(900).optional(),
  funFact: z.string().max(500).optional(),
  catalogSource: z.string().max(40).optional(),
  kidsMode: z.boolean().default(false),
});

const astronomerRequestSchema = z.object({
  question: z.string().min(2).max(600),
  context: astronomerContextSchema.optional(),
  mode: z.enum(['openai', 'local']).default('openai'),
});

type AstronomerContext = z.infer<typeof astronomerContextSchema>;

// --- Constants & Config ------------------------------------------------------

const MAX_REQUEST_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 40;
const FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini'];
const JSON_HEADERS = { 'Cache-Control': 'no-store' };

const DETAIL_FIELD_ALLOWLIST = new Set([
  'id', 'name', 'name_es', 'name_en', 'type', 'constellation_id', 'catalogue_ids',
  'desc_short', 'desc_long', 'mythology', 'fun_fact', 'observation_tips',
  'discovery_year', 'discoverer', 'parent_body', 'planet_type', 'moons_count',
  'has_rings', 'has_atmosphere', 'atmosphere_main', 'radius_km', 'mass_earth',
  'semi_major_axis_au', 'orbital_period_days', 'rotation_period_h', 'axial_tilt_deg',
  'mag_visual', 'size_arcmin_major', 'zhr_max', 'speed_kms',
]);

// --- Rate Limiting -----------------------------------------------------------

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  return forwarded || realIp || 'local';
}

function checkMemoryRateLimit(key: string) {
  const now = Date.now();
  for (const [entryKey, entry] of rateLimit) {
    if (entry.resetAt <= now) rateLimit.delete(entryKey);
  }

  const current = rateLimit.get(key);
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true as const, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return { ok: false as const, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  return { ok: true as const, remaining: RATE_LIMIT_MAX - current.count, resetAt: current.resetAt };
}

async function checkUpstashRateLimit(key: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const bucket = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
  const redisKey = `cosmos:astronomer:rl:${bucket}:${key}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    const incr = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(['INCR', redisKey]),
      cache: 'no-store',
    });
    if (!incr.ok) return null;

    const payload = await incr.json() as { result?: number };
    const count = Number(payload.result ?? 0);

    if (count === 1) {
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(['PEXPIRE', redisKey, RATE_LIMIT_WINDOW_MS]),
        cache: 'no-store',
      }).catch(() => undefined);
    }

    return {
      ok: count <= RATE_LIMIT_MAX,
      remaining: Math.max(0, RATE_LIMIT_MAX - count),
      resetAt: (bucket + 1) * RATE_LIMIT_WINDOW_MS,
    } as const;
  } catch {
    return null;
  }
}

async function checkRateLimit(key: string) {
  const distributed = await checkUpstashRateLimit(key);
  if (distributed) return distributed;
  return checkMemoryRateLimit(key);
}

// --- Data Fetching & Enrichment ----------------------------------------------

function compactDetails(row: Record<string, unknown> | null | undefined) {
  if (!row) return undefined;
  const details: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!DETAIL_FIELD_ALLOWLIST.has(key)) continue;
    if (value == null) continue;
    details[key] = typeof value === 'string' ? value.slice(0, 900) : value;
  }
  return Object.keys(details).length ? details : undefined;
}

async function fetchSupabaseDetails(context: AstronomerContext) {
  try {
    const { supabase } = await import('@/lib/supabase');
    if (!supabase) return undefined;

    const kind = context.objectKind;
    const objectId = context.objectId || context.objectName;
    const objectName = context.objectName;
    if (!objectId && !objectName) return undefined;

    if (kind === 'dso') {
      const { data } = await supabase.from('deep_sky_objects_cos').select('*').eq('id', objectId).maybeSingle();
      return compactDetails(data);
    }
    if (kind === 'star') {
      const { data } = await supabase.from('stars_cos').select('*').eq('name', objectName || objectId).maybeSingle();
      return compactDetails(data);
    }
    if (kind === 'planet') {
      const { data: p } = await supabase.from('planets_cos').select('*').or(`id.eq.${objectId},name_es.eq.${objectName}`).maybeSingle();
      if (p) return compactDetails(p);
      const { data: m } = await supabase.from('moons_cos').select('*').or(`id.eq.${objectId},name.eq.${objectName}`).maybeSingle();
      return compactDetails(m);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// --- AI Response Handling ----------------------------------------------------

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  if (typeof d.output_text === 'string') return d.output_text;
  if (Array.isArray(d.output)) {
    for (const item of d.output) {
      if (item && typeof item === 'object') {
        const { content } = item as Record<string, unknown>;
        if (Array.isArray(content)) {
          for (const part of content) {
            if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string') {
              return (part as Record<string, unknown>).text as string;
            }
          }
        }
      }
    }
  }
  return '';
}

function localAstronomerAnswer(question: string, context: AstronomerContext) {
  const name = context.objectName || 'este objeto';
  const visibility = context.visibility || 'visibilidad no calculada';
  const q = question.toLowerCase();
  const kidsTone = context.kidsMode ? '\n\n¡Explora con curiosidad, joven astronauta!' : '';

  if (q.includes('ver') || q.includes('observar')) {
    return `Para observar ${name}, prioriza una buena altura sobre el horizonte. Actualmente: ${visibility}.${kidsTone}`;
  }
  return `${name} es un objetivo fascinante. Estado: ${visibility}.${kidsTone}`;
}

async function createOpenAIResponse({
  apiKey, model, question, context, supabaseDetails, signal
}: {
  apiKey: string, model: string, question: string, context: AstronomerContext, supabaseDetails?: Record<string, unknown>, signal: AbortSignal
}) {
  const kidsMode = context.kidsMode;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      instructions: `Eres el Asistente de IA de Cosmos Atlas, un astrónomo experto con acceso a telemetría en tiempo real. 
      ${kidsMode 
        ? 'MODO NIÑOS ACTIVO: Usa analogías espaciales divertidas, evita tecnicismos áridos, sé inspirador y anima a la exploración.' 
        : 'MODO ESTÁNDAR: Sé profesional, preciso y apasionado. Usa datos de magnitud, visibilidad (Alt/Az) y escala de Bortle si están disponibles.'}
      
      REGLAS:
      1. Responde siempre en español de forma concisa (máx 2-3 párrafos).
      2. No inventes datos si no están en el contexto; si no sabes algo, admítelo con elegancia astronómica.
      3. Si el objeto no es visible (altura negativa), menciona que está bajo el horizonte.
      4. Fomenta el uso de las herramientas del atlas (zoom, capas, modo telescopio).
      5. Mantén un tono de "Cyber-Observatorio" futurista.`,
      input: [{ role: 'user', content: [{ type: 'input_text', text: `Pregunta: ${question}\nContexto: ${JSON.stringify({ ...context, supabaseDetails })}` }] }],
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) return { ok: false as const, status: response.status, message: data?.error?.message || 'AI Error' };
  return { ok: true as const, answer: extractOutputText(data).trim(), model };
}

// --- Main Handler ------------------------------------------------------------

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) return NextResponse.json({ error: 'request too large' }, { status: 413, headers: JSON_HEADERS });

  const limit = await checkRateLimit(getClientKey(req));
  if (!limit.ok) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return NextResponse.json({ error: 'rate limit exceeded', retryAfter }, { status: 429, headers: { ...JSON_HEADERS, 'Retry-After': String(retryAfter) } });
  }

  try {
    const rawBody = await req.json();
    const body = astronomerRequestSchema.safeParse(rawBody);

    if (!body.success) {
      return NextResponse.json({ error: 'invalid request format', details: body.error.format() }, { status: 400, headers: JSON_HEADERS });
    }

    const { question, context = {} as AstronomerContext, mode } = body.data;
    const apiKey = process.env.OPENAI_API_KEY;

    const supabaseDetails = await fetchSupabaseDetails(context);
    const enrichedContext = { ...context, ...supabaseDetails };

    if (mode === 'local' || !apiKey) {
      return NextResponse.json({ answer: localAstronomerAnswer(question, enrichedContext), source: 'local' }, { headers: JSON_HEADERS });
    }

    const configuredModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const models = [configuredModel, ...FALLBACK_MODELS].filter((m, i, a) => m && a.indexOf(m) === i);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      for (const model of models) {
        const result = await createOpenAIResponse({ apiKey, model, question, context: enrichedContext, supabaseDetails, signal: controller.signal });
        if (result.ok && result.answer) {
          clearTimeout(timer);
          return NextResponse.json({ answer: result.answer, source: 'openai', model: result.model }, { headers: JSON_HEADERS });
        }
      }
      return NextResponse.json({ answer: localAstronomerAnswer(question, enrichedContext), source: 'local', warning: 'AI fallback' }, { headers: JSON_HEADERS });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return NextResponse.json({ error: 'internal server error' }, { status: 500, headers: JSON_HEADERS });
  }
}
