export type ArHealthSample = {
    timestamp: number;
    success: boolean;
    jitterDeg: number;
    stableRatio: number;
};

export type ArHealthTone = 'neutral' | 'excellent' | 'good' | 'warning' | 'critical';

export function getArSampleScore(item: ArHealthSample): number {
    const successScore = item.success ? 40 : 0;
    const stableScore = Math.max(0, Math.min(40, Math.round(item.stableRatio * 40)));
    const jitterPenalty = Math.min(30, Math.round(item.jitterDeg * 1.5));
    const jitterScore = Math.max(0, 20 - jitterPenalty);
    return successScore + stableScore + jitterScore;
}

export function getArHealthSummary(history: ArHealthSample[]) {
    if (history.length === 0) {
        return {
            score: null,
            label: 'No data',
            tone: 'neutral' as const,
            recommendation: 'Run a full calibration to create your AR baseline.',
            avgJitter: null,
            avgStability: null,
            trend: [],
            lastSample: null,
        };
    }

    const score = Math.round(history.reduce((acc, item) => acc + getArSampleScore(item), 0) / history.length);
    const avgJitter = Math.round(history.reduce((acc, item) => acc + item.jitterDeg, 0) / history.length);
    const avgStability = Math.round((history.reduce((acc, item) => acc + item.stableRatio, 0) / history.length) * 100);

    const tone: ArHealthTone =
        score >= 85 ? 'excellent'
        : score >= 65 ? 'good'
        : score >= 45 ? 'warning'
        : 'critical';

    const label =
        tone === 'excellent' ? 'Excellent'
        : tone === 'good' ? 'Good'
        : tone === 'warning' ? 'Unstable'
        : 'Critical';

    const recommendation =
        tone === 'excellent'
            ? 'AR ready. Tracking is precise for premium overlays.'
            : tone === 'good'
              ? 'Usable, but recalibrate before long observation sessions.'
              : tone === 'warning'
                ? 'Medium drift detected. Recalibrate in open sky and away from metal.'
                : 'Low reliability. Recalibrate now with a clear sky and figure-8 motion.';

    return {
        score,
        label,
        tone,
        recommendation,
        avgJitter,
        avgStability,
        trend: [...history].reverse().map((item) => getArSampleScore(item)),
        lastSample: history[0] ?? null,
    };
}

export function getArToneClasses(tone: ArHealthTone) {
    switch (tone) {
        case 'excellent':
            return 'text-emerald-200 border-emerald-400/35 bg-emerald-500/12';
        case 'good':
            return 'text-cyan-200 border-cyan-400/35 bg-cyan-500/12';
        case 'warning':
            return 'text-amber-200 border-amber-400/35 bg-amber-500/12';
        case 'critical':
            return 'text-rose-200 border-rose-400/35 bg-rose-500/12';
        default:
            return 'text-white/70 border-white/20 bg-white/10';
    }
}
