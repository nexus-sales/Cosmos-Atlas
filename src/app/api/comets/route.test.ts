import { afterEach, describe, expect, it, vi } from 'vitest';

describe('GET /api/comets', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('degrades cleanly when JPL exceeds the timeout', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        const { GET } = await import('./route');
        const responsePromise = GET();
        await vi.advanceTimersByTimeAsync(10_000);

        const response = await responsePromise;
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            ok: true,
            comets: [],
            stale: false,
            degraded: true,
        });

        // The short failure backoff prevents every request from waiting again.
        const retryResponse = await GET();
        expect(retryResponse.status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
