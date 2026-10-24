import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

describe('GET /api/horizon-profile', () => {
    afterEach(() => vi.restoreAllMocks());

    it('rejects missing coordinates without contacting Open-Meteo', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const response = await GET(new NextRequest('http://localhost/api/horizon-profile'));
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: 'Coordenadas WGS84 no válidas.' });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects blank coordinates without contacting Open-Meteo', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const response = await GET(new NextRequest('http://localhost/api/horizon-profile?lat=&lon='));
        expect(response.status).toBe(400);
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
