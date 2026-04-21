import { NextResponse } from 'next/server';

interface AstronomerContext {
    objectName?: string;
    objectType?: string;
    visibility?: string;
    magnitude?: string;
    coordinates?: string;
    bortleScale?: number;
    observer?: { lat: number; lon: number };
    time?: string;
    summary?: string;
    observingAdvice?: string;
    visibilityWindow?: string;
}

interface AstronomerRequest {
    question?: string;
    context?: AstronomerContext;
    mode?: 'openai' | 'local';
}

const MAX_QUESTION_LENGTH = 600;
const MAX_CONTEXT_FIELD_LENGTH = 900;
const MAX_REQUEST_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 40;
const FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-4.1-mini'];
const JSON_HEADERS = { 'Cache-Control': 'no-store' };

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
    const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const realIp = req.headers.get('x-real-ip')?.trim();
    return forwarded || realIp || 'local';
}

function checkRateLimit(key: string) {
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

function truncateText(value: unknown, max = MAX_CONTEXT_FIELD_LENGTH) {
    if (typeof value !== 'string') return undefined;
    const clean = value.replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function sanitizeContext(context: AstronomerContext): AstronomerContext {
    const lat = typeof context.observer?.lat === 'number' ? context.observer.lat : undefined;
    const lon = typeof context.observer?.lon === 'number' ? context.observer.lon : undefined;
    const observer = lat != null && lon != null
        ? {
            lat: Math.max(-90, Math.min(90, lat)),
            lon: Math.max(-180, Math.min(180, lon)),
        }
        : undefined;

    return {
        objectName: truncateText(context.objectName, 120),
        objectType: truncateText(context.objectType, 80),
        visibility: truncateText(context.visibility, 180),
        magnitude: truncateText(context.magnitude, 120),
        coordinates: truncateText(context.coordinates, 160),
        bortleScale: typeof context.bortleScale === 'number'
            ? Math.max(1, Math.min(9, Math.round(context.bortleScale)))
            : undefined,
        observer,
        time: truncateText(context.time, 80),
        summary: truncateText(context.summary),
        observingAdvice: truncateText(context.observingAdvice, 500),
        visibilityWindow: truncateText(context.visibilityWindow, 220),
    };
}

function localAstronomerAnswer(question: string, context: AstronomerContext) {
    const name = context.objectName || 'este objeto';
    const type = context.objectType || 'objeto celeste';
    const visibility = context.visibility || 'visibilidad no calculada';
    const window = context.visibilityWindow ? ` Ventana: ${context.visibilityWindow}.` : '';
    const magnitude = context.magnitude || 'magnitud no disponible';
    const advice = context.observingAdvice || 'Observa con paciencia, adapta aumentos a la estabilidad atmosferica y evita luces directas.';
    const q = question.toLowerCase();

    if (q.includes('observar') || q.includes('ver') || q.includes('telescopio') || q.includes('prismatic')) {
        return `Para observar ${name}, trataria el objetivo como ${type}. Estado actual: ${visibility}.${window} Brillo: ${magnitude}. ${advice}\n\nComo regla practica: si esta bajo o cerca del horizonte, espera a que suba; si es un objeto difuso, prioriza cielo oscuro y vision lateral; si es planetario, prioriza estabilidad atmosferica antes que aumentos extremos.`;
    }

    if (q.includes('magnitud') || q.includes('brillo')) {
        return `La magnitud de ${name} es una escala inversa: cuanto menor es el numero, mas brillante parece. En este caso: ${magnitude}.\n\nLa magnitud no lo cuenta todo: en galaxias y nebulosas importa mucho el brillo superficial. Un objeto puede tener magnitud razonable y aun asi ser dificil si su luz esta repartida en un area grande.`;
    }

    if (q.includes('import') || q.includes('especial') || q.includes('interes')) {
        return `${name} merece atencion porque no es solo un punto en el mapa: es una pista fisica. Contexto disponible: ${context.summary || 'el atlas lo tiene localizado con posicion ecuatorial y datos de observacion.'}\n\nUsalo como objetivo de estudio: compara su posicion, brillo, tipo y visibilidad con otros objetos cercanos. Esa comparacion suele ensenar mas que mirarlo de forma aislada.`;
    }

    if (q.includes('cuando') || q.includes('mejor hora') || q.includes('horizonte')) {
        return `Para decidir cuando observar ${name}, mira sobre todo su altura. Ahora: ${visibility}.${window} Un objetivo mejora mucho cuando supera 30 grados de altitud, porque atraviesa menos atmosfera.\n\nSi esta bajo, conviene avanzar la hora o buscar su transito. Para cielo profundo, ademas evita Luna brillante y busca el menor Bortle posible.`;
    }

    return `${name}: ${context.summary || 'objeto localizado en el atlas.'}\n\nEstado actual: ${visibility}.${window} Brillo: ${magnitude}. ${advice}\n\nSi quieres afinar la observacion, pregunta por tecnica, magnitud, mejor momento, equipo recomendado o interpretacion fisica del objeto.`;
}

function extractOutputText(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const root = data as { output_text?: unknown; output?: unknown };
    if (typeof root.output_text === 'string') return root.output_text;
    if (!Array.isArray(root.output)) return '';

    for (const item of root.output) {
        if (!item || typeof item !== 'object') continue;
        const content = (item as { content?: unknown }).content;
        if (!Array.isArray(content)) continue;
        for (const part of content) {
            if (!part || typeof part !== 'object') continue;
            const text = (part as { text?: unknown }).text;
            if (typeof text === 'string') return text;
        }
    }
    return '';
}

async function createOpenAIResponse({
    apiKey,
    model,
    question,
    context,
    signal,
}: {
    apiKey: string;
    model: string;
    question: string;
    context: AstronomerContext;
    signal: AbortSignal;
}) {
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
            body: JSON.stringify({
                model,
                max_output_tokens: 450,
                store: false,
            instructions: [
                'Eres un astronomo observacional dentro de Cosmos Atlas.',
                'Responde en espanol, con tono profesional y claro, sin sonar infantil.',
                'Usa solamente el contexto proporcionado para datos numericos actuales; si falta un dato, dilo.',
                'Da recomendaciones practicas de observacion cuando proceda.',
                'Si se menciona observar el Sol, advierte de no mirarlo sin filtro solar certificado.',
                'Evita relleno poetico: prioriza precision, utilidad y criterio astronomico.',
            ].join('\n'),
            input: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: JSON.stringify({ question, context }, null, 2),
                        },
                    ],
                },
            ],
        }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        const message = data && typeof data === 'object'
            ? ((data as { error?: { message?: string } }).error?.message ?? `OpenAI HTTP ${response.status}`)
            : `OpenAI HTTP ${response.status}`;
        return { ok: false as const, status: response.status, message };
    }

    return { ok: true as const, answer: extractOutputText(data).trim(), model };
}

