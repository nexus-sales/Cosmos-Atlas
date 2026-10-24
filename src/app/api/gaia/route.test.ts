import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/gaia', () => {
    afterEach(() => vi.restoreAllMocks());

    it('rejects missing coordinates without contacting ESA', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const response = await GET(new NextRequest('http://localhost/api/gaia'));
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: 'Coordenadas ICRS no válidas.' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects blank coordinates without contacting ESA', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const response = await GET(new NextRequest('http://localhost/api/gaia?ra=&dec='));
        expect(response.status).toBe(400);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
