export const toRad = (d: number) => (d * Math.PI) / 180;
export const toDeg = (r: number) => (r * 180) / Math.PI;

export const julianDate = (d: Date) => d.getTime() / 86400000 + 2440587.5;

export const gmstDeg = (d: Date) => {
    const jd = julianDate(d);
    const T = (jd - 2451545.0) / 36525.0; // Siglos julianos desde J2000.0
    
    // Fórmula de precisión de la IAU (IAU 2000/2006)
    // Coeficientes para segundos de tiempo: 24110.54841, 8640184.812866, 0.093104, -0.0000062
    // Convertidos a grados (15° por hora):
    const g = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
            0.000387933 * T * T - (T * T * T) / 38710000.0;
            
    return ((g % 360) + 360) % 360;
};

export const getLST = (date: Date, lon: number) => {
    return ((gmstDeg(date) + lon) % 360 + 360) % 360;
};