export async function POST(req: Request) {
    const contentLength = Number(req.headers.get('content-length') ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
        return NextResponse.json({ error: 'request too large' }, { status: 413, headers: JSON_HEADERS });
    }

    const limit = checkRateLimit(getClientKey(req));
    if (!limit.ok) {
        const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
        return NextResponse.json(
            { error: 'too many astronomy questions', retryAfter },
            {
                status: 429,
                headers: { ...JSON_HEADERS, 'Retry-After': String(retryAfter) },
            }
        );
    }

    let body: AstronomerRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid json' }, { status: 400, headers: JSON_HEADERS });
    }

    const question = body.question?.trim();
    if (!question || question.length < 2) {
        return NextResponse.json({ error: 'question too short' }, { status: 400, headers: JSON_HEADERS });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
        return NextResponse.json({ error: 'question too long' }, { status: 413, headers: JSON_HEADERS });
    }

    const context = sanitizeContext(body.context ?? {});
    const mode = body.mode === 'local' ? 'local' : 'openai';
    const apiKey = process.env.OPENAI_API_KEY;
    const configuredModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const models = [configuredModel, ...FALLBACK_MODELS].filter((item, index, arr) => item && arr.indexOf(item) === index);

    if (mode === 'local' || !apiKey) {
        return NextResponse.json({
            answer: localAstronomerAnswer(question, context),
            source: 'local',
            mode,
        }, { headers: JSON_HEADERS });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
        let lastWarning = '';

        for (const model of models) {
            const result = await createOpenAIResponse({
                apiKey,
                model,
                question,
                context,
                signal: controller.signal,
            });
            if (result.ok && result.answer) {
                clearTimeout(timer);
                return NextResponse.json({
                    answer: result.answer,
                    source: 'openai',
                    model: result.model,
                    mode,
                }, { headers: JSON_HEADERS });
            }

            if (!result.ok) {
                lastWarning = `${model}: ${result.status} ${result.message}`;
                if (result.status >= 400 && result.status < 500) break;
            }
        }

        clearTimeout(timer);
        return NextResponse.json({
            answer: localAstronomerAnswer(question, context),
            source: 'local',
            warning: lastWarning || 'openai empty response',
        }, { headers: JSON_HEADERS });
    } catch (error) {
        clearTimeout(timer);
        const warning = error instanceof Error ? error.message : 'unknown error';
        return NextResponse.json({
            answer: localAstronomerAnswer(question, context),
            source: 'local',
            warning,
        }, { headers: JSON_HEADERS });
    }
}
