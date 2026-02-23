export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

export const julianDate = (d: Date) => d.getTime() / 86400000 + 2440587.5;

export const gmstDeg = (d: Date) => {
    const jd = julianDate(d);
    const g = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
    return ((g % 360) + 360) % 360;
};

export const getLST = (date: Date, lon: number) => {
    return ((gmstDeg(date) + lon) % 360 + 360) % 360;
};
