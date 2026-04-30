let sessionSeed: number | null = null;

export function getSessionSeed() {
    if (sessionSeed !== null) return sessionSeed;

    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        sessionSeed = values[0] || 0x6d2b79f5;
        return sessionSeed;
    }

    sessionSeed = (Date.now() ^ 0x6d2b79f5) >>> 0;
    return sessionSeed;
}
