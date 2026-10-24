import { describe, expect, it } from 'vitest';
import { buildNightPlan } from '../tonightPlanner';

const targets = [
    { id: 'sirius', name: 'Sirius', ra: 101.287, dec: -16.716, mag: -1.46, kind: 'star' as const },
    { id: 'm31', name: 'M31', ra: 10.685, dec: 41.269, mag: 3.4, kind: 'dso' as const },
];

describe('buildNightPlan', () => {
    it('builds a deterministic, sorted and explained plan', () => {
        const plan = buildNightPlan(new Date('2026-01-15T12:00:00Z'), { lat: 28.3, lon: -16.3 }, 4, targets);
        expect(plan.targets).toHaveLength(2);
        expect(plan.targets[0].score).toBeGreaterThanOrEqual(plan.targets[1].score);
        for (const target of plan.targets) {
            expect(target.score).toBeGreaterThanOrEqual(0);
            expect(target.score).toBeLessThanOrEqual(100);
            expect(target.reason.length).toBeGreaterThan(15);
            expect(target.curve).toHaveLength(31);
        }
    });

    it('penalises light pollution independently', () => {
        const dark = buildNightPlan(new Date('2026-01-15T12:00:00Z'), { lat: 28.3, lon: -16.3 }, 1, targets);
        const city = buildNightPlan(new Date('2026-01-15T12:00:00Z'), { lat: 28.3, lon: -16.3 }, 9, targets);
        expect(dark.targets.find((target) => target.id === 'm31')!.breakdown.darkness)
            .toBeGreaterThan(city.targets.find((target) => target.id === 'm31')!.breakdown.darkness);
    });
});
