import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    resolve: { alias: { '@': resolve(__dirname, 'src') } },
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/lib/**', 'src/data/**'],
            exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        },
    },
});
