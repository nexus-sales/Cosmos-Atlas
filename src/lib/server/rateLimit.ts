export interface RateLimitOptions {
    namespace: string;
    max: number;
    windowMs: number;
}

interface RateLimitResult {
    ok: boolean;
    remaining: number;
    resetAt: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientKey(request: Request) {
    // Vercel genera esta cabecera y evita depender del primer valor de
    // x-forwarded-for, que un cliente puede intentar falsificar.
    const vercelIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
    if (process.env.VERCEL && vercelIp) return vercelIp;

    const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
    if (process.env.CF_PAGES && cloudflareIp) return cloudflareIp;

    // En un proxy convencional el salto mas cercano queda al final. La
    // seguridad definitiva depende de que el proxy elimine cabeceras entrantes.
    const forwarded = request.headers.get('x-forwarded-for')
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .at(-1);
    return request.headers.get('x-real-ip')?.trim() || forwarded || 'local';
}

export function isAllowedOrigin(request: Request) {
    const origin = request.headers.get('origin');
    if (!origin) return true;
    try {
        return new URL(origin).origin === new URL(request.url).origin;
    } catch {
        return false;
    }
}

function checkMemoryLimit(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const bucketKey = `${options.namespace}:${key}`;
    const current = buckets.get(bucketKey);
    if (!current || current.resetAt <= now) {
        const resetAt = now + options.windowMs;
        buckets.set(bucketKey, { count: 1, resetAt });
        return { ok: true, remaining: options.max - 1, resetAt };
    }
    if (current.count >= options.max) return { ok: false, remaining: 0, resetAt: current.resetAt };
    current.count += 1;
    return { ok: true, remaining: options.max - current.count, resetAt: current.resetAt };
}

async function checkUpstashLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult | null> {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    const bucket = Math.floor(Date.now() / options.windowMs);
    const redisKey = `cosmos:${options.namespace}:rl:${bucket}:${key}`;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    try {
        const response = await fetch(url, {
            method: 'POST', headers, body: JSON.stringify(['INCR', redisKey]), cache: 'no-store',
        });
        if (!response.ok) return null;
        const payload = await response.json() as { result?: number };
        const count = Number(payload.result ?? 0);
        if (count === 1) {
            await fetch(url, {
                method: 'POST', headers, body: JSON.stringify(['PEXPIRE', redisKey, options.windowMs]), cache: 'no-store',
            }).catch(() => undefined);
        }
        return {
            ok: count <= options.max,
            remaining: Math.max(0, options.max - count),
            resetAt: (bucket + 1) * options.windowMs,
        };
    } catch {
        return null;
    }
}

export async function checkRateLimit(request: Request, options: RateLimitOptions) {
    const key = getClientKey(request);
    return await checkUpstashLimit(key, options) ?? checkMemoryLimit(key, options);
}

export function rateLimitResponse(result: RateLimitResult) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return Response.json(
        { error: 'rate limit exceeded', retryAfter },
        { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) } },
    );
}
