export interface ArCalibrationInput {
    sensorHeading: number;
    sensorElevation: number;
    magneticDeclination: number;
    currentHeadingOffset: number;
    currentElevationOffset: number;
    targetAzimuth: number;
    targetAltitude: number;
}

export function signedAngularDifference(target: number, current: number) {
    return ((target - current + 540) % 360) - 180;
}

/**
 * Calibración de un punto: el usuario coloca un astro conocido en el centro
 * óptico de la cámara. La diferencia entre el sensor y sus coordenadas reales
 * se convierte en correcciones persistentes de azimut y elevación.
 */
export function calibrateArToTarget(input: ArCalibrationInput) {
    const currentAzimuth = (
        input.sensorHeading
        + input.magneticDeclination
        + input.currentHeadingOffset
        + 360
    ) % 360;
    const azimuthCorrection = signedAngularDifference(input.targetAzimuth, currentAzimuth);
    const currentAltitude = input.sensorElevation + input.currentElevationOffset;

    return {
        headingOffset: input.currentHeadingOffset + azimuthCorrection,
        elevationOffset: input.currentElevationOffset + input.targetAltitude - currentAltitude,
        azimuthCorrection,
        elevationCorrection: input.targetAltitude - currentAltitude,
    };
}
