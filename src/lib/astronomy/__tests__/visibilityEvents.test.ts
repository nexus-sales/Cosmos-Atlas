import { describe, expect, it } from 'vitest';
import { calculateVisibilityEvents, formatVisibilityEvents } from '../visibilityEvents';

describe('calculateVisibilityEvents', () => {
    it('returns rise, transit and set for an equatorial object from Tenerife', () => {
        const events = calculateVisibilityEvents(
            120,
            0,
            { lat: 28.3, lon: -16.3 },
            new Date('2026-04-21T20:00:00Z'),
        );

        expect(events.status).toBe('normal');
        expect(events.rise).toBeInstanceOf(Date);
        expect(events.transit).toBeInstanceOf(Date);
        expect(events.set).toBeInstanceOf(Date);
    });

    it('identifies northern circumpolar targets from mid-northern latitudes', () => {
        const events = calculateVisibilityEvents(
            37.954,
            89.264,
            { lat: 40.4, lon: -3.7 },
            new Date('2026-04-21T20:00:00Z'),
        );

        expect(events.status).toBe('circumpolar');
        expect(events.transit).toBeInstanceOf(Date);
        expect(events.rise).toBeNull();
        expect(events.set).toBeNull();
    });
});

describe('formatVisibilityEvents', () => {
    it('formats normal visibility windows compactly', () => {
        const text = formatVisibilityEvents({
            status: 'normal',
            rise: new Date('2026-04-21T18:00:00Z'),
            transit: new Date('2026-04-21T22:00:00Z'),
            set: new Date('2026-04-22T02:00:00Z'),
        });

        expect(text).toContain('sale');
        expect(text).toContain('transita');
        expect(text).toContain('se pone');
    });
});
