import { afterEach, describe, expect, it } from 'vitest';
import { checkRateLimit, getClientKey, isAllowedOrigin } from './rateLimit';

describe('shared API rate limiting', () => {
    const originalVercel = process.env.VERCEL;

    afterEach(() => {
        if (originalVercel === undefined) delete process.env.VERCEL;
        else process.env.VERCEL = originalVercel;
    });

    it('uses the Vercel-generated forwarding header on Vercel', () => {
        process.env.VERCEL = '1';
        const request = new Request('https://example.test/api', {
            headers: {
                'x-vercel-forwarded-for': '203.0.113.7',
                'x-forwarded-for': '198.51.100.9',
            },
        });
        expect(getClientKey(request)).toBe('203.0.113.7');
    });

    it('rejects a browser origin different from the API origin', () => {
        expect(isAllowedOrigin(new Request('https://atlas.test/api', {
            headers: { origin: 'https://attacker.test' },
        }))).toBe(false);
    });

    it('blocks after the configured number of uncached requests', async () => {
        const request = new Request('https://atlas.test/api', { headers: { 'x-real-ip': '192.0.2.44' } });
        const options = { namespace: `test-${crypto.randomUUID()}`, max: 2, windowMs: 60_000 };
        expect((await checkRateLimit(request, options)).ok).toBe(true);
        expect((await checkRateLimit(request, options)).ok).toBe(true);
        expect((await checkRateLimit(request, options)).ok).toBe(false);
    });
});
